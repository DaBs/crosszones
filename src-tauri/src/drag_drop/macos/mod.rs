use std::sync::{LazyLock, Mutex, Arc, mpsc};
use std::thread;
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::AppHandle;
use rdev::{listen, Event, EventType, Key, Button};
use ::accessibility::AXUIElement;
use accessibility::{AXUIElementActions, AXUIElementAttributes};
use crate::store::settings::SettingsStore;
use crate::store::zone_layouts;
use crate::snapping::common::ScreenDimensions;
use crate::snapping::action::LayoutAction;
use crate::snapping::macos::snap_window_with_element;
use crate::drag_drop::overlay::ZoneOverlay;

static APP_HANDLE: Mutex<Option<AppHandle>> = Mutex::new(None);
static DRAGGING: Mutex<bool> = Mutex::new(false);
static DRAG_START_POS: Mutex<Option<(f64, f64)>> = Mutex::new(None);
static MODIFIER_PRESSED_DURING_DRAG: Mutex<bool> = Mutex::new(false);
static OVERLAY_SHOWING: Mutex<bool> = Mutex::new(false);
static OVERLAY_OPERATION_LOCK: Mutex<()> = Mutex::new(());
static OVERLAY: LazyLock<ZoneOverlay> = LazyLock::new(|| ZoneOverlay::new());
static RUNNING: AtomicBool = AtomicBool::new(false);
static MODIFIER_STATE: LazyLock<Mutex<ModifierState>> = LazyLock::new(|| Mutex::new(ModifierState::default()));
static LAST_MOUSE_POS: Mutex<Option<(f64, f64)>> = Mutex::new(None);
static EVENT_SENDER: Mutex<Option<mpsc::Sender<DragEvent>>> = Mutex::new(None);

#[derive(Default)]
struct ModifierState {
    control: bool,
    alt: bool,
    shift: bool,
    super_key: bool,
}

impl ModifierState {
    fn is_modifier_pressed(&self, modifier_key: &str) -> bool {
        match modifier_key {
            "control" => self.control,
            "alt" => self.alt,
            "shift" => self.shift,
            "super" => self.super_key,
            _ => false,
        }
    }
}

enum DragEvent {
    ButtonDown,
    ButtonUp,
    MouseMove { x: f64, y: f64 },
    KeyPress(Key),
    KeyRelease(Key),
}

pub fn start_drag_detection(app_handle: AppHandle) -> Result<(), String> {
    let mut app_handle_guard = APP_HANDLE.lock().unwrap();
    
    // If already running, don't start again
    if RUNNING.load(Ordering::SeqCst) {
        return Ok(());
    }
    
    *app_handle_guard = Some(app_handle.clone());
    drop(app_handle_guard);

    RUNNING.store(true, Ordering::SeqCst);
    let running_flag = Arc::new(AtomicBool::new(true));
    let running_for_thread = running_flag.clone();
    
    // Create a channel for events from listener (main thread) to processor (background thread)
    let (processor_tx, processor_rx) = mpsc::channel::<DragEvent>();
    
    // Store the sender for potential external use
    {
        let mut sender_guard = EVENT_SENDER.lock().unwrap();
        *sender_guard = Some(processor_tx.clone());
    }   

    let result = app_handle.run_on_main_thread(move || {
        let callback = move |event: Event| {
            if !running_for_thread.load(Ordering::SeqCst) {
                return;
            }
            
            // Convert rdev event to DragEvent
            let drag_event = match event.event_type {
                EventType::ButtonPress(Button::Left) => DragEvent::ButtonDown,
                EventType::ButtonRelease(Button::Left) => DragEvent::ButtonUp,
                EventType::MouseMove { x, y } => DragEvent::MouseMove { x, y },
                EventType::KeyPress(key) => DragEvent::KeyPress(key),
                EventType::KeyRelease(key) => DragEvent::KeyRelease(key),
                _ => return, // Ignore other events
            };
            
            let event_clone = drag_event;
            handle_event_on_main_thread(event_clone);
        };
        
        let _ = listen(callback).map_err(|e| eprintln!("Failed to listen for events: {:?}", e));
    });

    if let Err(e) = result {
        eprintln!("Failed to start drag detection: {:?}", e);
    }
    
    Ok(())
}

fn handle_event_on_main_thread(event: DragEvent) {
    // Update modifier state
    match &event {
        DragEvent::KeyPress(key) => {
            let mut state = MODIFIER_STATE.lock().unwrap();
            match key {
                Key::ControlLeft | Key::ControlRight => state.control = true,
                Key::Alt | Key::AltGr => state.alt = true,
                Key::ShiftLeft | Key::ShiftRight => state.shift = true,
                Key::MetaLeft | Key::MetaRight => state.super_key = true,
                _ => {}
            }
        }
        DragEvent::KeyRelease(key) => {
            let mut state = MODIFIER_STATE.lock().unwrap();
            match key {
                Key::ControlLeft | Key::ControlRight => state.control = false,
                Key::Alt | Key::AltGr => state.alt = false,
                Key::ShiftLeft | Key::ShiftRight => state.shift = false,
                Key::MetaLeft | Key::MetaRight => state.super_key = false,
                _ => {}
            }
        }
        _ => {}
    }
    
    // Handle the event
    match event {
        DragEvent::MouseMove { x, y } => {
            let mut pos = LAST_MOUSE_POS.lock().unwrap();
            *pos = Some((x, y));
            drop(pos);
            handle_mouse_move(x, y);
        }
        DragEvent::ButtonDown => {
            handle_left_button_down();
        }
        DragEvent::ButtonUp => {
            handle_left_button_up();
        }
        DragEvent::KeyPress(_) | DragEvent::KeyRelease(_) => {
            // Key events already updated modifier state above
            // If we're dragging, check and update overlay state based on new modifier state
            let dragging = DRAGGING.lock().unwrap();
            if *dragging {
                drop(dragging);
                
                // Get the frontmost window and update overlay based on current modifier state
                let app_handle_guard = APP_HANDLE.lock().unwrap();
                if let Some(app_handle) = app_handle_guard.as_ref() {
                    if let Ok(window) = get_frontmost_window() {
                        check_and_update_modifier_state(app_handle, &window);
                    }
                }
            }
        }
    }
}


fn get_current_mouse_position() -> Option<(f64, f64)> {
    let pos = LAST_MOUSE_POS.lock().unwrap();
    pos.clone()
}

fn handle_left_button_down() {
    // Get the frontmost window (similar to how Windows gets window at point)
    // This function is already called on the main thread via handle_event_on_main_thread
    let window = match get_frontmost_window() {
        Ok(w) => w,
        Err(_) => return,
    };
    
    // Start tracking the drag
    let mut dragging = DRAGGING.lock().unwrap();
    *dragging = true;
    drop(dragging);
    
    // Bring the dragged window to the front, above the overlay
    let _ = raise_window(&window);
    
    // Initialize modifier state
    let mut modifier_pressed = MODIFIER_PRESSED_DURING_DRAG.lock().unwrap();
    *modifier_pressed = false;
    drop(modifier_pressed);
    
    // Reset overlay state
    let mut showing = OVERLAY_SHOWING.lock().unwrap();
    *showing = false;
    drop(showing);
    
    // Check initial modifier state and update overlay
    let app_handle_guard = APP_HANDLE.lock().unwrap();
    if let Some(app_handle) = app_handle_guard.as_ref() {
        check_and_update_modifier_state(app_handle, &window);
    }
}

fn handle_mouse_move(x: f64, y: f64) {
    let dragging = DRAGGING.lock().unwrap();
    if !*dragging {
        return;
    }
    drop(dragging);
    
    // Update overlay with mouse position for hover effects
    let _ = OVERLAY.update_mouse_position(x as i32, y as i32);
    
    // Check modifier state during drag and update overlay
    // This function is already called on the main thread via handle_event_on_main_thread
    let app_handle_guard = APP_HANDLE.lock().unwrap();
    if let Some(app_handle) = app_handle_guard.as_ref() {
        // Get the frontmost window (the dragged window should remain frontmost)
        if let Ok(window) = get_frontmost_window() {
            // Keep dragged window above overlay during drag
            let _ = raise_window(&window);
            
            check_and_update_modifier_state(app_handle, &window);
        }
    }
}

fn handle_left_button_up() {
    let dragging = DRAGGING.lock().unwrap();
    if !*dragging {
        return;
    }
    drop(dragging);
    
    // Get current mouse position
    let (x, y) = match get_current_mouse_position() {
        Some(pos) => pos,
        None => (0.0, 0.0), // Fallback
    };
    
    // Check if modifier was ever pressed during the drag
    let modifier_was_pressed = {
        let modifier_pressed = MODIFIER_PRESSED_DURING_DRAG.lock().unwrap();
        *modifier_pressed
    };
    
    // Hide overlay (spawn thread to avoid blocking)
    thread::spawn(move || {
        let _operation_lock = OVERLAY_OPERATION_LOCK.lock().unwrap();
        let _ = OVERLAY.hide();
        let mut showing = OVERLAY_SHOWING.lock().unwrap();
        *showing = false;
    });
    
    // Only snap if modifier was pressed at some point during the drag
    if modifier_was_pressed {
        println!("Dropping window at mouse position: ({}, {})", x, y);
        
            let app_handle_guard = APP_HANDLE.lock().unwrap();
            if let Some(app_handle) = app_handle_guard.as_ref() {
                let app_handle_clone = app_handle.clone();
                drop(app_handle_guard);
                
                // Handle the drop - use Tauri's run_on_main_thread since we're in a background thread
                let app_handle_clone2 = app_handle_clone.clone();
                let x_clone = x;
                let y_clone = y;
                if let Err(e) = app_handle_clone.run_on_main_thread(move || {
                    thread::sleep(std::time::Duration::from_millis(10));
                    // Get the frontmost window again
                    if let Ok(drop_window) = get_frontmost_window() {
                        if let Err(e) = handle_drop(&app_handle_clone2, &drop_window, x_clone as i32, y_clone as i32) {
                            eprintln!("Failed to handle drop: {}", e);
                        }
                    }
                }) {
                    eprintln!("Failed to dispatch drop handler to main thread: {}", e);
                }
            }
    }
    
    // Clear dragging state
    let mut dragging = DRAGGING.lock().unwrap();
    *dragging = false;
    drop(dragging);
    
    let mut drag_start = DRAG_START_POS.lock().unwrap();
    *drag_start = None;
    drop(drag_start);
    
    let mut modifier_pressed = MODIFIER_PRESSED_DURING_DRAG.lock().unwrap();
    *modifier_pressed = false;
    drop(modifier_pressed);
}

fn check_and_update_modifier_state(app_handle: &AppHandle, _window: &AXUIElement) {
    // Get modifier key from settings
    let settings_store = match SettingsStore::new(app_handle) {
        Ok(s) => s,
        Err(_) => return,
    };

    let modifier_key = match settings_store.get_zone_drag_modifier_key() {
        Ok(Some(key)) => key,
        _ => return,
    };

    // Check if the modifier key is currently pressed (fast operation)
    let modifier_state = MODIFIER_STATE.lock().unwrap();
    let modifier_pressed = modifier_state.is_modifier_pressed(&modifier_key);
    drop(modifier_state);

    // Update the flag if modifier is pressed (fast operation)
    if modifier_pressed {
        let mut modifier_flag = MODIFIER_PRESSED_DURING_DRAG.lock().unwrap();
        *modifier_flag = true;
        drop(modifier_flag);
    }

    // Spawn thread for expensive overlay operations so we can return quickly
    let app_handle_clone = app_handle.clone();
    
    thread::spawn(move || {
        // Serialize overlay operations to prevent race conditions
        let _operation_lock = OVERLAY_OPERATION_LOCK.lock().unwrap();
        
        // Check overlay state inside thread to get most up-to-date value
        let overlay_showing = {
            let showing = OVERLAY_SHOWING.lock().unwrap();
            *showing
        };
        
        // Get the frontmost window - this is called from a thread spawned from handle_event_on_main_thread
        // which runs on main thread, so we're already on main thread
        let overlay_window = get_frontmost_window().ok();
        
        if modifier_pressed {
            // Only show overlay if it's not already showing
            if !overlay_showing {
                if let Some(ref win) = overlay_window {
                    // Get active zone layout for overlay (expensive operation)
                    if let Ok(Some(active_layout_id)) = zone_layouts::get_active_zone_layout_id(app_handle_clone.clone()) {
                        if let Ok(Some(layout)) = zone_layouts::get_zone_layout(app_handle_clone.clone(), active_layout_id) {
                            if let Ok(screen) = get_screen_dimensions_for_window(win) {
                                if OVERLAY.show(&app_handle_clone, &layout, screen).is_ok() {
                                    let mut showing = OVERLAY_SHOWING.lock().unwrap();
                                    *showing = true;
                                }
                            }
                        }
                    }
                }
            }
        } else {
            // Hide overlay if modifier is not pressed and overlay is showing
            if overlay_showing {
                let _ = OVERLAY.hide();
                let mut showing = OVERLAY_SHOWING.lock().unwrap();
                *showing = false;
            }
        }
    });
}

fn handle_drop(app_handle: &AppHandle, window: &AXUIElement, x: i32, y: i32) -> Result<(), String> {
    // Get active zone layout
    let active_layout_id = match zone_layouts::get_active_zone_layout_id(app_handle.clone()) {
        Ok(Some(id)) => id,
        _ => return Err("No active zone layout".to_string()),
    };

    let layout = match zone_layouts::get_zone_layout(app_handle.clone(), active_layout_id) {
        Ok(Some(l)) => l,
        _ => return Err("Failed to get zone layout".to_string()),
    };

    // Get screen dimensions
    let screen = get_screen_dimensions_for_window(window)?;

    // Find zone at drop position
    let zone = layout.get_zone_at_position(x, y, screen);
    if let Some(zone) = zone {
        // Snap window to zone using the specific window element we tracked during drag
        let action = LayoutAction::ApplyZone(zone.number);
        snap_window_with_element(action, Some(app_handle.clone()), window)?;
    }

    Ok(())
}

fn get_screen_dimensions_for_window(window: &AXUIElement) -> Result<ScreenDimensions, String> {
    // Duplicate the logic from the private screen module
    use display_info::DisplayInfo;
    use core_graphics_types::geometry::{CGPoint, CGRect, CGSize};
    use std::cmp;
    
    // Helper functions from screen module
    fn rect_intersection(rect1: CGRect, rect2: CGRect) -> CGRect {
        let intersection_bottom_left_point = cmp::max_by(rect1.origin.x, rect2.origin.x, |a, b| {
            a.partial_cmp(b).unwrap()
        });
        let intersection_bottom_right_point = cmp::min_by(
            rect1.origin.x + rect1.size.width,
            rect2.origin.x + rect2.size.width,
            |a, b| a.partial_cmp(b).unwrap(),
        );
        let intersection_top_left_point = cmp::max_by(rect1.origin.y, rect2.origin.y, |a, b| {
            a.partial_cmp(b).unwrap()
        });
        let intersection_top_right_point = cmp::min_by(
            rect1.origin.y + rect1.size.height,
            rect2.origin.y + rect2.size.height,
            |a, b| a.partial_cmp(b).unwrap(),
        );
        let intersection_width = intersection_bottom_right_point - intersection_bottom_left_point;
        let intersection_height = intersection_top_right_point - intersection_top_left_point;
        CGRect::new(
            &CGPoint::new(intersection_bottom_left_point, intersection_top_left_point),
            &CGSize::new(intersection_width, intersection_height),
        )
    }

    fn rect_contained_percentage(rect: CGRect, screen: &DisplayInfo) -> f64 {
        let screen_rect = CGRect::new(
            &CGPoint::new(screen.x as f64, screen.y as f64),
            &CGSize::new(screen.width as f64, screen.height as f64),
        );
        let intersection_area = rect_intersection(rect, screen_rect);
        (intersection_area.size.width * intersection_area.size.height) / (rect.size.width * rect.size.height)
    }

    fn screen_with_rect(rect: CGRect, screens: Vec<DisplayInfo>) -> Result<DisplayInfo, String> {
        let mut return_screen = screens.first().ok_or("No screens found")?.clone();
        let mut rect_contained_highest_percentage = 0.0;
        for screen in screens {
            let rect_contained_percentage = rect_contained_percentage(rect, &screen);
            if rect_contained_percentage > rect_contained_highest_percentage {
                rect_contained_highest_percentage = rect_contained_percentage;
                return_screen = screen.clone();
            }
        }
        Ok(return_screen)
    }
    
    let screens = DisplayInfo::all().map_err(|e| e.to_string())?;
    let screen = screens.first().ok_or("No screens found")?;

    if screens.len() == 1 {
        return Ok(ScreenDimensions {
            x: screen.x as i32,
            y: screen.y as i32,
            width: screen.width as i32,
            height: screen.height as i32,
        });
    }

    let frame = window.frame().map_err(|e| e.to_string())?;
    let screen = screen_with_rect(frame, screens)?;

    Ok(ScreenDimensions {
        x: screen.x as i32,
        y: screen.y as i32,
        width: screen.width as i32,
        height: screen.height as i32,
    })
}

fn get_frontmost_window() -> Result<AXUIElement, String> {
    use objc2_app_kit::NSWorkspace;
    
    let workspace = unsafe { NSWorkspace::sharedWorkspace() };
    let frontmost_application = unsafe { 
        workspace.frontmostApplication().ok_or("No frontmost application")? 
    };

    let frontmost_application_pid = unsafe { frontmost_application.processIdentifier() };

    let app = AXUIElement::application(frontmost_application_pid);

    if let Ok(focused_window) = app.focused_window() {
        return Ok(focused_window);
    }

    // Fallback to first window if no focused window
    let windows = app.windows().map_err(|e| format!("Failed to get windows: {}", e))?;
    if let Some(window) = windows.iter().next() {
        return Ok(window.clone());
    }

    Err("No window found".to_string())
}

// Helper function to raise/bring window to front on macOS
// This ensures the dragged window stays above the overlay
fn raise_window(window: &AXUIElement) -> Result<(), String> {    
    // Try to perform the AXRaise action to bring window to front
    // This should work for most windows
    if let Ok(_) = window.raise().map_err(|e| e.to_string()) {
        return Ok(());
    }
    
    Ok(())
}



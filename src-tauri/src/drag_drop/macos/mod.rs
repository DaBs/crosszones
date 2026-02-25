use std::sync::{LazyLock, Mutex, Arc};
use std::thread;
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::AppHandle;
use tauri::ipc::{Channel, InvokeResponseBody};
use tauri_plugin_user_input::{EventType, InputEvent, InputEventData, UserInputExt};
use monio::Key;
use accessibility::AXUIElement;
use crate::store::settings::SettingsStore;
use crate::store::zone_layouts;
use crate::snapping::action::LayoutAction;
use crate::snapping::macos::snap_window_with_element;
use crate::drag_drop::overlay::ZoneOverlay;
use crate::window::PRIMARY_WINDOW_NAME;
use crate::window::macos::{get_frontmost_window, get_screen_dimensions_for_window, raise_window};

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

#[derive(PartialEq)]
enum UserInputEvent {
    ButtonDown(monio::Button),
    ButtonUp(monio::Button),
    MouseMove { x: f64, y: f64 },
    KeyPress(monio::Key),
    KeyRelease(monio::Key),
}

pub fn start_drag_detection(app_handle: &AppHandle) -> Result<(), String> {
    {
        let mut app_handle_guard = APP_HANDLE.lock().unwrap();
        *app_handle_guard = Some(app_handle.clone());
    }

    // Avoid starting drag detection more than once
    if RUNNING.load(Ordering::SeqCst) {
        return Ok(());
    }
    RUNNING.store(true, Ordering::SeqCst);

    let user_input = app_handle.user_input();
    let app_handle_clone = app_handle.clone();

    let channel = Channel::new(move |event: InvokeResponseBody| {
        // println!("Received event: {:?}", event);

        let json_event = match event {
            InvokeResponseBody::Json(event) => event,
            _ => {
                eprintln!("Received non-JSON event: {:?}", event);
                return Ok(());
            }
        };

        let event: InputEvent = match serde_json::from_str(&json_event) {
            Ok(event) => event,
            Err(err) => {
                eprintln!(
                    "Failed to deserialize user input event: {}. Payload: {}",
                    err, json_event
                );
                return Ok(());
            }
        };

        let user_input_event = match &event.data {
            InputEventData::Button(button) => {
                let button = *button;
                if event.event_type == EventType::ButtonPress {
                    Some(UserInputEvent::ButtonDown(button))
                } else if event.event_type == EventType::ButtonRelease {
                    Some(UserInputEvent::ButtonUp(button))
                } else {
                    None
                }
            }
            InputEventData::Position { x, y } => {
                let x = *x;
                let y = *y;
                Some(UserInputEvent::MouseMove { x, y })
            },
            InputEventData::Key(key) => {
                let key = *key;
                match event.event_type {
                    EventType::KeyPress => Some(UserInputEvent::KeyPress(key)),
                    EventType::KeyRelease => Some(UserInputEvent::KeyRelease(key)),
                    _ => None
                }
            }
            _ => None
        };

        if let Some(user_input_event) = user_input_event {
            app_handle_clone.run_on_main_thread(move || {
                handle_event_on_main_thread(user_input_event);
            });
        }

        Ok(())
    });

    let event_types = vec![
        EventType::MouseMove, EventType::MouseDragged, EventType::ButtonPress, EventType::ButtonRelease, 
        EventType::KeyPress, EventType::KeyRelease,
    ];
    // Listen only on our primary window label so clicks in the app
    // are handled correctly and don't interfere with other apps.
    let window_labels = vec![PRIMARY_WINDOW_NAME.to_string()];
    user_input.set_window_labels(window_labels);
    user_input.set_event_types(event_types.into_iter().collect());
    user_input.start_listening(channel);
    
    Ok(())
}

fn handle_event_on_main_thread(event: UserInputEvent) {    
    // Handle the event
    match event {
        UserInputEvent::MouseMove { x, y } => {
            let mut pos = LAST_MOUSE_POS.lock().unwrap();
            *pos = Some((x, y));
            drop(pos);
            handle_mouse_move(x, y);
        }
        UserInputEvent::ButtonDown(button) => {
            if button != monio::Button::Left {
                return;
            }
            handle_left_button_down();
        }
        UserInputEvent::ButtonUp(button) => {
            if button != monio::Button::Left {
                return;
            }
            handle_left_button_up();
        }
        UserInputEvent::KeyPress(key) => {
            {
                let mut state = MODIFIER_STATE.lock().unwrap();
                match key {
                    Key::ControlLeft | Key::ControlRight => state.control = true,
                    Key::AltLeft | Key::AltRight => state.alt = true,
                    Key::ShiftLeft | Key::ShiftRight => state.shift = true,
                    Key::MetaLeft | Key::MetaRight => state.super_key = true,
                    _ => {}
                }
            }

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
        UserInputEvent::KeyRelease(key) => {
            {
                let mut state = MODIFIER_STATE.lock().unwrap();
                match key {
                    Key::ControlLeft | Key::ControlRight => state.control = false,
                    Key::AltLeft | Key::AltRight => state.alt = false,
                    Key::ShiftLeft | Key::ShiftRight => state.shift = false,
                    Key::MetaLeft | Key::MetaRight => state.super_key = false,
                    _ => {}
                }
            }

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
    // Use the stored mouse position
    let pos = LAST_MOUSE_POS.lock().unwrap();
    if let Some((x, y)) = *pos {
        Some((x, y))
    } else {
        None
    }
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
    // Update overlay with mouse position for hover effects
    let _ = OVERLAY.update_mouse_position(x as i32, y as i32);

    let dragging = DRAGGING.lock().unwrap();
    if !*dragging {
        return;
    }
    drop(dragging);
    
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
    let (x, y) = get_current_mouse_position().unwrap_or((0.0, 0.0));
    
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
        let dragged_window = get_frontmost_window().ok();

        // If no modifier, handle it here, potentially hiding the overlay
        if !modifier_pressed {
          if overlay_showing {
            let _ = OVERLAY.hide();
            let mut showing = OVERLAY_SHOWING.lock().unwrap();
            *showing = false;
          }
          return;
        }

        // Else, if the overlay is showing or the dragged window is not found, just return
        if overlay_showing || dragged_window.is_none() {
          return;
        }

        // Respect setting: don't show overlay if user disabled visual indicators
        let settings_store = match SettingsStore::new(&app_handle_clone) {
            Ok(s) => s,
            Err(_) => return,
        };
        if match settings_store.get_show_zone_drag_overlay() {
            Ok(show) => !show,
            _ => false,
        } {
            return;
        }

        // Get active zone layout, or return if not found
        let active_layout_id = match zone_layouts::get_active_zone_layout_id(app_handle_clone.clone()) {
          Ok(Some(id)) => id,
          _ => return,
        };

        // Get zone layout, or return if not found
        let layout = match zone_layouts::get_zone_layout(app_handle_clone.clone(), active_layout_id) {
          Ok(Some(l)) => l,
          _ => return,
        };

        let screen = match get_screen_dimensions_for_window(dragged_window.as_ref().unwrap()) {
          Ok(s) => s,
          _ => return,
        };

        if OVERLAY.show(&app_handle_clone, &layout, screen).is_ok() {
          let mut showing = OVERLAY_SHOWING.lock().unwrap();
          *showing = true;
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
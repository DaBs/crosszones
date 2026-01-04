use std::sync::{LazyLock, Mutex, Arc};
use std::thread;
use std::sync::atomic::{AtomicBool, Ordering};
use serde_json;
use tauri::AppHandle;
use willhook::{InputEvent, MouseButton, MouseButtonPress, MouseClick, MouseEvent, MouseEventType, MouseMoveEvent, MousePressEvent, mouse_hook};
use windows::Win32::UI::WindowsAndMessaging::GetCursorPos;
use windows::{
    Win32::{
        Foundation::{HWND, POINT},
        UI::{
            WindowsAndMessaging::{
                SetWindowPos,
                WindowFromPoint,
                HWND_TOPMOST, HWND_NOTOPMOST, SWP_NOMOVE, SWP_NOSIZE, SWP_NOACTIVATE,
            },
            Input::KeyboardAndMouse::GetAsyncKeyState,
        },
    },
};
use crate::store::settings::SettingsStore;
use crate::store::zone_layouts;
use crate::snapping::common::ScreenDimensions;
use crate::snapping::action::LayoutAction;
use crate::snapping::windows::snap_window_with_handle;
use crate::drag_drop::overlay::ZoneOverlay;

static APP_HANDLE: Mutex<Option<AppHandle>> = Mutex::new(None);
static DRAGGING: Mutex<bool> = Mutex::new(false);
static DRAG_START_POS: Mutex<Option<(i32, i32)>> = Mutex::new(None);
static DRAGGED_WINDOW: Mutex<Option<isize>> = Mutex::new(None);
static MODIFIER_PRESSED_DURING_DRAG: Mutex<bool> = Mutex::new(false);
static OVERLAY_SHOWING: Mutex<bool> = Mutex::new(false);
static OVERLAY_OPERATION_LOCK: Mutex<()> = Mutex::new(());
static OVERLAY: LazyLock<ZoneOverlay> = LazyLock::new(|| ZoneOverlay::new());
static RUNNING: AtomicBool = AtomicBool::new(false);

pub fn start_drag_detection(app_handle: AppHandle) -> Result<(), String> {
    let mut app_handle_guard = APP_HANDLE.lock().unwrap();
    
    // If already running, don't start again
    if RUNNING.load(Ordering::SeqCst) {
        return Ok(());
    }
    
    *app_handle_guard = Some(app_handle.clone());
    drop(app_handle_guard);

    // Create the mouse hook using willhook
    let hook = match mouse_hook() {
        Some(h) => h,
        None => return Err("Failed to create mouse hook".to_string()),
    };

    // Store the hook in an Arc so we can share it with the event loop thread
    let hook_arc = Arc::new(hook);
    let hook_for_thread = hook_arc.clone();
    
    RUNNING.store(true, Ordering::SeqCst);
    let running_flag = Arc::new(AtomicBool::new(true));
    let running_for_thread = running_flag.clone();
    
    // Spawn a background thread to process mouse events
    thread::spawn(move || {
        event_loop(hook_for_thread, running_for_thread);
    });
    
    // Store the hook so it doesn't get dropped (which would unhook it)
    // We'll keep it alive by storing it in a static or ensuring the thread keeps it alive
    // Since the thread has the Arc, it will keep the hook alive
    std::mem::forget(hook_arc); // Keep the hook alive for the lifetime of the program
    
    Ok(())
}

fn event_loop(hook: Arc<willhook::Hook>, running: Arc<AtomicBool>) {
    while running.load(Ordering::SeqCst) {
        // Try to receive an event from the hook
        if let Ok(event) = hook.try_recv() {
            if let InputEvent::Mouse(mouse_event) = event {
                handle_mouse_event(mouse_event);
            }
        } else {
            // No event available, yield to avoid busy-waiting
            thread::yield_now();
        }
    }
}

fn handle_mouse_event(mouse_event: MouseEvent) {
    let app_handle_guard = APP_HANDLE.lock().unwrap();
    let app_handle = match app_handle_guard.as_ref() {
        Some(h) => h.clone(),
        None => return,
    };
    drop(app_handle_guard);
    
    // Match on the mouse event type
    match mouse_event.event {
        MouseEventType::Press(MousePressEvent { pressed, button }) => {
          if button != MouseButton::Left(MouseClick::SingleClick) {
            return;
          }

          let mut point = POINT { x: 0, y: 0 };
          unsafe { GetCursorPos(&mut point) };
          let x = point.x;
          let y = point.y;

          match pressed {
            MouseButtonPress::Down => {
              handle_left_button_down(&app_handle, x, y);
            }
            MouseButtonPress::Up => {
              handle_left_button_up(&app_handle, x, y);
            }
            _ => {
              // Ignore other mouse button press events
            }
          }
        }
        MouseEventType::Move(MouseMoveEvent { point }) => {
            if let Some(point) = point {
                handle_mouse_move(&app_handle, point.x, point.y);
            }
        },
        _ => {
            // Ignore other mouse events
        }
    }
}

fn handle_left_button_down(app_handle: &AppHandle, x: i32, y: i32) {
    // Get the window under the mouse cursor
    let hwnd = unsafe {
        WindowFromPoint(POINT { x, y })
    };
    
    if hwnd.0 == std::ptr::null_mut() {
        return;
    }
    
    // Start tracking the drag
    let mut dragging = DRAGGING.lock().unwrap();
    *dragging = true;
    drop(dragging);
    
    let mut drag_start = DRAG_START_POS.lock().unwrap();
    *drag_start = Some((x, y));
    drop(drag_start);
    
    let mut dragged_window = DRAGGED_WINDOW.lock().unwrap();
    *dragged_window = Some(hwnd.0 as isize);
    drop(dragged_window);
    
    // Bring the dragged window to the topmost position, above the overlay
    unsafe {
        SetWindowPos(
            hwnd,
            Some(HWND_TOPMOST),
            0,
            0,
            0,
            0,
            SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE,
        );
    }
    
    // Initialize modifier state
    let mut modifier_pressed = MODIFIER_PRESSED_DURING_DRAG.lock().unwrap();
    *modifier_pressed = false;
    drop(modifier_pressed);
    
    // Reset overlay state
    let mut showing = OVERLAY_SHOWING.lock().unwrap();
    *showing = false;
    drop(showing);
    
    // Check initial modifier state and update overlay
    check_and_update_modifier_state(app_handle, hwnd);
}

fn handle_mouse_move(app_handle: &AppHandle, x: i32, y: i32) {
    let dragging = DRAGGING.lock().unwrap();
    if !*dragging {
        return;
    }
    drop(dragging);
    
    // Update overlay with mouse position
    let _ = OVERLAY.update_mouse_position(x, y);
    
    // Check modifier state during drag and update overlay
    let dragged_window = DRAGGED_WINDOW.lock().unwrap();
    if let Some(hwnd_value) = dragged_window.as_ref() {
        let hwnd = HWND(*hwnd_value as *mut _);
        drop(dragged_window);
        
        // Keep dragged window above overlay during drag (maintain topmost)
        unsafe {
            SetWindowPos(
                hwnd,
                Some(HWND_TOPMOST),
                0,
                0,
                0,
                0,
                SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE,
            );
        }
        
        check_and_update_modifier_state(app_handle, hwnd);
    } else {
        drop(dragged_window);
    }
}

fn handle_left_button_up(app_handle: &AppHandle, x: i32, y: i32) {
    let dragging = DRAGGING.lock().unwrap();
    if !*dragging {
        return;
    }
    drop(dragging);
    
    let dragged_window = DRAGGED_WINDOW.lock().unwrap();
    let hwnd = dragged_window.as_ref().map(|h| HWND(*h as *mut _));
    drop(dragged_window);
    
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
    
    if let Some(hwnd) = hwnd {
        // Remove topmost flag from dragged window after drag ends
        unsafe {
            SetWindowPos(
                hwnd,
                Some(HWND_NOTOPMOST),
                0,
                0,
                0,
                0,
                SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE,
            );
        }
        // Only snap if modifier was pressed at some point during the drag
        if modifier_was_pressed {
            println!("Dropping window at mouse position: ({}, {})", x, y);
            
            // Store HWND value as isize for thread safety
            let hwnd_value = hwnd.0 as isize;
            
            // Let Windows process the button up event normally,
            // then handle the drop asynchronously after Windows has finished
            let app_handle_clone = app_handle.clone();
            thread::spawn(move || {
                // Wait for Windows to finish processing the drag operation
                thread::sleep(std::time::Duration::from_millis(10));
                // Reconstruct HWND from the stored value
                let hwnd = HWND(hwnd_value as *mut _);
                if let Err(e) = handle_drop(&app_handle_clone, hwnd, x, y) {
                    eprintln!("Failed to handle drop: {}", e);
                }
            });
        }
    }
    
    // Clear dragging state after handling (whether hwnd was Some or None)
    let mut dragging = DRAGGING.lock().unwrap();
    *dragging = false;
    drop(dragging);
    
    let mut drag_start = DRAG_START_POS.lock().unwrap();
    *drag_start = None;
    drop(drag_start);
    
    let mut dragged_window = DRAGGED_WINDOW.lock().unwrap();
    *dragged_window = None;
    drop(dragged_window);
    
    let mut modifier_pressed = MODIFIER_PRESSED_DURING_DRAG.lock().unwrap();
    *modifier_pressed = false;
    drop(modifier_pressed);
}

fn check_and_update_modifier_state(app_handle: &AppHandle, hwnd: HWND) {
    // Fast path: Check modifier key state quickly
    let settings_store = match SettingsStore::new(app_handle) {
        Ok(s) => s,
        Err(_) => return,
    };

    let modifier_key = match settings_store.get_zone_drag_modifier_key() {
        Ok(Some(key)) => key,
        _ => return,
    };

    // Check if the modifier key is currently pressed (fast operation)
    let modifier_pressed = match modifier_key.as_str() {
        "control" => unsafe { GetAsyncKeyState(0x11) & 0x8000u16 as i16 != 0 }, // VK_CONTROL
        "alt" => unsafe { GetAsyncKeyState(0x12) & 0x8000u16 as i16 != 0 },     // VK_MENU
        "shift" => unsafe { GetAsyncKeyState(0x10) & 0x8000u16 as i16 != 0 },    // VK_SHIFT
        "super" => unsafe { GetAsyncKeyState(0x5B) & 0x8000u16 as i16 != 0 },   // VK_LWIN
        _ => false,
    };

    // Update the flag if modifier is pressed (fast operation)
    if modifier_pressed {
        let mut modifier_flag = MODIFIER_PRESSED_DURING_DRAG.lock().unwrap();
        *modifier_flag = true;
        drop(modifier_flag);
    }

    // Spawn thread for expensive overlay operations so we can return quickly
    let app_handle_clone = app_handle.clone();
    let hwnd_value = hwnd.0 as isize; // Store HWND as isize for thread safety
    
    thread::spawn(move || {
        // Reconstruct HWND from stored value
        let hwnd = HWND(hwnd_value as *mut _);
        
        // Serialize overlay operations to prevent race conditions
        let _operation_lock = OVERLAY_OPERATION_LOCK.lock().unwrap();
        
        // Check overlay state inside thread to get most up-to-date value
        let overlay_showing = {
            let showing = OVERLAY_SHOWING.lock().unwrap();
            *showing
        };
        
        // If no modifier, handle it here, potentially hiding the overlay
        if !modifier_pressed {
            if overlay_showing {
                let _ = OVERLAY.hide();
                let mut showing = OVERLAY_SHOWING.lock().unwrap();
                *showing = false;
            }
            return;
        }

        // Else, if the overlay is showing, just return
        if overlay_showing {
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

        let screen = match get_screen_dimensions_for_window(hwnd) {
            Ok(s) => s,
            _ => return,
        };

        if OVERLAY.show(&app_handle_clone, &layout, screen).is_ok() {
            let mut showing = OVERLAY_SHOWING.lock().unwrap();
            *showing = true;
        }
    });
}

fn handle_drop(app_handle: &AppHandle, hwnd: HWND, x: i32, y: i32) -> Result<(), String> {
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
    let screen = get_screen_dimensions_for_window(hwnd)?;

    // Find zone at drop position
    let zone = layout.get_zone_at_position(x, y, screen);
    if let Some(zone) = zone {
        // Snap window to zone using the specific window handle we tracked during drag
        let action = LayoutAction::ApplyZone(zone.number);
        snap_window_with_handle(action, Some(app_handle.clone()), hwnd)?;
    }

    Ok(())
}

fn get_screen_dimensions_for_window(hwnd: HWND) -> Result<ScreenDimensions, String> {
    use windows::Win32::{
        Graphics::Gdi::{GetMonitorInfoW, MonitorFromWindow, MONITOR_DEFAULTTONEAREST, MONITORINFO},
    };

    let mut monitor_info = MONITORINFO {
        cbSize: std::mem::size_of::<MONITORINFO>() as u32,
        ..Default::default()
    };

    unsafe {
        let monitor = MonitorFromWindow(hwnd, MONITOR_DEFAULTTONEAREST);
        if !GetMonitorInfoW(monitor, &mut monitor_info).as_bool() {
            return Err("Failed to get monitor info".to_string());
        }
    }

    Ok(ScreenDimensions {
        width: monitor_info.rcWork.right - monitor_info.rcWork.left,
        height: monitor_info.rcWork.bottom - monitor_info.rcWork.top,
        x: monitor_info.rcWork.left,
        y: monitor_info.rcWork.top,
    })
}
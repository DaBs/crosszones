use std::sync::{LazyLock, Mutex};
use std::thread;
use serde_json;
use tauri::AppHandle;
use windows::{
    Win32::{
        Foundation::{HWND, LPARAM, LRESULT, POINT, WPARAM},
        UI::{
            WindowsAndMessaging::{
                CallNextHookEx, SetWindowsHookExW,
                WindowFromPoint, WH_MOUSE_LL, WM_LBUTTONDOWN, WM_LBUTTONUP, WM_MOUSEMOVE, MSLLHOOKSTRUCT,
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

static HOOK_HANDLE: Mutex<Option<isize>> = Mutex::new(None);
static APP_HANDLE: Mutex<Option<AppHandle>> = Mutex::new(None);
static DRAGGING: Mutex<bool> = Mutex::new(false);
static DRAG_START_POS: Mutex<Option<(i32, i32)>> = Mutex::new(None);
static DRAGGED_WINDOW: Mutex<Option<isize>> = Mutex::new(None);
static MODIFIER_PRESSED_DURING_DRAG: Mutex<bool> = Mutex::new(false);
static OVERLAY_SHOWING: Mutex<bool> = Mutex::new(false);
static OVERLAY: LazyLock<ZoneOverlay> = LazyLock::new(|| ZoneOverlay::new());

pub fn start_drag_detection(app_handle: AppHandle) -> Result<(), String> {
    let mut app_handle_guard = APP_HANDLE.lock().unwrap();
    *app_handle_guard = Some(app_handle.clone());
    drop(app_handle_guard);

    unsafe {
        let hook = SetWindowsHookExW(
            WH_MOUSE_LL,
            Some(mouse_hook_proc),
            None,
            0,
        );

        if hook.is_err() {
            return Err("Failed to set mouse hook".to_string());
        }

        let mut hook_handle = HOOK_HANDLE.lock().unwrap();
        *hook_handle = Some(hook.unwrap().0 as *mut std::ffi::c_void as isize);
        drop(hook_handle);
    }

    Ok(())
}

unsafe extern "system" fn mouse_hook_proc(
    n_code: i32,
    w_param: WPARAM,
    l_param: LPARAM,
) -> LRESULT {
    if n_code >= 0 {
        let app_handle_guard = APP_HANDLE.lock().unwrap();
        let app_handle = match app_handle_guard.as_ref() {
            Some(h) => h.clone(),
            None => return CallNextHookEx(None, n_code, w_param, l_param),
        };
        drop(app_handle_guard);

        match w_param.0 as u32 {
            WM_LBUTTONDOWN => {
                // Track any window drag, regardless of modifier key state
                let hook_struct = unsafe { &*(l_param.0 as *const MSLLHOOKSTRUCT) };
                let hwnd = unsafe {
                    WindowFromPoint(POINT {
                        x: hook_struct.pt.x,
                        y: hook_struct.pt.y,
                    })
                };

                if hwnd.0 != std::ptr::null_mut() {
                    // Start tracking the drag
                    let mut dragging = DRAGGING.lock().unwrap();
                    *dragging = true;
                    drop(dragging);

                    let hook_struct = unsafe { &*(l_param.0 as *const MSLLHOOKSTRUCT) };
                    let mut drag_start = DRAG_START_POS.lock().unwrap();
                    *drag_start = Some((hook_struct.pt.x, hook_struct.pt.y));
                    drop(drag_start);

                    let mut dragged_window = DRAGGED_WINDOW.lock().unwrap();
                    *dragged_window = Some(hwnd.0 as *mut std::ffi::c_void as isize);
                    drop(dragged_window);

                    // Initialize modifier state
                    let mut modifier_pressed = MODIFIER_PRESSED_DURING_DRAG.lock().unwrap();
                    *modifier_pressed = false;
                    drop(modifier_pressed);

                    // Reset overlay state
                    let mut showing = OVERLAY_SHOWING.lock().unwrap();
                    *showing = false;
                    drop(showing);

                    // Check initial modifier state and update overlay
                    check_and_update_modifier_state(&app_handle, hwnd);
                }
            }
            WM_MOUSEMOVE => {
                let dragging = DRAGGING.lock().unwrap();
                if !*dragging {
                    return CallNextHookEx(None, n_code, w_param, l_param);
                }
                drop(dragging);

                // Get mouse position
                let hook_struct = unsafe { &*(l_param.0 as *const MSLLHOOKSTRUCT) };
                let mouse_x = hook_struct.pt.x;
                let mouse_y = hook_struct.pt.y;

                // Update overlay with mouse position
                let _ = OVERLAY.update_mouse_position(mouse_x, mouse_y);

                // Check modifier state during drag and update overlay
                let dragged_window = DRAGGED_WINDOW.lock().unwrap();
                if let Some(hwnd_value) = dragged_window.as_ref() {
                    let hwnd = HWND((*hwnd_value as *mut std::ffi::c_void) as *mut _);
                    drop(dragged_window);
                    check_and_update_modifier_state(&app_handle, hwnd);
                } else {
                    drop(dragged_window);
                }
            }
            WM_LBUTTONUP => {
                let dragging = DRAGGING.lock().unwrap();
                if !*dragging {
                    return CallNextHookEx(None, n_code, w_param, l_param);
                }
                drop(dragging);

                let dragged_window = DRAGGED_WINDOW.lock().unwrap();
                let hwnd = dragged_window.as_ref().map(|h| HWND((*h as *mut std::ffi::c_void) as *mut _));
                drop(dragged_window);

                // Check if modifier was ever pressed during the drag
                let modifier_was_pressed = {
                    let modifier_pressed = MODIFIER_PRESSED_DURING_DRAG.lock().unwrap();
                    *modifier_pressed
                };

                // Hide overlay
                let _ = OVERLAY.hide();
                let mut showing = OVERLAY_SHOWING.lock().unwrap();
                *showing = false;
                drop(showing);

                if let Some(hwnd) = hwnd {
                    // Only snap if modifier was pressed at some point during the drag
                    if modifier_was_pressed {
                        // Get mouse position
                        let hook_struct = unsafe { &*(l_param.0 as *const MSLLHOOKSTRUCT) };
                        let mouse_x = hook_struct.pt.x;
                        let mouse_y = hook_struct.pt.y;

                        println!("Dropping window at mouse position: ({}, {})", mouse_x, mouse_y);

                        // Store HWND value as isize for thread safety
                        let hwnd_value = hwnd.0 as isize;

                        // Let Windows process WM_LBUTTONUP normally to complete the drag operation,
                        // then handle the drop asynchronously after Windows has finished
                        let app_handle_clone = app_handle.clone();
                        thread::spawn(move || {
                            // Wait for Windows to finish processing the drag operation
                            thread::sleep(std::time::Duration::from_millis(10));
                            // Reconstruct HWND from the stored value
                            let hwnd = HWND(hwnd_value as *mut _);
                            if let Err(e) = handle_drop(&app_handle_clone, hwnd, mouse_x, mouse_y) {
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
            _ => {}
        }
    }

    CallNextHookEx(None, n_code, w_param, l_param)
}

fn check_and_update_modifier_state(app_handle: &AppHandle, hwnd: HWND) {
    let settings_store = match SettingsStore::new(app_handle) {
        Ok(s) => s,
        Err(_) => return,
    };

    let modifier_key = match settings_store.get_zone_drag_modifier_key() {
        Ok(Some(key)) => key,
        _ => return,
    };

    // Check if the modifier key is currently pressed
    let modifier_pressed = match modifier_key.as_str() {
        "control" => unsafe { GetAsyncKeyState(0x11) & 0x8000u16 as i16 != 0 }, // VK_CONTROL
        "alt" => unsafe { GetAsyncKeyState(0x12) & 0x8000u16 as i16 != 0 },     // VK_MENU
        "shift" => unsafe { GetAsyncKeyState(0x10) & 0x8000u16 as i16 != 0 },    // VK_SHIFT
        "super" => unsafe { GetAsyncKeyState(0x5B) & 0x8000u16 as i16 != 0 },   // VK_LWIN
        _ => false,
    };

    // Update the flag if modifier is pressed
    if modifier_pressed {
        let mut modifier_flag = MODIFIER_PRESSED_DURING_DRAG.lock().unwrap();
        *modifier_flag = true;
        drop(modifier_flag);
    }

    // Show or hide overlay based on modifier state
    let overlay_showing = {
        let showing = OVERLAY_SHOWING.lock().unwrap();
        *showing
    };

    if modifier_pressed {
        // Only show overlay if it's not already showing
        if !overlay_showing {
            // Get active zone layout for overlay
            if let Ok(Some(active_layout_id)) = zone_layouts::get_active_zone_layout_id(app_handle.clone()) {
                if let Ok(Some(layout)) = zone_layouts::get_zone_layout(app_handle.clone(), active_layout_id) {
                    if let Ok(screen) = get_screen_dimensions_for_window(hwnd) {
                        if OVERLAY.show(app_handle, &layout, screen).is_ok() {
                            let mut showing = OVERLAY_SHOWING.lock().unwrap();
                            *showing = true;
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

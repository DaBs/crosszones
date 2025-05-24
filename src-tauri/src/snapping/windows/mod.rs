use windows::core::BOOL;
use windows::Win32::Foundation::{HWND, LPARAM, RECT, TRUE};
use windows::Win32::UI::WindowsAndMessaging::{
    EnumWindows, GetWindowRect, GetWindowThreadProcessId, GetSystemMetrics, IsWindowVisible,
    GetForegroundWindow, SetWindowPos, SWP_FRAMECHANGED, SM_CXSCREEN, SM_CYSCREEN, SM_CYFULLSCREEN,
};
use windows::Win32::System::Threading::GetCurrentProcessId;

use super::action::LayoutAction;
use super::common::{WindowRect, ScreenDimensions, calculate_window_rect};

// Function to snap a window according to the specified layout action
pub fn snap_window(action: LayoutAction) -> Result<(), String> {
    let hwnd = unsafe { GetForegroundWindow() };
    if hwnd.0 == std::ptr::null_mut() {
        return Err("Failed to get foreground window".to_string());
    }

    // Get the current window position and size
    let mut rect = RECT::default();
    let result = unsafe { GetWindowRect(hwnd, &mut rect) };
    if !result.is_ok() {
        return Err("Failed to get window rectangle".to_string());
    }

    // Get screen dimensions
    let screen_width = unsafe { GetSystemMetrics(SM_CXSCREEN) };
    let screen_height = unsafe { GetSystemMetrics(SM_CYFULLSCREEN) };

    let screen_dimensions = ScreenDimensions {
        width: screen_width,
        height: screen_height,
    };

    let current_rect = WindowRect {
        x: rect.left,
        y: rect.top,
        width: rect.right - rect.left,
        height: rect.bottom - rect.top,
    };

    // Calculate new position and size based on the action
    let new_rect = calculate_window_rect(action, screen_dimensions, Some(current_rect));

    // Apply the new position and size
    let result = unsafe {
        SetWindowPos(
            hwnd,
            Some(HWND(std::ptr::null_mut())),
            new_rect.x,
            new_rect.y,
            new_rect.width,
            new_rect.height,
            SWP_FRAMECHANGED,
        )
    };

    if !result.is_ok() {
        return Err("Failed to set window position".to_string());
    }

    Ok(())
}

// Helper function to get all visible windows
pub fn get_visible_windows() -> Vec<HWND> {
    let mut windows = Vec::new();
    
    unsafe {
        EnumWindows(Some(enum_window_callback), LPARAM(&mut windows as *mut _ as isize));
    }
    
    windows
}

// Callback function for EnumWindows
extern "system" fn enum_window_callback(hwnd: HWND, lparam: LPARAM) -> BOOL {
    let windows = unsafe { &mut *(lparam.0 as *mut Vec<HWND>) };
    
    // Check if the window is visible
    if unsafe { IsWindowVisible(hwnd).as_bool() } {
        // Get the process ID of the window
        let mut process_id = 0u32;
        unsafe { GetWindowThreadProcessId(hwnd, Some(&mut process_id)) };
        
        // Skip windows from our own process
        if process_id != unsafe { GetCurrentProcessId() } {
            windows.push(hwnd);
        }
    }
    
    TRUE
}

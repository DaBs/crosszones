use windows::{
    core::BOOL,
    Win32::{
        Foundation::{HWND, LPARAM, RECT, TRUE},
        Graphics::{Dwm::{DwmGetWindowAttribute, DWMWA_EXTENDED_FRAME_BOUNDS}, Gdi::{
            GetDC, GetDeviceCaps, GetMonitorInfoW, MonitorFromWindow, MONITORINFO, MONITOR_DEFAULTTONEAREST, LOGPIXELSY
        }},
        System::Threading::GetCurrentProcessId,
        UI::{
            HiDpi::GetDpiForWindow,
            WindowsAndMessaging::{
                EnumWindows, GetForegroundWindow, GetWindowRect,
                GetWindowThreadProcessId, IsWindowVisible, SetWindowPos,
                SWP_NOACTIVATE, SWP_NOZORDER
            },
        },
    },
};

use super::action::LayoutAction;
use super::common::{calculate_window_rect, ScreenDimensions};
use super::window_rect::WindowRect;

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

    // Get the monitor info to account for taskbar
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

    // Get the frame without the windows borders
    let mut frame_rect = RECT::default();
    let result = unsafe {
        DwmGetWindowAttribute(
            hwnd,
            DWMWA_EXTENDED_FRAME_BOUNDS,
            &mut frame_rect as *mut _ as *mut std::ffi::c_void,
            std::mem::size_of::<RECT>() as u32,
        )
    };
    if result.is_err() {
        return Err("Failed to get window frame".to_string());
    }

    // Get the DPI for the monitor
    let monitor_dc = unsafe { GetDC(Some(hwnd)) };
    let monitor_dpi = unsafe { GetDeviceCaps(Some(monitor_dc), LOGPIXELSY) };

    // Get the DPI for the window
    let dpi = unsafe { GetDpiForWindow(hwnd) };
    let dpi_scale = dpi as f32 / monitor_dpi as f32;

    // Get the extra offset for the position and size due to windows 10 invisible borders
    // Scale the offsets by the DPI
    let x_position_offset = ((frame_rect.left - rect.left) as f32 * dpi_scale) as i32;
    let y_position_offset = ((frame_rect.top - rect.top) as f32 * dpi_scale) as i32;
    let width_addition = ((-frame_rect.right + rect.right) as f32 * dpi_scale * 2.0) as i32;
    let height_addition = ((-frame_rect.bottom + rect.bottom) as f32 * dpi_scale) as i32;

    let screen_dimensions = ScreenDimensions {
        width: monitor_info.rcWork.right - monitor_info.rcWork.left,
        height: monitor_info.rcWork.bottom - monitor_info.rcWork.top,
        x: monitor_info.rcWork.left,
        y: monitor_info.rcWork.top,
    };

    // Remove the effect of the invisible borders
    let current_rect = WindowRect {
        x: rect.left + x_position_offset,
        y: rect.top + y_position_offset,
        width: rect.right - rect.left - width_addition,
        height: rect.bottom - rect.top - height_addition,
    };

    let window_id = format!("{:?}", hwnd.0);

    // Calculate new position and size based on the action
    let mut new_rect = calculate_window_rect(&window_id, action, screen_dimensions, Some(current_rect));

    // Add the effect of the invisible borders to get the correct position and size
    new_rect = WindowRect {
        x: new_rect.x - x_position_offset,
        y: new_rect.y - y_position_offset,
        width: new_rect.width + width_addition,
        height: new_rect.height + height_addition,
    };

    println!("new_rect: {:?}", new_rect);
    println!("current_rect: {:?}", current_rect);
    println!("x_position_offset: {:?}", x_position_offset);
    println!("y_position_offset: {:?}", y_position_offset);
    println!("width_addition: {:?}", width_addition);
    println!("height_addition: {:?}", height_addition);

    // Apply the new position and size
    let result = unsafe {
        SetWindowPos(
            hwnd,
            Some(HWND(std::ptr::null_mut())),
            new_rect.x,
            new_rect.y,
            new_rect.width,
            new_rect.height,
            SWP_NOZORDER | SWP_NOACTIVATE,
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
        EnumWindows(
            Some(enum_window_callback),
            LPARAM(&mut windows as *mut _ as isize),
        );
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

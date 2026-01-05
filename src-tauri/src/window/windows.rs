use windows::Win32::{
    Foundation::HWND,
    Graphics::Gdi::{GetMonitorInfoW, MonitorFromWindow, MONITOR_DEFAULTTONEAREST, MONITORINFO},
};

use crate::snapping::common::ScreenDimensions;

/// Get screen dimensions for a window on Windows
pub fn get_screen_dimensions_for_window(hwnd: HWND) -> Result<ScreenDimensions, String> {
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


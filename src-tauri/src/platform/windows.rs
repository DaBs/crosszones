use windows::Win32::UI::WindowsAndMessaging::*;
use windows::Win32::Foundation::*;
use windows::Win32::Graphics::Gdi::*;
use crate::snap::SnapPosition;

pub fn snap_window(position: SnapPosition) {
  unsafe {
    let hwnd = GetForegroundWindow();
    if hwnd.0 == 0 {
        return;
    }

    let monitor = MonitorFromWindow(hwnd, MONITOR_DEFAULTTONEAREST);
    let mut mi: MONITORINFO = std::mem::zeroed();
    mi.cbSize = std::mem::size_of::<MONITORINFO>() as u32;
    if GetMonitorInfoW(monitor, &mut mi) == 0 {
        return;
    }

    let work = mi.rcWork;
    let width = (work.right - work.left) as i32;
    let height = (work.bottom - work.top) as i32;

    let (x, y, w, h) = match position {
        SnapPosition::LeftHalf => (work.left, work.top, width / 2, height),
        SnapPosition::RightHalf => (work.left + width / 2, work.top, width / 2, height),
        SnapPosition::TopHalf => (work.left, work.top, width, height / 2),
        SnapPosition::BottomHalf => (work.left, work.top + height / 2, width, height / 2),
        SnapPosition::FullScreen => (work.left, work.top, width, height),
        SnapPosition::TopLeft => (work.left, work.top, width / 2, height / 2),
        SnapPosition::TopRight => (work.left + width / 2, work.top, width / 2, height / 2),
        SnapPosition::BottomLeft => (work.left, work.top + height / 2, width / 2, height / 2),
        SnapPosition::BottomRight => (work.left + width / 2, work.top + height / 2, width / 2, height / 2),
        _ => return, // TODO: implement all SnapPositions
    };

    SetWindowPos(hwnd, HWND(0), x, y, w, h, SWP_NOZORDER | SWP_SHOWWINDOW);
}
}
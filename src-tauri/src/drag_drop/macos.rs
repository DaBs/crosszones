use tauri::AppHandle;

pub fn start_drag_detection(_app_handle: AppHandle) -> Result<(), String> {
    // TODO: Implement macOS drag detection using CGEventTap
    // This requires accessibility permissions
    Ok(())
}

pub fn stop_drag_detection() -> Result<(), String> {
    Ok(())
}

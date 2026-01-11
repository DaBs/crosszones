use tauri::AppHandle;

pub fn start_drag_detection(_app_handle: AppHandle) -> Result<(), String> {
    // TODO: Implement Linux drag detection using X11 event hooks
    Ok(())
}

pub fn stop_drag_detection() -> Result<(), String> {
    Ok(())
}

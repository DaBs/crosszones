use std::str::FromStr;

use tauri::Manager;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};
use crate::snapping::action::LayoutAction;


pub fn setup_handler(app_handle: tauri::AppHandle) {
    app_handle.plugin(tauri_plugin_global_shortcut::Builder::new().with_handler(move |app, hotkey, event| {
        println!("{:?}", hotkey);
    }).build());
}

#[tauri::command]
pub fn register_hotkey(
    app: tauri::AppHandle,
    shortcut: Shortcut,
    action: String,
) -> Result<(), String> {
    let mut shortcut_manager = app.global_shortcut();
    
    // Register the hotkey
    let app_handle = app.clone();
    shortcut_manager.register(shortcut).map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub fn unregister_hotkey(app: tauri::AppHandle, shortcut: Shortcut) -> Result<(), String> {
    let mut shortcut_manager = app.global_shortcut();
    shortcut_manager
        .unregister(shortcut)
        .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub fn get_all_hotkeys(app: tauri::AppHandle) -> Result<Vec<Shortcut>, String> {
    let shortcut_manager = app.global_shortcut();
    // This is a placeholder - the actual implementation would depend on the API
    // provided by the global_shortcut_manager
    Ok(Vec::new())
} 
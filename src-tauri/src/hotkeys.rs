use std::str::FromStr;

use strum::VariantNames;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};
use tauri_plugin_store::StoreExt;
use crate::snapping::action::LayoutAction;
use crate::snapping::snap_window;

const CROSSZONES_STORE_NAME: &str = "crosszones";

pub fn setup_handler(app_handle: tauri::AppHandle) {
    let _ = app_handle.plugin(tauri_plugin_global_shortcut::Builder::new().with_handler(move |app, hotkey, _event| {
        let store = app.store(CROSSZONES_STORE_NAME).expect("Failed to open store");

        let action = store.get(hotkey.to_string());
        
        if let Some(action) = action {
            let action = action.as_str().expect("Failed to get action");

            let action = LayoutAction::from_str(action).expect("Failed to convert action to LayoutAction");
            
            let _ = snap_window(action);
        }
    }).build());
}

#[tauri::command]
pub fn register_hotkey(
    app: tauri::AppHandle,
    shortcut: String,
    action: LayoutAction,
) -> Result<(), String> {
    let shortcut_manager = app.global_shortcut();
    
    let shortcut = match Shortcut::try_from(shortcut) {
        Ok(shortcut) => shortcut,
        Err(e) => return Err(e.to_string()),
    };

    let store = app.store(CROSSZONES_STORE_NAME).expect("Failed to open store");

    store.set(shortcut.to_string(), action.as_ref());

    shortcut_manager.register(shortcut).map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub fn unregister_hotkey(app: tauri::AppHandle, action: LayoutAction) -> Result<(), String> {
    let shortcut_manager = app.global_shortcut();
    let store = app.store(CROSSZONES_STORE_NAME).expect("Failed to open store");

    // Find the shortcut that maps to this action
    let entries = store.entries();
    for (shortcut, value) in entries {
        if let Some(action_str) = value.as_str() {
            if action_str == action.as_ref() {
                store.delete(&shortcut);
                let shortcut = Shortcut::try_from(shortcut).expect("Failed to convert shortcut to Shortcut");
                shortcut_manager
                    .unregister(shortcut)
                    .map_err(|e| e.to_string())?;
                return Ok(());
            }
        }
    }

    Ok(())
}

#[tauri::command]
pub fn get_all_hotkeys(app: tauri::AppHandle) -> Result<Vec<(String, String)>, String> {
    let store = app.store(CROSSZONES_STORE_NAME).expect("Failed to open store");

    let shortcuts = store.entries();

    let hotkeys = shortcuts.iter().map(|(shortcut, action)| {
        (shortcut.to_string(), action.to_string())
    }).collect();

    Ok(hotkeys)
} 
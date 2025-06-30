use std::str::FromStr;

use crate::snapping::action::LayoutAction;
use crate::snapping::snap_window;
use crate::store::hotkeys::HOTKEYS_STORE_NAME;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};
use tauri_plugin_store::StoreExt;

fn register_hotkey(app: &tauri::AppHandle, shortcut: Shortcut) -> Result<(), String> {
    let shortcut_manager = app.global_shortcut();

    shortcut_manager
    .register(shortcut)
    .map_err(|e| e.to_string())?;

    Ok(())
}

fn persist_hotkey_action(app: &tauri::AppHandle, shortcut: Shortcut, action: LayoutAction) -> Result<(), String> {
    let store = app
        .store(HOTKEYS_STORE_NAME)
        .expect("Failed to open store");

    store.set(shortcut.to_string(), action.as_ref());

    store.save().map_err(|e| e.to_string())?;

    Ok(())
}

pub fn load_hotkeys(app: tauri::AppHandle) {
    let store = app
        .store(HOTKEYS_STORE_NAME)
        .expect("Failed to open store");

    let entries = store.entries();

    for (shortcut, _action) in entries {
        let shortcut = Shortcut::from_str(shortcut.as_str()).expect("Failed to convert shortcut to Shortcut");
        let _ = register_hotkey(&app, shortcut);
    }
}

pub fn setup(app_handle: &tauri::AppHandle) {
    let _ = app_handle.plugin(
        tauri_plugin_global_shortcut::Builder::new()
            .with_handler(move |app, hotkey, event| {
                let store = app
                    .store(HOTKEYS_STORE_NAME)
                    .expect("Failed to open store");

                let action = store.get(hotkey.to_string());

                if let Some(action) = action {
                    if event.state() == ShortcutState::Pressed {
                                        let action = action.as_str().expect("Failed to get action");

                                        let action = LayoutAction::from_str(action)
                                            .expect("Failed to convert action to LayoutAction");
                    
                                        let _ = snap_window(action);
                                    }
                }
            })
            .build(),
    );

    load_hotkeys(app_handle.clone());
}

#[tauri::command]
pub fn register_hotkey_action(
    app: tauri::AppHandle,
    shortcut: String,
    action: LayoutAction,
) -> Result<(), String> {
    let shortcut = Shortcut::from_str(&shortcut).map_err(|e| e.to_string())?;

    persist_hotkey_action(&app, shortcut, action)?;
    register_hotkey(&app, shortcut)?;
    Ok(())
}

#[tauri::command]
pub fn unregister_hotkey_action(app: tauri::AppHandle, action: LayoutAction) -> Result<(), String> {
    let shortcut_manager = app.global_shortcut();
    let store = app
        .store(HOTKEYS_STORE_NAME)
        .expect("Failed to open store");

    // Find the shortcut that maps to this action
    let entries = store.entries();
    for (shortcut, value) in entries {
        if let Some(action_str) = value.as_str() {
            if action_str == action.as_ref() {
                store.delete(&shortcut);
                store.save().map_err(|e| e.to_string())?;
                let shortcut =
                    Shortcut::try_from(shortcut).expect("Failed to convert shortcut to Shortcut");
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
    let store = app
        .store(HOTKEYS_STORE_NAME)
        .expect("Failed to open store");

    let shortcuts = store.entries();

    let hotkeys = shortcuts
        .iter()
        .map(|(shortcut, action)| (shortcut.to_string(), action.as_str().unwrap().to_string()))
        .collect();

    Ok(hotkeys)
}

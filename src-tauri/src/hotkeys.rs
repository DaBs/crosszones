use std::str::FromStr;

use crate::snapping::action::{ActionPayload, LayoutAction};
use crate::snapping::snap_window;
use crate::store::hotkeys::HOTKEYS_STORE_NAME;
use crate::store::settings::SettingsStore;
use crate::store::zone_layouts;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};
use tauri_plugin_notification::NotificationExt;
use tauri_plugin_store::StoreExt;
use tauri::Emitter;

fn register_hotkey(app: &tauri::AppHandle, shortcut: Shortcut) -> Result<(), String> {
    let shortcut_manager = app.global_shortcut();

    shortcut_manager
        .register(shortcut)
        .map_err(|e| e.to_string())?;

    Ok(())
}

fn persist_hotkey_action(
    app: &tauri::AppHandle,
    shortcut: Shortcut,
    action: LayoutAction,
) -> Result<(), String> {
    let store = app.store(HOTKEYS_STORE_NAME).expect("Failed to open store");

    // Convert to ActionPayload for consistent storage format
    let payload: ActionPayload = action.into();
    let action_str =
        serde_json::to_string(&payload).map_err(|e| format!("Failed to serialize: {}", e))?;
    store.set(shortcut.to_string(), action_str);

    store.save().map_err(|e| e.to_string())?;

    Ok(())
}

pub fn load_hotkeys(app: tauri::AppHandle) {
    let store = app.store(HOTKEYS_STORE_NAME).expect("Failed to open store");

    let entries = store.entries();

    for (shortcut, _action) in entries {
        let shortcut =
            Shortcut::from_str(shortcut.as_str()).expect("Failed to convert shortcut to Shortcut");
        let _ = register_hotkey(&app, shortcut);
    }
}

pub fn setup(app_handle: &tauri::AppHandle) {
    let _ = app_handle.plugin(
        tauri_plugin_global_shortcut::Builder::new()
            .with_handler(move |app, hotkey, event| {
                let store = app.store(HOTKEYS_STORE_NAME).expect("Failed to open store");

                let action = store.get(hotkey.to_string());

                if let Some(action) = action {
                    if event.state() == ShortcutState::Pressed {
                        let action_str = action.as_str().expect("Failed to get action");
                        if action_str.is_empty() {
                            eprintln!("Warning: Empty action string for hotkey {}", hotkey);
                            return;
                        }
                        // Parse as ActionPayload (new format only)
                        let payload: ActionPayload = serde_json::from_str(action_str)
                            .unwrap_or_else(|e| {
                                eprintln!("Failed to parse action '{}': {}", action_str, e);
                                panic!("Failed to parse action: {}", e);
                            });
                        let layout_action: LayoutAction = payload.into();

                        // Handle ActivateLayout action separately
                        match &layout_action {
                            LayoutAction::ActivateLayout(layout_id) => {
                                let _ = zone_layouts::set_active_zone_layout_id(
                                    app.clone(),
                                    Some(layout_id.clone()),
                                );

                                // Emit event to notify frontend of layout activation
                                let _ = app.emit("active-layout-changed", layout_id.clone());

                                // Show notification if enabled
                                let settings_store = SettingsStore::new(&app);
                                if let Ok(store) = settings_store {
                                    if let Ok(true) = store.get_show_layout_activation_notification() {
                                        // Get layout name for notification
                                        if let Ok(Some(layout)) = zone_layouts::get_zone_layout(app.clone(), layout_id.clone()) {
                                            let _ = app.notification().builder()
                                                .title("Zone Layout Activated")
                                                .body(&format!("Active layout: {}", layout.name))
                                                .show();
                                        }
                                    }
                                }
                            }
                            _ => {
                                let _ = snap_window(layout_action.clone(), Some(app.clone()));
                            }
                        }
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
    action: ActionPayload,
) -> Result<(), String> {
    let shortcut = Shortcut::from_str(&shortcut).map_err(|e| e.to_string())?;
    let layout_action: LayoutAction = action.into();

    persist_hotkey_action(&app, shortcut, layout_action)?;
    register_hotkey(&app, shortcut)?;
    Ok(())
}

#[tauri::command]
pub fn unregister_hotkey_action(app: tauri::AppHandle, action: ActionPayload) -> Result<(), String> {
    let shortcut_manager = app.global_shortcut();
    let store = app.store(HOTKEYS_STORE_NAME).expect("Failed to open store");

    // Find the shortcut that maps to this action
    // Store using ActionPayload format for consistency
    let action_str =
        serde_json::to_string(&action).map_err(|e| format!("Failed to serialize: {}", e))?;

    let entries = store.entries();
    for (shortcut, value) in entries {
        if let Some(stored_str) = value.as_str() {
            if stored_str == action_str {
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
    let store = app.store(HOTKEYS_STORE_NAME).expect("Failed to open store");

    let shortcuts = store.entries();

    let hotkeys = shortcuts
        .iter()
        .map(|(shortcut, action)| (shortcut.to_string(), action.as_str().unwrap().to_string()))
        .collect();

    Ok(hotkeys)
}

#[tauri::command]
pub fn clear_all_hotkeys(app: tauri::AppHandle) -> Result<(), String> {
    let shortcut_manager = app.global_shortcut();
    let store = app.store(HOTKEYS_STORE_NAME).expect("Failed to open store");

    // Get all shortcuts before clearing
    let entries = store.entries();

    // Unregister all shortcuts and delete from store
    for (shortcut_str, _) in entries.iter() {
        // Unregister the shortcut
        if let Ok(shortcut) = Shortcut::try_from(shortcut_str.clone()) {
            let _ = shortcut_manager.unregister(shortcut);
        }
    }

    // Clear the store
    store.clear();
    store.save().map_err(|e| e.to_string())?;

    Ok(())
}

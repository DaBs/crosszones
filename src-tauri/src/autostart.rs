use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_autostart::ManagerExt;
use tauri_plugin_store::StoreExt;

use crate::store::settings::SETTINGS_STORE_NAME;

pub fn setup_autostart(app: tauri::AppHandle) {
    let _ = app.plugin(tauri_plugin_autostart::init(
        MacosLauncher::LaunchAgent,
        None,
    ));

    let autostart_manager = app.autolaunch();
    let _ = autostart_manager.enable();
}


#[tauri::command]
pub fn set_autostart(app: tauri::AppHandle, enabled: bool) -> Result<(), String> {
    let autostart_manager = app.autolaunch();

    let store = app.store(SETTINGS_STORE_NAME).expect("Failed to open store");

    if enabled {
        let _ = autostart_manager.enable();
    } else {
        let _ = autostart_manager.disable();
    }

    store.set("autostart", enabled);
    store.save().map_err(|e| e.to_string())?;

    Ok(())
}

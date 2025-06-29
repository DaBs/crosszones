use serde_json::Value;
use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_autostart::ManagerExt;

use crate::store::settings::SettingsStore;

pub fn setup_autostart(app_handle: &tauri::AppHandle) {
    let _ = app_handle.plugin(tauri_plugin_autostart::init(
        MacosLauncher::LaunchAgent,
        None,
    ));

    let settings = SettingsStore::new(app_handle).unwrap();

    let autostart_manager = app_handle.autolaunch();

    if let Ok(auto_start) = settings.get_auto_start() {
        if auto_start {
            let _ = autostart_manager.enable();
        } else {
            let _ = autostart_manager.disable();
        }
    }
}

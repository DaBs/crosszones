use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_autostart::ManagerExt;

pub fn setup_autostart(app: tauri::AppHandle) {
    app.plugin(tauri_plugin_autostart::init(
        MacosLauncher::LaunchAgent,
        None,
    ));

    let autostart_manager = app.autolaunch();
    let _ = autostart_manager.enable();
}

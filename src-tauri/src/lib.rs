mod autostart;
mod hotkeys;
mod snapping;
mod store;
mod tray;
mod window_manager;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_persisted_scope::init())
        .plugin(tauri_plugin_macos_permissions::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            hotkeys::setup(app.handle().clone());
            tray::setup_tray(app.handle().clone());
            autostart::setup_autostart(app.handle().clone());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            hotkeys::register_hotkey_action,
            hotkeys::unregister_hotkey_action,
            hotkeys::get_all_hotkeys,
            store::settings::set_settings,
        ])
        .on_window_event(window_manager::on_window_event)
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

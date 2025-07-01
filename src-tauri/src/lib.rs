mod autostart;
mod hotkeys;
mod snapping;
mod store;
mod tray;
mod window;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_persisted_scope::init())
        .plugin(tauri_plugin_macos_permissions::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            hotkeys::register_hotkey_action,
            hotkeys::unregister_hotkey_action,
            hotkeys::get_all_hotkeys,
            store::settings::set_settings,
        ])
        .setup(move |app| {
            #[cfg(target_os = "macos")]
            {
                app.set_activation_policy(tauri::ActivationPolicy::Accessory);
            }

            hotkeys::setup(app.handle());
            tray::setup_tray(app.handle());
            autostart::setup_autostart(app.handle());

            window::window::create_window(app);
            Ok(())
        })
        .on_window_event(window::window_manager::on_window_event)
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

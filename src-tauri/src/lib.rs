mod autostart;
mod hotkeys;
mod snapping;
mod store;
mod tray;
mod window;
mod zones;

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
            store::zone_layouts::get_all_zone_layouts,
            store::zone_layouts::save_zone_layout,
            store::zone_layouts::delete_zone_layout,
            store::zone_layouts::get_zone_layout,
            zones::zone_windows::create_zone_window,
            zones::zone_windows::update_zone_window,
            zones::zone_windows::destroy_zone_window,
            zones::zone_windows::destroy_all_zone_windows,
            zones::zone_windows::get_primary_screen_dimensions,
            zones::zone_windows::focus_zone_window,
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

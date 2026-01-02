mod autostart;
mod hotkeys;
mod snapping;
mod store;
mod tray;
mod window;
mod zones;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
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
            hotkeys::clear_all_hotkeys,
            store::settings::set_settings,
            store::zone_layouts::get_all_zone_layouts,
            store::zone_layouts::save_zone_layout,
            store::zone_layouts::delete_zone_layout,
            store::zone_layouts::get_zone_layout,
            store::zone_layouts::get_active_zone_layout_id,
            store::zone_layouts::set_active_zone_layout_id,
            zones::zone_layout_editor::get_all_screens,
            zones::zone_layout_editor::create_zone_editor_windows,
            zones::zone_layout_editor::destroy_all_editor_windows,
            zones::zone_layout_editor::close_editor_windows,
            zones::zone_layout_editor::store_editor_zones,
            zones::zone_layout_editor::get_editor_zones,
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

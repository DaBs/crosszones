mod snapping;
mod hotkeys;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_persisted_scope::init())
        .plugin(tauri_plugin_macos_permissions::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            hotkeys::setup_handler(app.handle().clone());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            hotkeys::register_hotkey,
            hotkeys::unregister_hotkey,
            hotkeys::get_all_hotkeys,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

mod snapping;
mod hotkeys;
mod rpc;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_persisted_scope::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(taurpc::create_ipc_handler(rpc::ApiImpl.into_handler()))
        .setup(|app| {
            hotkeys::setup_handler(app.handle().clone());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

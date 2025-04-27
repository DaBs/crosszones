use tauri_plugin_global_shortcut::Shortcut;

#[taurpc::procedures]
trait Api {
    async fn register_hotkey(shortcut: Shortcut, action: String) -> Result<(), String>;
    async fn unregister_hotkey(shortcut: Shortcut) -> Result<(), String>;
    async fn get_all_hotkeys() -> Result<Vec<Shortcut>, String>;
}

#[derive(Clone)]
pub struct ApiImpl;

#[taurpc::resolvers]
impl Api for ApiImpl {
    async fn register_hotkey(shortcut: Shortcut, action: String) -> Result<(), String> {
        Ok(())
    }

    async fn unregister_hotkey(shortcut: Shortcut) -> Result<(), String> {
        Ok(())
    }

    async fn get_all_hotkeys() -> Result<Vec<Shortcut>, String> {
        Ok(Vec::new())
    }
}



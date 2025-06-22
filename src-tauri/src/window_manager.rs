use tauri::{Manager, Window, WindowEvent};

use crate::store::settings::SettingsStore;

pub fn on_window_event(window: &Window, _event: &WindowEvent) {
    // Get a handle to the app so we can get the global state.
    let app_handle = window.app_handle();

    let settings = SettingsStore::new(&app_handle).unwrap();

    match _event {
        WindowEvent::CloseRequested { api, .. } => {
            let should_close_to_system_tray = settings.get_close_to_system_tray().unwrap_or(false);

            if should_close_to_system_tray {
                window.hide().unwrap();
                api.prevent_close();
            }
        }
        _ => {}
    }
}

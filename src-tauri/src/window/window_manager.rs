use tauri::{Manager, Window, WindowEvent};

use crate::store::settings::SettingsStore;
use crate::window::PRIMARY_WINDOW_NAME;
use crate::zones::zone_layout_editor;

pub fn on_window_event(window: &Window, event: &WindowEvent) {
    let window_label = window.label();

    // Handle editor window close events - destroy all editor windows when one closes
    if window_label.starts_with("zone-editor-") {
        if let WindowEvent::CloseRequested { .. } = event {
            let _ = zone_layout_editor::destroy_all_editor_windows(window.app_handle().clone());
        }
        return;
    }

    // Handling these events are only for the primary window
    if window_label != PRIMARY_WINDOW_NAME {
        return;
    }

    // Get a handle to the app so we can get the global state.
    let app_handle = window.app_handle();

    let settings = SettingsStore::new(&app_handle).unwrap();

    if let WindowEvent::CloseRequested { api, .. } = event {
        let should_close_to_system_tray = settings.get_close_to_system_tray().unwrap_or(false);

        if should_close_to_system_tray {
            window.hide().unwrap();
            api.prevent_close();
        }
    }
}

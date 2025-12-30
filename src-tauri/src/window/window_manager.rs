use tauri::{Manager, Window, WindowEvent};

use crate::store::settings::SettingsStore;
use crate::window::PRIMARY_WINDOW_NAME;
use crate::zones::zone_windows;

pub fn on_window_event(window: &Window, event: &WindowEvent) {
    let window_label = window.label();
    
    // Handle zone window close events
    if window_label.starts_with("zone-") {
        if let WindowEvent::CloseRequested { .. } = event {
            // Extract zone ID from window label (format: "zone-{id}")
            if let Some(zone_id) = window_label.strip_prefix("zone-") {
                // Remove from HashMap - window is already closing, just clean up our reference
                zone_windows::remove_zone_window_from_map(zone_id);
            }
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

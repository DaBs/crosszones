use tauri::{Manager, Window, WindowEvent};

pub fn on_window_event(window: &Window, _event: &WindowEvent) {
    // Get a handle to the app so we can get the global state.
    let app_handle = window.app_handle();

    match _event {
        WindowEvent::CloseRequested { api, .. } => {
            window.hide().unwrap();
            api.prevent_close();
        }
        _ => {}
    }
}

use tauri::{
    menu::{Menu, MenuItem},
    tray::{TrayIconBuilder, TrayIconEvent},
    Manager,
};

use crate::window::WINDOW_NAME;

pub fn setup_tray(app_handle: &tauri::AppHandle) {
    let open_i = MenuItem::with_id(app_handle, "open", "Open", true, None::<&str>).unwrap();
    let quit_i = MenuItem::with_id(app_handle, "quit", "Quit", true, None::<&str>).unwrap();
    let menu = Menu::with_items(app_handle, &[&open_i, &quit_i]).unwrap();

    let tray = TrayIconBuilder::new()
        .icon(app_handle.default_window_icon().unwrap().clone())
        .tooltip("CrossZones")
        .menu(&menu)
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click { .. } = event {    
                let app = tray.app_handle();
                app.get_webview_window(WINDOW_NAME).unwrap().show().unwrap();
            }
        })
        .on_menu_event(|app, event| match event.id.as_ref() {
            "open" => {
                app.get_webview_window(WINDOW_NAME).unwrap().show().unwrap();
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .build(app_handle)
        .unwrap();
}

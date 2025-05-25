use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager,
};

pub fn setup_tray(app: tauri::AppHandle) {
    let open_i = MenuItem::with_id(&app, "open", "Open", true, None::<&str>).unwrap();
    let quit_i = MenuItem::with_id(&app, "quit", "Quit", true, None::<&str>).unwrap();
    let menu = Menu::with_items(&app, &[&open_i, &quit_i]).unwrap();

    let tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .tooltip("CrossZones")
        .menu(&menu)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "open" => {
                app.get_webview_window("main").unwrap().show().unwrap();
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .build(&app)
        .unwrap();
}

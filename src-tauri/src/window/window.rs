use tauri::{TitleBarStyle, WebviewUrl, WebviewWindow, WebviewWindowBuilder};

use crate::window::WINDOW_NAME;

pub fn setup(app: &tauri::App) -> WebviewWindow {
    let window_builder = WebviewWindowBuilder::new(app, WINDOW_NAME, WebviewUrl::default())
      .title("")
      .visible(false)
      .inner_size(1300.0, 820.0)
      .min_inner_size(1300.0, 820.0);

    #[cfg(target_os = "macos")]
    let window_builder = window_builder.title_bar_style(TitleBarStyle::Overlay);

    match window_builder.build() {
        Ok(window) => window,
        Err(e) => {
            eprintln!("Failed to build window: {}", e);
            std::process::exit(1);
        }
    }
}
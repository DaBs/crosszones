use tauri::{WebviewUrl, WebviewWindow, WebviewWindowBuilder};

#[cfg(target_os = "macos")]
use tauri::TitleBarStyle;

use crate::window::WINDOW_NAME;

pub fn setup(app: &tauri::App) -> WebviewWindow {
    let mut window_builder = WebviewWindowBuilder::new(app, WINDOW_NAME, WebviewUrl::default())
      .title("CrossZones")
      .visible(false)
      .inner_size(1300.0, 820.0)
      .min_inner_size(1300.0, 820.0)
      .transparent(true);

    #[cfg(target_os = "windows")]
    {
        window_builder = window_builder.decorations(false);
    }

    #[cfg(target_os = "macos")]
    {
        window_builder = window_builder.title_bar_style(TitleBarStyle::Overlay);
        window_builder = window_builder.title("");
    }

    match window_builder.build() {
        Ok(window) => window,
        Err(e) => {
            eprintln!("Failed to build window: {}", e);
            std::process::exit(1);
        }
    }
}
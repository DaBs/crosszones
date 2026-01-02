use crate::store::zone_layouts::ZoneLayout;
use crate::snapping::common::ScreenDimensions;
use display_info::DisplayInfo;
use serde_json;
use std::collections::HashMap;
use std::sync::LazyLock;
use std::sync::Mutex;
use tauri::{Emitter, WebviewUrl, WebviewWindow, WebviewWindowBuilder};

static OVERLAY_WINDOWS: LazyLock<Mutex<HashMap<String, WebviewWindow>>> =
    LazyLock::new(|| Mutex::new(HashMap::new()));

pub struct ZoneOverlay;

impl ZoneOverlay {
    pub fn new() -> Self {
        Self
    }

    pub fn show(
        &self,
        app_handle: &tauri::AppHandle,
        layout: &ZoneLayout,
        screen: ScreenDimensions,
    ) -> Result<(), String> {
        // Hide existing overlay if any
        self.hide()?;

        // Find screen index for window label
        let screens = DisplayInfo::all().map_err(|e| format!("Failed to get screens: {}", e))?;
        let screen_idx = screens
            .iter()
            .enumerate()
            .find(|(_, s)| s.x == screen.x && s.y == screen.y && s.width == screen.width as u32 && s.height == screen.height as u32)
            .map(|(idx, _)| idx)
            .unwrap_or(0);

        let window_label = format!("zone-overlay-{}", screen_idx);

        // Create overlay window on the specified screen
        let mut window_builder = WebviewWindowBuilder::new(
            app_handle,
            &window_label,
            WebviewUrl::App("index.html#/zone-overlay".into()),
        )
        .title("Zone Overlay")
        .inner_size(screen.width as f64, screen.height as f64)
        .position(screen.x as f64, screen.y as f64)
        .visible(true)
        .resizable(false)
        .decorations(true)
        .skip_taskbar(true)
        .closable(false)
        .focused(false);

        if app_handle.config().app.macos_private_api || cfg!(target_os = "windows") {
            window_builder = window_builder.transparent(true);
        }

        if let Ok(window) = window_builder.build() {
            // Small delay to ensure navigation completes before emitting data
            std::thread::sleep(std::time::Duration::from_millis(300));

            // Emit overlay data to the window
            let overlay_data = serde_json::json!({
                "layout": layout,
                "screen": {
                    "x": screen.x,
                    "y": screen.y,
                    "width": screen.width,
                    "height": screen.height,
                }
            });
            let _ = app_handle.emit("drag-overlay-show", &overlay_data);

            // Store window reference
            let mut windows = OVERLAY_WINDOWS.lock().unwrap();
            windows.insert(window_label, window);
        }

        Ok(())
    }

    pub fn hide(&self) -> Result<(), String> {
        let mut windows = OVERLAY_WINDOWS.lock().unwrap();

        for (_label, window) in windows.drain() {
            //let _ = window.destroy();
        }

        Ok(())
    }

    pub fn update_mouse_position(
        &self,
        x: i32,
        y: i32,
    ) -> Result<(), String> {
        let windows = OVERLAY_WINDOWS.lock().unwrap();

        for (_label, window) in windows.iter() {
            let _ = window.emit("drag-overlay-mouse", serde_json::json!({ "x": x, "y": y }));
        }

        Ok(())
    }
}

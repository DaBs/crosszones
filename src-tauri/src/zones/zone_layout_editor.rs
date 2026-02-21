use crate::store::zone_layouts::Zone;
use display_info::DisplayInfo;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::{Emitter, WebviewUrl, WebviewWindow, WebviewWindowBuilder};

static EDITOR_WINDOWS: std::sync::LazyLock<std::sync::Mutex<HashMap<String, WebviewWindow>>> =
    std::sync::LazyLock::new(|| std::sync::Mutex::new(HashMap::new()));

static EDITOR_ZONES: std::sync::LazyLock<std::sync::Mutex<Vec<Zone>>> =
    std::sync::LazyLock::new(|| std::sync::Mutex::new(Vec::new()));

#[derive(Debug, Clone, Serialize, Deserialize, ts_rs::TS)]
#[ts(export)]
pub struct ScreenInfo {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
    pub id: String,
}

#[tauri::command]
pub fn get_all_screens() -> Result<Vec<ScreenInfo>, String> {
    let screens = DisplayInfo::all().map_err(|e| format!("Failed to get screens: {}", e))?;

    Ok(screens
        .into_iter()
        .enumerate()
        .map(|(idx, screen)| ScreenInfo {
            x: screen.x,
            y: screen.y,
            width: screen.width,
            height: screen.height,
            id: format!("screen-{}", idx),
        })
        .collect())
}

#[tauri::command]
pub fn create_zone_editor_windows(
    app: tauri::AppHandle,
    layout_id: String,
    layout_name: String,
    zones: Vec<Zone>,
) -> Result<(), String> {
    let screens = DisplayInfo::all().map_err(|e| format!("Failed to get screens: {}", e))?;

    // Destroy existing editor windows first
    destroy_all_editor_windows(app.clone())?;

    // Extract screen data before moving into threads
    let screen_data: Vec<(i32, i32, u32, u32, usize)> = screens
        .iter()
        .enumerate()
        .map(|(idx, screen)| (screen.x, screen.y, screen.width, screen.height, idx))
        .collect();

    for (screen_x, screen_y, screen_width, screen_height, screen_idx) in screen_data {
        let app_handle = app.clone();
        let layout_id_clone = layout_id.clone();
        let layout_name_clone = layout_name.clone();
        let zones_clone = zones.clone();
        let window_label = format!("zone-editor-{}", screen_idx);

        std::thread::spawn(move || {
            let mut window_builder = WebviewWindowBuilder::new(
                &app_handle,
                &window_label,
                WebviewUrl::App("index.html#/zone-editor".into()),
            )
            .title(&format!("Zone Editor - {}", layout_name_clone))
            .inner_size(screen_width as f64, screen_height as f64)
            .position(screen_x as f64, screen_y as f64)
            .visible(true)
            .resizable(false)
            .decorations(false)
            .skip_taskbar(true)
            .closable(true)
            .focused(screen_idx == 0);

            if app_handle.config().app.macos_private_api || cfg!(target_os = "windows") {
                window_builder = window_builder.transparent(true);
            }

            if let Ok(window) = window_builder.build() {
                // Small delay to ensure navigation completes before emitting data
                std::thread::sleep(std::time::Duration::from_millis(300));

                // Emit editor data to the window
                let editor_data = serde_json::json!({
                    "layoutId": layout_id_clone,
                    "layoutName": layout_name_clone,
                    "zones": zones_clone,
                    "screen": {
                        "x": screen_x,
                        "y": screen_y,
                        "width": screen_width,
                        "height": screen_height,
                        "id": format!("screen-{}", screen_idx),
                    }
                });
                let _ = window.emit("editor-data", &editor_data);

                // Store window reference
                let mut windows = EDITOR_WINDOWS.lock().unwrap();
                windows.insert(window_label, window);
            }
        });
    }

    Ok(())
}

#[tauri::command]
pub fn destroy_all_editor_windows(app: tauri::AppHandle) -> Result<(), String> {
    let mut windows = EDITOR_WINDOWS.lock().unwrap();

    for (_label, window) in windows.drain() {
        let _ = window.destroy();
    }

    let _ = app.emit("editor-closed", &serde_json::json!({})).unwrap();
    Ok(())
}

#[tauri::command]
pub fn store_editor_zones(app: tauri::AppHandle, zones: Vec<Zone>) -> Result<(), String> {
    let mut stored_zones = EDITOR_ZONES.lock().unwrap();
    *stored_zones = zones.clone();

    // Emit event to notify listeners that zones have been updated
    let _ = app.emit("zones-updated", &zones);

    Ok(())
}

#[tauri::command]
pub fn close_editor_windows(app: tauri::AppHandle, zones: Vec<Zone>) -> Result<(), String> {
    // Store zones before closing
    store_editor_zones(app.clone(), zones)?;

    // Close all windows
    destroy_all_editor_windows(app.clone())
}

#[tauri::command]
pub fn get_editor_zones() -> Result<Vec<Zone>, String> {
    let zones = EDITOR_ZONES.lock().unwrap();
    Ok(zones.clone())
}

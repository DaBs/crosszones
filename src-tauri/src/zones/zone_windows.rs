use std::collections::HashMap;
use tauri::{Emitter, WebviewUrl, WebviewWindow, WebviewWindowBuilder};
use display_info::DisplayInfo;
use crate::store::zone_layouts::Zone;

static ZONE_WINDOWS: std::sync::LazyLock<std::sync::Mutex<HashMap<String, WebviewWindow>>> =
    std::sync::LazyLock::new(|| std::sync::Mutex::new(HashMap::new()));

#[tauri::command]
pub fn create_zone_window(
    app: tauri::AppHandle,
    zone: Zone,
) -> Result<(), String> {
    let window_label = format!("zone-{}", zone.id);
    
    // Check if window already exists
    {
        let windows = ZONE_WINDOWS.lock().unwrap();
        if windows.contains_key(&window_label) {
            // Window exists, just update it
            drop(windows);
            return update_zone_window(app, zone);
        }
    }

    // Get primary screen dimensions
    let screens = DisplayInfo::all().map_err(|e| format!("Failed to get screens: {}", e))?;
    let primary_screen = screens
        .first()
        .ok_or_else(|| "No screens found".to_string())?;

    // Calculate absolute position and size from percentages
    let x = (primary_screen.width as f64 * zone.x / 100.0) as i32 + primary_screen.x;
    let y = (primary_screen.height as f64 * zone.y / 100.0) as i32 + primary_screen.y;
    let width = (primary_screen.width as f64 * zone.width / 100.0) as u32;
    let height = (primary_screen.height as f64 * zone.height / 100.0) as u32;

    // Create transparent window
    let mut window_builder = WebviewWindowBuilder::new(
        &app,
        &window_label,
        WebviewUrl::App("zone-overlay.html".into()),
    )
    .title(&format!("Zone {}", zone.number))
    .inner_size(width as f64, height as f64)
    .position(x as f64, y as f64)
    .visible(true)
    .resizable(true)
    .decorations(false)
    .always_on_top(true)
    .skip_taskbar(true)
    .focused(false);

    #[cfg(target_os = "macos")]
    {
        use tauri::TitleBarStyle;
        window_builder = window_builder.title_bar_style(TitleBarStyle::Overlay);
    }

    let window = window_builder
        .build()
        .map_err(|e| format!("Failed to create zone window: {}", e))?;

    // Emit zone data to the window
    window
        .emit("zone-data", &zone)
        .map_err(|e| format!("Failed to emit zone data: {}", e))?;

    // Store window reference
    {
        let mut windows = ZONE_WINDOWS.lock().unwrap();
        windows.insert(window_label, window);
    }

    Ok(())
}

#[tauri::command]
pub fn update_zone_window(
    app: tauri::AppHandle,
    zone: Zone,
) -> Result<(), String> {
    let window_label = format!("zone-{}", zone.id);

    // Get primary screen dimensions
    let screens = DisplayInfo::all().map_err(|e| format!("Failed to get screens: {}", e))?;
    let primary_screen = screens
        .first()
        .ok_or_else(|| "No screens found".to_string())?;

    // Calculate absolute position and size from percentages
    let x = (primary_screen.width as f64 * zone.x / 100.0) as i32 + primary_screen.x;
    let y = (primary_screen.height as f64 * zone.y / 100.0) as i32 + primary_screen.y;
    let width = (primary_screen.width as f64 * zone.width / 100.0) as u32;
    let height = (primary_screen.height as f64 * zone.height / 100.0) as u32;

    let windows = ZONE_WINDOWS.lock().unwrap();
    if let Some(window) = windows.get(&window_label) {
        // Update position and size
        window
            .set_position(tauri::PhysicalPosition::new(x, y))
            .map_err(|e| format!("Failed to set position: {}", e))?;
        window
            .set_size(tauri::PhysicalSize::new(width, height))
            .map_err(|e| format!("Failed to set size: {}", e))?;

        // Update zone data
        window
            .emit("zone-data", &zone)
            .map_err(|e| format!("Failed to emit zone data: {}", e))?;
    } else {
        // Window doesn't exist, create it
        drop(windows);
        return create_zone_window(app, zone);
    }

    Ok(())
}

#[tauri::command]
pub fn destroy_zone_window(zone_id: String) -> Result<(), String> {
    let window_label = format!("zone-{}", zone_id);
    
    let mut windows = ZONE_WINDOWS.lock().unwrap();
    if let Some(window) = windows.remove(&window_label) {
        window
            .close()
            .map_err(|e| format!("Failed to close zone window: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
pub fn destroy_all_zone_windows() -> Result<(), String> {
    let mut windows = ZONE_WINDOWS.lock().unwrap();
    
    for (_label, window) in windows.drain() {
        let _ = window.close();
    }

    Ok(())
}

#[tauri::command]
pub fn get_primary_screen_dimensions() -> Result<(u32, u32), String> {
    let screens = DisplayInfo::all().map_err(|e| format!("Failed to get screens: {}", e))?;
    let primary_screen = screens
        .first()
        .ok_or_else(|| "No screens found".to_string())?;
    
    Ok((primary_screen.width, primary_screen.height))
}

#[tauri::command]
pub fn focus_zone_window(zone_id: String) -> Result<(), String> {
    let window_label = format!("zone-{}", zone_id);
    
    let windows = ZONE_WINDOWS.lock().unwrap();
    if let Some(window) = windows.get(&window_label) {
        window.set_focus().map_err(|e| format!("Failed to focus window: {}", e))?;
    }

    Ok(())
}


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
    let should_update = {
        let windows = ZONE_WINDOWS.lock().unwrap();
        windows.contains_key(&window_label)
    };
    
    if should_update {
        // Window exists, just update it
        return update_zone_window(app, zone);
    }

    // Get primary screen dimensions (this is safe to do synchronously)
    let screens = DisplayInfo::all().map_err(|e| format!("Failed to get screens: {}", e))?;
    let primary_screen = screens
        .first()
        .ok_or_else(|| "No screens found".to_string())?;

    // Calculate absolute position and size from percentages
    let x = (primary_screen.width as f64 * zone.x / 100.0) as i32 + primary_screen.x;
    let y = (primary_screen.height as f64 * zone.y / 100.0) as i32 + primary_screen.y;
    let width = (primary_screen.width as f64 * zone.width / 100.0) as u32;
    let height = (primary_screen.height as f64 * zone.height / 100.0) as u32;
    
    // Clone data needed for window creation
    let app_handle = app.clone();
    let window_label_clone = window_label.clone();
    let zone_clone = zone.clone();
    let title = format!("Zone {}", zone.number);
    
    // Spawn window creation in a separate thread to avoid deadlocks on Windows
    // The thread will handle window creation asynchronously
    std::thread::spawn(move || {
        // Create transparent window
        let mut window_builder = WebviewWindowBuilder::new(
            &app_handle,
            &window_label_clone,
            WebviewUrl::App("zone-overlay.html".into()),
        )
        .title(&title)
        .inner_size(width as f64, height as f64)
        .position(x as f64, y as f64)
        .visible(true)
        .resizable(true)
        .decorations(false)
        .always_on_top(true)
        .skip_taskbar(true)
        .closable(true)
        .focused(false);

        #[cfg(target_os = "windows")]
        {
            window_builder = window_builder.transparent(true);
        }

        if let Ok(window) = window_builder.build() {
            // Emit zone data to the window (ignore errors)
            let _ = window.emit("zone-data", &zone_clone);
            
            // Store window reference
            let mut windows = ZONE_WINDOWS.lock().unwrap();
            windows.insert(window_label_clone, window);
        }
        // Note: Errors are silently ignored as window creation happens in background
    });

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

    let window_exists = {
        let windows = ZONE_WINDOWS.lock().unwrap();
        windows.contains_key(&window_label)
    };
    
    if window_exists {
        // Update position and size
        let windows = ZONE_WINDOWS.lock().unwrap();
        if let Some(window) = windows.get(&window_label) {
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
        }
    } else {
        // Window doesn't exist, create it
        return create_zone_window(app, zone);
    }

    Ok(())
}

/// Remove a zone window from the HashMap without closing it.
/// Used when the window is already in the process of closing.
pub fn remove_zone_window_from_map(zone_id: &str) {
    let window_label = format!("zone-{}", zone_id);
    let mut windows = ZONE_WINDOWS.lock().unwrap();
    windows.remove(&window_label);
}

#[tauri::command]
pub fn destroy_zone_window(zone_id: String) -> Result<(), String> {
    let window_label = format!("zone-{}", zone_id);
    
    let mut windows = ZONE_WINDOWS.lock().unwrap();
    if let Some(window) = windows.remove(&window_label) {
        window
            .destroy()
            .map_err(|e| format!("Failed to close zone window: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
pub fn destroy_all_zone_windows() -> Result<(), String> {
    let mut windows = ZONE_WINDOWS.lock().unwrap();
    
    for (_label, window) in windows.drain() {
        let _ = window.destroy();
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


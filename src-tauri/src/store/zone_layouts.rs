use serde::{Deserialize, Serialize};
use tauri_plugin_store::StoreExt;
use ts_rs::TS;

pub const ZONE_LAYOUTS_STORE_NAME: &str = "zone_layouts.json";

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct Zone {
    pub id: String,
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    pub number: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct ZoneLayout {
    pub id: String,
    pub name: String,
    pub zones: Vec<Zone>,
}


#[tauri::command]
pub fn get_all_zone_layouts(app: tauri::AppHandle) -> Result<Vec<ZoneLayout>, String> {
    let store = app
        .store(ZONE_LAYOUTS_STORE_NAME)
        .map_err(|e| format!("Failed to open store: {}", e))?;

    let layouts_json = store.get("layouts");
    
    if let Some(layouts_value) = layouts_json {
        let layouts: Vec<ZoneLayout> = serde_json::from_value(layouts_value.clone())
            .map_err(|e| format!("Failed to deserialize layouts: {}", e))?;
        Ok(layouts)
    } else {
        Ok(Vec::new())
    }
}

#[tauri::command]
pub fn save_zone_layout(app: tauri::AppHandle, layout: ZoneLayout) -> Result<(), String> {
    let store = app
        .store(ZONE_LAYOUTS_STORE_NAME)
        .map_err(|e| format!("Failed to open store: {}", e))?;

    let mut layouts: Vec<ZoneLayout> = if let Some(layouts_value) = store.get("layouts") {
        serde_json::from_value(layouts_value.clone())
            .map_err(|e| format!("Failed to deserialize layouts: {}", e))?
    } else {
        Vec::new()
    };

    // Update or insert the layout
    if let Some(existing_index) = layouts.iter().position(|l| l.id == layout.id) {
        layouts[existing_index] = layout;
    } else {
        layouts.push(layout);
    }

    store.set("layouts", serde_json::to_value(&layouts)
        .map_err(|e| format!("Failed to serialize layouts: {}", e))?);
    
    store.save().map_err(|e| format!("Failed to save store: {}", e))?;

    Ok(())
}

#[tauri::command]
pub fn delete_zone_layout(app: tauri::AppHandle, layout_id: String) -> Result<(), String> {
    let store = app
        .store(ZONE_LAYOUTS_STORE_NAME)
        .map_err(|e| format!("Failed to open store: {}", e))?;

    let mut layouts: Vec<ZoneLayout> = if let Some(layouts_value) = store.get("layouts") {
        serde_json::from_value(layouts_value.clone())
            .map_err(|e| format!("Failed to deserialize layouts: {}", e))?
    } else {
        return Ok(());
    };

    layouts.retain(|l| l.id != layout_id);

    store.set("layouts", serde_json::to_value(&layouts)
        .map_err(|e| format!("Failed to serialize layouts: {}", e))?);
    
    store.save().map_err(|e| format!("Failed to save store: {}", e))?;

    Ok(())
}

#[tauri::command]
pub fn get_zone_layout(app: tauri::AppHandle, layout_id: String) -> Result<Option<ZoneLayout>, String> {
    let store = app
        .store(ZONE_LAYOUTS_STORE_NAME)
        .map_err(|e| format!("Failed to open store: {}", e))?;

    let layouts: Vec<ZoneLayout> = if let Some(layouts_value) = store.get("layouts") {
        serde_json::from_value(layouts_value.clone())
            .map_err(|e| format!("Failed to deserialize layouts: {}", e))?
    } else {
        return Ok(None);
    };

    Ok(layouts.into_iter().find(|l| l.id == layout_id))
}


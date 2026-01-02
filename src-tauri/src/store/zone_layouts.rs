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
    #[serde(skip_serializing_if = "Option::is_none", rename = "screenWidth")]
    pub screen_width: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none", rename = "screenHeight")]
    pub screen_height: Option<u32>,
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

    store.set(
        "layouts",
        serde_json::to_value(&layouts)
            .map_err(|e| format!("Failed to serialize layouts: {}", e))?,
    );

    store
        .save()
        .map_err(|e| format!("Failed to save store: {}", e))?;

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

    store.set(
        "layouts",
        serde_json::to_value(&layouts)
            .map_err(|e| format!("Failed to serialize layouts: {}", e))?,
    );

    store
        .save()
        .map_err(|e| format!("Failed to save store: {}", e))?;

    Ok(())
}

#[tauri::command]
pub fn get_zone_layout(
    app: tauri::AppHandle,
    layout_id: String,
) -> Result<Option<ZoneLayout>, String> {
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

#[tauri::command]
pub fn get_active_zone_layout_id(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let store = app
        .store(ZONE_LAYOUTS_STORE_NAME)
        .map_err(|e| format!("Failed to open store: {}", e))?;

    if let Some(active_id_value) = store.get("active_layout_id") {
        let active_id: String = serde_json::from_value(active_id_value.clone())
            .map_err(|e| format!("Failed to deserialize active layout ID: {}", e))?;
        Ok(Some(active_id))
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub fn set_active_zone_layout_id(
    app: tauri::AppHandle,
    layout_id: Option<String>,
) -> Result<(), String> {
    let store = app
        .store(ZONE_LAYOUTS_STORE_NAME)
        .map_err(|e| format!("Failed to open store: {}", e))?;

    if let Some(id) = layout_id {
        store.set(
            "active_layout_id",
            serde_json::to_value(id)
                .map_err(|e| format!("Failed to serialize active layout ID: {}", e))?,
        );
    } else {
        store.delete("active_layout_id");
    }

    store
        .save()
        .map_err(|e| format!("Failed to save store: {}", e))?;

    Ok(())
}

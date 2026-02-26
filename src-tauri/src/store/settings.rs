use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tauri::Manager;
use tauri_plugin_store::{Store, StoreExt};
use ts_rs::TS;

pub const SETTINGS_STORE_NAME: &str = "settings.json";

#[derive(Debug, Clone, Serialize, Deserialize, Default, TS)]
#[ts(export)]
pub struct Settings {
    #[serde(default)]
    pub auto_start: bool,
    #[serde(default)]
    pub start_minimized: bool,
    #[serde(default)]
    pub close_to_system_tray: bool,
    #[serde(default)]
    pub show_layout_activation_notification: bool,
    #[serde(default)]
    pub zone_drag_modifier_key: Option<String>, // e.g., "control", "alt", "shift", "super"
    /// When true, show the zone overlay during drag-and-drop (when modifier is held). When false, zones still apply on drop but no visual indicator is shown.
    #[serde(default)]
    pub show_zone_drag_overlay: bool,
    /// Opacity of the zone overlay during drag (0.0–1.0). Default 0.25 when unset.
    #[serde(default = "default_zone_overlay_opacity")]
    pub zone_overlay_opacity: f32,
}

fn default_zone_overlay_opacity() -> f32 {
    0.25
}

/// The main settings store
pub struct SettingsStore {
    app_handle: tauri::AppHandle,
}

#[derive(Debug, thiserror::Error)]
pub enum SettingsError {
    #[error("Store error: {0}")]
    Store(#[from] tauri_plugin_store::Error),
    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),
}

impl SettingsStore {
    pub fn new(app_handle: &tauri::AppHandle) -> Result<Self, SettingsError> {
        Ok(Self {
            app_handle: app_handle.clone(),
        })
    }

    /// Save all settings
    pub fn save_all(&self, settings: &Settings) -> Result<(), SettingsError> {
        let store = self.app_handle.store(SETTINGS_STORE_NAME)?;
        // TODO: Actually iterate instead of this
        store.set("auto_start", settings.auto_start);
        store.set("start_minimized", settings.start_minimized);
        store.set("close_to_system_tray", settings.close_to_system_tray);
        store.set("show_layout_activation_notification", settings.show_layout_activation_notification);
        store.set("zone_drag_modifier_key", serde_json::to_value(&settings.zone_drag_modifier_key)?);
        store.set("show_zone_drag_overlay", settings.show_zone_drag_overlay);
        store.set("zone_overlay_opacity", settings.zone_overlay_opacity);
        store.save()?;
        Ok(())
    }

    /// Get a specific setting
    pub fn get<T: for<'de> serde::Deserialize<'de>>(
        &self,
        field: &str,
    ) -> Result<Option<T>, SettingsError> {
        let store = self.app_handle.store(SETTINGS_STORE_NAME)?;
        let value = store.get(field).unwrap_or(serde_json::Value::Null);
        Ok(serde_json::from_value(value).ok())
    }

    /// Set a specific setting
    pub fn set<T: Serialize>(&self, field: &str, value: T) -> Result<(), SettingsError> {
        let store = self.app_handle.store(SETTINGS_STORE_NAME)?;
        let json_value = serde_json::to_value(value)?;
        store.set(field, json_value);
        store.save()?;
        Ok(())
    }
}

// Helper methods for common settings
impl SettingsStore {
    pub fn get_auto_start(&self) -> Result<bool, SettingsError> {
        self.get("auto_start").map(|v| v.unwrap_or(false))
    }

    pub fn set_auto_start(&self, value: bool) -> Result<(), SettingsError> {
        self.set("auto_start", value)
    }

    pub fn get_start_minimized(&self) -> Result<bool, SettingsError> {
        self.get("start_minimized").map(|v| v.unwrap_or(false))
    }

    pub fn set_start_minimized(&self, value: bool) -> Result<(), SettingsError> {
        self.set("start_minimized", value)
    }

    pub fn get_close_to_system_tray(&self) -> Result<bool, SettingsError> {
        self.get("close_to_system_tray").map(|v| v.unwrap_or(false))
    }

    pub fn set_close_to_system_tray(&self, value: bool) -> Result<(), SettingsError> {
        self.set("close_to_system_tray", value)
    }

    pub fn get_show_layout_activation_notification(&self) -> Result<bool, SettingsError> {
        self.get("show_layout_activation_notification").map(|v| v.unwrap_or(false))
    }

    pub fn set_show_layout_activation_notification(&self, value: bool) -> Result<(), SettingsError> {
        self.set("show_layout_activation_notification", value)
    }

    pub fn get_zone_drag_modifier_key(&self) -> Result<Option<String>, SettingsError> {
        self.get("zone_drag_modifier_key")
    }

    pub fn set_zone_drag_modifier_key(&self, value: Option<String>) -> Result<(), SettingsError> {
        self.set("zone_drag_modifier_key", value)
    }

    /// Whether to show the zone overlay during drag-and-drop when the modifier key is held. Defaults to true when unset.
    pub fn get_show_zone_drag_overlay(&self) -> Result<bool, SettingsError> {
        self.get("show_zone_drag_overlay").map(|v| v.unwrap_or(true))
    }

    pub fn set_show_zone_drag_overlay(&self, value: bool) -> Result<(), SettingsError> {
        self.set("show_zone_drag_overlay", value)
    }

    /// Zone overlay opacity (0.0–1.0). Defaults to 0.25 when unset.
    pub fn get_zone_overlay_opacity(&self) -> Result<f32, SettingsError> {
        self.get("zone_overlay_opacity").map(|v| v.unwrap_or(0.25))
    }

    pub fn set_zone_overlay_opacity(&self, value: f32) -> Result<(), SettingsError> {
        self.set("zone_overlay_opacity", value)
    }
}

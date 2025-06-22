use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use serde::{Serialize, Deserialize};
use tauri::Manager;
use tauri_plugin_store::{Store, StoreExt};
use serde_json::Value as JsonValue;
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
}

/// A hook that will be called when a setting changes
pub type SettingChangeHook = Box<dyn Fn(&str, &serde_json::Value) + Send + Sync>;

/// The main settings store
pub struct SettingsStore {
    hooks: Mutex<HashMap<String, Vec<SettingChangeHook>>>,
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
            hooks: Mutex::new(HashMap::new()),
            app_handle: app_handle.clone(),
        })
    }

    /// Get all settings
    pub fn get_all(&self) -> Result<Settings, SettingsError> {
        let store = self.app_handle.store(SETTINGS_STORE_NAME)?;
        let value = store.get(SETTINGS_STORE_NAME).unwrap_or_else(|| serde_json::json!({}));
        Ok(serde_json::from_value(value.clone())?)
    }

    /// Save all settings
    pub fn save_all(&self, settings: &Settings) -> Result<(), SettingsError> {
        let store = self.app_handle.store(SETTINGS_STORE_NAME)?;
        // TODO: Actually iterate instead of this   
        store.set("auto_start", settings.auto_start);
        store.set("start_minimized", settings.start_minimized);
        store.set("close_to_system_tray", settings.close_to_system_tray);
        store.save()?;
        Ok(())
    }

    /// Get a specific setting
    pub fn get<T: for<'de> serde::Deserialize<'de>>(&self, field: &str) -> Result<Option<T>, SettingsError> {
        let settings = self.get_all()?;
        let value = serde_json::to_value(settings)?;
        Ok(value.get(field).and_then(|v| serde_json::from_value(v.clone()).ok()))
    }

    /// Set a specific setting
    pub fn set<T: Serialize>(&self, field: &str, value: T) -> Result<(), SettingsError> {
        let mut settings = self.get_all()?;
        let value = serde_json::to_value(value)?;
        
        // Update the settings struct
        let mut json = serde_json::to_value(&settings)?;
        json[field] = value.clone();
        settings = serde_json::from_value(json)?;
        
        // Save the updated settings
        self.save_all(&settings)?;

        // Notify hooks
        if let Ok(hooks) = self.hooks.lock() {
            if let Some(hooks) = hooks.get(field) {
                for hook in hooks {
                    hook(field, &value);
                }
            }
        }

        Ok(())
    }

    /// Register a hook to be called when a setting changes
    pub fn register_hook(&self, field: &str, hook: SettingChangeHook) {
        let mut hooks = self.hooks.lock().unwrap();
        hooks.entry(field.to_string()).or_insert_with(Vec::new).push(hook);
    }

    /// Remove all hooks for a specific setting
    pub fn clear_hooks(&self, field: &str) {
        let mut hooks = self.hooks.lock().unwrap();
        hooks.remove(field);
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
}

#[tauri::command]
pub fn set_settings(app_handle: tauri::AppHandle, settings: Settings) -> Result<(), String> {
    let settings_store = SettingsStore::new(&app_handle).map_err(|e| e.to_string())?;
    settings_store.save_all(&settings).map_err(|e| e.to_string())?;
    Ok(())
}
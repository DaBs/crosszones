use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::LazyLock;
use std::sync::Mutex;

use crate::snapping::window_rect::WindowRect;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct WindowState {
    pub window_rect: WindowRect,
    pub window_id: String,
}

impl WindowState {
    pub fn new(window_id: &str, window_rect: WindowRect) -> Self {
        Self {
            window_id: window_id.to_string(),
            window_rect,
        }
    }
}

static WINDOW_STATE_STORE: LazyLock<Mutex<HashMap<String, WindowState>>> = LazyLock::new(|| Mutex::new(HashMap::new()));

pub fn get_window_state(window_id: &str) -> Option<WindowState> {
    WINDOW_STATE_STORE.lock().unwrap().get(window_id).cloned()
}

pub fn insert_window_state(window_id: &str, window_state: WindowState) {
    WINDOW_STATE_STORE.lock().unwrap().insert(window_id.to_string(), window_state);
}



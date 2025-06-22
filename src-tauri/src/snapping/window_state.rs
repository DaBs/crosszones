use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use lazy_static::lazy_static;

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

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct WindowStateStore {
    pub window_states: HashMap<String, WindowState>,
}

impl WindowStateStore {
    pub fn new() -> Self {
        Self { window_states: HashMap::new() }
    }

    pub fn get(&self, window_id: &str) -> Option<&WindowState> {
        self.window_states.get(window_id)
    }

    pub fn insert(&mut self, window_id: &str, window_state: WindowState) {
        self.window_states.insert(window_id.to_string(), window_state);
    }
}

lazy_static!{
  static ref WINDOW_STATE_STORE: WindowStateStore = WindowStateStore::new();
}

pub fn get_window_state(window_id: &str) -> Option<&WindowState> {
    WINDOW_STATE_STORE.get(window_id)
}

pub fn insert_window_state(window_id: &str, window_state: WindowState) {
    let mut store = WINDOW_STATE_STORE.clone();
    store.insert(window_id, window_state);
}



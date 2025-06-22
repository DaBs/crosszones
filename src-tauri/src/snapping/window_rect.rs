use serde::{Deserialize, Serialize};

/// Represents a window's position and size
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub struct WindowRect {
    pub x: i32,
    pub y: i32,
    pub width: i32,
    pub height: i32,
}
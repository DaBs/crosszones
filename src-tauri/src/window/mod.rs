pub const PRIMARY_WINDOW_NAME: &str = "crosszones";

pub mod window;
pub mod window_manager;

#[cfg(target_os = "macos")]
pub mod macos;

#[cfg(target_os = "windows")]
pub mod windows;

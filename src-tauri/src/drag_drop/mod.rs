pub mod overlay;

#[cfg(target_os = "windows")]
pub mod windows;

#[cfg(target_os = "macos")]
pub mod macos;

#[cfg(target_os = "linux")]
pub mod linux;

#[cfg(target_os = "windows")]
pub use windows::start_drag_detection;

#[cfg(target_os = "macos")]
pub use macos::start_drag_detection;

#[cfg(target_os = "linux")]
pub use linux::start_drag_detection;

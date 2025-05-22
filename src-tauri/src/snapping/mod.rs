pub mod action;
pub mod common;

#[cfg(target_os = "windows")]
pub mod windows;

#[cfg(target_os = "macos")]
pub mod macos;

#[cfg(target_os = "linux")]
pub mod linux;

#[cfg(target_os = "windows")]
pub use windows::snap_window;

#[cfg(target_os = "macos")]
pub use macos::snap_window;

#[cfg(target_os = "linux")]
pub use linux::snap_window;

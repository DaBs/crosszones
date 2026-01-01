use std::ffi::os_str::Display;

use ::accessibility::{AXAttribute, AXUIElement};
use accessibility::value::AXValue;
use accessibility::AXUIElementAttributes;
use core_graphics_types::geometry::{CGPoint, CGSize};
use objc2_app_kit::NSWorkspace;

mod screen;

use super::action::LayoutAction;
use super::common::calculate_window_rect;
use super::common::ScreenDimensions;
use super::window_rect::WindowRect;
use screen::get_screen_dimensions;

// Function to snap a window according to the specified layout action
pub fn snap_window(
    action: LayoutAction,
    app_handle: Option<tauri::AppHandle>,
) -> Result<(), String> {
    // Get the frontmost window
    let window = get_frontmost_window()?;

    // Get the current window position and size
    let current_rect = get_window_rect(&window)?;

    // Get screen dimensions
    let screen_dimensions = get_screen_dimensions(&window)?;

    let identifier = "blabla";
    let identifier_string = identifier.to_string();

    // Calculate new position and size based on the action
    let new_rect = calculate_window_rect(
        &identifier_string,
        action,
        screen_dimensions,
        Some(current_rect),
        app_handle.as_ref(),
    );

    // Apply the new position and size
    set_window_rect(&window, new_rect)?;

    Ok(())
}

// Helper function to get the frontmost window
fn get_frontmost_window() -> Result<AXUIElement, String> {
    let workspace = unsafe { NSWorkspace::sharedWorkspace() };
    let frontmost_application = unsafe { workspace.frontmostApplication().unwrap() };

    let frontmost_application_pid = unsafe { frontmost_application.processIdentifier() };

    let app = AXUIElement::application(frontmost_application_pid);

    if app.focused_window().is_ok() {
        let focused_window = app.focused_window().unwrap().clone();
        return Ok(focused_window);
    }

    let window = app.windows().unwrap().iter().next().unwrap().clone();
    Ok(window)
}

// Helper function to get window rectangle
fn get_window_rect(window: &AXUIElement) -> Result<WindowRect, String> {
    let size = window
        .attribute(&AXAttribute::size())
        .map_err(|e| e.to_string())?
        .value()
        .map_err(|e| e.to_string())?;
    let position = window
        .attribute(&AXAttribute::position())
        .map_err(|e| e.to_string())?
        .value()
        .map_err(|e| e.to_string())?;

    Ok(WindowRect {
        x: position.x as i32,
        y: position.y as i32,
        width: size.width as i32,
        height: size.height as i32,
    })
}

// Helper function to set window rectangle
fn set_window_rect(window: &AXUIElement, rect: WindowRect) -> Result<(), String> {
    let position =
        AXValue::new(&CGPoint::new(rect.x as f64, rect.y as f64)).map_err(|e| e.to_string())?;

    let size = AXValue::new(&CGSize::new(rect.width as f64, rect.height as f64))
        .map_err(|e| e.to_string())?;

    window
        .set_attribute(&AXAttribute::position(), position)
        .map_err(|e| e.to_string())?;
    window
        .set_attribute(&AXAttribute::size(), size)
        .map_err(|e| e.to_string())?;
    Ok(())
}

// Helper function to get all visible windows
pub fn get_visible_windows() -> Vec<AXUIElement> {
    // TODO: Implement
    AXUIElement::system_wide()
        .windows()
        .map_err(|e| e.to_string())
        .unwrap()
        .iter()
        .map(|window| window.clone())
        .collect()
}

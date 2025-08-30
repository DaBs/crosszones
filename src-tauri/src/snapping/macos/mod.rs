use accessibility::value::AXValue;
use accessibility::AXUIElementAttributes;
use ::accessibility::{AXAttribute, AXUIElement};
use core_graphics_types::geometry::{CGPoint, CGSize};
use display_info::DisplayInfo;
use objc2_app_kit::NSWorkspace;

use super::action::LayoutAction;
use super::common::{calculate_window_rect, ScreenDimensions};
use super::window_rect::WindowRect;

// Function to snap a window according to the specified layout action
pub fn snap_window(action: LayoutAction) -> Result<(), String> {
    // Get the frontmost window
    let window = get_frontmost_window()?;

    // Get the current window position and size
    let current_rect = get_window_rect(&window)?;

    // Get screen dimensions
    let screen_dimensions = get_screen_dimensions()?;

    let identifier = "blabla";
    let identifier_string = identifier.to_string();

    // Calculate new position and size based on the action
    let new_rect = calculate_window_rect(&identifier_string, action, screen_dimensions, Some(current_rect));

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
        .value().map_err(|e| e.to_string())?;

    Ok(WindowRect {
        x: position.x as i32,
        y: position.y as i32,
        width: size.width as i32,
        height: size.height as i32,
    })
}

// Helper function to set window rectangle
fn set_window_rect(window: &AXUIElement, rect: WindowRect) -> Result<(), String> {

    let position = AXValue::new(&CGPoint::new(rect.x as f64, rect.y as f64))
        .map_err(|e| e.to_string())?;

    let size = AXValue::new(&CGSize::new(rect.width as f64, rect.height as f64))
        .map_err(|e| e.to_string())?;

    window.set_attribute(&AXAttribute::position(), position)
        .map_err(|e| e.to_string())?;
    window.set_attribute(&AXAttribute::size(), size)
        .map_err(|e| e.to_string())?;
    Ok(())
}

// Helper function to get screen dimensions
fn get_screen_dimensions() -> Result<ScreenDimensions, String> {
    let binding = DisplayInfo::all()
        .map_err(|e| e.to_string())?;
    let main_display = binding
        .iter()
        .find(|display| display.is_primary)
        .ok_or_else(|| String::from("No primary display found"))?;

    Ok(ScreenDimensions {
        width: main_display.width as i32,
        height: main_display.height as i32,
    })
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

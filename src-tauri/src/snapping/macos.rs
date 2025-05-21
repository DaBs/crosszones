use core_graphics::display::{CGDisplay};
use core_graphics::geometry::{CGRect, CGSize, CGPoint};

use super::action::LayoutAction;
use super::common::{calculate_window_rect, ScreenDimensions, WindowRect};
use super::accessibility::AccessibilityElement;

// Function to snap a window according to the specified layout action
pub fn snap_window(action: LayoutAction) -> Result<(), String> {
    // Get the frontmost window
    let window = get_frontmost_window()?;
    
    // Get the current window position and size
    let current_rect = get_window_rect(&window)?;
    
    // Get screen dimensions
    let screen_dimensions = get_screen_dimensions()?;
    
    // Calculate new position and size based on the action
    let new_rect = calculate_window_rect(action, screen_dimensions, Some(current_rect));
    
    // Apply the new position and size
    set_window_rect(&window, new_rect)?;

    Ok(())
}

// Helper function to get the frontmost window
fn get_frontmost_window() -> Result<AccessibilityElement, String> {
    match AccessibilityElement::get_front_window_element() {
        Ok(window) => Ok(window),
        Err(e) => Err(e.to_string())
    }
}

// Helper function to get window rectangle
fn get_window_rect(window: &AccessibilityElement) -> Result<WindowRect, String> {
    match window.get_frame() {
        Ok(frame) => Ok(WindowRect {
            x: frame.origin.x as i32,
            y: frame.origin.y as i32,
            width: frame.size.width as i32,
            height: frame.size.height as i32,
        }),
        Err(e) => Err(e.to_string())
    }
}

// Helper function to set window rectangle
fn set_window_rect(window: &AccessibilityElement, rect: WindowRect) -> Result<(), String> {
    let origin_point = CGPoint::new(rect.x as f64, rect.y as f64);
    let size = CGSize::new(rect.width as f64, rect.height as f64);
    let frame = CGRect::new(&origin_point, &size);

    // Set the frame with adjust_size_first=true to handle multi-display scenarios
    window.set_frame(frame, true);
    Ok(())
}

// Helper function to get screen dimensions
fn get_screen_dimensions() -> Result<ScreenDimensions, String> {
    let main_display = CGDisplay::main();
    let bounds = main_display.bounds();
    
    Ok(ScreenDimensions {
        width: bounds.size.width as i32,
        height: bounds.size.height as i32,
    })
}

// Helper function to get all visible windows
pub fn get_visible_windows() -> Vec<AccessibilityElement> {
    // TODO: Implement
    vec![]
}
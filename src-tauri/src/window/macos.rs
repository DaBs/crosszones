use ::accessibility::AXUIElement;
use accessibility::{AXUIElementActions, AXUIElementAttributes};
use core_graphics_types::geometry::{CGPoint, CGRect, CGSize};
use display_info::DisplayInfo;
use objc2_app_kit::NSWorkspace;
use std::cmp;

use crate::snapping::common::ScreenDimensions;

/// Get the frontmost window on macOS
pub fn get_frontmost_window() -> Result<AXUIElement, String> {
    let workspace = unsafe { NSWorkspace::sharedWorkspace() };
    let frontmost_application = unsafe { 
        workspace.frontmostApplication().ok_or("No frontmost application")? 
    };

    let frontmost_application_pid = unsafe { frontmost_application.processIdentifier() };

    let app = AXUIElement::application(frontmost_application_pid);

    if let Ok(focused_window) = app.focused_window() {
        return Ok(focused_window);
    }

    // Fallback to first window if no focused window
    let windows = app.windows().map_err(|e| format!("Failed to get windows: {}", e))?;
    if let Some(window) = windows.iter().next() {
        return Ok(window.clone());
    }

    Err("No window found".to_string())
}

/// Raise/bring window to front on macOS
/// This ensures the dragged window stays above the overlay
pub fn raise_window(window: &AXUIElement) -> Result<(), String> {    
    // Try to perform the AXRaise action to bring window to front
    // This should work for most windows
    if window.raise().map_err(|e| e.to_string()).is_ok() {
        return Ok(());
    }

    Err("Failed to raise window".to_string())
}

/// Get screen dimensions for a window on macOS
pub fn get_screen_dimensions_for_window(window: &AXUIElement) -> Result<ScreenDimensions, String> {
    let screens = DisplayInfo::all().map_err(|e| e.to_string())?;
    let screen = screens.first().ok_or("No screens found")?;

    if screens.len() == 1 {
        return Ok(ScreenDimensions {
            x: screen.x,
            y: screen.y,
            width: screen.width as i32,
            height: screen.height as i32,
        });
    }

    let frame = window.frame().map_err(|e| e.to_string())?;
    let screen = screen_with_rect(frame, screens)?;

    Ok(ScreenDimensions {
        x: screen.x as i32,
        y: screen.y as i32,
        width: screen.width as i32,
        height: screen.height as i32,
    })
}

// Helper functions for screen calculations

fn rect_intersection(rect1: CGRect, rect2: CGRect) -> CGRect {
    let intersection_bottom_left_point = cmp::max_by(rect1.origin.x, rect2.origin.x, |a, b| {
        a.partial_cmp(b).unwrap()
    });
    let intersection_bottom_right_point = cmp::min_by(
        rect1.origin.x + rect1.size.width,
        rect2.origin.x + rect2.size.width,
        |a, b| a.partial_cmp(b).unwrap(),
    );
    let intersection_top_left_point = cmp::max_by(rect1.origin.y, rect2.origin.y, |a, b| {
        a.partial_cmp(b).unwrap()
    });
    let intersection_top_right_point = cmp::min_by(
        rect1.origin.y + rect1.size.height,
        rect2.origin.y + rect2.size.height,
        |a, b| a.partial_cmp(b).unwrap(),
    );
    let intersection_width = intersection_bottom_right_point - intersection_bottom_left_point;
    let intersection_height = intersection_top_right_point - intersection_top_left_point;
    CGRect::new(
        &CGPoint::new(intersection_bottom_left_point, intersection_top_left_point),
        &CGSize::new(intersection_width, intersection_height),
    )
}

fn rect_contained_percentage(rect: CGRect, screen: &DisplayInfo) -> f64 {
    let screen_rect = CGRect::new(
        &CGPoint::new(screen.x as f64, screen.y as f64),
        &CGSize::new(screen.width as f64, screen.height as f64),
    );
    let intersection_area = rect_intersection(rect, screen_rect);
    (intersection_area.size.width * intersection_area.size.height) / (rect.size.width * rect.size.height)
}

fn screen_with_rect(rect: CGRect, screens: Vec<DisplayInfo>) -> Result<DisplayInfo, String> {
    let mut return_screen = screens.first().ok_or("No screens found")?.clone();
    let mut rect_contained_highest_percentage = 0.0;
    for screen in screens {
        let rect_contained_percentage = rect_contained_percentage(rect, &screen);
        if rect_contained_percentage > rect_contained_highest_percentage {
            rect_contained_highest_percentage = rect_contained_percentage;
            return_screen = screen.clone();
        }
    }
    Ok(return_screen)
}


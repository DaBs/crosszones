use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use crate::snapping::action::LayoutAction;
use crate::snapping::window_rect::WindowRect;
use crate::snapping::window_state::{get_window_state, insert_window_state, WindowState};
use crate::store::zone_layouts;

/// Represents screen dimensions
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct ScreenDimensions {
    pub x: i32,
    pub y: i32,
    pub width: i32,
    pub height: i32,
}

/// Ensures a window stays within screen boundaries
fn constrain_to_screen(rect: WindowRect, screen: ScreenDimensions) -> WindowRect {
    WindowRect {
        x: rect.x.max(0).min(screen.width + screen.x),
        y: rect.y.max(0).min(screen.height + screen.y),
        width: rect.width,
        height: rect.height,
    }
}

/// Calculate the window position and size based on the layout action and screen dimensions
pub fn calculate_window_rect(
    window_id: &str,
    action: LayoutAction,
    screen: ScreenDimensions,
    current_rect: Option<WindowRect>,
    app_handle: Option<&tauri::AppHandle>,
) -> WindowRect {
    // Default to full screen if no current rect is provided
    let current = current_rect.unwrap_or(WindowRect {
        x: 0,
        y: 0,
        width: screen.width,
        height: screen.height,
    });

    let mut current_state = WindowState::new(window_id, current);

    let mut previous_state = get_window_state(window_id);

    if previous_state.is_none() {
        insert_window_state(window_id, current_state.clone());
        previous_state = Some(current_state.clone());
    }

    current_state.window_rect = current;
    insert_window_state(window_id, current_state);

    let result = match action {
        LayoutAction::LeftHalf => WindowRect {
            x: 0,
            y: 0,
            width: screen.width / 2,
            height: screen.height,
        },
        LayoutAction::RightHalf => WindowRect {
            x: screen.width / 2,
            y: 0,
            width: screen.width / 2,
            height: screen.height,
        },
        LayoutAction::CenterHalf => WindowRect {
            x: screen.width / 4,
            y: 0,
            width: screen.width / 2,
            height: screen.height,
        },
        LayoutAction::TopHalf => WindowRect {
            x: 0,
            y: 0,
            width: screen.width,
            height: screen.height / 2,
        },
        LayoutAction::BottomHalf => WindowRect {
            x: 0,
            y: screen.height / 2,
            width: screen.width,
            height: screen.height / 2,
        },
        LayoutAction::TopLeft => WindowRect {
            x: 0,
            y: 0,
            width: screen.width / 2,
            height: screen.height / 2,
        },
        LayoutAction::TopRight => WindowRect {
            x: screen.width / 2,
            y: 0,
            width: screen.width / 2,
            height: screen.height / 2,
        },
        LayoutAction::BottomLeft => WindowRect {
            x: 0,
            y: screen.height / 2,
            width: screen.width / 2,
            height: screen.height / 2,
        },
        LayoutAction::BottomRight => WindowRect {
            x: screen.width / 2,
            y: screen.height / 2,
            width: screen.width / 2,
            height: screen.height / 2,
        },
        LayoutAction::FirstThird => WindowRect {
            x: 0,
            y: 0,
            width: screen.width / 3,
            height: screen.height,
        },
        LayoutAction::CenterThird => WindowRect {
            x: screen.width / 3,
            y: 0,
            width: screen.width / 3,
            height: screen.height,
        },
        LayoutAction::LastThird => WindowRect {
            x: 2 * screen.width / 3,
            y: 0,
            width: screen.width / 3,
            height: screen.height,
        },
        LayoutAction::FirstTwoThirds => WindowRect {
            x: 0,
            y: 0,
            width: 2 * screen.width / 3,
            height: screen.height,
        },
        LayoutAction::LastTwoThirds => WindowRect {
            x: screen.width / 3,
            y: 0,
            width: 2 * screen.width / 3,
            height: screen.height,
        },
        LayoutAction::Maximize => WindowRect {
            x: 0,
            y: 0,
            width: screen.width,
            height: screen.height,
        },
        LayoutAction::AlmostMaximize => WindowRect {
            x: (screen.width as f32 * 0.01) as i32,
            y: (screen.height as f32 * 0.01) as i32,
            width: (screen.width as f32 * 0.98) as i32,
            height: (screen.height as f32 * 0.98) as i32,
        },
        LayoutAction::MaximizeHeight => WindowRect {
            x: current.x,
            y: 0,
            width: current.width,
            height: screen.height,
        },
        LayoutAction::Smaller => WindowRect {
            x: current.x + current.width / 10,
            y: current.y + current.height / 10,
            width: current.width * 8 / 10,
            height: current.height * 8 / 10,
        },
        LayoutAction::Larger => WindowRect {
            x: current.x - current.width / 10,
            y: current.y - current.height / 10,
            width: current.width * 12 / 10,
            height: current.height * 12 / 10,
        },
        LayoutAction::Center => WindowRect {
            x: (screen.width - current.width) / 2,
            y: (screen.height - current.height) / 2,
            width: current.width,
            height: current.height,
        },
        LayoutAction::CenterProminently => WindowRect {
            x: (screen.width - 9 * current.width / 10) / 2,
            y: (screen.height - 9 * current.height / 10) / 2,
            width: 9 * current.width / 10,
            height: 9 * current.height / 10,
        },
        LayoutAction::Restore => previous_state.unwrap().window_rect,
        // TODO: Implement next and previous display
        LayoutAction::NextDisplay | LayoutAction::PreviousDisplay => current,
        LayoutAction::MoveLeft => WindowRect {
            x: current.x - current.width,
            y: current.y,
            width: current.width,
            height: current.height,
        },
        LayoutAction::MoveRight => WindowRect {
            x: current.x + current.width,
            y: current.y,
            width: current.width,
            height: current.height,
        },
        LayoutAction::MoveUp => WindowRect {
            x: current.x,
            y: current.y - current.height,
            width: current.width,
            height: current.height,
        },
        LayoutAction::MoveDown => WindowRect {
            x: current.x,
            y: current.y + current.height,
            width: current.width,
            height: current.height,
        },
        LayoutAction::FirstFourth => WindowRect {
            x: 0,
            y: 0,
            width: screen.width / 4,
            height: screen.height,
        },
        LayoutAction::SecondFourth => WindowRect {
            x: screen.width / 4,
            y: 0,
            width: screen.width / 4,
            height: screen.height,
        },
        LayoutAction::ThirdFourth => WindowRect {
            x: 2 * screen.width / 4,
            y: 0,
            width: screen.width / 4,
            height: screen.height,
        },
        LayoutAction::LastFourth => WindowRect {
            x: 3 * screen.width / 4,
            y: 0,
            width: screen.width / 4,
            height: screen.height,
        },
        LayoutAction::FirstThreeFourths => WindowRect {
            x: 0,
            y: 0,
            width: 3 * screen.width / 4,
            height: screen.height,
        },
        LayoutAction::LastThreeFourths => WindowRect {
            x: screen.width / 4,
            y: 0,
            width: 3 * screen.width / 4,
            height: screen.height,
        },
        LayoutAction::TopLeftSixth => WindowRect {
            x: 0,
            y: 0,
            width: screen.width / 3,
            height: screen.height / 2,
        },
        LayoutAction::TopCenterSixth => WindowRect {
            x: screen.width / 3,
            y: 0,
            width: screen.width / 3,
            height: screen.height / 2,
        },
        LayoutAction::TopRightSixth => WindowRect {
            x: 2 * screen.width / 3,
            y: 0,
            width: screen.width / 3,
            height: screen.height / 2,
        },
        LayoutAction::BottomLeftSixth => WindowRect {
            x: 0,
            y: screen.height / 2,
            width: screen.width / 3,
            height: screen.height / 2,
        },
        LayoutAction::BottomCenterSixth => WindowRect {
            x: screen.width / 3,
            y: screen.height / 2,
            width: screen.width / 3,
            height: screen.height / 2,
        },
        LayoutAction::BottomRightSixth => WindowRect {
            x: 2 * screen.width / 3,
            y: screen.height / 2,
            width: screen.width / 3,
            height: screen.height / 2,
        },
        LayoutAction::TopLeftThird => WindowRect {
            x: 0,
            y: 0,
            width: screen.width / 3,
            height: screen.height,
        },
        LayoutAction::TopRightThird => WindowRect {
            x: 2 * screen.width / 3,
            y: 0,
            width: screen.width / 3,
            height: screen.height,
        },
        LayoutAction::BottomLeftThird => WindowRect {
            x: 0,
            y: 0,
            width: screen.width / 3,
            height: screen.height,
        },
        LayoutAction::BottomRightThird => WindowRect {
            x: 2 * screen.width / 3,
            y: 0,
            width: screen.width / 3,
            height: screen.height,
        },
        // Zone-based actions
        LayoutAction::ApplyZone(zone_number) => {
            // Try to load active zone layout and apply zone
            if let Some(app) = app_handle {
                if let Ok(Some(active_layout_id)) =
                    zone_layouts::get_active_zone_layout_id(app.clone())
                {
                    if let Ok(Some(layout)) =
                        zone_layouts::get_zone_layout(app.clone(), active_layout_id)
                    {
                        // Find the zone with matching number
                        if let Some(zone) =
                            layout.zones.iter().find(|z| z.number == zone_number as u32)
                        {
                            // Convert percentage-based zone coordinates to screen coordinates
                            // Zone coordinates are 0-100, convert to screen pixels
                            let zone_x = (zone.x / 100.0) * screen.width as f64;
                            let zone_y = (zone.y / 100.0) * screen.height as f64;
                            let zone_width = (zone.width / 100.0) * screen.width as f64;
                            let zone_height = (zone.height / 100.0) * screen.height as f64;

                            return WindowRect {
                                x: zone_x as i32,
                                y: zone_y as i32,
                                width: zone_width as i32,
                                height: zone_height as i32,
                            };
                        }
                    }
                }
            }
            // If we can't apply zone, return current position unchanged
            current
        }
        _ => current,
    };

    println!("current: {:?}", current);

    // Add the screen x and y to the result
    let result = WindowRect {
        x: result.x + screen.x,
        y: result.y + screen.y,
        width: result.width,
        height: result.height,
    };

    println!("result: {:?}", result);

    // Apply screen boundary constraints to all layout actions
    let result = constrain_to_screen(result, screen);

    println!("bounded result: {:?}", result);

    result
}

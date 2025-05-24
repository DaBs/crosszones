use crate::snapping::action::LayoutAction;

/// Represents a window's position and size
#[derive(Debug, Clone, Copy)]
pub struct WindowRect {
    pub x: i32,
    pub y: i32,
    pub width: i32,
    pub height: i32,
}

/// Represents screen dimensions
#[derive(Debug, Clone, Copy)]
pub struct ScreenDimensions {
    pub width: i32,
    pub height: i32,
}

/// Calculate the window position and size based on the layout action and screen dimensions
pub fn calculate_window_rect(
    action: LayoutAction,
    screen: ScreenDimensions,
    current_rect: Option<WindowRect>,
) -> WindowRect {
    // Default to full screen if no current rect is provided
    let current = current_rect.unwrap_or(WindowRect {
        x: 0,
        y: 0,
        width: screen.width,
        height: screen.height,
    });

    match action {
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
            x: screen.width / 20,
            y: screen.height / 20,
            width: 18 * screen.width / 20,
            height: 18 * screen.height / 20,
        },
        LayoutAction::MaximizeHeight => WindowRect {
            x: current.x,
            y: 0,
            width: current.width,
            height: screen.height,
        },
        LayoutAction::Smaller => WindowRect {
            x: current.x + current.width / 20,
            y: current.y + current.height / 20,
            width: 18 * current.width / 20,
            height: 18 * current.height / 20,
        },
        LayoutAction::Larger => WindowRect {
            x: current.x - current.width / 20,
            y: current.y - current.height / 20,
            width: 22 * current.width / 20,
            height: 22 * current.height / 20,
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
        LayoutAction::Restore => current,
        LayoutAction::NextDisplay | LayoutAction::PreviousDisplay => current,
        LayoutAction::MoveLeft => WindowRect {
            x: current.x - screen.width / 10,
            y: current.y,
            width: current.width,
            height: current.height,
        },
        LayoutAction::MoveRight => WindowRect {
            x: current.x + screen.width / 10,
            y: current.y,
            width: current.width,
            height: current.height,
        },
        LayoutAction::MoveUp => WindowRect {
            x: current.x,
            y: current.y - screen.height / 10,
            width: current.width,
            height: current.height,
        },
        LayoutAction::MoveDown => WindowRect {
            x: current.x,
            y: current.y + screen.height / 10,
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
        LayoutAction::Specified => current,
        LayoutAction::ReverseAll => current,
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
        LayoutAction::TileAll | LayoutAction::CascadeAll | LayoutAction::CascadeActiveApp => current,
    }
} 
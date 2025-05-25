use cocoa::{
    base::{id, nil},
    foundation::NSAutoreleasePool,
};
use core_graphics::geometry::{CGPoint, CGRect, CGSize};
use objc::rc::autoreleasepool;
use objc::runtime::{Class, Object};
use objc::{class, msg_send, sel, sel_impl};
use objc_foundation::{INSString, NSString};

use super::accessibility_helpers::Error;

#[derive(Debug, Clone)]
pub struct AccessibilityElement {
    element: id,
}

impl AccessibilityElement {
    pub fn new(element: id) -> Self {
        Self { element }
    }

    pub fn from_pid(pid: i32) -> Self {
        unsafe {
            autoreleasepool(|| {
                let workspace = class!(NSWorkspace);
                let shared_workspace: id = msg_send![workspace, sharedWorkspace];
                let app: id =
                    msg_send![shared_workspace, runningApplicationWithProcessIdentifier: pid];
                Self::new(app)
            })
        }
    }

    pub fn from_bundle_identifier(bundle_id: &str) -> Option<Self> {
        unsafe {
            autoreleasepool(|| {
                let bundle_id_str = NSString::from_str(bundle_id);
                let workspace = class!(NSWorkspace);
                let shared_workspace: id = msg_send![workspace, sharedWorkspace];
                let apps: id = msg_send![
                    shared_workspace,
                    runningApplicationsWithBundleIdentifier: bundle_id_str
                ];

                let count: usize = msg_send![apps, count];
                if count > 0 {
                    let app: id = msg_send![apps, objectAtIndex: 0];
                    Some(Self::new(app))
                } else {
                    None
                }
            })
        }
    }

    pub fn is_application(&self) -> bool {
        unsafe {
            let bundle_id: id = msg_send![self.element, bundleIdentifier];
            !bundle_id.is_null()
        }
    }

    pub fn is_window(&self) -> bool {
        unsafe {
            let window: id = msg_send![self.element, window];
            !window.is_null()
        }
    }

    pub fn get_position(&self) -> Result<CGPoint, Error> {
        unsafe {
            let frame: CGRect = msg_send![self.element, frame];
            Ok(CGPoint::new(frame.origin.x, frame.origin.y))
        }
    }

    pub fn set_position(&self, position: CGPoint) -> Result<(), Error> {
        unsafe {
            let frame: CGRect = msg_send![self.element, frame];
            let new_frame = CGRect::new(&position, &frame.size);
            let _: () = msg_send![self.element, setFrame: new_frame];
            Ok(())
        }
    }

    pub fn is_resizable(&self) -> bool {
        unsafe {
            let style_mask: usize = msg_send![self.element, styleMask];
            style_mask & 0x8 != 0 // NSWindowStyleMaskResizable
        }
    }

    pub fn get_size(&self) -> Result<CGSize, Error> {
        unsafe {
            let frame: CGRect = msg_send![self.element, frame];
            Ok(frame.size)
        }
    }

    pub fn set_size(&self, size: CGSize) -> Result<(), Error> {
        unsafe {
            let frame: CGRect = msg_send![self.element, frame];
            let new_frame = CGRect::new(&frame.origin, &size);
            let _: () = msg_send![self.element, setFrame: new_frame];
            Ok(())
        }
    }

    pub fn get_frame(&self) -> Result<CGRect, Error> {
        unsafe {
            let frame: CGRect = msg_send![self.element, frame];
            Ok(frame)
        }
    }

    pub fn set_frame(&self, frame: CGRect, _adjust_size_first: bool) -> Result<(), Error> {
        unsafe {
            let _: () = msg_send![self.element, setFrame: frame];
            Ok(())
        }
    }

    pub fn get_window_id(&self) -> Option<u32> {
        unsafe {
            let window_number: i32 = msg_send![self.element, windowNumber];
            Some(window_number as u32)
        }
    }

    pub fn get_pid(&self) -> Option<i32> {
        unsafe {
            let pid: i32 = msg_send![self.element, processIdentifier];
            Some(pid)
        }
    }

    pub fn window_element(&self) -> Result<Self, Error> {
        if self.is_window() {
            Ok(self.clone())
        } else {
            unsafe {
                let window: id = msg_send![self.element, window];
                if window.is_null() {
                    Err(Error::NotFound)
                } else {
                    Ok(Self::new(window))
                }
            }
        }
    }

    pub fn is_main_window(&self) -> bool {
        unsafe {
            let is_main: bool = msg_send![self.element, isMainWindow];
            is_main
        }
    }

    pub fn set_main_window(&self, is_main: bool) -> Result<(), Error> {
        unsafe {
            if is_main {
                let _: () = msg_send![self.element, makeMainWindow];
            }
            Ok(())
        }
    }

    pub fn is_minimized(&self) -> bool {
        unsafe {
            let is_minimized: bool = msg_send![self.element, isMiniaturized];
            is_minimized
        }
    }

    pub fn application_element(&self) -> Result<Self, Error> {
        if self.is_application() {
            Ok(self.clone())
        } else {
            self.get_pid().ok_or(Error::NotFound).map(Self::from_pid)
        }
    }

    pub fn focused_window_element(&self) -> Result<Self, Error> {
        unsafe {
            let workspace = class!(NSWorkspace);
            let shared_workspace: id = msg_send![workspace, sharedWorkspace];
            let frontmost_app: id = msg_send![shared_workspace, frontmostApplication];

            if frontmost_app.is_null() {
                return Err(Error::NotFound);
            }

            let key_window: id = msg_send![frontmost_app, window];
            if key_window.is_null() {
                Err(Error::NotFound)
            } else {
                Ok(Self::new(key_window))
            }
        }
    }

    pub fn is_hidden(&self) -> bool {
        unsafe {
            let is_hidden: bool = msg_send![self.element, isHidden];
            is_hidden
        }
    }

    pub fn bring_to_front(&self, force: bool) -> Result<(), Error> {
        unsafe {
            let is_active: bool = msg_send![self.element, isActive];
            if !is_active || force {
                let _: () = msg_send![self.element, activateWithOptions: 1]; // NSApplicationActivateIgnoringOtherApps
            }
            Ok(())
        }
    }

    pub fn get_front_application_element() -> Option<Self> {
        unsafe {
            let workspace = class!(NSWorkspace);
            let shared_workspace: id = msg_send![workspace, sharedWorkspace];
            let frontmost_app: id = msg_send![shared_workspace, frontmostApplication];

            if frontmost_app.is_null() {
                None
            } else {
                Some(Self::new(frontmost_app))
            }
        }
    }

    pub fn get_front_window_element() -> Result<Self, Error> {
        let app_element = Self::get_front_application_element().ok_or(Error::NotFound)?;

        unsafe {
            let key_window: id = msg_send![app_element.element, window];
            if key_window.is_null() {
                Err(Error::NotFound)
            } else {
                Ok(Self::new(key_window))
            }
        }
    }

    pub fn get_window_element_under_cursor() -> Option<Self> {
        unsafe {
            let workspace = class!(NSWorkspace);
            let shared_workspace: id = msg_send![workspace, sharedWorkspace];
            let frontmost_app: id = msg_send![shared_workspace, frontmostApplication];

            if frontmost_app.is_null() {
                return None;
            }

            let mouse_location: CGPoint = msg_send![class!(NSEvent), mouseLocation];
            let window: id = msg_send![frontmost_app, windowAtPoint: mouse_location];

            if window.is_null() {
                None
            } else {
                Some(Self::new(window))
            }
        }
    }

    pub fn get_window_element(window_id: u32) -> Option<Self> {
        unsafe {
            let workspace = class!(NSWorkspace);
            let shared_workspace: id = msg_send![workspace, sharedWorkspace];
            let apps: id = msg_send![shared_workspace, runningApplications];

            let count: usize = msg_send![apps, count];
            for i in 0..count {
                let app: id = msg_send![apps, objectAtIndex: i];
                let windows: id = msg_send![app, windows];
                let window_count: usize = msg_send![windows, count];

                for j in 0..window_count {
                    let window: id = msg_send![windows, objectAtIndex: j];
                    let window_number: i32 = msg_send![window, windowNumber];

                    if window_number as u32 == window_id {
                        return Some(Self::new(window));
                    }
                }
            }
            None
        }
    }
}

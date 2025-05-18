use std::collections::HashSet;
use std::hash::{Hash, Hasher};
use core_foundation::array::CFArray;
use core_foundation::base::TCFType;
use core_foundation::boolean::CFBoolean;
use core_foundation::number::CFNumber;
use core_foundation::string::CFString;
use core_graphics::geometry::{CGRect, CGPoint, CGSize};
use objc::runtime::{Class, Object};
use objc::{msg_send, sel, sel_impl};
use objc_foundation::{INSString, NSString};

use crate::snapping::accessibility_helpers::{
    AXUIElement, AXUIElementAttributes, AXUIElementActions, Error,
    AXAttribute, ElementFinder, TreeWalker, TreeVisitor, TreeWalkerFlow,
};

#[derive(Debug, Clone)]
pub struct AccessibilityElement {
    element: AXUIElement,
}

impl AccessibilityElement {
    pub fn new(element: AXUIElement) -> Self {
        Self { element }
    }

    pub fn from_pid(pid: i32) -> Self {
        Self::new(AXUIElement::application(pid))
    }

    pub fn from_bundle_identifier(bundle_id: &str) -> Option<Self> {
        AXUIElement::application_with_bundle(bundle_id)
            .ok()
            .map(Self::new)
    }

    pub fn is_application(&self) -> Result<bool, Error> {
        self.element.attribute(&AXAttribute::role())
            .map(|role| role.to_string() == "AXApplication")
    }

    pub fn is_window(&self) -> Result<bool, Error> {
        self.element.attribute(&AXAttribute::role())
            .map(|role| role.to_string() == "AXWindow")
    }

    pub fn is_sheet(&self) -> Result<bool, Error> {
        self.element.attribute(&AXAttribute::role())
            .map(|role| role.to_string() == "AXSheet")
    }

    pub fn is_toolbar(&self) -> Result<bool, Error> {
        self.element.attribute(&AXAttribute::role())
            .map(|role| role.to_string() == "AXToolbar")
    }

    pub fn is_group(&self) -> Result<bool, Error> {
        self.element.attribute(&AXAttribute::role())
            .map(|role| role.to_string() == "AXGroup")
    }

    pub fn is_tab_group(&self) -> Result<bool, Error> {
        self.element.attribute(&AXAttribute::role())
            .map(|role| role.to_string() == "AXTabGroup")
    }

    pub fn is_static_text(&self) -> Result<bool, Error> {
        self.element.attribute(&AXAttribute::role())
            .map(|role| role.to_string() == "AXStaticText")
    }

    pub fn is_system_dialog(&self) -> Result<bool, Error> {
        self.element.attribute(&AXAttribute::subrole())
            .map(|subrole| subrole.to_string() == "AXSystemDialog")
    }

    pub fn get_position(&self) -> Result<CGPoint, Error> {
        let position = self.element.attribute(&AXAttribute::position())?;
        let x = position.get(0).expect("Failed to get x position").downcast::<CFNumber>().unwrap().to_f64().expect("Failed to convert x position to f64");
        let y = position.get(1).expect("Failed to get y position").downcast::<CFNumber>().unwrap().to_f64().expect("Failed to convert y position to f64");
        Ok(CGPoint::new(x, y))
    }

    pub fn set_position(&self, position: CGPoint) -> Result<(), Error> {
        // TODO: Implement position setter using AXAttribute
        Err(Error::NotFound)
    }

    pub fn is_resizable(&self) -> Result<bool, Error> {
        self.element.is_settable(&AXAttribute::size())
    }

    pub fn get_size(&self) -> Result<CGSize, Error> {
        // TODO: Implement size getter using AXAttribute
        Err(Error::NotFound)
    }

    pub fn set_size(&self, size: CGSize) -> Result<(), Error> {
        // TODO: Implement size setter using AXAttribute
        Err(Error::NotFound)
    }

    pub fn get_frame(&self) -> Result<CGRect, Error> {
        match (self.get_position(), self.get_size()) {
            (Ok(position), Ok(size)) => Ok(CGRect::new(&position, &size)),
            _ => Err(Error::NotFound),
        }
    }

    pub fn set_frame(&self, frame: CGRect, adjust_size_first: bool) -> Result<(), Error> {
        if adjust_size_first {
            self.set_size(frame.size)?;
        }
        self.set_position(frame.origin)?;
        self.set_size(frame.size)
    }

    pub fn get_window_id(&self) -> Option<u32> {
        // Implementation depends on WindowUtil functionality
        None // TODO: Implement window ID retrieval
    }

    pub fn get_pid(&self) -> Option<i32> {
        // TODO: Implement PID retrieval
        None
    }

    pub fn window_element(&self) -> Result<Self, Error> {
        if self.is_window()? {
            Ok(self.clone())
        } else {
            self.element.window().map(Self::new)
        }
    }

    pub fn is_main_window(&self) -> Result<bool, Error> {
        self.element.attribute(&AXAttribute::main())
            .map(|main| main == CFBoolean::true_value())
    }

    pub fn set_main_window(&self, is_main: bool) -> Result<(), Error> {
        self.element.set_main(is_main)
    }

    pub fn is_minimized(&self) -> Result<bool, Error> {
        self.element.attribute(&AXAttribute::minimized())
            .map(|minimized| minimized == CFBoolean::true_value())
    }

    pub fn application_element(&self) -> Result<Self, Error> {
        if self.is_application()? {
            Ok(self.clone())
        } else {
            self.get_pid()
                .ok_or(Error::NotFound)
                .map(Self::from_pid)
        }
    }

    pub fn focused_window_element(&self) -> Result<Self, Error> {
        self.application_element()?
            .element.focused_window()
            .map(Self::new)
    }

    pub fn is_hidden(&self) -> Result<bool, Error> {
        self.application_element()?
            .element.attribute(&AXAttribute::enabled())
            .map(|enabled| enabled == CFBoolean::false_value())
    }

    pub fn bring_to_front(&self, force: bool) -> Result<(), Error> {
        if self.is_main_window()? {
            self.set_main_window(true)?;
        }

        if let Some(pid) = self.get_pid() {
            unsafe {
                let workspace = Class::get("NSWorkspace").unwrap();
                let shared_workspace: *mut Object = msg_send![workspace, sharedWorkspace];
                let app: *mut Object = msg_send![shared_workspace, runningApplicationWithProcessIdentifier: pid];
                
                if !app.is_null() {
                    let is_active: bool = msg_send![app, isActive];
                    if !is_active || force {
                        let _: () = msg_send![app, activateWithOptions: 1]; // NSApplicationActivateIgnoringOtherApps
                    }
                }
            }
        }
        Ok(())
    }

    pub fn get_front_application_element() -> Option<Self> {
        unsafe {
            let workspace = Class::get("NSWorkspace").unwrap();
            let shared_workspace: *mut Object = msg_send![workspace, sharedWorkspace];
            let frontmost_app: *mut Object = msg_send![shared_workspace, frontmostApplication];
            
            if !frontmost_app.is_null() {
                let pid: i32 = msg_send![frontmost_app, processIdentifier];
                Some(Self::from_pid(pid))
            } else {
                None
            }
        }
    }

    pub fn get_front_window_element() -> Result<Self, Error> {
        let app_element = Self::get_front_application_element()
            .ok_or(Error::NotFound)?;
        
        if let Ok(focused_window) = app_element.focused_window_element() {
            Ok(focused_window)
        } else {
            Err(Error::NotFound)
        }
    }

    pub fn get_window_element_under_cursor() -> Option<Self> {
        // TODO: Implement window element under cursor detection
        None
    }

    pub fn get_window_element(window_id: u32) -> Option<Self> {
        // TODO: Implement window element retrieval by ID
        None
    }
}

pub enum EnhancedUI {
    DisableEnable = 1,
    DisableOnly = 2,
    FrontmostDisable = 3,
} 
use crate::store::zone_layouts::{ZoneLayout, Zone};
use crate::snapping::common::ScreenDimensions;

pub struct ZoneOverlay {
    // Window handle will be added when we implement the visual overlay
    // For now, we just track zones for drop detection
}

impl ZoneOverlay {
    pub fn new() -> Self {
        Self { window: None }
    }

    pub fn show(
        &mut self,
        app_handle: &tauri::AppHandle,
        layout: &ZoneLayout,
        screen: ScreenDimensions,
    ) -> Result<(), String> {
        // Hide existing overlay if any
        self.hide();

        // For now, we'll skip the visual overlay and just track zones
        // A proper overlay window would require creating an HTML file and webview
        // This can be added later as an enhancement
        // For now, the drag detection will work without visual feedback
        
        Ok(())
    }

    pub fn hide(&mut self) {
        // Overlay hiding will be implemented when visual overlay is added
    }

    pub fn get_zone_at_position(&self, x: i32, y: i32, layout: &ZoneLayout, screen: ScreenDimensions) -> Option<&Zone> {
        // Convert screen coordinates to percentage
        let x_percent = ((x - screen.x) as f64 / screen.width as f64) * 100.0;
        let y_percent = ((y - screen.y) as f64 / screen.height as f64) * 100.0;

        // Find zone containing this position
        layout.zones.iter().find(|zone| {
            x_percent >= zone.x
                && x_percent <= zone.x + zone.width
                && y_percent >= zone.y
                && y_percent <= zone.y + zone.height
        })
    }
}

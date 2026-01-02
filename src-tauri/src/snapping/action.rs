use serde::{Deserialize, Serialize};

// Define the layout action types
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum LayoutAction {
    LeftHalf,
    RightHalf,
    CenterHalf,
    TopHalf,
    BottomHalf,
    TopLeft,
    TopRight,
    BottomLeft,
    BottomRight,
    FirstThird,
    CenterThird,
    LastThird,
    FirstTwoThirds,
    LastTwoThirds,
    Maximize,
    AlmostMaximize,
    MaximizeHeight,
    Smaller,
    Larger,
    Center,
    CenterProminently,
    Restore,
    NextDisplay,
    PreviousDisplay,
    MoveLeft,
    MoveRight,
    MoveUp,
    MoveDown,
    FirstFourth,
    SecondFourth,
    ThirdFourth,
    LastFourth,
    FirstThreeFourths,
    LastThreeFourths,
    TopLeftSixth,
    TopCenterSixth,
    TopRightSixth,
    BottomLeftSixth,
    BottomCenterSixth,
    BottomRightSixth,
    TopLeftThird,
    TopRightThird,
    BottomLeftThird,
    BottomRightThird,
    ApplyZone(u32),
    ActivateLayout(String),
}

// Wrapper structure for consistent JSON format with action field
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActionPayload {
    pub action: String, // The action type in kebab-case
    #[serde(skip_serializing_if = "Option::is_none")]
    pub zone_number: Option<u32>, // For ApplyZone
    #[serde(skip_serializing_if = "Option::is_none")]
    pub layout_id: Option<String>, // For ActivateLayout
}

impl TryFrom<ActionPayload> for LayoutAction {
    type Error = String;

    fn try_from(payload: ActionPayload) -> Result<Self, Self::Error> {
        // Handle special cases with associated data
        match payload.action.as_str() {
            "apply-zone" => {
                if let Some(zone_num) = payload.zone_number {
                    Ok(LayoutAction::ApplyZone(zone_num))
                } else {
                    Err("apply-zone action requires zone_number".to_string())
                }
            }
            "activate-layout" => {
                if let Some(layout_id) = payload.layout_id {
                    Ok(LayoutAction::ActivateLayout(layout_id))
                } else {
                    Err("activate-layout action requires layout_id".to_string())
                }
            }
            // For simple variants, use serde to deserialize the action string
            action_str => {
                serde_json::from_str(&format!("\"{}\"", action_str))
                    .map_err(|e| format!("Unknown action: {}", e))
            }
        }
    }
}


// TODO: This is smelly in how it serializes and deserializes. It should be replaced with better serde serialization if possible.
impl TryFrom<LayoutAction> for ActionPayload {
    type Error = String;

    fn try_from(action: LayoutAction) -> Result<Self, Self::Error> {
        // Serialize the enum to JSON and parse it
        let json_str = serde_json::to_string(&action).map_err(|e| format!("Failed to serialize action: {}", e))?;
        
        // Try to parse as a simple string variant first
        if let Ok(action_name) = serde_json::from_str::<String>(&json_str) {
            return Ok(ActionPayload { action: action_name, zone_number: None, layout_id: None });
        }
        
        // Otherwise, it's an object variant - parse it
        let json_value: serde_json::Value = serde_json::from_str(&json_str).map_err(|e| format!("Failed to parse action: {}", e))?;
        let obj = json_value.as_object().ok_or("Failed to get object from action")?;
        
        // Get the first (and only) key-value pair
        let (action_name, value) = obj.iter().next().ok_or("Failed to get action name")?;
        
        match action_name.as_str() {
            "apply-zone" => Ok(ActionPayload {
                action: "apply-zone".to_string(),
                zone_number: value.as_u64().map(|v| v as u32),
                layout_id: None,
            }),
            "activate-layout" => Ok(ActionPayload {
                action: "activate-layout".to_string(),
                zone_number: None,
                layout_id: value.as_str().map(|s| s.to_string()),
            }),
            _ => Err(format!("Unexpected action variant: {}", action_name)),
        }
    }
}

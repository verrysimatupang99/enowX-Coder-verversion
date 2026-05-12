pub mod coder_be;
pub mod coder_fe;
pub mod librarian;
pub mod orchestrator;
pub mod planner;
pub mod researcher;
pub mod reviewer;
pub mod security;
pub mod tester;
pub mod ui_designer;
pub mod ux_researcher;

pub fn get_prompt(agent_type: &str) -> Option<&'static str> {
    match agent_type {
        // Core 5 agents
        "chat" => Some(researcher::SYSTEM_PROMPT), // Fallback to researcher for general chat
        "planner" => Some(planner::SYSTEM_PROMPT),
        "orchestrator" => Some(orchestrator::SYSTEM_PROMPT),
        "coder" => Some(coder_fe::SYSTEM_PROMPT), // Use coder_fe as base for all coding
        "researcher" => Some(researcher::SYSTEM_PROMPT),
        
        // Legacy agents (backward compatibility)
        "coder_fe" => Some(coder_fe::SYSTEM_PROMPT),
        "coder_be" => Some(coder_be::SYSTEM_PROMPT),
        "security" => Some(security::SYSTEM_PROMPT),
        "ux_researcher" => Some(ux_researcher::SYSTEM_PROMPT),
        "ui_designer" => Some(ui_designer::SYSTEM_PROMPT),
        "tester" => Some(tester::SYSTEM_PROMPT),
        "reviewer" => Some(reviewer::SYSTEM_PROMPT),
        "librarian" => Some(librarian::SYSTEM_PROMPT),
        _ => None,
    }
}

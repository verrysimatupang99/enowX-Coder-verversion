use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct AgentRun {
    pub id: String,
    pub session_id: String,
    pub agent_type: String,
    pub status: String,
    pub input: Option<String>,
    pub output: Option<String>,
    pub error: Option<String>,
    pub started_at: Option<String>,
    pub completed_at: Option<String>,
    pub created_at: String,
    pub parent_agent_run_id: Option<String>,
    pub project_path: Option<String>,
    pub orchestrator_timeline: Option<String>,
}

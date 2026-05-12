use serde_json::Value;
use tauri::State;

use crate::{
    error::AppResult,
    services::mcp_service::{MCPServer, MCPService, MCPTool},
    state::AppState,
};

#[tauri::command]
pub async fn list_mcp_servers(state: State<'_, AppState>) -> AppResult<Vec<MCPServer>> {
    MCPService::list_servers(state.pool()).await
}

#[tauri::command]
pub async fn create_mcp_server(
    name: String,
    command: String,
    args: Vec<String>,
    state: State<'_, AppState>,
) -> AppResult<MCPServer> {
    MCPService::create_server(state.pool(), &name, &command, &args).await
}

#[tauri::command]
pub async fn delete_mcp_server(id: String, state: State<'_, AppState>) -> AppResult<()> {
    MCPService::delete_server(state.pool(), &id).await
}

#[tauri::command]
pub async fn toggle_mcp_server(
    id: String,
    enabled: bool,
    state: State<'_, AppState>,
) -> AppResult<()> {
    MCPService::toggle_server(state.pool(), &id, enabled).await
}

#[tauri::command]
pub async fn start_mcp_server(id: String, state: State<'_, AppState>) -> AppResult<()> {
    let servers = MCPService::list_servers(state.pool()).await?;
    let server = servers
        .into_iter()
        .find(|s| s.id == id)
        .ok_or_else(|| crate::error::AppError::NotFound("MCP server not found".to_string()))?;
    
    let service = MCPService::new();
    service.start_server(&server)
}

#[tauri::command]
pub async fn stop_mcp_server(id: String, _state: State<'_, AppState>) -> AppResult<()> {
    let service = MCPService::new();
    service.stop_server(&id)
}

#[tauri::command]
pub async fn restart_mcp_server(id: String, state: State<'_, AppState>) -> AppResult<()> {
    let servers = MCPService::list_servers(state.pool()).await?;
    let server = servers
        .into_iter()
        .find(|s| s.id == id)
        .ok_or_else(|| crate::error::AppError::NotFound("MCP server not found".to_string()))?;
    
    let service = MCPService::new();
    service.restart_server(&server)
}

#[tauri::command]
pub async fn discover_mcp_tools(
    server_id: String,
    _state: State<'_, AppState>,
) -> AppResult<Vec<MCPTool>> {
    let service = MCPService::new();
    service.discover_tools(&server_id).await
}

#[tauri::command]
pub async fn invoke_mcp_tool(
    server_id: String,
    tool_name: String,
    args: Value,
    _state: State<'_, AppState>,
) -> AppResult<Value> {
    let service = MCPService::new();
    service.invoke_tool(&server_id, &tool_name, args).await
}

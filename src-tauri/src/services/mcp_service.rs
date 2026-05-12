use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::SqlitePool;
use std::collections::HashMap;
use std::process::{Child, Command, Stdio};
use std::sync::{Arc, Mutex};
use uuid::Uuid;

use crate::error::{AppError, AppResult};
use super::now_rfc3339;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct MCPServer {
    pub id: String,
    pub name: String,
    pub command: String,
    pub args: String, // JSON array
    pub enabled: bool,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MCPTool {
    pub name: String,
    pub description: String,
    pub input_schema: Value,
}

#[derive(Clone)]
pub struct MCPService {
    processes: Arc<Mutex<HashMap<String, Child>>>,
}

impl MCPService {
    pub fn new() -> Self {
        Self {
            processes: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub async fn list_servers(db: &SqlitePool) -> AppResult<Vec<MCPServer>> {
        let servers = sqlx::query_as::<_, MCPServer>(
            "SELECT id, name, command, args, enabled, created_at FROM mcp_servers ORDER BY created_at DESC"
        )
        .fetch_all(db)
        .await?;
        Ok(servers)
    }

    pub async fn create_server(
        db: &SqlitePool,
        name: &str,
        command: &str,
        args: &[String],
    ) -> AppResult<MCPServer> {
        let id = Uuid::new_v4().to_string();
        let args_json = serde_json::to_string(args)?;
        let created_at = now_rfc3339();

        sqlx::query(
            "INSERT INTO mcp_servers (id, name, command, args, enabled, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)"
        )
        .bind(&id)
        .bind(name)
        .bind(command)
        .bind(&args_json)
        .bind(true)
        .bind(&created_at)
        .execute(db)
        .await?;

        Ok(MCPServer {
            id,
            name: name.to_string(),
            command: command.to_string(),
            args: args_json,
            enabled: true,
            created_at,
        })
    }

    pub async fn delete_server(db: &SqlitePool, id: &str) -> AppResult<()> {
        sqlx::query("DELETE FROM mcp_servers WHERE id = ?1")
            .bind(id)
            .execute(db)
            .await?;
        Ok(())
    }

    pub async fn toggle_server(db: &SqlitePool, id: &str, enabled: bool) -> AppResult<()> {
        sqlx::query("UPDATE mcp_servers SET enabled = ?1 WHERE id = ?2")
            .bind(enabled)
            .bind(id)
            .execute(db)
            .await?;
        Ok(())
    }

    pub fn start_server(&self, server: &MCPServer) -> AppResult<()> {
        let args: Vec<String> = serde_json::from_str(&server.args)?;
        
        let child = Command::new(&server.command)
            .args(&args)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| AppError::Internal(format!("Failed to start MCP server: {}", e)))?;

        if let Ok(mut processes) = self.processes.lock() {
            processes.insert(server.id.clone(), child);
        }

        Ok(())
    }

    pub fn stop_server(&self, server_id: &str) -> AppResult<()> {
        if let Ok(mut processes) = self.processes.lock() {
            if let Some(mut child) = processes.remove(server_id) {
                let _ = child.kill();
                let _ = child.wait();
            }
        }
        Ok(())
    }

    pub fn restart_server(&self, server: &MCPServer) -> AppResult<()> {
        self.stop_server(&server.id)?;
        self.start_server(server)?;
        Ok(())
    }

    pub async fn discover_tools(&self, _server_id: &str) -> AppResult<Vec<MCPTool>> {
        // Placeholder: MCP protocol tool discovery
        // In real impl: send list_tools request via stdio
        Ok(vec![])
    }

    pub async fn invoke_tool(
        &self,
        _server_id: &str,
        _tool_name: &str,
        _args: Value,
    ) -> AppResult<Value> {
        // Placeholder: MCP protocol tool invocation
        // In real impl: send call_tool request via stdio
        Err(AppError::Internal("MCP tool invocation not yet implemented".to_string()))
    }
}

impl Default for MCPService {
    fn default() -> Self {
        Self::new()
    }
}

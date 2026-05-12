-- MCP servers table
CREATE TABLE IF NOT EXISTS mcp_servers (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    command TEXT NOT NULL,
    args TEXT NOT NULL, -- JSON array
    enabled BOOLEAN NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
);

CREATE INDEX idx_mcp_servers_enabled ON mcp_servers(enabled);

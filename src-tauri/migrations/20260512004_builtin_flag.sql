-- Add is_builtin flag for MCP servers and plugins
ALTER TABLE mcp_servers ADD COLUMN is_builtin BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE plugins ADD COLUMN is_builtin BOOLEAN NOT NULL DEFAULT 0;

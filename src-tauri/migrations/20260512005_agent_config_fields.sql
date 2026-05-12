-- Add agent config fields
ALTER TABLE agent_configs ADD COLUMN temperature REAL DEFAULT 0.7;
ALTER TABLE agent_configs ADD COLUMN max_tokens INTEGER DEFAULT 4096;
ALTER TABLE agent_configs ADD COLUMN system_prompt TEXT;

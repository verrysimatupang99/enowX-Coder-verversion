-- Add orchestrator timeline persistence to agent_runs table
ALTER TABLE agent_runs ADD COLUMN orchestrator_timeline TEXT;

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_agent_runs_orchestrator 
ON agent_runs(agent_type) WHERE agent_type = 'orchestrator';

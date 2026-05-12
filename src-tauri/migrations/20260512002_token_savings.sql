-- Token savings tracking table
CREATE TABLE IF NOT EXISTS token_savings (
    id TEXT PRIMARY KEY NOT NULL,
    command TEXT NOT NULL UNIQUE,
    tokens_saved INTEGER NOT NULL DEFAULT 0,
    executions INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
);

CREATE INDEX idx_token_savings_command ON token_savings(command);
CREATE INDEX idx_token_savings_tokens ON token_savings(tokens_saved DESC);

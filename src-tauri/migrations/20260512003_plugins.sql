-- Plugin system
CREATE TABLE IF NOT EXISTS plugins (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    version TEXT NOT NULL,
    description TEXT,
    author TEXT,
    enabled BOOLEAN NOT NULL DEFAULT 1,
    config TEXT, -- JSON
    installed_at TEXT NOT NULL
);

CREATE INDEX idx_plugins_enabled ON plugins(enabled);

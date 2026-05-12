-- Add settings table for optimization toggles
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  rtk_enabled INTEGER NOT NULL DEFAULT 1,
  caveman_enabled INTEGER NOT NULL DEFAULT 0,
  dcp_enabled INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Insert default settings row
INSERT OR IGNORE INTO settings (id, rtk_enabled, caveman_enabled, dcp_enabled, created_at, updated_at)
VALUES (1, 1, 0, 0, datetime('now'), datetime('now'));

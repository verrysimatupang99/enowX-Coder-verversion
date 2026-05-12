-- Add permission_mode column to settings
ALTER TABLE settings ADD COLUMN permission_mode TEXT NOT NULL DEFAULT 'ask';

-- Valid values: 'ask', 'auto', 'manual'

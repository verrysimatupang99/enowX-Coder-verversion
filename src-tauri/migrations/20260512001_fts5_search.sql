-- FTS5 virtual table for session search
CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(
    message_id UNINDEXED,
    session_id UNINDEXED,
    role,
    content,
    tokenize = 'porter unicode61'
);

-- Trigger to keep FTS5 in sync with messages table
CREATE TRIGGER IF NOT EXISTS messages_fts_insert AFTER INSERT ON messages BEGIN
    INSERT INTO messages_fts(message_id, session_id, role, content)
    VALUES (new.id, new.session_id, new.role, new.content);
END;

CREATE TRIGGER IF NOT EXISTS messages_fts_delete AFTER DELETE ON messages BEGIN
    DELETE FROM messages_fts WHERE message_id = old.id;
END;

CREATE TRIGGER IF NOT EXISTS messages_fts_update AFTER UPDATE ON messages BEGIN
    DELETE FROM messages_fts WHERE message_id = old.id;
    INSERT INTO messages_fts(message_id, session_id, role, content)
    VALUES (new.id, new.session_id, new.role, new.content);
END;

-- Populate existing messages into FTS5
INSERT INTO messages_fts(message_id, session_id, role, content)
SELECT id, session_id, role, content FROM messages;

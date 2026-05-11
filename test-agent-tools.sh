#!/bin/bash
# Test Agent Tool Execution

echo "=== Agent Tool Execution Test ==="
echo ""

DB_PATH="$HOME/.local/share/com.enowdev.enowxcoder/enowx.db"

if [ ! -f "$DB_PATH" ]; then
    echo "❌ Database not found: $DB_PATH"
    exit 1
fi

echo "✓ Database found"
echo ""

echo "=== Projects in Database ==="
sqlite3 "$DB_PATH" "SELECT id, name, path FROM projects;"
echo ""

echo "=== Recent Agent Runs ==="
sqlite3 "$DB_PATH" "SELECT id, agent_type, status, project_path, error FROM agent_runs ORDER BY created_at DESC LIMIT 5;"
echo ""

echo "=== Recent Tool Calls ==="
sqlite3 "$DB_PATH" "SELECT id, tool_name, status, error FROM tool_calls ORDER BY created_at DESC LIMIT 5;"
echo ""

echo "=== Test Instructions ==="
echo "1. Open enowX-Coder app"
echo "2. Select kulpik project"
echo "3. Send message: 'Read package.json and tell me the project name'"
echo "4. Verify agent uses ReadFile tool"
echo "5. Run this script again to see tool_calls"
echo ""
echo "Expected: Agent should use ReadFile tool and read kulpik/package.json"
echo "Expected result: Project name should be 'kulpik', not 'Kiro' or 'enowx-coder'"

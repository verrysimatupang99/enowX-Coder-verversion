#!/bin/bash
# Real-time Testing Monitor for enowX-Coder

echo "=== enowX-Coder Testing Monitor ==="
echo "Monitoring backend logs and errors..."
echo ""

# Function to check if process is running
check_process() {
    if pgrep -f "tauri dev" > /dev/null; then
        echo "✓ Tauri dev server: RUNNING"
    else
        echo "✗ Tauri dev server: NOT RUNNING"
    fi

    if lsof -ti:1420 > /dev/null 2>&1; then
        echo "✓ Vite (port 1420): RUNNING"
    else
        echo "✗ Vite (port 1420): NOT RUNNING"
    fi
}

# Function to tail backend logs
tail_logs() {
    echo ""
    echo "=== Backend Logs (last 20 lines) ==="
    # Tauri logs usually go to stdout/stderr
    # Check common log locations
    if [ -f "src-tauri/target/debug/enowx-coder.log" ]; then
        tail -20 src-tauri/target/debug/enowx-coder.log
    else
        echo "No log file found. Logs should appear in terminal running 'npm run tauri dev'"
    fi
}

# Function to check database
check_db() {
    echo ""
    echo "=== Database Check ==="

    # Find database location
    DB_PATH="$HOME/.local/share/enowx-coder/enowx.db"
    if [ ! -f "$DB_PATH" ]; then
        DB_PATH="$HOME/Library/Application Support/enowx-coder/enowx.db"
    fi

    if [ -f "$DB_PATH" ]; then
        echo "✓ Database found: $DB_PATH"
        echo ""
        echo "Projects in database:"
        sqlite3 "$DB_PATH" "SELECT id, name, path FROM projects;" 2>/dev/null || echo "  (unable to query)"
        echo ""
        echo "Sessions in database:"
        sqlite3 "$DB_PATH" "SELECT id, project_id, title FROM sessions LIMIT 5;" 2>/dev/null || echo "  (unable to query)"
    else
        echo "✗ Database not found"
        echo "  Expected location: $DB_PATH"
    fi
}

# Function to check agent runs
check_agents() {
    echo ""
    echo "=== Agent Runs Check ==="

    DB_PATH="$HOME/.local/share/enowx-coder/enowx.db"
    if [ ! -f "$DB_PATH" ]; then
        DB_PATH="$HOME/Library/Application Support/enowx-coder/enowx.db"
    fi

    if [ -f "$DB_PATH" ]; then
        echo "Recent agent runs:"
        sqlite3 "$DB_PATH" "SELECT id, agent_type, status, error FROM agent_runs ORDER BY created_at DESC LIMIT 5;" 2>/dev/null || echo "  (unable to query)"
    fi
}

# Main monitoring loop
while true; do
    clear
    echo "=== enowX-Coder Testing Monitor ==="
    echo "Time: $(date '+%H:%M:%S')"
    echo ""

    check_process
    check_db
    check_agents

    echo ""
    echo "=== Quick Actions ==="
    echo "Press Ctrl+C to stop monitoring"
    echo "Refreshing in 5 seconds..."

    sleep 5
done

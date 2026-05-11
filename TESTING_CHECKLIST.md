# Testing Checklist for enowX-Coder with kulpik Project

## Pre-Test Setup
- [ ] Close any running enowX-Coder instances
- [ ] Clear app data (optional, for clean test):
  ```bash
  rm -rf ~/.local/share/enowx-coder/
  # or on macOS:
  rm -rf ~/Library/Application\ Support/enowx-coder/
  ```
- [ ] Start fresh: `npm run tauri dev`

---

## Test 1: Project Creation with Path
**Expected**: User must select folder, no auto-created "Default" project

1. [ ] App starts with empty state
2. [ ] Left sidebar shows "Open folder" button
3. [ ] Click "Open folder"
4. [ ] Select kulpik directory: `~/Documents/Coding/kulpik`
5. [ ] Project created with name "kulpik"
6. [ ] Project appears in left sidebar

**Success Criteria**:
- Project has valid path
- No "Default" project created
- Can see kulpik files in file explorer

---

## Test 2: Terminal Opens in Project Directory
**Expected**: Terminal spawns in kulpik directory

1. [ ] Click right sidebar
2. [ ] Click "Terminal" tab
3. [ ] Terminal opens with xterm.js
4. [ ] Run: `pwd`
5. [ ] Output shows: `/home/mrtrickster99/Documents/Coding/kulpik`
6. [ ] Run: `ls`
7. [ ] Output shows kulpik files (web/, scripts/, README.md, etc.)

**Success Criteria**:
- Terminal working directory = kulpik path
- Can execute commands in project context
- Can navigate project files

---

## Test 3: Git Panel Shows kulpik Repo
**Expected**: Git panel shows kulpik repository status

1. [ ] Click "Git" tab in right sidebar
2. [ ] Git status loads
3. [ ] Shows current branch (e.g., "main")
4. [ ] Shows modified files (if any)
5. [ ] Branch list shows kulpik branches

**Success Criteria**:
- Git panel detects kulpik repo
- Shows accurate status
- Branch switcher works

---

## Test 4: Search Works in kulpik Files
**Expected**: Search finds matches in kulpik codebase

1. [ ] Click "Search" tab in right sidebar
2. [ ] Enter query: `KulPik`
3. [ ] Click "Search"
4. [ ] Results show matches from kulpik files
5. [ ] Try file filter: `*.tsx`
6. [ ] Results only show TypeScript files

**Success Criteria**:
- Search scans kulpik directory
- Results grouped by file
- Match highlighting works
- File filtering works

---

## Test 5: Agent Execution (CRITICAL TEST)
**Expected**: Agent can read kulpik files and execute tools

### 5a. Simple Agent Task
1. [ ] In chat, select agent type: "Coder"
2. [ ] Enter prompt: "List all Python files in this project"
3. [ ] Click send
4. [ ] Agent spawns (check right sidebar "Agents" tab)
5. [ ] Agent shows "running" status
6. [ ] Agent executes tools (read_file, list_files)
7. [ ] Agent completes successfully
8. [ ] Response lists Python files: `auto_curation.py`, `curation_server.py`, etc.

**Success Criteria**:
- Agent spawns without errors
- Tools execute in project context
- Agent can read project files
- Response is accurate

### 5b. Code Analysis Task
1. [ ] Select agent: "Reviewer"
2. [ ] Prompt: "Review the auto_curation.py file for potential issues"
3. [ ] Agent reads file
4. [ ] Agent analyzes code
5. [ ] Agent provides review

**Success Criteria**:
- Agent can read specific files
- Analysis is relevant to kulpik code
- No permission errors

### 5c. File Modification Task
1. [ ] Select agent: "Coder"
2. [ ] Prompt: "Add a comment to the top of README.md explaining the project"
3. [ ] Agent reads README.md
4. [ ] Agent proposes changes
5. [ ] Permission dialog appears (if enabled)
6. [ ] Agent writes file
7. [ ] Changes visible in file explorer

**Success Criteria**:
- Agent can write files
- Permission system works
- File changes persist

---

## Test 6: Agent Config Inheritance
**Expected**: Agent uses chat provider/model by default

1. [ ] Open Settings
2. [ ] Go to "Providers" tab
3. [ ] Note active provider and model
4. [ ] Go to "Agents" tab
5. [ ] Check agent configurations
6. [ ] Verify if provider/model are set

**Current Behavior** (expected to fail):
- Agent configs are empty
- Must manually set for each agent

**Desired Behavior**:
- Agent inherits from chat
- Shows "Using chat defaults: [provider] / [model]"

---

## Test 7: File Explorer
**Expected**: Can browse kulpik files

1. [ ] Left sidebar "Files" tab
2. [ ] File tree shows kulpik structure
3. [ ] Expand folders: web/, scripts/, etc.
4. [ ] Click a file (e.g., README.md)
5. [ ] File opens in preview (if implemented)

**Success Criteria**:
- File tree loads
- Can navigate folders
- File paths are correct

---

## Common Issues to Watch For

### Issue: Agent Fails to Spawn
**Symptoms**:
- No activity in Agents tab
- No error message
- Chat shows no response

**Debug Steps**:
1. Check browser console (F12)
2. Check terminal running `tauri dev`
3. Look for Rust panic messages
4. Check database: `sqlite3 ~/.local/share/enowx-coder/enowx.db "SELECT * FROM agent_runs ORDER BY created_at DESC LIMIT 1;"`

### Issue: Tools Fail to Execute
**Symptoms**:
- Agent spawns but hangs
- Tool calls show "running" forever
- No tool output

**Debug Steps**:
1. Check if project_path is passed correctly
2. Verify working directory in tool executor
3. Check file permissions
4. Look for permission dialog (might be hidden)

### Issue: Terminal Not in Project Dir
**Symptoms**:
- `pwd` shows home directory
- Can't see project files with `ls`

**Debug Steps**:
1. Check if project has valid path in database
2. Verify RightSidebar passes projectPath
3. Check TerminalPanel receives workingDir

---

## Success Metrics

**Must Pass** (Critical):
- [x] Project creation with path
- [x] Terminal in project directory
- [x] Git panel works
- [x] Search works
- [ ] Agent spawns successfully
- [ ] Agent can read files
- [ ] Agent can execute tools

**Should Pass** (Important):
- [ ] Agent can write files
- [ ] Permission system works
- [ ] File explorer shows files

**Nice to Have**:
- [ ] Agent config inheritance
- [ ] Resizable sidebars
- [ ] Tools configuration

---

## Reporting Issues

When reporting issues, include:
1. **What you did**: Step-by-step actions
2. **What happened**: Actual behavior
3. **What you expected**: Expected behavior
4. **Logs**: Browser console + terminal output
5. **Database state**: Agent runs, projects, sessions

Example:
```
Issue: Agent fails to spawn

Steps:
1. Selected "Coder" agent
2. Entered prompt: "List Python files"
3. Clicked send

Actual: No activity in Agents tab, no response

Expected: Agent spawns, executes tools, returns list

Console: [paste errors]
Terminal: [paste Rust errors]
Database: [paste agent_runs query]
```

---

## Quick Database Queries

```bash
# Check projects
sqlite3 ~/.local/share/enowx-coder/enowx.db "SELECT * FROM projects;"

# Check agent runs
sqlite3 ~/.local/share/enowx-coder/enowx.db "SELECT id, agent_type, status, error FROM agent_runs ORDER BY created_at DESC LIMIT 5;"

# Check tool calls
sqlite3 ~/.local/share/enowx-coder/enowx.db "SELECT * FROM tool_calls ORDER BY created_at DESC LIMIT 5;"
```

---

**Ready to test!** Start with Test 1 and work through sequentially. Report any failures immediately.

# Phase 2 Final Fixes - Functional Audit

## Issues Found

### 1. Terminal Panel (BROKEN)
**Problem:** Commands exist but not registered in main.rs
**Fix:** Register terminal commands module

### 2. Preview Tab (COMPLEX)
**Problem:** CodePreview shows file content, but no file selection UI
**Decision:** Replace with **Diff Viewer** (more useful for AI coding)
**Features:**
- Show git diff of current changes
- Syntax highlighting
- Accept/reject hunks

### 3. Other Tabs Status
- ✅ Agents: Working (shows agent runs)
- ✅ Skills: Working (placeholder list)
- ✅ Metrics: Working (placeholder)
- ✅ Git: Working (GitPanel component)
- ✅ Search: Working (SearchPanel component)
- ❌ Terminal: Broken (commands not registered)
- ❌ Preview: Incomplete (no file picker)
- ✅ Settings: Working (opens modal)

## Implementation Plan

### Task 1: Register Terminal Commands
1. Check mod.rs exports terminal module
2. Add terminal commands to invoke_handler in main.rs
3. Test: open Terminal tab → should show working shell

### Task 2: Replace Preview with Diff Viewer
1. Create DiffPanel.tsx component
2. Add git diff command (or use existing git commands)
3. Show staged/unstaged changes
4. Syntax highlight diffs
5. Update RightSidebar: Preview → Diff

### Task 3: Verify All Tabs Work
1. Test each tab in right sidebar
2. Ensure no console errors
3. Verify UI renders correctly

## Estimated Time
- Task 1: 15 min
- Task 2: 45 min
- Task 3: 15 min
**Total:** ~75 min

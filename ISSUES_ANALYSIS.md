# enowX-Coder Issues Analysis & Fixes

**Testing Date**: 2026-05-12  
**Test Project**: kulpik (laptop recommendation platform)  
**Tester**: User manual testing in Tauri dev mode

---

## Issues Found

### 1. ✅ Terminal Not Opening in Project Directory
**Status**: FIXED  
**Severity**: High  
**Impact**: Terminal spawns in home directory instead of project folder

**Root Cause**:
- `RightSidebar.tsx` hardcoded `workingDir={undefined}`
- No connection to active project path from store

**Fix Applied**:
```tsx
// Before
<TerminalPanel sessionId="main-terminal" workingDir={undefined} />

// After
const activeProject = projects.find((p) => p.id === activeProjectId);
const projectPath = activeProject?.path || undefined;
<TerminalPanel sessionId="main-terminal" workingDir={projectPath} />
```

**Commit**: `[latest]`

---

### 2. ⏳ Projects Created Without Path
**Status**: ROOT CAUSE IDENTIFIED  
**Severity**: Critical  
**Impact**: All IDE features (terminal, git, search) fail without project path

**Root Cause**:
- `AppShell.tsx:413` creates project with `path: null`
- No UI to select/set project directory
- Backend accepts `path` parameter but frontend doesn't provide it

**Current Flow**:
```typescript
// AppShell.tsx:413
const project = await invoke<Project>('create_project', { 
  name: 'Default', 
  path: null  // ❌ Always null!
});
```

**Required Fix**:
1. Add project path selector dialog on project creation
2. Use Tauri file dialog to select directory
3. Store selected path in project
4. Update existing projects to have paths

**Implementation Plan**:
- [ ] Create `ProjectPathDialog` component
- [ ] Add "Browse" button to project creation
- [ ] Use `@tauri-apps/plugin-dialog` for folder selection
- [ ] Update `LeftSidebar` project creation flow
- [ ] Add "Set Path" option for existing projects

---

### 3. ⏳ Agent Spawn Failures
**Status**: INVESTIGATING  
**Severity**: High  
**Impact**: Agents cannot execute, core feature broken

**Symptoms**:
- Agent execution fails when spawned from chat
- No error messages visible to user
- Agent panel shows no activity

**Investigation Needed**:
1. Check agent runner error logs
2. Verify tool executor permissions
3. Test with valid project path
4. Check provider/model configuration

**Hypothesis**:
- May be related to missing project path
- Tool execution might fail without working directory
- Permission system might be blocking operations

---

### 4. ⏳ Agent Config Not Auto-Set from Chat Provider/Model
**Status**: DESIGN ISSUE  
**Severity**: Medium  
**Impact**: User must manually configure agent settings

**Current Behavior**:
- User selects provider/model in chat
- Agent settings remain empty
- Must manually set provider/model for each agent type

**Expected Behavior**:
- Agent inherits chat provider/model by default
- User can override per agent type if needed
- Settings show "Using chat defaults" when not overridden

**Implementation Plan**:
- [ ] Add "Use Chat Defaults" toggle in agent settings
- [ ] Auto-populate agent config from active chat provider/model
- [ ] Show inherited values in UI (grayed out)
- [ ] Allow per-agent overrides

---

### 5. ⏳ Sidebars Not Resizable
**Status**: FEATURE MISSING  
**Severity**: Low  
**Impact**: Fixed sidebar widths, poor UX for different screen sizes

**Current State**:
- Left sidebar: fixed width
- Right sidebar: fixed width
- No drag handles to resize

**Research Needed**:
- Best practices for resizable panels in React
- Libraries: `react-resizable-panels`, `react-split-pane`
- Persist sizes to localStorage
- Min/max width constraints

**Implementation Plan**:
- [ ] Research resizable panel libraries
- [ ] Add drag handles between panels
- [ ] Persist panel sizes to localStorage
- [ ] Add min/max width constraints (200px - 600px)
- [ ] Smooth resize animation

---

### 6. ⏳ Tools Tab Empty in Settings
**Status**: NOT IMPLEMENTED  
**Severity**: Medium  
**Impact**: No way to configure available tools for agents

**Current State**:
- Settings has "Tools" tab
- Tab content is empty/placeholder
- No tool configuration UI

**Required Features**:
1. List all available tools (read_file, write_file, run_command, etc.)
2. Enable/disable tools per agent type
3. Configure tool permissions (auto-allow, prompt, deny)
4. Tool usage statistics

**Implementation Plan**:
- [ ] Create `ToolsTab` component
- [ ] List all tools from backend
- [ ] Add enable/disable toggles
- [ ] Add permission level selector
- [ ] Show tool descriptions and examples

---

## Priority Order

1. **🔴 Critical**: Fix project path (enables all IDE features)
2. **🟠 High**: Fix agent spawn failures
3. **🟡 Medium**: Auto-set agent config from chat
4. **🟡 Medium**: Implement Tools tab
5. **🟢 Low**: Add resizable sidebars

---

## Research Topics

### Agent File Access Patterns
**Question**: How should AI coding agents access project files?

**Industry Patterns** (from Cursor, Claude Code, Aider):
1. **Workspace Root**: Agent operates within project root directory
2. **File Whitelist**: Only access files in project, exclude node_modules, .git
3. **Permission System**: Ask user before modifying files
4. **Context Window**: Load relevant files based on task
5. **Incremental Updates**: Stream file changes, not full rewrites

**Best Practices**:
- Set working directory to project root
- Use relative paths for all file operations
- Respect .gitignore patterns
- Ask permission for destructive operations
- Show file diffs before applying changes

### Resizable Panels
**Libraries**:
- `react-resizable-panels` (recommended, 2.1k stars)
- `react-split-pane` (older, 3.2k stars)
- `allotment` (VS Code style, 1.5k stars)

**Implementation**:
```tsx
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

<PanelGroup direction="horizontal">
  <Panel defaultSize={20} minSize={15} maxSize={40}>
    <LeftSidebar />
  </Panel>
  <PanelResizeHandle />
  <Panel>
    <MainContent />
  </Panel>
  <PanelResizeHandle />
  <Panel defaultSize={25} minSize={20} maxSize={45}>
    <RightSidebar />
  </Panel>
</PanelGroup>
```

---

## Next Steps

1. ✅ Commit terminal path fix
2. ⏳ Implement project path selector dialog
3. ⏳ Debug agent spawn failures with proper logging
4. ⏳ Research and implement resizable panels
5. ⏳ Implement Tools tab in settings
6. ⏳ Add agent config inheritance from chat
7. ⏳ Test all fixes with kulpik project
8. ⏳ Prepare PR for upstream contribution

---

## Testing Checklist

- [x] Terminal opens in project directory
- [ ] Git panel works with project path
- [ ] Search works with project path
- [ ] Agent can read project files
- [ ] Agent can execute tools
- [ ] Agent config inherits from chat
- [ ] Sidebars are resizable
- [ ] Tools tab shows configuration
- [ ] All features work with kulpik project

---

**Status**: 1/8 issues fixed, 7 remaining. Ready for next phase of fixes.

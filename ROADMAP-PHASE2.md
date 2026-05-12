# enowX-Coder Phase 2 Roadmap

## User Requirements Analysis

### 1. Built-in MCP/Plugins (Pre-configured)
**Goal:** MCP servers + plugins pre-installed, toggle enable/disable
**Implementation:**
- Default MCP servers: filesystem, github, sqlite, fetch
- Default plugins: hello-world, code-review, security-scan
- UI: Toggle switches in Settings → Tools
- DB: `enabled` column already exists
**Priority:** P0 (core UX improvement)

### 2. Token Dashboard Toggles
**Goal:** RTK/Caveman/DCP enable/disable switches
**Current:** Token savings display only
**Add:**
- Toggle: Enable RTK (command filtering)
- Toggle: Enable Caveman (terse responses)
- Toggle: Enable DCP (context deduplication)
- Store in settings table
**Priority:** P0 (cost optimization control)

### 3. Resizable Sidebars
**Goal:** Drag-to-resize both left + right sidebars
**Current:** Fixed width (--sidebar-width-left/right CSS vars)
**Implementation:**
- React resize handle component
- Store width in localStorage
- Min/max width constraints (200px - 600px)
**Priority:** P1 (UX polish)

### 4. Better Sidebar UI/UX
**Goal:** Improved visual design, icons, spacing
**Current:** Basic layout with tabs
**Improvements:**
- Collapsible sections
- Better icons (Phosphor)
- Hover states, animations
- Search/filter for long lists
- Tooltips for actions
**Priority:** P1 (UX polish)

### 5. Active Project Folder Tree
**Goal:** File explorer showing project files
**Current:** Project name only, no file tree
**Implementation:**
- Recursive directory tree component
- File icons by extension
- Click to open in CodePreview
- Right-click context menu (open, delete, rename)
- Git status indicators (modified, untracked)
**Priority:** P0 (core IDE feature)

### 6. Agent Configuration & Chat Integration
**Goal:** All agents configurable in Settings, usable in chat
**Current:** Agent configs exist, but not fully integrated
**Implementation:**
- Settings → Agents tab: list all agents (Orchestrator, Planner, Coder FE/BE, Tester, Reviewer, Security)
- Per-agent settings: model, temperature, max_tokens, system_prompt
- Chat: Agent selector dropdown (default: Orchestrator)
- Agent switching mid-conversation
**Priority:** P0 (core multi-agent feature)

### 7. Permission Modes
**Goal:** Multiple permission levels for tool execution
**Current:** Binary approve/reject per tool call
**Modes:**
- **Manual** (default): Approve each tool call
- **Accept Edits**: Auto-approve file edits, ask for shell/delete
- **Autopilot**: Auto-approve all (dangerously-skip-permissions)
**UI:** Radio buttons in Settings → System → Permissions
**Priority:** P1 (power user feature)

### 8. Codebase Indexing System
**Goal:** Background indexing for context + security scanning
**Features:**
- **Startup indexing**: Scan project on app launch (if enabled)
- **Shutdown indexing**: Scan changes before app close
- **Incremental**: Only index modified files
- **Security scan levels:**
  - High-warning (SQL injection, XSS, hardcoded secrets)
  - Weak-warning (weak crypto, deprecated APIs)
  - Warning (potential issues, code smells)
  - Mismatch (type errors, unused vars)
  - Typo (spelling in comments/strings)
- **Context extraction**: Function signatures, imports, exports → reduce token usage
- **Storage**: SQLite table `indexed_files` (path, hash, symbols, issues, last_indexed)
**UI:**
- Settings → System → Indexing: Enable/disable, scan on startup/shutdown
- Status indicator: "Indexing... 45/120 files"
- Security panel: List issues by severity
**Priority:** P0 (token optimization + security)

---

## Implementation Plan

### Phase 2A: Core Features (Week 1-2)
**P0 items:**
1. Built-in MCP/plugins (2 days)
2. Token dashboard toggles (1 day)
3. Active project folder tree (3 days)
4. Agent configuration + chat integration (3 days)
5. Codebase indexing system (5 days)

### Phase 2B: UX Polish (Week 3)
**P1 items:**
1. Resizable sidebars (2 days)
2. Better sidebar UI/UX (2 days)
3. Permission modes (2 days)

---

## Technical Design

### 1. Built-in MCP/Plugins
```rust
// src-tauri/src/services/mcp_service.rs
pub fn init_default_servers() -> Vec<MCPServer> {
    vec![
        MCPServer {
            id: "filesystem".into(),
            name: "Filesystem".into(),
            command: "npx".into(),
            args: vec!["-y", "@modelcontextprotocol/server-filesystem", "."],
            enabled: true,
        },
        MCPServer {
            id: "github".into(),
            name: "GitHub".into(),
            command: "npx".into(),
            args: vec!["-y", "@modelcontextprotocol/server-github"],
            enabled: false,
        },
        // ... sqlite, fetch
    ]
}
```

### 2. Token Dashboard Toggles
```sql
-- Add to settings table
ALTER TABLE settings ADD COLUMN rtk_enabled BOOLEAN DEFAULT 1;
ALTER TABLE settings ADD COLUMN caveman_enabled BOOLEAN DEFAULT 0;
ALTER TABLE settings ADD COLUMN dcp_enabled BOOLEAN DEFAULT 0;
```

```tsx
// TokenDashboard.tsx
<div className="space-y-4">
  <Toggle label="Enable RTK (Command Filtering)" checked={rtk} onChange={setRtk} />
  <Toggle label="Enable Caveman (Terse Responses)" checked={caveman} onChange={setCaveman} />
  <Toggle label="Enable DCP (Context Deduplication)" checked={dcp} onChange={setDcp} />
</div>
```

### 3. Resizable Sidebars
```tsx
// src/components/layout/ResizeHandle.tsx
export const ResizeHandle = ({ side, onResize }) => {
  const handleMouseDown = (e) => {
    const startX = e.clientX;
    const startWidth = side === 'left' ? leftWidth : rightWidth;
    
    const handleMouseMove = (e) => {
      const delta = side === 'left' ? e.clientX - startX : startX - e.clientX;
      const newWidth = Math.max(200, Math.min(600, startWidth + delta));
      onResize(newWidth);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', () => {
      document.removeEventListener('mousemove', handleMouseMove);
    }, { once: true });
  };
  
  return <div className="resize-handle" onMouseDown={handleMouseDown} />;
};
```

### 4. Project Folder Tree
```rust
// src-tauri/src/commands/filesystem.rs
#[tauri::command]
pub async fn read_directory_tree(path: String, max_depth: usize) -> Result<DirTree> {
    let mut tree = DirTree::new();
    walk_dir(&path, 0, max_depth, &mut tree)?;
    Ok(tree)
}

struct DirTree {
    name: String,
    path: String,
    is_dir: bool,
    children: Vec<DirTree>,
    git_status: Option<GitStatus>, // modified, untracked, staged
}
```

```tsx
// src/components/ide/FileTree.tsx
export const FileTree = ({ projectPath }) => {
  const [tree, setTree] = useState<DirTree | null>(null);
  
  useEffect(() => {
    invoke('read_directory_tree', { path: projectPath, maxDepth: 5 })
      .then(setTree);
  }, [projectPath]);
  
  return <TreeNode node={tree} onFileClick={handleFileClick} />;
};
```

### 5. Agent Configuration
```sql
-- Already exists: agent_configs table
-- Add UI to edit system_prompt, model, temperature per agent
```

```tsx
// src/components/settings/AgentsTab.tsx
export const AgentsTab = () => {
  const agents = useAgentStore(s => s.agents);
  
  return (
    <div className="space-y-4">
      {agents.map(agent => (
        <AgentCard
          key={agent.id}
          agent={agent}
          onUpdate={handleUpdate}
        />
      ))}
    </div>
  );
};
```

```tsx
// src/components/chat/AgentSelector.tsx
<Select value={selectedAgent} onChange={setSelectedAgent}>
  <option value="orchestrator">Orchestrator</option>
  <option value="planner">Planner</option>
  <option value="coder-fe">Coder (Frontend)</option>
  <option value="coder-be">Coder (Backend)</option>
  <option value="tester">Tester</option>
  <option value="reviewer">Reviewer</option>
  <option value="security">Security</option>
</Select>
```

### 6. Permission Modes
```rust
// src-tauri/src/models/settings.rs
pub enum PermissionMode {
    Manual,       // Approve each tool call
    AcceptEdits,  // Auto-approve file edits
    Autopilot,    // Auto-approve all
}
```

```tsx
// src/components/settings/PermissionsTab.tsx
<RadioGroup value={mode} onChange={setMode}>
  <Radio value="manual">Manual (approve each action)</Radio>
  <Radio value="accept-edits">Accept Edits (auto-approve file changes)</Radio>
  <Radio value="autopilot">Autopilot (auto-approve all - dangerous!)</Radio>
</RadioGroup>
```

### 7. Codebase Indexing
```sql
-- src-tauri/migrations/20260512004_indexing.sql
CREATE TABLE indexed_files (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  path TEXT NOT NULL,
  hash TEXT NOT NULL,
  symbols TEXT, -- JSON: functions, classes, imports
  issues TEXT,  -- JSON: [{severity, type, line, message}]
  last_indexed TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE INDEX idx_indexed_files_project ON indexed_files(project_id);
CREATE INDEX idx_indexed_files_hash ON indexed_files(hash);
```

```rust
// src-tauri/src/services/indexing_service.rs
pub struct IndexingService {
    db: SqlitePool,
    parser: TreeSitterParser,
    security_scanner: SecurityScanner,
}

impl IndexingService {
    pub async fn index_project(&self, project_id: &str, path: &str) -> Result<IndexStats> {
        let files = walk_dir(path)?;
        let mut stats = IndexStats::default();
        
        for file in files {
            if should_skip(&file) { continue; }
            
            let content = fs::read_to_string(&file)?;
            let hash = sha256(&content);
            
            // Check if already indexed
            if self.is_indexed(&file, &hash).await? {
                continue;
            }
            
            // Parse symbols
            let symbols = self.parser.parse(&content)?;
            
            // Security scan
            let issues = self.security_scanner.scan(&content)?;
            
            // Store
            self.store_indexed_file(project_id, &file, &hash, &symbols, &issues).await?;
            
            stats.files_indexed += 1;
            stats.issues_found += issues.len();
        }
        
        Ok(stats)
    }
    
    pub async fn incremental_index(&self, project_id: &str, changed_files: Vec<String>) -> Result<()> {
        // Only re-index modified files
        for file in changed_files {
            self.index_file(project_id, &file).await?;
        }
        Ok(())
    }
}

pub struct SecurityScanner {
    rules: Vec<SecurityRule>,
}

impl SecurityScanner {
    pub fn scan(&self, content: &str) -> Result<Vec<SecurityIssue>> {
        let mut issues = vec![];
        
        for rule in &self.rules {
            if let Some(matches) = rule.pattern.find_iter(content) {
                for m in matches {
                    issues.push(SecurityIssue {
                        severity: rule.severity,
                        issue_type: rule.issue_type.clone(),
                        line: get_line_number(content, m.start()),
                        message: rule.message.clone(),
                    });
                }
            }
        }
        
        Ok(issues)
    }
}

// Security rules
fn default_security_rules() -> Vec<SecurityRule> {
    vec![
        SecurityRule {
            severity: Severity::High,
            issue_type: "sql-injection".into(),
            pattern: Regex::new(r#"execute\([^?]*\+[^)]*\)"#).unwrap(),
            message: "Potential SQL injection: string concatenation in query".into(),
        },
        SecurityRule {
            severity: Severity::High,
            issue_type: "hardcoded-secret".into(),
            pattern: Regex::new(r#"(password|secret|api_key)\s*=\s*["'][^"']{8,}["']"#).unwrap(),
            message: "Hardcoded secret detected".into(),
        },
        SecurityRule {
            severity: Severity::Weak,
            issue_type: "weak-crypto".into(),
            pattern: Regex::new(r"md5|sha1").unwrap(),
            message: "Weak cryptographic algorithm".into(),
        },
        // ... more rules
    ]
}
```

```tsx
// src/components/settings/IndexingTab.tsx
export const IndexingTab = () => {
  const [enabled, setEnabled] = useState(true);
  const [scanOnStartup, setScanOnStartup] = useState(true);
  const [scanOnShutdown, setScanOnShutdown] = useState(true);
  const [status, setStatus] = useState<IndexingStatus | null>(null);
  
  const handleStartIndexing = async () => {
    const result = await invoke('start_indexing', { projectId: activeProjectId });
    setStatus(result);
  };
  
  return (
    <div className="space-y-6">
      <Toggle label="Enable Indexing" checked={enabled} onChange={setEnabled} />
      <Toggle label="Scan on Startup" checked={scanOnStartup} onChange={setScanOnStartup} />
      <Toggle label="Scan on Shutdown" checked={scanOnShutdown} onChange={setScanOnShutdown} />
      
      {status && (
        <div className="bg-surface-2 p-4 rounded">
          <p>Indexing: {status.current}/{status.total} files</p>
          <Progress value={status.progress} />
        </div>
      )}
      
      <Button onClick={handleStartIndexing}>Start Indexing Now</Button>
    </div>
  );
};

// src/components/ide/SecurityPanel.tsx
export const SecurityPanel = () => {
  const [issues, setIssues] = useState<SecurityIssue[]>([]);
  
  useEffect(() => {
    invoke('get_security_issues', { projectId: activeProjectId })
      .then(setIssues);
  }, [activeProjectId]);
  
  const groupedIssues = groupBy(issues, 'severity');
  
  return (
    <div className="space-y-4">
      {Object.entries(groupedIssues).map(([severity, items]) => (
        <div key={severity}>
          <h3 className="font-semibold text-red-500">{severity} ({items.length})</h3>
          <ul className="space-y-2">
            {items.map(issue => (
              <li key={issue.id} className="p-2 bg-surface-2 rounded">
                <p className="font-mono text-sm">{issue.path}:{issue.line}</p>
                <p className="text-text-muted">{issue.message}</p>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};
```

---

## Benefits Analysis

### Token Optimization
**Indexing → Context Reduction:**
- Store function signatures, imports, exports in DB
- Agent queries DB instead of reading full files
- Example: "What functions are in auth.ts?" → DB lookup (0 tokens) vs file read (500 tokens)
- **Estimated savings:** 40-60% on codebase queries

### Security
**Proactive Scanning:**
- Catch issues before commit
- Real-time feedback in IDE
- Reduce security debt

### UX
**Built-in MCP/Plugins:**
- Zero-config experience
- Discover features via toggle switches
- Faster onboarding

**Resizable Sidebars:**
- Adapt to screen size
- Power users: more space for file tree
- Casual users: more space for chat

**Permission Modes:**
- Manual: Safe for production
- Accept Edits: Fast iteration
- Autopilot: Demo/testing

---

## Risks & Mitigations

### Risk 1: Indexing Performance
**Problem:** Large repos (10k+ files) slow startup
**Mitigation:**
- Incremental indexing (only changed files)
- Background thread (non-blocking)
- Skip node_modules, .git, dist
- Progress indicator

### Risk 2: False Positives (Security Scan)
**Problem:** Too many warnings → alert fatigue
**Mitigation:**
- Severity levels (high/weak/warning)
- Configurable rules
- Whitelist patterns
- "Mark as false positive" button

### Risk 3: Complexity Creep
**Problem:** Too many features → bloated UI
**Mitigation:**
- Collapsible sections
- Tabs for advanced settings
- Sensible defaults
- Progressive disclosure

---

## Success Metrics

1. **Token savings:** 40%+ reduction via indexing
2. **Security issues caught:** 10+ per project
3. **User satisfaction:** 4.5/5 on UX survey
4. **Onboarding time:** <5 min to first chat (built-in MCP)
5. **Adoption:** 80%+ users enable indexing

---

## Next Steps

1. **Review roadmap** with user
2. **Prioritize** P0 vs P1
3. **Prototype** indexing system (highest complexity)
4. **Iterate** on UX feedback
5. **Ship** Phase 2A (2 weeks)

# enowX-Coder-verversion Development Log

## 2026-05-12 — Phase 2: Search & Replace

### Completed Features

#### 1. Terminal PTY Resize Fix ✅
- **Issue**: Terminal text wrapping broke on window resize
- **Fix**: Store `MasterPty` reference in `TerminalSession`, implement actual resize
- **Impact**: Terminal now properly resizes, no cursor misalignment
- **Commit**: `0c4b4cf`

#### 2. Bundle Size Optimization ✅
- **Issue**: 8.8MB bundle with large chunks (Excalidraw 1.8MB, Monaco 2.3MB)
- **Fix**: Code-split Monaco, Excalidraw, xterm into separate lazy-loaded chunks
- **Impact**: On-demand loading, faster initial load
- **Chunks**:
  - `excalidraw-*.js`: 1.1MB (lazy)
  - `xterm-*.js`: 330KB (lazy)
  - `monaco-*.js`: separate chunk (lazy)
- **Commit**: `0c4b4cf`

#### 3. Search & Replace System ✅
- **Backend** (`search_service.rs`):
  - Regex and literal search modes
  - Case-sensitive toggle
  - File pattern filtering (e.g., `*.tsx`)
  - Auto-exclude `.git`, `node_modules`, `target`, `dist`
  - Batch replace with preview
- **Frontend** (`SearchPanel.tsx`):
  - Grouped results by file
  - Match highlighting with line numbers
  - File selection for batch replace
  - Match counter and files searched stats
- **Commands**:
  - `search_in_files`: Global search with filters
  - `replace_in_file`: Single file replace
  - `replace_in_files`: Batch replace
- **UI**: New "Search" tab in right sidebar
- **Commit**: `[latest]`

### Technical Improvements

- **Rust formatting**: Applied rustfmt to all backend code
- **Dependency**: Added `git2 = "0.20"` for git operations
- **Type safety**: All TS files type-check cleanly
- **Build**: Backend compiles with 0 errors, 0 warnings

### Remaining Issues

- **Console.log cleanup**: 27 statements (low priority, skipped)
- **Git service**: Already safe (uses `unwrap_or` fallbacks)

### Next Development Targets

1. **File Editor**: Make Monaco editable + save files
2. **File Tree Actions**: Context menu (create/delete/rename)
3. **Git Advanced**: Diff viewer, push/pull, conflict resolution
4. **LSP Integration**: Autocomplete, go-to-definition

### Metrics

- **Source files**: 33 TSX, 53 RS
- **Bundle size**: 8.8MB (optimized with code-splitting)
- **Build time**: ~25s frontend, ~2s backend
- **Commits ahead**: 6 (from upstream)

---

## Development Environment

- **Tauri**: 2.0
- **React**: 19.1
- **Rust**: 1.75+
- **TypeScript**: 5.8
- **Node**: 18+

## Testing

```bash
# Backend
cargo check --manifest-path src-tauri/Cargo.toml

# Frontend
npx tsc --noEmit
npm run build

# Full app
npm run tauri dev
```

## Git Status

```
* main...origin/main [ahead 6]
clean — nothing to commit
```

**Latest commits**:
- `[latest]` — feat(ide): add Search & Replace functionality
- `f0af78d` — chore: apply rustfmt and add git2 dependency
- `0c4b4cf` — fix: implement PTY resize and optimize bundle size

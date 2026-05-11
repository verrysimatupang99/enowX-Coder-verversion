# enowX-Coder-verversion — Identified Issues

**Generated**: 2026-05-12  
**Status**: Development fork (sanitized from upstream enowdev/enowX-Coder)

---

## 🔴 Critical Issues

### 1. Terminal PTY Resize Not Implemented
**Location**: `src-tauri/src/services/terminal_service.rs:128-134`  
**Impact**: Terminal text wrapping breaks when window resizes, cursor misalignment  
**Root cause**: `resize_terminal()` is a no-op stub — `portable-pty` 0.9 doesn't expose `PtyMaster::resize()` in public API  
**Fix**: Store `PtyMaster` reference in `TerminalSession` struct, call internal resize method

```rust
// Current (broken):
pub fn resize_terminal(&self, _session_id: &str, _rows: u16, _cols: u16) -> Result<(), AppError> {
    // PTY resize not exposed in current API — would need master.resize()
    // Skipping for now
    Ok(())
}
```

**Workaround**: Restart terminal session on resize (poor UX)

---

## 🟡 Medium Priority Issues

### 2. Git Service Uses `.unwrap()` on Optional Values
**Location**: `src-tauri/src/services/git_service.rs:42,103`  
**Impact**: Potential panic on detached HEAD or invalid UTF-8 branch names  
**Lines**:
- L42: `.shorthand().unwrap_or("(detached)")`
- L103: `.name()...unwrap_or("?")`

**Fix**: Replace with proper error handling or safe defaults

### 3. Large Bundle Size (8.8MB dist/)
**Location**: Build output  
**Impact**: Slow initial load, large download  
**Cause**: 
- `subset-shared.chunk-BxoUImLn.js` (1.8MB)
- `index-CkwS8Dla.js` (2.3MB)
- Excalidraw, Monaco, Chart.js all bundled together

**Fix**: 
- Code-split with dynamic imports
- Lazy-load Monaco/Excalidraw on tab switch
- Use `build.rollupOptions.output.manualChunks`

### 4. 27 Console.log Statements in Production Code
**Location**: Scattered across `src/` components  
**Impact**: Debug noise in production, potential info leak  
**Fix**: Replace with proper logging service or remove

### 5. Uncommitted Changes in Main Branch
**Files**:
- 9 modified Rust files (services, commands, agents)
- 1 untracked test script (`test-phase1.sh`)

**Impact**: Unclear what's in-progress vs. stable  
**Fix**: Commit or stash changes, document test script purpose

---

## 🟢 Low Priority / Tech Debt

### 6. HTTP Timeout Hardcoded (30s)
**Location**: `src-tauri/src/services/chat_service.rs`  
**Current**: `.timeout(Duration::from_secs(30))`  
**Improvement**: Make configurable per-provider (some models need >30s for long responses)

### 7. MAX_REACT_ITERATIONS Reduced to 10
**Location**: `src-tauri/src/agents/runner.rs:20`  
**Context**: Reduced from 20 to prevent excessive API calls  
**Risk**: Complex agent tasks may hit iteration limit prematurely  
**Monitor**: Track agent run failures due to iteration cap

### 8. No Error Boundary in React Components
**Impact**: Single component crash can break entire UI  
**Fix**: Add `ErrorBoundary` wrapper in `App.tsx`

### 9. Git Panel Auto-Selects All Files for Commit
**Location**: `src/components/ide/GitPanel.tsx:36`  
```tsx
setSelectedFiles(new Set(result.files.map((f) => f.path)));
```
**UX Issue**: User may accidentally commit unintended files  
**Fix**: Default to empty selection, require explicit file selection

### 10. Terminal Service Uses `read_line()` for PTY Output
**Location**: `src-tauri/src/services/terminal_service.rs:68-77`  
**Issue**: Line-buffered reading breaks interactive programs (vim, htop)  
**Fix**: Use raw byte reading with `read()` instead of `read_line()`

---

## 📋 Upstream PR Cleanup Status

**Closed**: PR #5 (yours) ✅  
**Remaining open** (require team action):
- PR #3 (mhmmadazis) — feat: token optimization
- PR #4 (raffyherp) — chore: add tiny improvement to main.tsx

**Action**: Coordinate with team to close #3 & #4 before merging to upstream

---

## ✅ What's Working Well

- ✅ Rust backend compiles cleanly (0 errors, 1 warning)
- ✅ TypeScript type-checks pass (0 errors)
- ✅ Frontend builds successfully (31s)
- ✅ No `.unwrap()` panic risks (only 1 instance found)
- ✅ HTTP timeouts implemented (prevents hanging on slow providers)
- ✅ Terminal PTY backend functional (spawn/write/close work)
- ✅ Git commands registered and working
- ✅ Monaco editor integrated
- ✅ Agent system with tool execution
- ✅ Multi-provider support with enable/disable toggles

---

## 🎯 Recommended Fix Priority

1. **Terminal resize** (breaks UX on window resize)
2. **Commit uncommitted changes** (clarify repo state)
3. **Bundle size optimization** (impacts all users)
4. **Git service `.unwrap()` fixes** (prevent panics)
5. **Remove console.log statements** (production hygiene)
6. **Terminal line-buffering fix** (enables interactive tools)
7. **Git auto-select behavior** (UX improvement)
8. **Error boundaries** (resilience)

---

## 📊 Project Health Metrics

| Metric | Value | Status |
|--------|-------|--------|
| Rust compile | ✅ Pass | Good |
| TS type-check | ✅ Pass | Good |
| Bundle size | 8.8MB | ⚠️ Large |
| Console logs | 27 | ⚠️ High |
| Unwrap calls | 0 | ✅ Good |
| Expect calls | 1 | ✅ Good |
| Test coverage | Unknown | ❓ |
| Open PRs (upstream) | 2 | ⚠️ Needs cleanup |

---

**Next Steps**: Address critical issues first, then optimize bundle size and clean up tech debt.

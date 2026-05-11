# Search & Replace Testing Guide

## Test Scenarios

### 1. Basic Search
**Steps**:
1. Open app → Right sidebar → Click "Search" tab
2. Enter query: `useState`
3. Click "Search"

**Expected**:
- Shows matches grouped by file
- Displays line numbers and content
- Highlights matched text in yellow
- Shows total matches and files searched

### 2. Case-Sensitive Search
**Steps**:
1. Search for: `React`
2. Toggle case-sensitive (Aa icon)
3. Search again

**Expected**:
- Without case-sensitive: matches `react`, `React`, `REACT`
- With case-sensitive: only matches `React`

### 3. Regex Search
**Steps**:
1. Enter query: `use[A-Z]\w+`
2. Toggle regex (* icon)
3. Click "Search"

**Expected**:
- Matches: `useState`, `useEffect`, `useRef`, etc.
- Shows regex pattern matches

### 4. File Pattern Filter
**Steps**:
1. Enter query: `import`
2. File pattern: `*.tsx`
3. Click "Search"

**Expected**:
- Only searches `.tsx` files
- Excludes `.ts`, `.rs`, `.json` files

### 5. Replace in Single File
**Steps**:
1. Search for: `console.log`
2. Toggle replace (Files icon)
3. Replace with: `// console.log`
4. Select 1 file checkbox
5. Click "Replace (1)"

**Expected**:
- Confirmation dialog appears
- After confirm, file is modified
- Search refreshes showing updated results

### 6. Batch Replace
**Steps**:
1. Search for: `var `
2. Replace with: `const `
3. Click "Select all"
4. Click "Replace (N)" where N = number of files

**Expected**:
- Confirmation shows total matches and files
- All selected files are modified
- Results refresh

### 7. Auto-Exclude Folders
**Steps**:
1. Search for: `node_modules` (or any common term)
2. Check results

**Expected**:
- No matches from `.git/`, `node_modules/`, `target/`, `dist/`
- Only searches source files

## Manual Testing Checklist

- [ ] Search tab appears in right sidebar
- [ ] Search input focuses on open
- [ ] Enter key triggers search
- [ ] Case-sensitive toggle works
- [ ] Regex toggle works
- [ ] File pattern filtering works
- [ ] Results grouped by file
- [ ] Match highlighting visible
- [ ] Line numbers correct
- [ ] Replace toggle shows replace input
- [ ] File selection checkboxes work
- [ ] "Select all" button works
- [ ] Replace confirmation dialog appears
- [ ] Files are actually modified after replace
- [ ] Search refreshes after replace
- [ ] Close button returns to Agents tab

## Known Limitations

1. **No undo**: Replace operations are immediate (use git to revert)
2. **No match navigation**: Can't jump to next/previous match
3. **No in-file preview**: Can't see full file context
4. **Hardcoded root path**: Uses fixed project path (should use active project)

## Performance Notes

- Searches entire project tree (can be slow on large projects)
- No result pagination (all matches loaded at once)
- No search cancellation (long searches block UI)

## Next Improvements

1. Add match navigation (prev/next buttons)
2. Implement search cancellation
3. Add result pagination (show first 100, load more)
4. Use active project path instead of hardcoded
5. Add "Replace All" without file selection
6. Show file preview on match click
7. Add search history
8. Keyboard shortcuts (Ctrl+F, Ctrl+H)

# Phase 2 Fixes - Resizable Sidebar Issues

## Problems Identified

### 1. Resize Direction Inverted
- **Left sidebar:** Drag kanan → tertutup chat (harusnya melebar)
- **Right sidebar:** Drag kiri → melebar kiri (harusnya mengecil)
- **Root cause:** Delta calculation terbalik

### 2. Color Mismatch
- Panel atas "default" text → warna ga match tema
- Need: use CSS variables (--text, --text-muted)

### 3. Right Sidebar Icon Layout
- Icon layout kurang rapi
- Need: better spacing, alignment

### 4. Project Folder Switching
- Belum ada quick switch dari history
- Need: dropdown atau quick picker

### 5. Toggle Sidebar Behavior
- Current: hide/show (hilang total)
- Expected: minimize to icon bar (collapsed state)
- Left sidebar collapsed: logo + icons vertical
- Right sidebar collapsed: icons vertical

## Implementation Plan

### Fix 1: Resize Direction (Priority 1)
**File:** `src/components/layout/LeftSidebar.tsx`, `RightSidebar.tsx`

**Left sidebar:**
```tsx
// Current (wrong):
const handleResize = (delta: number) => {
  setWidth(prev => Math.max(200, Math.min(600, prev + delta)));
};

// Fixed:
const handleResize = (delta: number) => {
  setWidth(prev => Math.max(200, Math.min(600, prev + delta)));
};
// Delta sudah benar, tapi perlu cek apakah ResizeHandle di edge yang benar
```

**Right sidebar:**
```tsx
// Current (wrong):
const handleResize = (delta: number) => {
  setWidth(prev => Math.max(200, Math.min(600, prev + delta)));
};

// Fixed:
const handleResize = (delta: number) => {
  setWidth(prev => Math.max(200, Math.min(600, prev - delta))); // INVERT
};
```

### Fix 2: Color Match (Priority 1)
**File:** All components with hardcoded colors

Search for: `text-gray-`, `bg-gray-`, `border-gray-`
Replace with: `text-[var(--text)]`, `bg-[var(--surface)]`, etc.

### Fix 3: Right Sidebar Icon Layout (Priority 2)
**File:** `src/components/layout/RightSidebar.tsx`

- Add flex gap
- Center align icons
- Consistent sizing

### Fix 4: Project Folder Quick Switch (Priority 2)
**File:** `src/components/layout/LeftSidebar.tsx`

Add dropdown in Files tab:
```tsx
<Select value={activeProjectId} onChange={switchProject}>
  {recentProjects.map(p => (
    <option key={p.id} value={p.id}>{p.name}</option>
  ))}
</Select>
```

### Fix 5: Collapsed Sidebar State (Priority 3)
**Files:** `LeftSidebar.tsx`, `RightSidebar.tsx`, `useUIStore.ts`

**State:**
```tsx
// Add to useUIStore
leftSidebarCollapsed: boolean
rightSidebarCollapsed: boolean
```

**Left sidebar collapsed:**
- Width: 48px
- Show: logo + tab icons vertical
- Hide: text labels, content

**Right sidebar collapsed:**
- Width: 48px
- Show: tab icons vertical
- Hide: text labels, content

**Toggle button:**
- Click → toggle collapsed state (not hide)
- Collapsed: show expand icon
- Expanded: show collapse icon

## Execution Order

1. Fix resize direction (left + right)
2. Fix color mismatch (search/replace)
3. Fix right sidebar icon layout
4. Add project quick switch
5. Implement collapsed sidebar state

## Testing Checklist

- [ ] Left sidebar drag right → melebar
- [ ] Right sidebar drag left → mengecil
- [ ] Colors match theme (light + dark mode)
- [ ] Right sidebar icons aligned
- [ ] Project quick switch works
- [ ] Toggle → collapsed (not hidden)
- [ ] Collapsed sidebar shows icons only
- [ ] Click icon in collapsed → expand + switch tab

import React, { useState } from 'react';
import { ProjectSwitcher } from '@/components/sidebar/ProjectSwitcher';
import { SessionList } from '@/components/sidebar/SessionList';
import { FileTree } from '@/components/ide/FileTree';
import { SidebarSimple, GearSix, Files, ClockCounterClockwise, CaretDown, MagnifyingGlass } from '@phosphor-icons/react';
import { useUIStore } from '@/stores/useUIStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { useResizableSidebar } from '@/hooks/useResizableSidebar';
import { cn } from '@/lib/utils';

type SidebarTab = 'files' | 'history';

export const LeftSidebar: React.FC = () => {
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen);
  const toggleLeftSidebar = useUIStore((s) => s.toggleLeftSidebar);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const projects = useProjectStore((s) => s.projects);
  const [activeTab, setActiveTab] = useState<SidebarTab>('files');
  const [searchQuery, setSearchQuery] = useState('');
  const [filesExpanded, setFilesExpanded] = useState(true);
  const [historyExpanded, setHistoryExpanded] = useState(true);

  const { width, isResizing, startResize } = useResizableSidebar({
    storageKey: 'left-sidebar-width',
    defaultWidth: 260,
    minWidth: 200,
    maxWidth: 500,
  });

  const activeProject = projects.find((p) => p.id === activeProjectId);

  return (
    <aside 
      className="h-full bg-[var(--surface)] border-r border-[var(--border)] flex flex-col relative"
      style={{ width: `${width}px` }}
    >
      <div className="flex items-center gap-2 p-4 border-b border-[var(--border)]">
        <button
          onClick={toggleLeftSidebar}
          className="w-7 h-7 rounded-lg bg-[var(--surface-3)] border border-[var(--border)] flex items-center justify-center hover:bg-[var(--surface-2)] transition-colors"
          title="Toggle sidebar"
        >
          <SidebarSimple size={15} weight="fill" className="text-[var(--text)]" />
        </button>

        <button
          onClick={() => setSettingsOpen(true)}
          className="w-7 h-7 rounded-lg bg-[var(--surface-3)] border border-[var(--border)] flex items-center justify-center hover:bg-[var(--surface-2)] transition-colors ml-auto"
          title="Settings"
        >
          <GearSix size={15} weight="fill" className="text-[var(--text)]" />
        </button>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <ProjectSwitcher />

        <div className="flex border-b border-[var(--border)]">
          <button
            onClick={() => setActiveTab('files')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-medium transition-all",
              activeTab === 'files'
                ? "text-[var(--text)] bg-[var(--surface-2)] shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]/50"
            )}
          >
            <Files size={14} weight={activeTab === 'files' ? 'fill' : 'regular'} />
            Files
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-medium transition-all",
              activeTab === 'history'
                ? "text-[var(--text)] bg-[var(--surface-2)] shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]/50"
            )}
          >
            <ClockCounterClockwise size={14} weight={activeTab === 'history' ? 'fill' : 'regular'} />
            History
          </button>
        </div>

        {/* Search Bar */}
        {activeTab === 'files' && (
          <div className="p-2 border-b border-[var(--border)]">
            <div className="relative">
              <MagnifyingGlass 
                size={14} 
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" 
              />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--surface-2)] border border-[var(--border)] rounded-md text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-all"
              />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {activeTab === 'files' && (
            <div className="transition-all duration-200">
              {activeProject?.path ? (
                <FileTree projectPath={activeProject.path} searchQuery={searchQuery} />
              ) : (
                <div className="p-4 text-center text-xs text-[var(--text-muted)]">
                  No project selected
                </div>
              )}
            </div>
          )}
          {activeTab === 'history' && (
            <div className="transition-all duration-200">
              <SessionList />
            </div>
          )}
        </div>
      </div>

      {/* Resize Handle */}
      <div
        className={cn(
          "absolute top-0 bottom-0 right-0 w-1 cursor-ew-resize hover:bg-[var(--accent)] transition-colors z-50",
          isResizing && "bg-[var(--accent)]"
        )}
        onMouseDown={(e) => startResize(e, 'left')}
      >
        <div className="absolute inset-y-0 -left-1 -right-1" />
      </div>
    </aside>
  );
};

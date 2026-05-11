import React, { useState } from 'react';
import { ProjectSwitcher } from '@/components/sidebar/ProjectSwitcher';
import { SessionList } from '@/components/sidebar/SessionList';
import { FileExplorer } from '@/components/ide/FileExplorer';
import { SidebarSimple, GearSix, Files, ClockCounterClockwise } from '@phosphor-icons/react';
import { useUIStore } from '@/stores/useUIStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { cn } from '@/lib/utils';

type SidebarTab = 'files' | 'history';

export const LeftSidebar: React.FC = () => {
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen);
  const toggleLeftSidebar = useUIStore((s) => s.toggleLeftSidebar);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const projects = useProjectStore((s) => s.projects);
  const [activeTab, setActiveTab] = useState<SidebarTab>('files');

  const activeProject = projects.find((p) => p.id === activeProjectId);

  return (
    <aside className="h-full bg-[var(--surface)] border-r border-[var(--border)] flex flex-col w-[var(--sidebar-width-left)]">
      <div className="flex items-center gap-2 p-4 border-b border-[var(--border)]">
        <button
          onClick={toggleLeftSidebar}
          className="w-7 h-7 rounded-lg bg-[var(--surface-3)] border border-[var(--border)] flex items-center justify-center hover:bg-[var(--surface-2)] transition-colors"
          title="Toggle sidebar"
        >
          <SidebarSimple size={15} weight="fill" className="text-[var(--text)]" />
        </button>
        <span className="font-bold text-sm tracking-tight text-[var(--text)]">enowX Coder</span>
      </div>

      <div className="px-3 pt-3 pb-2">
        <ProjectSwitcher />
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-[var(--border)] px-3">
        <button
          onClick={() => setActiveTab('files')}
          className={cn(
            'flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors relative',
            activeTab === 'files'
              ? 'text-[var(--text)] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[var(--accent)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
          )}
        >
          <Files size={16} />
          <span>Files</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            'flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors relative',
            activeTab === 'history'
              ? 'text-[var(--text)] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[var(--accent)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
          )}
        >
          <ClockCounterClockwise size={16} />
          <span>History</span>
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {activeTab === 'files' ? (
          <FileExplorer projectPath={activeProject?.path ?? null} />
        ) : (
          <SessionList />
        )}
      </div>

      <div className="p-3 border-t border-[var(--border)]">
        <button
          onClick={() => setSettingsOpen(true)}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--hover-bg)] transition-colors text-sm"
        >
          <GearSix size={16} />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
};

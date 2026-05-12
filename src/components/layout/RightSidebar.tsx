import React, { useState, lazy, Suspense } from 'react';
import { Robot, Code, ChartBar, TerminalWindow, Cpu, Books, SidebarSimple, CircleNotch, CheckCircle, XCircle, GitBranch, FileCode, MagnifyingGlass, Spinner, GearSix } from '@phosphor-icons/react';
import { ResizeHandle } from '@/components/common/ResizeHandle';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/useUIStore';
import { useAgentStore } from '@/stores/useAgentStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { useResizableSidebar } from '@/hooks/useResizableSidebar';
import { AGENT_LABELS } from '@/types';
import { TerminalPanel } from '@/components/ide/TerminalPanel';
import { GitPanel } from '@/components/ide/GitPanel';
import { SearchPanel } from '@/components/ide/SearchPanel';

const CodePreview = lazy(() => import('@/components/ide/CodePreview').then(m => ({ default: m.CodePreview })));

type Tab = 'agents' | 'skills' | 'metrics' | 'terminal' | 'git' | 'preview' | 'search' | 'settings';

export const RightSidebar: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('agents');
  const toggleRightSidebar = useUIStore((s) => s.toggleRightSidebar);
  const rightSidebarCollapsed = useUIStore((s) => s.rightSidebarCollapsed);
  const toggleRightSidebarCollapsed = useUIStore((s) => s.toggleRightSidebarCollapsed);
  const agentRuns = useAgentStore((s) => s.agentRuns);
  const projects = useProjectStore((s) => s.projects);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);

  const { width, isResizing, handleMouseDown } = useResizableSidebar({
    storageKey: 'right-sidebar-width',
    defaultWidth: 320,
    minWidth: 250,
    maxWidth: 600,
    side: 'right',
  });

  const activeProject = projects.find((p) => p.id === activeProjectId);
  const projectPath = activeProject?.path || undefined;

  const tabs = [
    { id: 'agents' as Tab, icon: Robot, label: 'Agents' },
    { id: 'terminal' as Tab, icon: TerminalWindow, label: 'Terminal' },
    { id: 'git' as Tab, icon: GitBranch, label: 'Git' },
    { id: 'search' as Tab, icon: MagnifyingGlass, label: 'Search' },
    { id: 'preview' as Tab, icon: FileCode, label: 'Preview' },
    { id: 'skills' as Tab, icon: Books, label: 'Skills' },
    { id: 'metrics' as Tab, icon: ChartBar, label: 'Metrics' },
    { id: 'settings' as Tab, icon: GearSix, label: 'Settings' },
  ];

  const handleTabClick = (tabId: Tab) => {
    if (rightSidebarCollapsed) {
      toggleRightSidebarCollapsed();
    }
    
    // Settings tab opens modal directly
    if (tabId === 'settings') {
      useUIStore.getState().setSettingsOpen(true);
      return;
    }
    
    setActiveTab(tabId);
  };

  if (rightSidebarCollapsed) {
    return (
      <aside 
        className="h-full bg-[var(--surface)] border-l border-[var(--border)] flex flex-col items-center gap-3"
        style={{ width: '48px' }}
      >
        {/* Collapse toggle at top */}
        <div className="w-full border-b border-[var(--border)] py-3 flex justify-center">
          <button
            onClick={toggleRightSidebarCollapsed}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
            title="Expand"
          >
            <SidebarSimple size={16} weight="fill" className="scale-x-[-1]" />
          </button>
        </div>

        {/* Tab Icons */}
        <div className="flex flex-col gap-2 px-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
              title={tab.label}
            >
              <tab.icon size={16} weight="fill" />
            </button>
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside 
      className="h-full bg-[var(--surface)] border-l border-[var(--border)] flex flex-col relative"
      style={{ width: `${width}px` }}
    >
      <div className="flex flex-col border-b border-[var(--border)] px-3 py-3 gap-3">
        <div className="flex items-center justify-between">
          <button
            onClick={toggleRightSidebarCollapsed}
            className="w-7 h-7 rounded-lg bg-[var(--surface-3)] border border-[var(--border)] flex items-center justify-center hover:bg-[var(--surface-2)] transition-colors"
            title="Collapse panel"
          >
            <SidebarSimple size={15} weight="fill" className="scale-x-[-1] text-[var(--text)]" />
          </button>
          <span className="text-xs font-semibold text-[var(--text-muted)]">Tools</span>
        </div>
        
        <div className="grid grid-cols-4 gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-lg transition-all",
                activeTab === tab.id 
                  ? "bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/30" 
                  : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"
              )}
              title={tab.label}
            >
              <tab.icon size={18} weight={activeTab === tab.id ? "fill" : "regular"} />
              <span className="text-[10px] font-medium leading-tight text-center">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        {activeTab === 'terminal' && (
          <div className="h-full -m-4">
            <TerminalPanel sessionId="main-terminal" workingDir={projectPath} />
          </div>
        )}

        {activeTab === 'git' && (
          <div className="h-full -m-4">
            {projectPath ? (
              <GitPanel repoPath={projectPath} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <GitBranch size={48} weight="duotone" className="text-[var(--text-muted)] mb-4" />
                <p className="text-sm font-medium text-[var(--text)]">No Project Selected</p>
                <p className="text-xs text-[var(--text-muted)] mt-2">
                  Select a project to view Git status
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'search' && (
          <div className="h-full -m-4">
            {projectPath ? (
              <SearchPanel
                rootPath={projectPath}
                onClose={() => setActiveTab('agents')}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <MagnifyingGlass size={48} weight="duotone" className="text-[var(--text-muted)] mb-4" />
                <p className="text-sm font-medium text-[var(--text)]">No Project Selected</p>
                <p className="text-xs text-[var(--text-muted)] mt-2">
                  Select a project to search files
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="h-full -m-4">
            <Suspense fallback={
              <div className="flex flex-col items-center justify-center h-full">
                <CircleNotch size={32} weight="bold" className="text-[var(--accent)] animate-spin mb-3" />
                <p className="text-xs text-[var(--text-muted)]">Loading editor...</p>
              </div>
            }>
              <CodePreview
                content="// Select a file from the explorer to preview"
                language="typescript"
              />
            </Suspense>
          </div>
        )}

        {activeTab === 'agents' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
              <Cpu size={14} weight="duotone" />
              Active Agents
            </h3>
            {agentRuns.length === 0 ? (
              <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/50 text-center space-y-3 transition-all hover:bg-[var(--surface-2)]/70">
                <div className="w-12 h-12 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto">
                  <Robot size={24} weight="duotone" className="text-[var(--text-muted)]" />
                </div>
                <div>
                  <p className="text-xs font-medium text-[var(--text)]">No agents running</p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-1">
                    Spawn an agent from the chat to see progress here
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {agentRuns.map((run) => (
                  <div
                    key={run.id}
                    className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/30 space-y-2 transition-all hover:bg-[var(--surface-2)]/50 hover:border-[var(--accent)]/30"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {run.status === 'running' && (
                          <CircleNotch size={14} weight="bold" className="text-[var(--accent)] animate-spin" />
                        )}
                        {run.status === 'completed' && (
                          <CheckCircle size={14} weight="fill" className="text-green-500" />
                        )}
                        {run.status === 'failed' && (
                          <XCircle size={14} weight="fill" className="text-red-500" />
                        )}
                        <span className="text-xs font-medium text-[var(--text)]">
                          {AGENT_LABELS[run.agentType as keyof typeof AGENT_LABELS] || run.agentType}
                        </span>
                      </div>
                      <span className="text-[10px] text-[var(--text-subtle)] uppercase tracking-wider font-semibold">
                        {run.status}
                      </span>
                    </div>
                    {run.toolCalls.length > 0 && (
                      <div className="text-[10px] text-[var(--text-muted)]">
                        {run.toolCalls.filter(tc => tc.status === 'completed').length}/{run.toolCalls.length} tools completed
                      </div>
                    )}
                    {run.streamingText && run.status === 'running' && (
                      <div className="text-[10px] text-[var(--text-muted)] truncate">
                        {run.streamingText.slice(0, 60)}...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
              <Code size={14} weight="duotone" />
              Agent Skills
            </h3>
            <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/50 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto">
                <Books size={24} weight="duotone" className="text-[var(--text-muted)]" />
              </div>
              <div>
                <p className="text-xs font-medium text-[var(--text)]">Skills System Coming Soon</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">
                  Reusable agent capabilities will appear here
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
              <ChartBar size={14} weight="duotone" />
              Session Metrics
            </h3>
            <div className="space-y-3">
              <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[var(--text-muted)]">Agent Runs</span>
                  <span className="text-sm font-bold text-[var(--text)]">{agentRuns.length}</span>
                </div>
                <div className="text-[10px] text-[var(--text-subtle)]">
                  {agentRuns.filter(r => r.status === 'completed').length} completed, {agentRuns.filter(r => r.status === 'running').length} active
                </div>
              </div>
              <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[var(--text-muted)]">Tool Calls</span>
                  <span className="text-sm font-bold text-[var(--text)]">
                    {agentRuns.reduce((sum, run) => sum + run.toolCalls.length, 0)}
                  </span>
                </div>
                <div className="text-[10px] text-[var(--text-subtle)]">
                  {agentRuns.reduce((sum, run) => sum + run.toolCalls.filter(tc => tc.status === 'completed').length, 0)} successful
                </div>
              </div>
              <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[var(--text-muted)]">Projects</span>
                  <span className="text-sm font-bold text-[var(--text)]">{projects.length}</span>
                </div>
                <div className="text-[10px] text-[var(--text-subtle)]">
                  {activeProjectId ? '1 active' : 'None active'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Resize Handle */}
      <ResizeHandle
        side="right"
        onMouseDown={handleMouseDown}
        isResizing={isResizing}
      />
    </aside>
  );
};

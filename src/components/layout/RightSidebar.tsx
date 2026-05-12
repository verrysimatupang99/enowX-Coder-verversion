import React, { useState, lazy, Suspense } from 'react';
import { Robot, Code, ChartBar, TerminalWindow, Cpu, Books, SidebarSimple, CircleNotch, CheckCircle, XCircle, GitBranch, FileCode, MagnifyingGlass, Spinner } from '@phosphor-icons/react';
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

type Tab = 'agents' | 'skills' | 'metrics' | 'terminal' | 'git' | 'preview' | 'search';

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
  ];

  const handleTabClick = (tabId: Tab) => {
    if (rightSidebarCollapsed) {
      toggleRightSidebarCollapsed();
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
      <div className="flex items-center border-b border-[var(--border)] h-14 px-3 gap-2">
        <button
          onClick={toggleRightSidebarCollapsed}
          className="w-7 h-7 rounded-lg bg-[var(--surface-3)] border border-[var(--border)] flex items-center justify-center hover:bg-[var(--surface-2)] transition-colors flex-shrink-0"
          title="Collapse panel"
        >
          <SidebarSimple size={15} weight="fill" className="scale-x-[-1] text-[var(--text)]" />
        </button>
        
        <div className="flex-1 grid grid-cols-4 gap-1.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2 rounded-lg transition-all",
                activeTab === tab.id 
                  ? "bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)]" 
                  : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"
              )}
              title={tab.label}
            >
              <tab.icon size={16} weight={activeTab === tab.id ? "fill" : "regular"} />
              <span className="text-[9px] font-medium">{tab.label}</span>
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
              Available Skills
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {['git-master', 'brainstorming', 'mnemosyne', 'plan-visualizer'].map(skill => (
                <div key={skill} className="p-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/30 hover:bg-[var(--surface-2)]/50 transition-colors cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-[var(--text)]">{skill}</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--text-subtle)]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="space-y-4 text-center py-10">
            <ChartBar size={48} weight="duotone" className="text-[var(--border)] mx-auto mb-2" />
            <h3 className="text-sm font-bold">Session Metrics</h3>
            <p className="text-xs text-[var(--text-muted)]">Usage data will appear here once the session starts.</p>
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

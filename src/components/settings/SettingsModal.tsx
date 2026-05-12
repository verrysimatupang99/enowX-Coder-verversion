import React, { useEffect, useState } from 'react';
import { X, Wrench, Robot, GearSix } from '@phosphor-icons/react';
import { useUIStore } from '@/stores/useUIStore';
import { ProvidersTab } from './ProvidersTab';
import { AgentsTab } from './AgentsTab';
import { MCPServerManager } from './MCPServerManager';
import { PluginManager } from './PluginManager';
import { TokenDashboard } from './TokenDashboard';
import { cn } from '@/lib/utils';

type SettingsTab = 'providers' | 'agents' | 'tools' | 'system';

export const SettingsModal: React.FC = () => {
  const { settingsOpen, setSettingsOpen } = useUIStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>('providers');

  useEffect(() => {
    if (!settingsOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSettingsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settingsOpen, setSettingsOpen]);

  if (!settingsOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay)] backdrop-blur-sm"
      onClick={() => setSettingsOpen(false)}
    >
      <div
        className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-6xl h-[64vh] flex flex-col overflow-hidden shadow-2xl shadow-[var(--shadow)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-1">
          <h2 className="text-sm font-bold text-[var(--text)]">Settings</h2>
          <button
            onClick={() => setSettingsOpen(false)}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--hover-bg)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex items-center gap-1 px-4 border-b border-[var(--border)]">
          <button
            onClick={() => setActiveTab('providers')}
            className={cn(
              "px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 -mb-px flex items-center gap-2",
              activeTab === 'providers'
                ? "text-[var(--text)] border-[var(--accent)] bg-[var(--hover-bg)]"
                : "text-[var(--text-muted)] border-transparent hover:text-[var(--text)] hover:bg-[var(--hover-bg)]"
            )}
          >
            <Robot size={14} weight={activeTab === 'providers' ? "fill" : "regular"} />
            Providers
          </button>
          <button
            onClick={() => setActiveTab('agents')}
            className={cn(
              "px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 -mb-px flex items-center gap-2",
              activeTab === 'agents'
                ? "text-[var(--text)] border-[var(--accent)] bg-[var(--hover-bg)]"
                : "text-[var(--text-muted)] border-transparent hover:text-[var(--text)] hover:bg-[var(--hover-bg)]"
            )}
          >
            <Robot size={14} weight={activeTab === 'agents' ? "fill" : "regular"} />
            Agents
          </button>
          <button
            onClick={() => setActiveTab('tools')}
            className={cn(
              "px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 -mb-px flex items-center gap-2",
              activeTab === 'tools'
                ? "text-[var(--text)] border-[var(--accent)] bg-[var(--hover-bg)]"
                : "text-[var(--text-muted)] border-transparent hover:text-[var(--text)] hover:bg-[var(--hover-bg)]"
            )}
          >
            <Wrench size={14} weight={activeTab === 'tools' ? "fill" : "regular"} />
            Tools
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={cn(
              "px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 -mb-px flex items-center gap-2",
              activeTab === 'system'
                ? "text-[var(--text)] border-[var(--accent)] bg-[var(--hover-bg)]"
                : "text-[var(--text-muted)] border-transparent hover:text-[var(--text)] hover:bg-[var(--hover-bg)]"
            )}
          >
            <GearSix size={14} weight={activeTab === 'system' ? "fill" : "regular"} />
            System
          </button>
        </div>

        <div className="flex-1 overflow-hidden bg-[var(--bg)] relative p-6">
          {activeTab === 'providers' && <ProvidersTab />}
          {activeTab === 'agents' && <AgentsTab />}
          
          {activeTab === 'tools' && (
            <div className="overflow-y-auto h-full space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text)] mb-3">MCP Servers</h3>
                <MCPServerManager />
              </div>
              <div className="border-t border-[var(--border)] pt-6">
                <h3 className="text-sm font-semibold text-[var(--text)] mb-3">Plugins</h3>
                <PluginManager />
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="overflow-y-auto h-full">
              <TokenDashboard />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

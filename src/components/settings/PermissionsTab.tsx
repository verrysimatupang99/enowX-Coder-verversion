import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { ShieldCheck, Lightning, Hand } from '@phosphor-icons/react';

type PermissionMode = 'ask' | 'auto' | 'manual';

interface PermissionSettings {
  permission_mode: PermissionMode;
}

export const PermissionsTab: React.FC = () => {
  const [mode, setMode] = useState<PermissionMode>('ask');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await invoke<PermissionSettings>('get_permission_settings');
      setMode(settings.permission_mode);
    } catch (error) {
      console.error('Failed to load permission settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = async (newMode: PermissionMode) => {
    setMode(newMode);
    try {
      await invoke('update_permission_mode', { mode: newMode });
    } catch (error) {
      console.error('Failed to update permission mode:', error);
    }
  };

  if (loading) {
    return <div className="text-[var(--text-muted)] text-sm">Loading...</div>;
  }

  const modes = [
    {
      id: 'ask' as PermissionMode,
      icon: Hand,
      title: 'Ask Every Time',
      description: 'Review and approve each tool execution individually',
      color: 'blue',
    },
    {
      id: 'auto' as PermissionMode,
      icon: Lightning,
      title: 'Auto-Approve',
      description: 'Automatically approve all tool executions',
      color: 'green',
    },
    {
      id: 'manual' as PermissionMode,
      icon: ShieldCheck,
      title: 'Manual Only',
      description: 'Block all automatic tool executions',
      color: 'orange',
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-[var(--text)] mb-1">Permission Mode</h3>
        <p className="text-xs text-[var(--text-muted)]">
          Control how agents request permission to execute tools
        </p>
      </div>

      <div className="space-y-3">
        {modes.map((modeOption) => {
          const Icon = modeOption.icon;
          const isSelected = mode === modeOption.id;

          return (
            <button
              key={modeOption.id}
              onClick={() => handleModeChange(modeOption.id)}
              className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                isSelected
                  ? `border-${modeOption.color}-500 bg-${modeOption.color}-500/10`
                  : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    isSelected
                      ? `bg-${modeOption.color}-500/20`
                      : 'bg-[var(--surface-2)]'
                  }`}
                >
                  <Icon
                    size={20}
                    weight={isSelected ? 'fill' : 'regular'}
                    className={
                      isSelected
                        ? `text-${modeOption.color}-500`
                        : 'text-[var(--text-muted)]'
                    }
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-[var(--text)]">
                      {modeOption.title}
                    </span>
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    {modeOption.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="p-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-muted)]">
        <p className="mb-2 font-semibold text-[var(--text)]">Current Mode: {mode}</p>
        <ul className="space-y-1 list-disc list-inside">
          {mode === 'ask' && (
            <>
              <li>Agent pauses before each tool execution</li>
              <li>You review and approve/deny each action</li>
              <li>Recommended for sensitive operations</li>
            </>
          )}
          {mode === 'auto' && (
            <>
              <li>Agent executes tools without waiting</li>
              <li>Faster workflow, less interruption</li>
              <li>Use with trusted agents only</li>
            </>
          )}
          {mode === 'manual' && (
            <>
              <li>All tool executions are blocked</li>
              <li>Agent can only provide suggestions</li>
              <li>Maximum safety, manual control</li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
};

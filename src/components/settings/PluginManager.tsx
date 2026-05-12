import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { Plus, Power, Package } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface Plugin {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  enabled: boolean;
  config?: string;
  installed_at: string;
}

export const PluginManager: React.FC = () => {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);

  const loadPlugins = async () => {
    try {
      const data = await invoke<Plugin[]>('list_plugins');
      setPlugins(data);
    } catch (error) {
      console.error('Failed to load plugins:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlugins();
  }, []);

  const handleToggle = async (plugin: Plugin) => {
    try {
      if (plugin.enabled) {
        await invoke('disable_plugin', { id: plugin.id });
      } else {
        await invoke('enable_plugin', { id: plugin.id });
      }
      await loadPlugins();
    } catch (error) {
      console.error('Failed to toggle plugin:', error);
    }
  };

  const handleInstall = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Plugin Directory',
      });

      if (selected) {
        await invoke('install_plugin', { path: selected });
        await loadPlugins();
      }
    } catch (error) {
      console.error('Failed to install plugin:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-[var(--text-muted)] text-sm">Loading plugins...</div>
      </div>
    );
  }

  return (
    <div className="flex gap-4 h-full">
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[var(--text)]">Installed Plugins</h3>
          <button
            onClick={handleInstall}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--accent)] text-white hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Plus size={14} weight="bold" />
            Install Plugin
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {plugins.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <Package size={48} className="text-[var(--text-muted)] mb-3" />
              <p className="text-sm text-[var(--text-muted)] mb-1">No plugins installed</p>
              <p className="text-xs text-[var(--text-muted)]">
                Install plugins to extend functionality
              </p>
            </div>
          ) : (
            plugins.map((plugin) => (
              <div
                key={plugin.id}
                onClick={() => setSelectedPlugin(plugin)}
                className={cn(
                  "p-3 rounded-lg border cursor-pointer transition-colors",
                  selectedPlugin?.id === plugin.id
                    ? "border-[var(--accent)] bg-[var(--hover-bg)]"
                    : "border-[var(--border)] hover:border-[var(--border-hover)] hover:bg-[var(--hover-bg)]"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium text-[var(--text)] truncate">
                        {plugin.name}
                      </h4>
                      <span className="text-xs text-[var(--text-muted)] shrink-0">
                        v{plugin.version}
                      </span>
                    </div>
                    {plugin.description && (
                      <p className="text-xs text-[var(--text-muted)] line-clamp-2">
                        {plugin.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggle(plugin);
                    }}
                    className={cn(
                      "p-1.5 rounded-lg transition-colors shrink-0",
                      plugin.enabled
                        ? "text-green-500 hover:bg-green-500/10"
                        : "text-[var(--text-muted)] hover:bg-[var(--hover-bg)]"
                    )}
                  >
                    <Power size={16} weight={plugin.enabled ? "fill" : "regular"} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedPlugin && (
        <div className="w-80 border-l border-[var(--border)] pl-4 flex flex-col">
          <h3 className="text-sm font-semibold text-[var(--text)] mb-4">Plugin Details</h3>
          
          <div className="flex-1 overflow-y-auto space-y-4">
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">
                Name
              </label>
              <p className="text-sm text-[var(--text)]">{selectedPlugin.name}</p>
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">
                Version
              </label>
              <p className="text-sm text-[var(--text)]">{selectedPlugin.version}</p>
            </div>

            {selectedPlugin.author && (
              <div>
                <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">
                  Author
                </label>
                <p className="text-sm text-[var(--text)]">{selectedPlugin.author}</p>
              </div>
            )}

            {selectedPlugin.description && (
              <div>
                <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">
                  Description
                </label>
                <p className="text-sm text-[var(--text)]">{selectedPlugin.description}</p>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">
                Status
              </label>
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    selectedPlugin.enabled ? "bg-green-500" : "bg-[var(--text-muted)]"
                  )}
                />
                <span className="text-sm text-[var(--text)]">
                  {selectedPlugin.enabled ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">
                Installed
              </label>
              <p className="text-sm text-[var(--text)]">
                {new Date(selectedPlugin.installed_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

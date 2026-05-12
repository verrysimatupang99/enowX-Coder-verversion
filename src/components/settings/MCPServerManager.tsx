import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Plus, Trash, Play, Stop, ArrowsClockwise } from '@phosphor-icons/react';

interface MCPServer {
  id: string;
  name: string;
  command: string;
  args: string;
  enabled: boolean;
  is_builtin: boolean;
  created_at: string;
}

export const MCPServerManager: React.FC = () => {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', command: '', args: '' });

  const loadServers = async () => {
    try {
      const data = await invoke<MCPServer[]>('list_mcp_servers');
      setServers(data);
    } catch (error) {
      console.error('Failed to load MCP servers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServers();
  }, []);

  const handleCreate = async () => {
    try {
      const args = formData.args ? JSON.parse(formData.args) : [];
      await invoke('create_mcp_server', {
        name: formData.name,
        command: formData.command,
        args,
      });
      setFormData({ name: '', command: '', args: '' });
      setShowForm(false);
      loadServers();
    } catch (error) {
      console.error('Failed to create MCP server:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await invoke('delete_mcp_server', { id });
      loadServers();
    } catch (error) {
      console.error('Failed to delete MCP server:', error);
    }
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      await invoke('toggle_mcp_server', { id, enabled: !enabled });
      loadServers();
    } catch (error) {
      console.error('Failed to toggle MCP server:', error);
    }
  };

  const handleStart = async (id: string) => {
    try {
      await invoke('start_mcp_server', { id });
    } catch (error) {
      console.error('Failed to start MCP server:', error);
    }
  };

  const handleStop = async (id: string) => {
    try {
      await invoke('stop_mcp_server', { id });
    } catch (error) {
      console.error('Failed to stop MCP server:', error);
    }
  };

  const handleRestart = async (id: string) => {
    try {
      await invoke('restart_mcp_server', { id });
    } catch (error) {
      console.error('Failed to restart MCP server:', error);
    }
  };

  if (loading) {
    return <div className="text-[var(--text-muted)] text-sm">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text)]">MCP Servers</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 text-xs font-medium bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5"
        >
          <Plus size={14} weight="bold" />
          Add Server
        </button>
      </div>

      {showForm && (
        <div className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg space-y-3">
          <input
            type="text"
            placeholder="Server name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 text-xs bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder:text-[var(--text-muted)]"
          />
          <input
            type="text"
            placeholder="Command (e.g., npx)"
            value={formData.command}
            onChange={(e) => setFormData({ ...formData, command: e.target.value })}
            className="w-full px-3 py-2 text-xs bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder:text-[var(--text-muted)]"
          />
          <input
            type="text"
            placeholder='Args (JSON array, e.g., ["-y", "@modelcontextprotocol/server-filesystem"])'
            value={formData.args}
            onChange={(e) => setFormData({ ...formData, args: e.target.value })}
            className="w-full px-3 py-2 text-xs bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder:text-[var(--text-muted)]"
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              className="px-3 py-1.5 text-xs font-medium bg-[var(--accent)] text-white rounded-lg hover:opacity-90"
            >
              Create
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 text-xs font-medium bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] rounded-lg hover:bg-[var(--hover-bg)]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {servers.map((server) => (
          <div
            key={server.id}
            className="p-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg flex items-center justify-between"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[var(--text)]">{server.name}</span>
                {server.is_builtin && (
                  <span className="px-2 py-0.5 text-xs rounded bg-blue-500/20 text-blue-400">
                    Built-in
                  </span>
                )}
                <span
                  className={`px-2 py-0.5 text-xs rounded ${
                    server.enabled
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-[var(--surface-3)] text-[var(--text-muted)]'
                  }`}
                >
                  {server.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="text-xs text-[var(--text-muted)] mt-1">
                {server.command} {JSON.parse(server.args).join(' ')}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleStart(server.id)}
                className="p-1.5 text-[var(--text-muted)] hover:text-green-400 hover:bg-[var(--hover-bg)] rounded transition-colors"
                title="Start"
              >
                <Play size={14} weight="fill" />
              </button>
              <button
                onClick={() => handleStop(server.id)}
                className="p-1.5 text-[var(--text-muted)] hover:text-red-400 hover:bg-[var(--hover-bg)] rounded transition-colors"
                title="Stop"
              >
                <Stop size={14} weight="fill" />
              </button>
              <button
                onClick={() => handleRestart(server.id)}
                className="p-1.5 text-[var(--text-muted)] hover:text-blue-400 hover:bg-[var(--hover-bg)] rounded transition-colors"
                title="Restart"
              >
                <ArrowsClockwise size={14} />
              </button>
              <button
                onClick={() => handleToggle(server.id, server.enabled)}
                className="px-2 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--hover-bg)] rounded transition-colors"
              >
                {server.enabled ? 'Disable' : 'Enable'}
              </button>
              {!server.is_builtin && (
                <button
                  onClick={() => handleDelete(server.id)}
                  className="p-1.5 text-[var(--text-muted)] hover:text-red-400 hover:bg-[var(--hover-bg)] rounded transition-colors"
                  title="Delete"
                >
                  <Trash size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
        {servers.length === 0 && (
          <div className="text-center py-8 text-[var(--text-muted)] text-sm">
            No MCP servers configured
          </div>
        )}
      </div>
    </div>
  );
};

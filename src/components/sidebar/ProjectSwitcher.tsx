import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { useProjectStore } from '@/stores/useProjectStore';
import { useSessionStore } from '@/stores/useSessionStore';
import { FolderOpen, CircleNotch, CaretDown } from '@phosphor-icons/react';
import { Project, Session } from '@/types';

export const ProjectSwitcher: React.FC = () => {
  const { projects, activeProjectId, addProject, setActiveProjectId } = useProjectStore();
  const { addSession, setActiveSessionId } = useSessionStore();
  const [loading, setLoading] = useState(false);

  const activeProject = projects.find((p) => p.id === activeProjectId);

  const handleOpenFolder = async () => {
    const selected = await open({ directory: true, multiple: false });
    if (!selected || typeof selected !== 'string') return;

    setLoading(true);
    try {
      const folderName = selected.split('/').filter(Boolean).pop() ?? selected;

      const project = await invoke<Project>('create_project', { name: folderName, path: selected });
      addProject(project);
      setActiveProjectId(project.id);

      const session = await invoke<Session>('create_session', { projectId: project.id, title: 'New Chat' });
      addSession(session);
      setActiveSessionId(session.id);
    } catch (error) {
      console.error('Failed to open folder:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSwitch = (projectId: string) => {
    setActiveProjectId(projectId);
  };

  return (
    <div className="px-3 py-2 space-y-2 border-b border-[var(--border)]">
      {/* Project Dropdown */}
      {projects.length > 0 && (
        <div className="relative">
          <select
            value={activeProjectId || ''}
            onChange={(e) => handleProjectSwitch(e.target.value)}
            className="w-full px-3 py-2 pr-8 text-xs bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-[var(--text)] appearance-none cursor-pointer hover:bg-[var(--surface-3)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <CaretDown 
            size={12} 
            weight="bold"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" 
          />
        </div>
      )}

      {/* Open Folder Button */}
      <button
        onClick={handleOpenFolder}
        disabled={loading}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--hover-bg)] transition-colors text-sm border border-dashed border-[var(--border)] hover:border-[var(--border-strong)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <CircleNotch size={15} className="animate-spin" />
        ) : (
          <FolderOpen size={15} />
        )}
        <span className="text-[13px]">{loading ? 'Opening…' : 'Open folder'}</span>
      </button>
    </div>
  );
};

import React from 'react';
import { Robot } from '@phosphor-icons/react';
import { useAgentStore } from '@/stores/useAgentStore';
import { AGENT_LABELS } from '@/types';
import { cn } from '@/lib/utils';

interface AgentSelectorProps {
  value: string | null;
  onChange: (agentType: string | null) => void;
}

export const AgentSelector: React.FC<AgentSelectorProps> = ({ value, onChange }) => {
  const { agentConfigs } = useAgentStore();

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-[var(--surface-2)]/50 border border-[var(--border)] rounded-lg">
      <Robot size={12} weight="duotone" className="text-[var(--text-muted)]" />
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
        className={cn(
          "text-xs bg-transparent border-none outline-none text-[var(--text)] cursor-pointer pr-1",
          "hover:text-[var(--accent)] transition-colors"
        )}
      >
        <option value="">Default</option>
        {agentConfigs.map((config) => (
          <option key={config.agentType} value={config.agentType}>
            {AGENT_LABELS[config.agentType] || config.agentType}
          </option>
        ))}
      </select>
    </div>
  );
};

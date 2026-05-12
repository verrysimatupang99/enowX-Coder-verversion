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
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg hover:border-[var(--accent)]/30 transition-colors">
      <Robot size={13} weight="duotone" className="text-[var(--accent)] flex-shrink-0" />
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
        className={cn(
          "text-[11px] font-medium bg-transparent border-none outline-none text-[var(--text)] cursor-pointer pr-1",
          "focus:text-[var(--accent)] transition-colors"
        )}
        style={{
          colorScheme: 'dark',
        }}
      >
        <option value="" className="bg-[var(--surface-2)] text-[var(--text)]">Default</option>
        {agentConfigs.map((config) => (
          <option key={config.agentType} value={config.agentType} className="bg-[var(--surface-2)] text-[var(--text)]">
            {AGENT_LABELS[config.agentType] || config.agentType}
          </option>
        ))}
      </select>
    </div>
  );
};

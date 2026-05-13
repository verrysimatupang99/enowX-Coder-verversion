import { Robot, CheckCircle, ArrowRight } from '@phosphor-icons/react';
import { useAgentStore } from '@/stores/useAgentStore';

interface OrchestratorTimelineProps {
  agentRunId: string;
}

export const OrchestratorTimeline = ({ agentRunId }: OrchestratorTimelineProps) => {
  const phase = useAgentStore((s) => s.orchestratorPhases[agentRunId]);
  const delegations = useAgentStore((s) => s.orchestratorDelegations[agentRunId] || []);
  const aggregate = useAgentStore((s) => s.orchestratorAggregates[agentRunId]);
  const decisions = useAgentStore((s) => s.orchestratorDecisions[agentRunId] || []);

  return (
    <div className="space-y-3 p-4 bg-[var(--surface-2)] rounded-lg border border-[var(--border)]">
      {/* Current Phase */}
      {phase && (
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <div>
            <div className="text-sm font-medium text-[var(--text)]">{phase.phase}</div>
            <div className="text-xs text-[var(--text-muted)]">{phase.description}</div>
          </div>
        </div>
      )}

      {/* Delegations */}
      {delegations.map((delegation, idx) => (
        <div key={idx} className="flex items-start gap-3 pl-5">
          <Robot size={16} className="text-purple-500 mt-0.5" weight="fill" />
          <div className="flex-1">
            <div className="text-sm font-medium text-[var(--text)]">
              Delegated to {delegation.targetAgent}
            </div>
            <div className="text-xs text-[var(--text-muted)]">{delegation.task}</div>
            <div className="text-xs text-[var(--text-tertiary)] italic">{delegation.reason}</div>
          </div>
        </div>
      ))}

      {/* Aggregate Status */}
      {aggregate && (
        <div className="flex items-start gap-3 pl-5">
          <ArrowRight size={16} className="text-teal-500 mt-0.5" weight="bold" />
          <div className="flex-1">
            <div className="text-sm font-medium text-[var(--text)]">
              {aggregate.synthesisStatus}
            </div>
            <div className="text-xs text-[var(--text-muted)]">
              Collected {aggregate.resultsCount} results
            </div>
          </div>
        </div>
      )}

      {/* Decisions */}
      {decisions.map((decision, idx) => (
        <div key={idx} className="flex items-start gap-3 pl-5">
          <CheckCircle size={16} className="text-green-500 mt-0.5" weight="fill" />
          <div className="flex-1">
            <div className="text-sm font-medium text-[var(--text)]">{decision.decision}</div>
            <div className="text-xs text-[var(--text-muted)]">{decision.reasoning}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

import { create } from 'zustand';
import { 
  AgentRunWithTools, 
  AgentConfig, 
  AgentType, 
  PermissionRequest,
  OrchestratorPhase,
  OrchestratorDelegation,
  OrchestratorAggregate,
  OrchestratorDecision
} from '@/types';

interface AgentState {
  agentRuns: AgentRunWithTools[];
  agentConfigs: AgentConfig[];
  selectedAgentType: AgentType;
  pendingPermission: PermissionRequest | null;

  // Orchestrator-specific state
  orchestratorPhases: Record<string, OrchestratorPhase>;
  orchestratorDelegations: Record<string, OrchestratorDelegation[]>;
  orchestratorAggregates: Record<string, OrchestratorAggregate>;
  orchestratorDecisions: Record<string, OrchestratorDecision[]>;

  setAgentRuns: (runs: AgentRunWithTools[]) => void;
  addAgentRun: (run: AgentRunWithTools) => void;
  updateAgentRun: (id: string, patch: Partial<AgentRunWithTools>) => void;
  appendAgentToken: (id: string, token: string) => void;
  flushThinkingBlock: (id: string) => void;
  clearAgentStreaming: (id: string) => void;

  setAgentConfigs: (configs: AgentConfig[]) => void;
  upsertAgentConfig: (config: AgentConfig) => void;

  setSelectedAgentType: (type: AgentType) => void;
  setPendingPermission: (req: PermissionRequest | null) => void;

  // Orchestrator actions
  setOrchestratorPhase: (agentRunId: string, phase: OrchestratorPhase) => void;
  addOrchestratorDelegation: (agentRunId: string, delegation: OrchestratorDelegation) => void;
  setOrchestratorAggregate: (agentRunId: string, aggregate: OrchestratorAggregate) => void;
  addOrchestratorDecision: (agentRunId: string, decision: OrchestratorDecision) => void;
}

export const useAgentStore = create<AgentState>((set) => ({
  agentRuns: [],
  agentConfigs: [],
  selectedAgentType: 'chat',
  pendingPermission: null,

  // Orchestrator state
  orchestratorPhases: {},
  orchestratorDelegations: {},
  orchestratorAggregates: {},
  orchestratorDecisions: {},

  setAgentRuns: (runs) => set({ agentRuns: runs }),
  addAgentRun: (run) => set((state) => ({ agentRuns: [...state.agentRuns, run] })),
  updateAgentRun: (id, patch) =>
    set((state) => ({
      agentRuns: state.agentRuns.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    })),
  appendAgentToken: (id, token) =>
    set((state) => ({
      agentRuns: state.agentRuns.map((r) =>
        r.id === id ? { ...r, streamingText: r.streamingText + token } : r,
      ),
    })),
  flushThinkingBlock: (id) =>
    set((state) => ({
      agentRuns: state.agentRuns.map((r) => {
        if (r.id !== id) return r;
        const text = r.streamingText.trim();
        if (!text) return r;
        return {
          ...r,
          thinkingBlocks: [...r.thinkingBlocks, text],
          streamingText: '',
        };
      }),
    })),
  clearAgentStreaming: (id) =>
    set((state) => ({
      agentRuns: state.agentRuns.map((r) =>
        r.id === id ? { ...r, streamingText: '' } : r,
      ),
    })),

  setAgentConfigs: (configs) => set({ agentConfigs: configs }),
  upsertAgentConfig: (config) =>
    set((state) => {
      const exists = state.agentConfigs.some((c) => c.agentType === config.agentType);
      return {
        agentConfigs: exists
          ? state.agentConfigs.map((c) => (c.agentType === config.agentType ? config : c))
          : [...state.agentConfigs, config],
      };
    }),

  setSelectedAgentType: (type) => set({ selectedAgentType: type }),
  setPendingPermission: (req) => set({ pendingPermission: req }),

  // Orchestrator actions
  setOrchestratorPhase: (agentRunId, phase) =>
    set((state) => ({
      orchestratorPhases: { ...state.orchestratorPhases, [agentRunId]: phase },
    })),
  addOrchestratorDelegation: (agentRunId, delegation) =>
    set((state) => ({
      orchestratorDelegations: {
        ...state.orchestratorDelegations,
        [agentRunId]: [...(state.orchestratorDelegations[agentRunId] || []), delegation],
      },
    })),
  setOrchestratorAggregate: (agentRunId, aggregate) =>
    set((state) => ({
      orchestratorAggregates: { ...state.orchestratorAggregates, [agentRunId]: aggregate },
    })),
  addOrchestratorDecision: (agentRunId, decision) =>
    set((state) => ({
      orchestratorDecisions: {
        ...state.orchestratorDecisions,
        [agentRunId]: [...(state.orchestratorDecisions[agentRunId] || []), decision],
      },
    })),
}));

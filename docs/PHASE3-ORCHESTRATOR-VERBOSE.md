# Phase 3: Orchestrator Verbose Logging System

**Goal:** Show real-time orchestrator reasoning, agent transitions, and progress updates in the UI.

---

## Design Overview

### Current Event System
```rust
// src-tauri/src/agents/runner.rs
agent-started       → { agent_run_id, agent_type, parent_agent_run_id }
agent-token         → { agent_run_id, token }
agent-tool-call     → { tool_call_id, agent_run_id, tool_name, input }
agent-tool-result   → { tool_call_id, output, is_error }
agent-done          → { agent_run_id, output }
agent-error         → { agent_run_id, error }
```

### New Events for Orchestrator Verbose Mode
```rust
// Orchestrator-specific events
orchestrator-phase       → { agent_run_id, phase, description }
orchestrator-delegate    → { agent_run_id, target_agent, task, reason }
orchestrator-aggregate   → { agent_run_id, results_count, synthesis_status }
orchestrator-decision    → { agent_run_id, decision, reasoning }
```

---

## Event Definitions

### 1. orchestrator-phase
**When:** Orchestrator transitions between phases (analyze → plan → delegate → aggregate → synthesize)

```rust
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct OrchestratorPhaseEvent {
    agent_run_id: String,
    phase: String,  // "analyzing", "planning", "delegating", "aggregating", "synthesizing"
    description: String,  // Human-readable description
    timestamp: String,
}
```

**Example:**
```json
{
  "agentRunId": "abc123",
  "phase": "analyzing",
  "description": "Analyzing user request and project context",
  "timestamp": "2026-05-13T10:15:30Z"
}
```

### 2. orchestrator-delegate
**When:** Orchestrator spawns a sub-agent

```rust
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct OrchestratorDelegateEvent {
    agent_run_id: String,
    target_agent: String,  // "planner", "coder", "researcher"
    task: String,  // Task description
    reason: String,  // Why this agent was chosen
    sub_agent_run_id: String,  // ID of spawned agent
    timestamp: String,
}
```

**Example:**
```json
{
  "agentRunId": "abc123",
  "targetAgent": "planner",
  "task": "Create implementation plan for user authentication",
  "reason": "User request requires strategic planning before implementation",
  "subAgentRunId": "def456",
  "timestamp": "2026-05-13T10:15:35Z"
}
```

### 3. orchestrator-aggregate
**When:** Orchestrator collects sub-agent results

```rust
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct OrchestratorAggregateEvent {
    agent_run_id: String,
    results_count: usize,
    synthesis_status: String,  // "collecting", "validating", "synthesizing"
    timestamp: String,
}
```

### 4. orchestrator-decision
**When:** Orchestrator makes a decision (retry, skip, proceed)

```rust
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct OrchestratorDecisionEvent {
    agent_run_id: String,
    decision: String,  // "retry", "skip", "proceed", "abort"
    reasoning: String,
    timestamp: String,
}
```

---

## Implementation Plan

### Backend Changes

#### 1. Add Event Structs (runner.rs)
```rust
// src-tauri/src/agents/runner.rs

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct OrchestratorPhaseEvent {
    agent_run_id: String,
    phase: String,
    description: String,
    timestamp: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct OrchestratorDelegateEvent {
    agent_run_id: String,
    target_agent: String,
    task: String,
    reason: String,
    sub_agent_run_id: String,
    timestamp: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct OrchestratorAggregateEvent {
    agent_run_id: String,
    results_count: usize,
    synthesis_status: String,
    timestamp: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct OrchestratorDecisionEvent {
    agent_run_id: String,
    decision: String,
    reasoning: String,
    timestamp: String,
}
```

#### 2. Add Helper Methods (runner.rs)
```rust
impl AgentRunner {
    fn emit_orchestrator_phase(&self, agent_run_id: &str, phase: &str, description: &str) {
        let _ = self.app_handle.emit(
            "orchestrator-phase",
            OrchestratorPhaseEvent {
                agent_run_id: agent_run_id.to_string(),
                phase: phase.to_string(),
                description: description.to_string(),
                timestamp: now_rfc3339(),
            },
        );
    }

    fn emit_orchestrator_delegate(
        &self,
        agent_run_id: &str,
        target_agent: &str,
        task: &str,
        reason: &str,
        sub_agent_run_id: &str,
    ) {
        let _ = self.app_handle.emit(
            "orchestrator-delegate",
            OrchestratorDelegateEvent {
                agent_run_id: agent_run_id.to_string(),
                target_agent: target_agent.to_string(),
                task: task.to_string(),
                reason: reason.to_string(),
                sub_agent_run_id: sub_agent_run_id.to_string(),
                timestamp: now_rfc3339(),
            },
        );
    }

    fn emit_orchestrator_aggregate(
        &self,
        agent_run_id: &str,
        results_count: usize,
        synthesis_status: &str,
    ) {
        let _ = self.app_handle.emit(
            "orchestrator-aggregate",
            OrchestratorAggregateEvent {
                agent_run_id: agent_run_id.to_string(),
                results_count,
                synthesis_status: synthesis_status.to_string(),
                timestamp: now_rfc3339(),
            },
        );
    }

    fn emit_orchestrator_decision(&self, agent_run_id: &str, decision: &str, reasoning: &str) {
        let _ = self.app_handle.emit(
            "orchestrator-decision",
            OrchestratorDecisionEvent {
                agent_run_id: agent_run_id.to_string(),
                decision: decision.to_string(),
                reasoning: reasoning.to_string(),
                timestamp: now_rfc3339(),
            },
        );
    }
}
```

#### 3. Integrate into Orchestrator Logic (runner.rs)
```rust
async fn execute_agent(&self, agent_run_id: &str, ctx: AgentContext, token_sink: &S) -> AppResult<String> {
    // ... existing code ...

    if ctx.agent_type == "orchestrator" {
        // Phase 1: Analyze
        self.emit_orchestrator_phase(agent_run_id, "analyzing", "Analyzing user request and project context");
        
        // Phase 2: Plan
        self.emit_orchestrator_phase(agent_run_id, "planning", "Creating execution plan");
        
        // Phase 3: Delegate (will be implemented in step 2)
        self.emit_orchestrator_phase(agent_run_id, "delegating", "Spawning specialized agents");
        
        // Phase 4: Aggregate
        self.emit_orchestrator_phase(agent_run_id, "aggregating", "Collecting and validating results");
        
        // Phase 5: Synthesize
        self.emit_orchestrator_phase(agent_run_id, "synthesizing", "Creating final response");
    }

    // ... existing ReAct loop ...
}
```

---

### Frontend Changes

#### 1. Add Event Listeners (AppShell.tsx)
```tsx
// src/components/layout/AppShell.tsx

useEffect(() => {
  const unlistenPhase = listen<OrchestratorPhaseEvent>('orchestrator-phase', (event) => {
    const { agentRunId, phase, description, timestamp } = event.payload;
    
    // Update agent run with phase info
    updateAgentRun(agentRunId, {
      orchestratorPhase: phase,
      orchestratorDescription: description,
    });
  });

  const unlistenDelegate = listen<OrchestratorDelegateEvent>('orchestrator-delegate', (event) => {
    const { agentRunId, targetAgent, task, reason, subAgentRunId } = event.payload;
    
    // Add delegation log
    addAgentDelegation(agentRunId, {
      targetAgent,
      task,
      reason,
      subAgentRunId,
    });
  });

  const unlistenAggregate = listen<OrchestratorAggregateEvent>('orchestrator-aggregate', (event) => {
    const { agentRunId, resultsCount, synthesisStatus } = event.payload;
    
    updateAgentRun(agentRunId, {
      aggregateStatus: synthesisStatus,
      resultsCount,
    });
  });

  const unlistenDecision = listen<OrchestratorDecisionEvent>('orchestrator-decision', (event) => {
    const { agentRunId, decision, reasoning } = event.payload;
    
    addAgentDecision(agentRunId, { decision, reasoning });
  });

  return () => {
    unlistenPhase.then(fn => fn());
    unlistenDelegate.then(fn => fn());
    unlistenAggregate.then(fn => fn());
    unlistenDecision.then(fn => fn());
  };
}, []);
```

#### 2. Update Agent Store (useAgentStore.ts)
```tsx
// src/stores/useAgentStore.ts

interface AgentState {
  // ... existing fields ...
  
  // Orchestrator-specific state
  orchestratorPhases: Record<string, OrchestratorPhase>;
  orchestratorDelegations: Record<string, OrchestratorDelegation[]>;
  orchestratorDecisions: Record<string, OrchestratorDecision[]>;
  
  // Actions
  setOrchestratorPhase: (agentRunId: string, phase: OrchestratorPhase) => void;
  addOrchestratorDelegation: (agentRunId: string, delegation: OrchestratorDelegation) => void;
  addOrchestratorDecision: (agentRunId: string, decision: OrchestratorDecision) => void;
}

interface OrchestratorPhase {
  phase: string;
  description: string;
  timestamp: string;
}

interface OrchestratorDelegation {
  targetAgent: string;
  task: string;
  reason: string;
  subAgentRunId: string;
  timestamp: string;
}

interface OrchestratorDecision {
  decision: string;
  reasoning: string;
  timestamp: string;
}
```

#### 3. Create Orchestrator Timeline Component
```tsx
// src/components/chat/OrchestratorTimeline.tsx

export const OrchestratorTimeline = ({ agentRunId }: { agentRunId: string }) => {
  const phase = useAgentStore(s => s.orchestratorPhases[agentRunId]);
  const delegations = useAgentStore(s => s.orchestratorDelegations[agentRunId] || []);
  const decisions = useAgentStore(s => s.orchestratorDecisions[agentRunId] || []);

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
          <Robot size={16} className="text-purple-500 mt-0.5" />
          <div className="flex-1">
            <div className="text-sm font-medium text-[var(--text)]">
              Delegated to {delegation.targetAgent}
            </div>
            <div className="text-xs text-[var(--text-muted)]">{delegation.task}</div>
            <div className="text-xs text-[var(--text-tertiary)] italic">{delegation.reason}</div>
          </div>
        </div>
      ))}

      {/* Decisions */}
      {decisions.map((decision, idx) => (
        <div key={idx} className="flex items-start gap-3 pl-5">
          <CheckCircle size={16} className="text-green-500 mt-0.5" />
          <div className="flex-1">
            <div className="text-sm font-medium text-[var(--text)]">{decision.decision}</div>
            <div className="text-xs text-[var(--text-muted)]">{decision.reasoning}</div>
          </div>
        </div>
      ))}
    </div>
  );
};
```

#### 4. Integrate into AgentRunCard
```tsx
// src/components/chat/AgentRunCard.tsx

export const AgentRunCard = ({ run }: { run: AgentRunWithTools }) => {
  const isOrchestrator = run.agentType === 'orchestrator';

  return (
    <div className="space-y-3">
      {/* Existing agent run UI */}
      
      {/* Orchestrator Timeline (only for orchestrator) */}
      {isOrchestrator && <OrchestratorTimeline agentRunId={run.id} />}
      
      {/* Existing tool calls, thinking blocks, etc. */}
    </div>
  );
};
```

---

## UI Mockup

```
┌─────────────────────────────────────────────────────────────┐
│ 🤖 Orchestrator                                             │
├─────────────────────────────────────────────────────────────┤
│ ● analyzing                                                 │
│   Analyzing user request and project context                │
│                                                             │
│   🤖 Delegated to planner                                   │
│      Create implementation plan for user authentication     │
│      User request requires strategic planning first         │
│                                                             │
│   ✓ proceed                                                 │
│      Planner output validated, proceeding to implementation │
│                                                             │
│   🤖 Delegated to coder                                     │
│      Implement authentication service based on plan         │
│      Plan approved, ready for code implementation           │
│                                                             │
│ ● synthesizing                                              │
│   Creating final response from 2 sub-agent results          │
└─────────────────────────────────────────────────────────────┘
```

---

## Benefits

1. **Transparency:** User sees orchestrator reasoning in real-time
2. **Debugging:** Easier to diagnose orchestrator failures
3. **Trust:** User understands why certain agents were chosen
4. **Progress:** Clear indication of multi-step progress
5. **Education:** User learns how orchestrator works

---

## Testing Plan

1. **Unit Test:** Event emission in runner.rs
2. **Integration Test:** Frontend receives and displays events
3. **E2E Test:** Full orchestrator flow with verbose logging
4. **Manual Test:** User experience with real tasks

---

## Next Steps

After implementing verbose logging:
1. **Phase 3.2:** Agent chaining workflow (orchestrator → planner → coder)
2. **Phase 3.3:** Sub-agent spawning mechanism (actual delegation API)

---

## Files to Modify

**Backend:**
- `src-tauri/src/agents/runner.rs` (add events, helper methods, integrate into orchestrator logic)

**Frontend:**
- `src/stores/useAgentStore.ts` (add orchestrator state)
- `src/components/layout/AppShell.tsx` (add event listeners)
- `src/components/chat/OrchestratorTimeline.tsx` (new component)
- `src/components/chat/AgentRunCard.tsx` (integrate timeline)
- `src/types/index.ts` (add orchestrator types)

---

**Status:** Design complete. Ready for implementation.

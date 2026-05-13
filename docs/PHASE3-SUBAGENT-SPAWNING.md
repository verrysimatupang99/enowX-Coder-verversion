# Phase 3: Sub-Agent Spawning Mechanism

**Goal:** Enable orchestrator to spawn and manage specialized sub-agents (planner, coder, researcher) with proper lifecycle management.

---

## Design Overview

### Current Architecture
```rust
// src-tauri/src/agents/runner.rs

pub async fn run(&self, params: RunAgentParams) -> AppResult<String> {
    // Single agent execution
    // No sub-agent support
}
```

### Target Architecture
```rust
pub async fn run(&self, params: RunAgentParams) -> AppResult<String> {
    // Top-level agent execution
}

pub async fn spawn_sub_agent(&self, params: SpawnSubAgentParams) -> AppResult<SubAgentResult> {
    // Sub-agent execution with parent tracking
}
```

---

## Key Requirements

1. **Parent-Child Relationship:** Sub-agents must track parent agent run ID
2. **Isolated Context:** Each sub-agent has its own conversation history
3. **Result Aggregation:** Parent agent collects sub-agent outputs
4. **Error Propagation:** Sub-agent failures bubble up to parent
5. **Cancellation:** Cancelling parent cancels all sub-agents
6. **No Infinite Recursion:** Sub-agents cannot spawn their own sub-agents (depth limit)

---

## Data Structures

### SpawnSubAgentParams
```rust
#[derive(Debug, Clone)]
pub struct SpawnSubAgentParams {
    pub parent_agent_run_id: String,
    pub session_id: String,
    pub agent_type: String,  // "planner", "coder", "researcher"
    pub task: String,
    pub project_path: String,
    pub provider_id: Option<String>,
    pub model_id: Option<String>,
    pub context: Option<String>,  // Additional context from parent
}
```

### SubAgentResult
```rust
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SubAgentResult {
    pub agent_run_id: String,
    pub agent_type: String,
    pub output: String,
    pub is_error: bool,
    pub duration_ms: u64,
    pub tool_calls_count: usize,
}
```

---

## Implementation

### 1. Add spawn_sub_agent Method (runner.rs)

```rust
impl AgentRunner {
    /// Spawn a sub-agent from an orchestrator
    /// 
    /// Sub-agents:
    /// - Have their own agent_run record with parent_agent_run_id set
    /// - Execute in isolated context (no shared conversation history)
    /// - Cannot spawn their own sub-agents (depth limit = 1)
    /// - Results are returned to parent for aggregation
    pub async fn spawn_sub_agent(&self, params: SpawnSubAgentParams) -> AppResult<SubAgentResult> {
        let start_time = std::time::Instant::now();

        // Validate agent type (only leaf agents allowed as sub-agents)
        if !Self::is_leaf_agent(&params.agent_type) {
            return Err(AppError::Validation(format!(
                "Agent type '{}' cannot be spawned as sub-agent. Only planner, coder, researcher allowed.",
                params.agent_type
            )));
        }

        // Create sub-agent context
        let token_sink = NoopTokenSink;  // Sub-agents don't stream to UI
        let ctx = InternalRunContext::new(
            &params.session_id,
            &params.agent_type,
            &params.task,
            &params.project_path,
            params.provider_id.as_deref(),
            params.model_id.as_deref(),
            Some(&params.parent_agent_run_id),
            false,  // flux_enabled = false for sub-agents
        );

        // Execute sub-agent
        let result = self.run_internal(&ctx, &token_sink).await;

        let duration_ms = start_time.elapsed().as_millis() as u64;

        // Count tool calls
        let tool_calls_count = self.count_tool_calls(&ctx.session_id).await?;

        match result {
            Ok(output) => Ok(SubAgentResult {
                agent_run_id: ctx.session_id.to_string(),  // TODO: get actual agent_run_id
                agent_type: params.agent_type,
                output,
                is_error: false,
                duration_ms,
                tool_calls_count,
            }),
            Err(e) => Ok(SubAgentResult {
                agent_run_id: ctx.session_id.to_string(),
                agent_type: params.agent_type,
                output: e.to_string(),
                is_error: true,
                duration_ms,
                tool_calls_count,
            }),
        }
    }

    /// Check if agent type is a leaf agent (can be spawned as sub-agent)
    fn is_leaf_agent(agent_type: &str) -> bool {
        matches!(agent_type, "planner" | "coder" | "researcher")
    }

    /// Count tool calls for a session
    async fn count_tool_calls(&self, session_id: &str) -> AppResult<usize> {
        let count: (i64,) = sqlx::query_as(
            "SELECT COUNT(*) FROM tool_calls WHERE agent_run_id IN \
             (SELECT id FROM agent_runs WHERE session_id = ?1)"
        )
        .bind(session_id)
        .fetch_one(&self.db)
        .await?;

        Ok(count.0 as usize)
    }
}
```

### 2. Update execute_agent for Orchestrator (runner.rs)

```rust
async fn execute_agent<S: TokenSink + Sync>(
    &self,
    agent_run_id: &str,
    ctx: &InternalRunContext<'_>,
    token_sink: &S,
) -> AppResult<String> {
    // Check if orchestrator
    if ctx.agent_type == "orchestrator" {
        return self.execute_orchestrator(agent_run_id, ctx, token_sink).await;
    }

    // ... existing single-agent logic ...
}

async fn execute_orchestrator<S: TokenSink + Sync>(
    &self,
    agent_run_id: &str,
    ctx: &InternalRunContext<'_>,
    token_sink: &S,
) -> AppResult<String> {
    // Phase 1: Analyze
    self.emit_orchestrator_phase(agent_run_id, "analyzing", "Analyzing user request");
    let analysis = self.analyze_request(ctx.task, ctx.project_path);

    // Phase 2: Plan
    self.emit_orchestrator_phase(agent_run_id, "planning", "Creating execution plan");
    let plan = self.create_execution_plan(analysis);

    // Phase 3: Delegate (spawn sub-agents)
    self.emit_orchestrator_phase(agent_run_id, "delegating", "Spawning specialized agents");
    let mut results = vec![];

    for step in plan.steps {
        // Emit delegation event
        let sub_agent_run_id = format!("{}-{}", agent_run_id, step.step_number);
        self.emit_orchestrator_delegate(
            agent_run_id,
            &step.agent_type,
            &step.task,
            &step.reasoning,
            &sub_agent_run_id,
        );

        // Spawn sub-agent
        let sub_result = self.spawn_sub_agent(SpawnSubAgentParams {
            parent_agent_run_id: agent_run_id.to_string(),
            session_id: ctx.session_id.to_string(),
            agent_type: step.agent_type.clone(),
            task: step.task.clone(),
            project_path: ctx.project_path.to_string(),
            provider_id: ctx.provider_id.map(String::from),
            model_id: ctx.model_id.map(String::from),
            context: None,
        }).await?;

        // Check for errors
        if sub_result.is_error {
            self.emit_orchestrator_decision(
                agent_run_id,
                "retry",
                &format!("Step {} failed: {}", step.step_number, sub_result.output),
            );

            // Retry once
            let retry_result = self.spawn_sub_agent(SpawnSubAgentParams {
                parent_agent_run_id: agent_run_id.to_string(),
                session_id: ctx.session_id.to_string(),
                agent_type: step.agent_type.clone(),
                task: format!("{} (retry)", step.task),
                project_path: ctx.project_path.to_string(),
                provider_id: ctx.provider_id.map(String::from),
                model_id: ctx.model_id.map(String::from),
                context: Some(format!("Previous attempt failed: {}", sub_result.output)),
            }).await?;

            if retry_result.is_error {
                return Err(AppError::Agent(format!(
                    "Step {} failed after retry: {}",
                    step.step_number,
                    retry_result.output
                )));
            }

            results.push(retry_result);
        } else {
            results.push(sub_result);
        }
    }

    // Phase 4: Aggregate
    self.emit_orchestrator_phase(agent_run_id, "aggregating", "Validating results");
    self.emit_orchestrator_aggregate(agent_run_id, results.len(), "validating");

    // Phase 5: Synthesize
    self.emit_orchestrator_phase(agent_run_id, "synthesizing", "Creating final response");
    let final_output = self.synthesize_results(results);

    Ok(final_output)
}

fn synthesize_results(&self, results: Vec<SubAgentResult>) -> String {
    let mut synthesis = String::new();
    synthesis.push_str("# Orchestrator Execution Summary\n\n");

    for (idx, result) in results.iter().enumerate() {
        synthesis.push_str(&format!(
            "## Step {}: {} ({}ms)\n",
            idx + 1,
            result.agent_type,
            result.duration_ms
        ));
        synthesis.push_str(&format!("{}\n\n", result.output));
    }

    synthesis.push_str("# Validation\n");
    synthesis.push_str(&format!("All {} steps completed successfully.\n", results.len()));

    synthesis
}
```

### 3. Add Helper Methods for Analysis & Planning

```rust
impl AgentRunner {
    fn analyze_request(&self, task: &str, project_path: &str) -> AnalysisResult {
        let task_lower = task.to_lowercase();

        let task_type = if task_lower.contains("plan") && !task_lower.contains("implement") {
            TaskType::Planning
        } else if task_lower.contains("implement") || task_lower.contains("build") || task_lower.contains("create") {
            TaskType::Implementation
        } else if task_lower.contains("fix") || task_lower.contains("bug") {
            TaskType::BugFix
        } else if task_lower.contains("research") || task_lower.contains("find") {
            TaskType::Research
        } else {
            TaskType::General
        };

        let agent_chain = match task_type {
            TaskType::Planning => vec!["planner".to_string()],
            TaskType::Implementation => vec!["planner".to_string(), "coder".to_string()],
            TaskType::BugFix => vec!["coder".to_string()],
            TaskType::Research => vec!["researcher".to_string()],
            TaskType::General => vec![],  // orchestrator handles directly
        };

        AnalysisResult {
            task_type,
            agent_chain,
            reasoning: format!("Detected {:?} task, will use: {:?}", task_type, agent_chain),
        }
    }

    fn create_execution_plan(&self, analysis: AnalysisResult) -> ExecutionPlan {
        let mut steps = vec![];

        for (idx, agent_type) in analysis.agent_chain.iter().enumerate() {
            let task_description = match agent_type.as_str() {
                "planner" => format!("Create implementation plan for: {}", analysis.reasoning),
                "coder" => "Implement the plan".to_string(),
                "researcher" => format!("Research: {}", analysis.reasoning),
                _ => format!("Execute step {}", idx + 1),
            };

            steps.push(ExecutionStep {
                step_number: idx + 1,
                agent_type: agent_type.clone(),
                task: task_description,
                reasoning: format!("Step {} in {:?} workflow", idx + 1, analysis.task_type),
                depends_on: if idx > 0 { Some(idx) } else { None },
            });
        }

        ExecutionPlan {
            steps,
            total_steps: analysis.agent_chain.len(),
        }
    }
}

#[derive(Debug, Clone)]
struct AnalysisResult {
    task_type: TaskType,
    agent_chain: Vec<String>,
    reasoning: String,
}

#[derive(Debug, Clone, PartialEq)]
enum TaskType {
    Planning,
    Implementation,
    BugFix,
    Research,
    General,
}

#[derive(Debug, Clone)]
struct ExecutionPlan {
    steps: Vec<ExecutionStep>,
    total_steps: usize,
}

#[derive(Debug, Clone)]
struct ExecutionStep {
    step_number: usize,
    agent_type: String,
    task: String,
    reasoning: String,
    depends_on: Option<usize>,
}
```

---

## Database Schema (Already Exists)

```sql
-- agent_runs table already has parent_agent_run_id column
CREATE TABLE agent_runs (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  agent_type TEXT NOT NULL,
  status TEXT NOT NULL,
  input TEXT,
  output TEXT,
  error TEXT,
  started_at TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL,
  parent_agent_run_id TEXT,  -- ✅ Already exists
  project_path TEXT,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);
```

---

## Frontend Integration

### 1. Update Types (types/index.ts)

```typescript
export interface SubAgentResult {
  agentRunId: string;
  agentType: string;
  output: string;
  isError: boolean;
  durationMs: number;
  toolCallsCount: number;
}

export interface OrchestratorDelegation {
  targetAgent: string;
  task: string;
  reason: string;
  subAgentRunId: string;
  timestamp: string;
  result?: SubAgentResult;  // Populated when sub-agent completes
}
```

### 2. Update Agent Store (useAgentStore.ts)

```typescript
interface AgentState {
  // ... existing fields ...
  
  // Sub-agent tracking
  subAgentResults: Record<string, SubAgentResult[]>;  // parent_run_id → results
  
  addSubAgentResult: (parentRunId: string, result: SubAgentResult) => void;
}

export const useAgentStore = create<AgentState>((set) => ({
  // ... existing state ...
  
  subAgentResults: {},
  
  addSubAgentResult: (parentRunId, result) =>
    set((state) => ({
      subAgentResults: {
        ...state.subAgentResults,
        [parentRunId]: [...(state.subAgentResults[parentRunId] || []), result],
      },
    })),
}));
```

### 3. Listen for Sub-Agent Completion (AppShell.tsx)

```typescript
useEffect(() => {
  const unlistenAgentDone = listen<AgentDoneEvent>('agent-done', (event) => {
    const { agentRunId, output } = event.payload;
    
    // Check if this is a sub-agent (has parent_agent_run_id)
    const agentRun = agentRuns.find(r => r.id === agentRunId);
    if (agentRun?.parentAgentRunId) {
      // Sub-agent completed, add result to parent
      addSubAgentResult(agentRun.parentAgentRunId, {
        agentRunId,
        agentType: agentRun.agentType,
        output,
        isError: false,
        durationMs: 0,  // TODO: calculate from timestamps
        toolCallsCount: agentRun.toolCalls.length,
      });
    }
  });

  return () => {
    unlistenAgentDone.then(fn => fn());
  };
}, [agentRuns]);
```

### 4. Display Sub-Agent Results (OrchestratorTimeline.tsx)

```typescript
export const OrchestratorTimeline = ({ agentRunId }: { agentRunId: string }) => {
  const delegations = useAgentStore(s => s.orchestratorDelegations[agentRunId] || []);
  const subResults = useAgentStore(s => s.subAgentResults[agentRunId] || []);

  return (
    <div className="space-y-3">
      {delegations.map((delegation, idx) => {
        const result = subResults.find(r => r.agentRunId === delegation.subAgentRunId);
        
        return (
          <div key={idx} className="border-l-2 border-purple-500 pl-4">
            <div className="flex items-center gap-2">
              <Robot size={16} />
              <span className="font-medium">{delegation.targetAgent}</span>
              {result && (
                <span className="text-xs text-green-500">
                  ✓ {result.durationMs}ms
                </span>
              )}
            </div>
            <div className="text-sm text-[var(--text-muted)]">{delegation.task}</div>
            {result && (
              <div className="mt-2 p-2 bg-[var(--surface-3)] rounded text-xs">
                {result.output.substring(0, 200)}...
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
```

---

## Error Handling

### 1. Depth Limit Enforcement
```rust
impl AgentRunner {
    fn validate_spawn_depth(&self, parent_agent_run_id: &str) -> AppResult<()> {
        // Check if parent is already a sub-agent
        let parent_run = sqlx::query_as::<_, AgentRun>(
            "SELECT * FROM agent_runs WHERE id = ?1"
        )
        .bind(parent_agent_run_id)
        .fetch_one(&self.db)
        .await?;

        if parent_run.parent_agent_run_id.is_some() {
            return Err(AppError::Validation(
                "Cannot spawn sub-agent from sub-agent (max depth = 1)".to_string()
            ));
        }

        Ok(())
    }
}
```

### 2. Cancellation Propagation
```rust
impl AgentRunner {
    pub async fn cancel_agent(&self, agent_run_id: &str) -> AppResult<()> {
        // Cancel main agent
        self.cancel_token.cancel();

        // Cancel all sub-agents
        let sub_agents = sqlx::query_as::<_, AgentRun>(
            "SELECT * FROM agent_runs WHERE parent_agent_run_id = ?1 AND status = 'running'"
        )
        .bind(agent_run_id)
        .fetch_all(&self.db)
        .await?;

        for sub_agent in sub_agents {
            // TODO: Cancel sub-agent token
            sqlx::query("UPDATE agent_runs SET status = 'cancelled' WHERE id = ?1")
                .bind(&sub_agent.id)
                .execute(&self.db)
                .await?;
        }

        Ok(())
    }
}
```

---

## Testing Plan

### Unit Tests
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_leaf_agent() {
        assert!(AgentRunner::is_leaf_agent("planner"));
        assert!(AgentRunner::is_leaf_agent("coder"));
        assert!(AgentRunner::is_leaf_agent("researcher"));
        assert!(!AgentRunner::is_leaf_agent("orchestrator"));
        assert!(!AgentRunner::is_leaf_agent("chat"));
    }

    #[tokio::test]
    async fn test_spawn_sub_agent() {
        let runner = create_test_runner();
        let params = SpawnSubAgentParams {
            parent_agent_run_id: "parent-123".into(),
            session_id: "session-456".into(),
            agent_type: "planner".into(),
            task: "Create plan".into(),
            project_path: "/test".into(),
            provider_id: None,
            model_id: None,
            context: None,
        };

        let result = runner.spawn_sub_agent(params).await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap().agent_type, "planner");
    }

    #[tokio::test]
    async fn test_spawn_orchestrator_as_sub_agent_fails() {
        let runner = create_test_runner();
        let params = SpawnSubAgentParams {
            parent_agent_run_id: "parent-123".into(),
            session_id: "session-456".into(),
            agent_type: "orchestrator".into(),  // Not allowed
            task: "Orchestrate".into(),
            project_path: "/test".into(),
            provider_id: None,
            model_id: None,
            context: None,
        };

        let result = runner.spawn_sub_agent(params).await;
        assert!(result.is_err());
    }
}
```

### Integration Tests
```rust
#[tokio::test]
async fn test_orchestrator_spawns_planner_and_coder() {
    let runner = create_test_runner();
    let ctx = InternalRunContext::new(
        "session-123",
        "orchestrator",
        "Build user authentication",
        "/test",
        None,
        None,
        None,
        false,
    );

    let result = runner.execute_orchestrator("run-123", &ctx, &NoopTokenSink).await;
    assert!(result.is_ok());

    // Verify sub-agents were created
    let sub_agents = sqlx::query_as::<_, AgentRun>(
        "SELECT * FROM agent_runs WHERE parent_agent_run_id = 'run-123'"
    )
    .fetch_all(&runner.db)
    .await
    .unwrap();

    assert_eq!(sub_agents.len(), 2);  // planner + coder
    assert_eq!(sub_agents[0].agent_type, "planner");
    assert_eq!(sub_agents[1].agent_type, "coder");
}
```

---

## Files to Modify

**Backend:**
- `src-tauri/src/agents/runner.rs` (add spawn_sub_agent, execute_orchestrator, helper methods)
- `src-tauri/src/models/mod.rs` (add SubAgentResult, SpawnSubAgentParams)

**Frontend:**
- `src/types/index.ts` (add SubAgentResult, update OrchestratorDelegation)
- `src/stores/useAgentStore.ts` (add subAgentResults state)
- `src/components/layout/AppShell.tsx` (listen for sub-agent completion)
- `src/components/chat/OrchestratorTimeline.tsx` (display sub-agent results)

---

## Execution Order

1. **Phase 3.1:** Verbose logging (events + UI)
2. **Phase 3.2:** Agent chaining (workflow logic)
3. **Phase 3.3:** Sub-agent spawning (this document)

---

**Status:** Design complete. Ready for implementation after Phase 3.1 and 3.2.

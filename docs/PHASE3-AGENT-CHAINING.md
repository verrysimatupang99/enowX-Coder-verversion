# Phase 3: Agent Chaining Workflow

**Goal:** Orchestrator executes multi-step workflows by chaining specialized agents (planner → coder → reviewer).

---

## Design Overview

### Current Flow (Single Agent)
```
User → orchestrator → ReAct loop → final output
```

### Target Flow (Agent Chaining)
```
User → orchestrator → analyze
                    ↓
                    planner → plan.md
                    ↓
                    coder → implementation
                    ↓
                    reviewer → validation
                    ↓
                    orchestrator → synthesis → final output
```

---

## Orchestrator Workflow Phases

### Phase 1: Analyze
**Input:** User request + project context  
**Output:** Task classification + agent selection strategy

**Logic:**
```rust
fn analyze_request(user_request: &str, project_path: &str) -> AnalysisResult {
    // Detect task type
    let task_type = if user_request.contains("plan") {
        TaskType::Planning
    } else if user_request.contains("implement") || user_request.contains("build") {
        TaskType::Implementation
    } else if user_request.contains("fix") || user_request.contains("bug") {
        TaskType::BugFix
    } else if user_request.contains("research") {
        TaskType::Research
    } else {
        TaskType::General
    };

    // Select agent chain
    let agent_chain = match task_type {
        TaskType::Planning => vec!["planner"],
        TaskType::Implementation => vec!["planner", "coder", "reviewer"],
        TaskType::BugFix => vec!["coder", "reviewer"],
        TaskType::Research => vec!["researcher"],
        TaskType::General => vec![], // orchestrator handles directly
    };

    AnalysisResult {
        task_type,
        agent_chain,
        reasoning: format!("Detected {} task, will use: {:?}", task_type, agent_chain),
    }
}
```

### Phase 2: Plan
**Input:** Analysis result  
**Output:** Execution plan with agent assignments

**Logic:**
```rust
fn create_execution_plan(analysis: AnalysisResult) -> ExecutionPlan {
    let mut steps = vec![];

    for (idx, agent_type) in analysis.agent_chain.iter().enumerate() {
        steps.push(ExecutionStep {
            step_number: idx + 1,
            agent_type: agent_type.to_string(),
            task: format!("Step {}: {}", idx + 1, agent_type),
            depends_on: if idx > 0 { Some(idx) } else { None },
            status: StepStatus::Pending,
        });
    }

    ExecutionPlan {
        steps,
        total_steps: analysis.agent_chain.len(),
    }
}
```

### Phase 3: Delegate
**Input:** Execution plan  
**Output:** Sub-agent results

**Logic:**
```rust
async fn execute_plan(&self, plan: ExecutionPlan, agent_run_id: &str) -> AppResult<Vec<StepResult>> {
    let mut results = vec![];

    for step in plan.steps {
        // Emit delegation event
        self.emit_orchestrator_delegate(
            agent_run_id,
            &step.agent_type,
            &step.task,
            "Executing planned step",
            &format!("{}-{}", agent_run_id, step.step_number),
        );

        // Spawn sub-agent (will be implemented in Phase 3.3)
        let sub_result = self.spawn_sub_agent(
            &step.agent_type,
            &step.task,
            agent_run_id,
        ).await?;

        // Validate result
        if sub_result.is_error {
            // Retry logic
            self.emit_orchestrator_decision(
                agent_run_id,
                "retry",
                &format!("Step {} failed, retrying", step.step_number),
            );

            let retry_result = self.spawn_sub_agent(
                &step.agent_type,
                &step.task,
                agent_run_id,
            ).await?;

            if retry_result.is_error {
                // Abort or skip
                self.emit_orchestrator_decision(
                    agent_run_id,
                    "abort",
                    &format!("Step {} failed after retry, aborting", step.step_number),
                );
                return Err(AppError::Agent(format!("Step {} failed", step.step_number)));
            }

            results.push(retry_result);
        } else {
            results.push(sub_result);
        }
    }

    Ok(results)
}
```

### Phase 4: Aggregate
**Input:** Sub-agent results  
**Output:** Validated and structured results

**Logic:**
```rust
fn aggregate_results(&self, results: Vec<StepResult>, agent_run_id: &str) -> AggregatedResult {
    self.emit_orchestrator_aggregate(agent_run_id, results.len(), "validating");

    // Cross-check consistency
    let mut issues = vec![];
    for (idx, result) in results.iter().enumerate() {
        if result.output.is_empty() {
            issues.push(format!("Step {} returned empty output", idx + 1));
        }
    }

    self.emit_orchestrator_aggregate(agent_run_id, results.len(), "synthesizing");

    AggregatedResult {
        results,
        issues,
        is_valid: issues.is_empty(),
    }
}
```

### Phase 5: Synthesize
**Input:** Aggregated results  
**Output:** Final response to user

**Logic:**
```rust
fn synthesize_response(&self, aggregated: AggregatedResult) -> String {
    if !aggregated.is_valid {
        return format!(
            "Execution completed with issues:\n{}",
            aggregated.issues.join("\n")
        );
    }

    let mut synthesis = String::new();
    synthesis.push_str("# Execution Summary\n\n");

    for (idx, result) in aggregated.results.iter().enumerate() {
        synthesis.push_str(&format!(
            "## Step {}: {}\n{}\n\n",
            idx + 1,
            result.agent_type,
            result.output
        ));
    }

    synthesis.push_str("# Validation\n");
    synthesis.push_str("All steps completed successfully.\n");

    synthesis
}
```

---

## Data Structures

### AnalysisResult
```rust
struct AnalysisResult {
    task_type: TaskType,
    agent_chain: Vec<String>,
    reasoning: String,
}

enum TaskType {
    Planning,
    Implementation,
    BugFix,
    Research,
    General,
}
```

### ExecutionPlan
```rust
struct ExecutionPlan {
    steps: Vec<ExecutionStep>,
    total_steps: usize,
}

struct ExecutionStep {
    step_number: usize,
    agent_type: String,
    task: String,
    depends_on: Option<usize>,
    status: StepStatus,
}

enum StepStatus {
    Pending,
    Running,
    Completed,
    Failed,
}
```

### StepResult
```rust
struct StepResult {
    step_number: usize,
    agent_type: String,
    output: String,
    is_error: bool,
    duration_ms: u64,
}
```

### AggregatedResult
```rust
struct AggregatedResult {
    results: Vec<StepResult>,
    issues: Vec<String>,
    is_valid: bool,
}
```

---

## Implementation in runner.rs

### Orchestrator Entry Point
```rust
async fn execute_agent(&self, agent_run_id: &str, ctx: AgentContext, token_sink: &S) -> AppResult<String> {
    if ctx.agent_type == "orchestrator" {
        return self.execute_orchestrator(agent_run_id, &ctx, token_sink).await;
    }

    // ... existing single-agent logic ...
}

async fn execute_orchestrator(&self, agent_run_id: &str, ctx: &AgentContext, token_sink: &S) -> AppResult<String> {
    // Phase 1: Analyze
    self.emit_orchestrator_phase(agent_run_id, "analyzing", "Analyzing user request");
    let analysis = self.analyze_request(&ctx.task, ctx.project_path);

    // Phase 2: Plan
    self.emit_orchestrator_phase(agent_run_id, "planning", "Creating execution plan");
    let plan = self.create_execution_plan(analysis);

    // Phase 3: Delegate
    self.emit_orchestrator_phase(agent_run_id, "delegating", "Executing agent chain");
    let results = self.execute_plan(plan, agent_run_id).await?;

    // Phase 4: Aggregate
    self.emit_orchestrator_phase(agent_run_id, "aggregating", "Validating results");
    let aggregated = self.aggregate_results(results, agent_run_id);

    // Phase 5: Synthesize
    self.emit_orchestrator_phase(agent_run_id, "synthesizing", "Creating final response");
    let final_output = self.synthesize_response(aggregated);

    Ok(final_output)
}
```

---

## Example Workflows

### Workflow 1: Simple Planning
**User:** "Create a plan for user authentication"

```
orchestrator → analyze → TaskType::Planning
            ↓
            planner → plan.md
            ↓
            orchestrator → synthesis → "Plan created at plan.md"
```

### Workflow 2: Full Implementation
**User:** "Build a user authentication system"

```
orchestrator → analyze → TaskType::Implementation
            ↓
            planner → plan.md
            ↓
            coder → auth.ts, auth.test.ts
            ↓
            reviewer → validation report
            ↓
            orchestrator → synthesis → "Implementation complete, 2 files created, tests pass"
```

### Workflow 3: Bug Fix
**User:** "Fix the login bug in auth.ts"

```
orchestrator → analyze → TaskType::BugFix
            ↓
            coder → fix auth.ts
            ↓
            reviewer → validation report
            ↓
            orchestrator → synthesis → "Bug fixed, tests pass"
```

### Workflow 4: Research
**User:** "Research best practices for React hooks"

```
orchestrator → analyze → TaskType::Research
            ↓
            researcher → research report
            ↓
            orchestrator → synthesis → "Research complete: [summary]"
```

---

## Error Handling

### Retry Strategy
```rust
const MAX_RETRIES: usize = 3;

async fn spawn_sub_agent_with_retry(
    &self,
    agent_type: &str,
    task: &str,
    agent_run_id: &str,
) -> AppResult<StepResult> {
    for attempt in 1..=MAX_RETRIES {
        match self.spawn_sub_agent(agent_type, task, agent_run_id).await {
            Ok(result) if !result.is_error => return Ok(result),
            Ok(result) => {
                self.emit_orchestrator_decision(
                    agent_run_id,
                    "retry",
                    &format!("Attempt {}/{} failed: {}", attempt, MAX_RETRIES, result.output),
                );
            }
            Err(e) => {
                if attempt == MAX_RETRIES {
                    return Err(e);
                }
                self.emit_orchestrator_decision(
                    agent_run_id,
                    "retry",
                    &format!("Attempt {}/{} error: {}", attempt, MAX_RETRIES, e),
                );
            }
        }
    }

    Err(AppError::Agent(format!("Failed after {} retries", MAX_RETRIES)))
}
```

### Fallback Strategy
```rust
async fn execute_with_fallback(
    &self,
    plan: ExecutionPlan,
    agent_run_id: &str,
) -> AppResult<Vec<StepResult>> {
    let mut results = vec![];

    for step in plan.steps {
        match self.spawn_sub_agent_with_retry(&step.agent_type, &step.task, agent_run_id).await {
            Ok(result) => results.push(result),
            Err(e) => {
                // Try fallback agent
                self.emit_orchestrator_decision(
                    agent_run_id,
                    "fallback",
                    &format!("Step {} failed, trying fallback agent", step.step_number),
                );

                let fallback_agent = match step.agent_type.as_str() {
                    "coder" => "chat", // fallback to general chat
                    _ => "chat",
                };

                let fallback_result = self.spawn_sub_agent(
                    fallback_agent,
                    &step.task,
                    agent_run_id,
                ).await?;

                results.push(fallback_result);
            }
        }
    }

    Ok(results)
}
```

---

## UI Updates

### Orchestrator Timeline with Chaining
```tsx
// src/components/chat/OrchestratorTimeline.tsx

export const OrchestratorTimeline = ({ agentRunId }: { agentRunId: string }) => {
  const phase = useAgentStore(s => s.orchestratorPhases[agentRunId]);
  const delegations = useAgentStore(s => s.orchestratorDelegations[agentRunId] || []);
  const decisions = useAgentStore(s => s.orchestratorDecisions[agentRunId] || []);

  return (
    <div className="space-y-3">
      {/* Phase indicator */}
      <PhaseIndicator phase={phase} />

      {/* Agent chain visualization */}
      <div className="flex items-center gap-2">
        {delegations.map((delegation, idx) => (
          <React.Fragment key={idx}>
            <AgentBadge agent={delegation.targetAgent} status={delegation.status} />
            {idx < delegations.length - 1 && <ArrowRight size={16} />}
          </React.Fragment>
        ))}
      </div>

      {/* Detailed logs */}
      <div className="space-y-2">
        {delegations.map((delegation, idx) => (
          <DelegationCard key={idx} delegation={delegation} />
        ))}
        {decisions.map((decision, idx) => (
          <DecisionCard key={idx} decision={decision} />
        ))}
      </div>
    </div>
  );
};
```

---

## Testing Plan

### Unit Tests
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_analyze_planning_request() {
        let result = analyze_request("Create a plan for auth", "/project");
        assert_eq!(result.task_type, TaskType::Planning);
        assert_eq!(result.agent_chain, vec!["planner"]);
    }

    #[test]
    fn test_analyze_implementation_request() {
        let result = analyze_request("Build user authentication", "/project");
        assert_eq!(result.task_type, TaskType::Implementation);
        assert_eq!(result.agent_chain, vec!["planner", "coder", "reviewer"]);
    }

    #[test]
    fn test_create_execution_plan() {
        let analysis = AnalysisResult {
            task_type: TaskType::Implementation,
            agent_chain: vec!["planner".into(), "coder".into()],
            reasoning: "test".into(),
        };
        let plan = create_execution_plan(analysis);
        assert_eq!(plan.total_steps, 2);
        assert_eq!(plan.steps[0].agent_type, "planner");
        assert_eq!(plan.steps[1].depends_on, Some(0));
    }
}
```

### Integration Tests
```rust
#[tokio::test]
async fn test_orchestrator_full_workflow() {
    let runner = create_test_runner();
    let ctx = AgentContext {
        agent_type: "orchestrator",
        task: "Build user authentication",
        session_id: "test",
        project_path: "/test",
        parent_agent_run_id: None,
    };

    let result = runner.execute_orchestrator("test-run", &ctx, &TestTokenSink).await;
    assert!(result.is_ok());
    assert!(result.unwrap().contains("Implementation complete"));
}
```

---

## Files to Modify

**Backend:**
- `src-tauri/src/agents/runner.rs` (add orchestrator workflow logic)
- `src-tauri/src/agents/prompts/orchestrator.rs` (update system prompt)

**Frontend:**
- `src/components/chat/OrchestratorTimeline.tsx` (update with chaining UI)
- `src/stores/useAgentStore.ts` (add chaining state)

---

## Next Steps

After implementing agent chaining:
1. **Phase 3.3:** Sub-agent spawning mechanism (actual delegation API)

---

**Status:** Design complete. Ready for implementation after Phase 3.1 (verbose logging).

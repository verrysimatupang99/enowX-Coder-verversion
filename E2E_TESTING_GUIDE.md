# End-to-End Testing Guide - A1 Orchestrator

**Status:** Ready for manual testing  
**Completion:** 85% (Timeline persistence added, subagent execution deferred)

---

## 🎯 TEST OBJECTIVES

1. Verify orchestrator agent detection
2. Verify timeline UI renders
3. Verify events flow correctly
4. Verify DB persistence
5. Verify delegate_task tool creates subagent runs

---

## 📋 PREREQUISITES

### 1. Environment Setup
```bash
cd ~/Documents/Coding/enowX-Coder-verversion
npm install
cd src-tauri && cargo build
```

### 2. API Key Configuration
- Open app: `npm run tauri dev`
- Go to Settings → Providers
- Add API key for your provider (enowX Labs, OpenAI, Anthropic, etc.)
- Enable provider
- Select model

### 3. Project Setup
- Click "Open Folder" button
- Select a test project directory
- Verify project appears in left sidebar

---

## 🧪 TEST CASES

### TEST 1: Orchestrator Detection
**Objective:** Verify orchestrator agent is auto-detected

**Steps:**
1. Open app
2. Open project folder
3. Send message: `"build a login system with React and Node.js"`

**Expected Results:**
- ✅ Agent type badge shows "orchestrator" (not "chat" or "coder")
- ✅ Message appears in chat
- ✅ Agent starts processing

**How to Verify:**
- Look for agent badge above AI response
- Should say "orchestrator" in small gray text

---

### TEST 2: Timeline UI Rendering
**Objective:** Verify OrchestratorTimeline component renders

**Steps:**
1. Continue from TEST 1
2. Wait for orchestrator to start processing
3. Look for timeline UI below agent badge

**Expected Results:**
- ✅ Timeline section appears with border
- ✅ Phase indicator shows (e.g., "Phase: analyze")
- ✅ Pulse animation on phase indicator
- ✅ Timeline has warm background color

**How to Verify:**
- Timeline should be visible between agent badge and response content
- Should have rounded corners and border
- Phase text should be visible

---

### TEST 3: Event Flow (Console Logs)
**Objective:** Verify events are emitted and received

**Steps:**
1. Open browser DevTools (F12 or Ctrl+Shift+I)
2. Go to Console tab
3. Send orchestrator task: `"create a full-stack app"`
4. Watch console for event logs

**Expected Results:**
- ✅ `orchestrator-phase` event logged
- ✅ `orchestrator-delegate` event logged (if delegate_task is called)
- ✅ Event payloads include correct fields

**How to Verify:**
```javascript
// You should see logs like:
// [orchestrator-phase] { agentRunId: "...", phase: "analyze", ... }
// [orchestrator-delegate] { agentRunId: "...", targetAgent: "coder", ... }
```

---

### TEST 4: Database Persistence
**Objective:** Verify subagent runs are created in DB

**Steps:**
1. Complete TEST 1-3
2. Open SQLite database:
   ```bash
   sqlite3 ~/.local/share/enowx-coder/enowx-coder.db
   ```
3. Query subagent runs:
   ```sql
   SELECT id, agent_type, parent_agent_run_id, status, created_at 
   FROM agent_runs 
   WHERE parent_agent_run_id IS NOT NULL;
   ```

**Expected Results:**
- ✅ At least one row returned
- ✅ `parent_agent_run_id` is set (not NULL)
- ✅ `agent_type` matches delegated agent (e.g., "coder", "planner")
- ✅ `status` is "running" or "completed"

**How to Verify:**
```sql
-- Example output:
-- id                                   | agent_type | parent_agent_run_id              | status  | created_at
-- ------------------------------------ | ---------- | -------------------------------- | ------- | -------------------
-- abc123...                            | coder      | xyz789...                        | running | 2026-05-13 10:30:00
```

---

### TEST 5: Timeline Persistence
**Objective:** Verify timeline state is saved to DB

**Steps:**
1. Complete TEST 1-4
2. Query orchestrator_timeline column:
   ```sql
   SELECT id, agent_type, orchestrator_timeline 
   FROM agent_runs 
   WHERE agent_type = 'orchestrator' 
   AND orchestrator_timeline IS NOT NULL;
   ```

**Expected Results:**
- ✅ `orchestrator_timeline` column contains JSON data
- ✅ JSON includes phases, delegations, aggregates, decisions

**How to Verify:**
```sql
-- Example output:
-- orchestrator_timeline: {"phases": {...}, "delegations": [...], ...}
```

---

### TEST 6: Delegate Task Tool
**Objective:** Verify delegate_task tool is available and callable

**Steps:**
1. Send orchestrator task that requires delegation
2. Wait for orchestrator to call delegate_task
3. Check console for tool execution logs

**Expected Results:**
- ✅ Tool execution block appears in chat
- ✅ Tool name: "delegate_task"
- ✅ Tool input includes: agentType, task
- ✅ Tool output includes: subAgentRunId

**How to Verify:**
- Look for collapsible "Tool Execution" blocks in chat
- Expand to see tool details
- Should show delegate_task with parameters

---

### TEST 7: Multiple Delegations
**Objective:** Verify orchestrator can delegate multiple tasks

**Steps:**
1. Send complex task: `"build a full-stack e-commerce app with authentication, product catalog, and checkout"`
2. Wait for orchestrator to process
3. Check timeline for multiple delegation cards

**Expected Results:**
- ✅ Multiple delegation cards appear
- ✅ Each card shows different agent type (planner, coder_fe, coder_be, etc.)
- ✅ Each card has Robot icon
- ✅ Cards are stacked vertically

**How to Verify:**
- Timeline should show 2+ delegation cards
- Each card should have distinct agent type and task

---

### TEST 8: Error Handling
**Objective:** Verify graceful error handling

**Steps:**
1. Send orchestrator task without API key configured
2. OR send task with invalid project path
3. Check error messages

**Expected Results:**
- ✅ Clear error message displayed
- ✅ No app crash
- ✅ Error logged in console
- ✅ Agent status shows "failed"

**How to Verify:**
- Error message should be user-friendly
- Should not show raw stack traces to user

---

## 🐛 KNOWN LIMITATIONS

### 1. Subagent Execution Not Implemented
**Status:** Deferred  
**Impact:** delegate_task creates DB entry but doesn't execute subagent  
**Workaround:** Orchestrator receives placeholder response

**Why Deferred:**
- Requires background task spawning
- Needs async result aggregation
- Requires streaming output handling
- Would block orchestrator ReAct loop

**Future Implementation:**
```rust
// Spawn subagent in background
tokio::spawn(async move {
    let runner = AgentRunner::new(...);
    let result = runner.run(...).await;
    // Aggregate result back to orchestrator
});
```

### 2. Timeline Persistence Not Auto-Saved
**Status:** Implemented but not auto-triggered  
**Impact:** Timeline state not saved automatically  
**Workaround:** Manual save via Tauri command

**To Enable Auto-Save:**
```typescript
// In AppShell.tsx, after each orchestrator event:
useEffect(() => {
  if (orchestratorPhases[agentRunId]) {
    const timeline = {
      phases: orchestratorPhases,
      delegations: orchestratorDelegations,
      aggregates: orchestratorAggregates,
      decisions: orchestratorDecisions,
    };
    invoke('save_orchestrator_timeline', {
      agentRunId,
      timelineJson: JSON.stringify(timeline),
    });
  }
}, [orchestratorPhases, orchestratorDelegations, orchestratorAggregates, orchestratorDecisions]);
```

---

## ✅ SUCCESS CRITERIA

### Minimum Viable (MVP):
- [x] Orchestrator agent detected correctly
- [x] Timeline UI renders
- [x] Events flow from backend to frontend
- [x] Subagent runs created in DB
- [x] Timeline persistence available

### Full Feature (100%):
- [x] All MVP criteria
- [ ] Subagent execution completes
- [ ] Results aggregated back to orchestrator
- [ ] Timeline auto-saved on every update
- [ ] Manual E2E testing passed

**Current Status:** 85% complete (MVP achieved, full execution deferred)

---

## 📊 TEST RESULTS TEMPLATE

```markdown
## Test Execution Report

**Date:** YYYY-MM-DD  
**Tester:** [Your Name]  
**Environment:** [OS, Browser, App Version]

### TEST 1: Orchestrator Detection
- Status: [ ] PASS / [ ] FAIL
- Notes: 

### TEST 2: Timeline UI Rendering
- Status: [ ] PASS / [ ] FAIL
- Notes:

### TEST 3: Event Flow
- Status: [ ] PASS / [ ] FAIL
- Notes:

### TEST 4: Database Persistence
- Status: [ ] PASS / [ ] FAIL
- Notes:

### TEST 5: Timeline Persistence
- Status: [ ] PASS / [ ] FAIL
- Notes:

### TEST 6: Delegate Task Tool
- Status: [ ] PASS / [ ] FAIL
- Notes:

### TEST 7: Multiple Delegations
- Status: [ ] PASS / [ ] FAIL
- Notes:

### TEST 8: Error Handling
- Status: [ ] PASS / [ ] FAIL
- Notes:

### Overall Result
- Tests Passed: X/8
- Tests Failed: X/8
- Blockers: [List any critical issues]
- Recommendations: [Next steps]
```

---

## 🚀 NEXT STEPS AFTER TESTING

### If All Tests Pass:
1. Document test results
2. Create PR to upstream
3. Release v0.3.0

### If Tests Fail:
1. Document failures
2. Fix critical issues
3. Re-test
4. Iterate until pass

### Future Enhancements:
1. Implement full subagent execution
2. Add timeline auto-save
3. Add retry logic for failed delegations
4. Add subagent result aggregation
5. Add performance metrics

---

**Testing Guide Version:** 1.0  
**Last Updated:** 2026-05-13  
**Status:** Ready for manual testing

---
name: plan-execution
description: Use when you have an implementation plan to execute, or when facing 2+ independent tasks/bugs — supports sequential execution, parallel dispatch (if available), and single-agent fallback
---

# Plan Execution

## Overview

Execute implementation plans or tackle multiple independent problems with the right strategy for your environment.

**Core principle:** Match execution mode to task structure and environment capabilities.

## Mode Selection

```
Have a plan with tasks?
├── Subagents available?
│   ├── Yes → Mode A: Subagent per task (best quality)
│   └── No  → Mode B: Sequential single-agent (Pi compatible)
│
Multiple independent bugs/problems?
├── Parallel dispatch available?
│   ├── Yes → Mode C: Parallel agents
│   └── No  → Mode D: Sequential isolation (Pi compatible)
```

---

## Mode A: Subagent Per Task

*Use when: plan with independent tasks + subagent support*

For each task:
1. **Dispatch implementer subagent** with full task text + context
2. If subagent asks questions → answer, re-dispatch
3. Subagent implements, tests, commits, self-reviews
4. **Dispatch spec reviewer** → confirms code matches spec
5. **Dispatch code quality reviewer** → checks implementation quality
6. Both pass → mark task complete, next task

**Handling subagent status:**
- **DONE** → proceed to review
- **DONE_WITH_CONCERNS** → read concerns, address if needed, then review
- **NEEDS_CONTEXT** → provide missing context, re-dispatch
- **BLOCKED** → try more capable model, or break task smaller, or escalate to human

**Model selection:**
- Mechanical tasks (1-2 files, clear spec) → fast/cheap model
- Integration tasks (multi-file) → standard model
- Architecture/review → most capable model

## Mode B: Sequential Single-Agent

*Use when: plan with tasks + no subagent support (Pi)*

1. **Read the full plan**, create task list
2. **For each task:**
   - Re-read task requirements (stay aligned)
   - Implement following TDD (test → fail → implement → pass)
   - Self-review against spec
   - Self-review for code quality
   - Run ALL tests (no regressions)
   - Commit with descriptive message
3. **After all tasks**, final review pass across all changes
4. Proceed to `finishing-a-development-branch`

**Context management (critical for single-agent):**
- Keep each task focused and small
- Commit after each task (checkpoint)
- Re-read plan before each new task
- Don't carry debugging context between tasks

## Mode C: Parallel Dispatch

*Use when: 2+ independent problems + parallel agent support*

1. **Identify independent domains** — group by what's broken
2. **Create focused prompts** per domain:
   - Specific scope (one test file / subsystem)
   - All needed context (error messages, relevant code)
   - Clear constraints ("don't change other code")
   - Expected output format
3. **Dispatch all agents simultaneously**
4. **When agents return:**
   - Review each summary
   - Check for conflicts (same files edited?)
   - Run full test suite
   - Integrate changes

**Good prompt example:**
```
Fix the 3 failing tests in src/agent-tool-abort.test.ts:
1. "should abort tool with partial output" - expects 'interrupted' in message
2. "should handle mixed tools" - fast tool aborted instead of completed

Root cause is likely timing/race conditions.
Do NOT just increase timeouts - find the real issue.
Do NOT change files outside this test and its implementation.
Return: summary of root cause and changes made.
```

**Bad prompts:** "Fix all the tests" (too broad), "Fix the bug" (no context)

## Mode D: Sequential Isolation

*Use when: 2+ independent problems + no parallel support (Pi)*

1. **List all problem domains** separately
2. **For each domain, one at a time:**
   - Focus ONLY on this domain
   - Investigate → identify root cause → fix → verify
   - Commit the fix
   - Mentally "reset" — don't carry assumptions to next domain
3. **After all domains**, run full verification

**Why this works without parallelism:**
- Domain isolation prevents cross-contamination
- Each problem gets full focused attention
- Per-domain commits make reverts easy
- "Mental reset" between domains mimics fresh agent context

---

## Red Flags (All Modes)

**Never:**
- Start on main/master without explicit consent
- Skip reviews (self-review or subagent review)
- Proceed with failing tests
- Edit same files from parallel agents
- Skip TDD because "it's a small change"
- Ignore subagent questions or escalations

**Always:**
- Verify tests pass after each task
- Commit after each task
- Review before moving to next task
- Run full suite after all tasks complete

## Integration

**Requires:** An implementation plan (from `writing-plans`) or identified independent problems
**Leads to:** `finishing-a-development-branch` when all tasks complete
**Uses:** `test-driven-development` for each task, `using-git-worktrees` for isolation

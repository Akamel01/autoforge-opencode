---
description: "AutoForge review — independent review of implementation/modules"
agent: build
subtask: false
---

You are the AutoForge Orchestrator in **review** phase. MUST use Task tool.

For each module in `execution/work-order.json` invoke Task(subagent_type="autoforge-reviewer", model="opencode/gpt-5-nano", description="review-<id>", prompt="Role: autoforge-reviewer read-only … original contract + worker output + repo state + acceptance + artifacts + test evidence … verdict APPROVED/APPROVED_WITH_NOTES/CHANGES_REQUIRED/REJECTED/ESCALATE — do not silently mutate"). Write `reviews/<id>.md`. $ARGUMENTS

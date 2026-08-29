# 04_plan — build DAG with touches + critic

One job: turn discovery+arch into concrete DAG; every tracker-index entry → module.

## Inputs
- Working (this run): ../01_discovery/output/tracker-index.md (MANDATORY), ../02_grill/output/grilling.md, ../03_architect/output/*
- Reference (every run): ../../_shared/protocol.md §Plan+Critique + spawn-contract.md

Do NOT load: execution outputs.

## Process
1. MUST enumerate every entry in tracker-index — one module per frontier ticket (merge only with cited dedup).
2. For each module: objective, inputs/outputs, touches: [globs], blocked_by, acceptance, skills/tools/tests, reviewer. Via Task autoforge-planner.
3. Task critic (autoforge-reviewer) → incorporate resolvable CHANGES_REQUIRED and auto-approve; only if irreversible/ambiguous/missing-auth requires human authority AND insufficient info → write `decisions/need-human.md` and ask.

## Outputs
- `output/plan.md` + `output/work-order.json` (with touches per module) → stage 05_execute

## Human check
Plan covers all index entries; touches present for shared-state guard; DAG valid.

# 05_execute — implement DAG respecting touches + blocked_by

One job: run workers per module, parallel when disjoint touches, sequential when shared.

## Inputs
- Working (this run): ../04_plan/output/work-order.json + plan.md (with touches)
- Reference (every run): ../../_shared/spawn-contract.md

Do NOT load: review/validation outputs beyond current module.

## Process
1. Group modules by blocked_by + touches overlap: disjoint → parallel Task autoforge-worker calls same turn; intersecting (same file/route, state/vault-notes.json) → sequential topological.
2. Per module: Task autoforge-worker with spawn contract.
3. Record `output/<id>.md` + code changes.

## Outputs
- `output/<id>.md` + code → stage 06_review

## Human check
Each module independently reviewable/testable; touches respected (no parallel on shared state).

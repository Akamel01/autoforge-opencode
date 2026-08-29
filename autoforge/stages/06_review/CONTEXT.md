# 06_review — independent review (read-only)

One job: independently verify worker output — no trust.

## Inputs
- Working (this run): ../05_execute/output/<id>.md + module contract + worker evidence
- Reference (every run): ../../_shared/protocol.md §Review

Do NOT load: later validation beyond evidence bundle.

## Process
1. Task autoforge-reviewer (edit deny, read-only).
2. Check correctness, coverage, quality, regressions, architecture, tests, edge, unintended.
3. Verdict APPROVED/WITH_NOTES/CHANGES_REQUIRED/REJECTED/ESCALATE.

## Outputs
- `output/<id>.md` verdict → stage 07_validate + orchestrator integration

## Human check
Verdict has evidence and required-change list if not approved; reviewer never mutates.

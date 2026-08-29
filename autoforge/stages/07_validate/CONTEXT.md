# 07_validate — evidence mapping + adversarial investigation

One job: prove acceptance and ask what could still be wrong.

## Inputs
- Working (this run): ../06_review/output/*.md + integrated repo + work-order + original tracker-index
- Reference (every run): ../../_shared/protocol.md §Validate

Do NOT load: stale prior runs.

## Process
1. Task autoforge-validator → output/report.md (criterion→evidence, GO/REPLAN).
2. Task autoforge-investigator → output/investigation.md (what could still be wrong).
3. Orchestrator integrates: compare objectives vs tracker-index, cross-module checks, decide loop.

## Outputs
- `output/report.md` + `output/investigation.md` → orchestrator reassess (repeat affected phases if REPLAN)

## Human check
Report maps each acceptance criterion to evidence; investigation names hidden coupling/regression risks.

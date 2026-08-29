# 01_discovery — map trackers & repo state

One job: auto-discover every tracker and inspect repo, cite file:line.

## Inputs
- Working (this run): $ARGUMENTS handoff path or implicit auto-discover
- Reference (every run): ../../_shared/protocol.md §Discover
- Reference (every run): ../../_shared/model-policy.yaml (model routing)

Do NOT load: later stages' references, any run's product except prior tracker-index if resuming.

## Process
1. If $ARGUMENTS explicit, use it; else scan `.scratch/**/map.md` + `issues/*.md`, `gh issue list --state open`, handoff docs from AGENTS.md.
2. Inspect repo state, code, docs, architecture, constraints, deps, unknowns via read/glob/grep.
3. Write `output/tracker-index.md` (one line per open ticket, source prefix) + `output/report.md` (findings, unknowns, deps) citing file:line.

## Outputs
- `output/tracker-index.md` → stages/02_grill input (also 04_plan's mandatory input)
- `output/report.md` → stages/02_grill + 03_architect

## Human check
Index lists every frontier ticket — missing one is a failure. Edit index in place before grill reads it.

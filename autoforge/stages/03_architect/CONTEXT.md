# 03_architect — choose boundaries & tradeoffs

One job: analyze codebase and pick smallest correct architecture.

## Inputs
- Working (this run): ../01_discovery/output/* + ../02_grill/output/grilling.md
- Reference (every run): ../../_shared/protocol.md §Architect
- Reference (every run): codebase-design + improve-codebase-architecture guides (use selectively)

Do NOT load: plan/execute outputs.

## Process
1. Inspect architecture seams, directory structure, interfaces, dependencies.
2. Propose alternatives, define boundaries/interfaces, dependencies, tradeoffs, risks.
3. Invoke Task autoforge-architect.

## Outputs
- `output/decisions.md` (+ report.md) → stage 04_plan

## Human check
Smallest correct change named; alternatives with tradeoffs listed.

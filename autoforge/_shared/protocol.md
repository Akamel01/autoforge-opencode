# AutoForge Protocol — reusable hierarchical multi-agent orchestration

Main session = **Orchestrator** (owns global workflow state, context, objectives, deps, decisions, integration, acceptance, escalation). Child agents = specialized workers/reviewers with fresh context — must receive full task contract.

## Lifecycle
Discover → Grill → Architect → Plan → Critique → Approve → Decompose → Execute → Review → Integrate → Validate → Reassess → (repeat necessary phases) until objectives demonstrably satisfied or human escalation gate reached.

Optimizes: correctness, architectural integrity, independent validation, traceability, modularity, parallelism, model efficiency, minimal human intervention, context preservation, reproducibility.

## Phase details
- **Discover**: auto-discover ALL trackers when $ARGUMENTS empty (Wayfinder `.scratch/**/map.md` + `.scratch/**/issues/*.md`, `gh issue list --state open`, handoff docs from AGENTS.md/state) → write `discovery/tracker-index.md` (one line per open ticket, source prefix) + `discovery/report.md`. Wayfinder for large/foggy work; find-skills for capability discovery.
- **Grill**: Grill-with-Docs deep interrogation — what ticket asks + adjacent/hidden requirements, assumptions, risks, deps, consequences. Recommendations independently challenged; orchestrator decides accept/modify/reject/escalate. Input is discovery report + tracker-index.
- **Architect**: design alternatives, boundaries/interfaces, tradeoffs, risks. Invoke codebase-design / improve-codebase-architecture selectively. Consumes tracker-index scope.
- **Plan**: MUST enumerate every entry in `discovery/tracker-index.md` (one module per frontier ticket, merge only with cited dedup). Concrete, dep-aware, modular, executable, testable, traceable plan → DAG Execution Work Order with `touches: [globs]` per module for shared-state guard.
- **Critique**: independent critic challenges completeness/dep ordering/arch consistency/assumptions/testability/rollback/modularity/parallelism/risks/scope/acceptance. Orchestrator incorporates resolvable criticism and auto-approves; only if critic flags irreversible/ambiguous/missing-auth/conflicting-owner/destructive needing human authority AND insufficient info in CONTEXT.md/ADRs/docs → write `decisions/need-human.md` and ask via question tool.
- **Execute**: modular principle — each module independently understandable/executable/reviewable/testable. Module boundary ≠ session boundary. Orchestrator groups by `touches` overlap + `blocked_by`: disjoint → parallel Task calls; intersecting (same file/route, `state/vault-notes.json`) → sequential fallback.
- **Review**: every meaningful worker → independent reviewer (read-only where practical) with verdict APPROVED/APPROVED_WITH_NOTES/CHANGES_REQUIRED/REJECTED/ESCALATE — includes docs-only M3-type modules; no exception (docs-only still meaningful: MAP + decisions log are source of truth).
- **Integrate**: orchestrator checks cross-module interactions, architecture, dep assumptions, unintended consequences; integrates compatible changes; determines next iteration.
- **Validate**: evidence-based criterion→evidence mapping (validator) + final adversarial investigation (investigator: "what could still be wrong?").
- **Reassess**: closed-loop replanning — repeat only necessary phases.

## Human escalation (§16)
Autonomous by default. Escalate only: irreversible high-impact, ambiguous product/business req, missing authorization, conflicting owner reqs, destructive confirmation, unresolved arch decision with stakeholder consequences, security/privacy/legal needing human authority. Otherwise auto-approve plan after incorporating resolvable critique.

## Skill routing (dynamic)
Wayfinder (discovery), Grill-with-Docs (grilling), codebase-design/improve-codebase-architecture (architecture), tdd/surgical-patch/lean-build (implementation), code-review (review), verify-and-stop (validation), investigate-first/diagnosing-bugs (investigation), find-skills/caveman-explore (locate). Caveman/Ponytail are behavioral constraints.

## Artifacts (project-local `.autoforge/` — canonical ICM `stages/*/output/` views)

```
.autoforge/                                    # flat homes (one home per fact)
  state.json                           # phase, loop, modules — orchestrator updates after each phase
  discovery/report.md           ↔ stages/01_discovery/output/report.md
  discovery/tracker-index.md    ↔ stages/01_discovery/output/tracker-index.md  # auto-discovery index (required when no explicit issues/handoff)
  requirements/grilling.md      ↔ stages/02_grill/output/grilling.md
  architecture/report.md        ↔ stages/03_architect/output/report.md
  architecture/decisions.md     ↔ stages/03_architect/output/decisions.md
  decisions/log.md
  decisions/need-human.md              # only when autonomous approval insufficient
  plans/plan.md                 ↔ stages/04_plan/output/plan.md
  execution/work-order.json     ↔ stages/05_execute/output/work-order.json  # modules with touches: [globs], blocked_by, DAG
  execution/<module>.md         ↔ stages/05_execute/output/<module>.md
  reviews/<module>.md           ↔ stages/06_review/output/<module>.md
  validation/report.md          ↔ stages/07_validate/output/report.md
  validation/investigation.md   ↔ stages/07_validate/output/investigation.md
  validation/ops-loop-*.json    ↔ stages/07_validate/output/ops-loop-*.json
  stages/01_discovery…07_validate/output/  # ICM views (symlinks to flat homes)
```
`stages/*/output` is the canonical ICM view; flat homes are one-home links. Adapt if repo has equivalent system; otherwise use this structure. Use conversation history never as primary state. On empty $ARGUMENTS, tracker-index is mandatory input to planning.

## Model policy + model-aware delegation
`~/.config/opencode/autoforge/model-policy.yaml` is central authority. Hierarchy: global default → role-specific (planner/reviewer/architect use bigger `opencode/gpt-5` 272k; workers/discovery/validator use `opencode/gpt-5-nano` 128k) → task/module → explicit runtime. Registry `model-registry.yaml` holds `context_window / max_output / capabilities / guidance` per `opencode/*` model. Orchestrator MUST lookup resolved model in registry before sizing each `Task`: budget = `min(context_window * 0.30, 80000)` tok; if `sum(inputs) > budget` summarize reports (paragraph + file:line) or chunk; for `fast`-only models send checklist/acceptance, for `reasoning` models include tradeoffs/risks. See Spawn contract §2b.

## References
- Spawn contract: `spawn-contract.md`
- Model policy: `model-policy.yaml`

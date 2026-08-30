# AutoForge Child-Session Spawn Contract

Every child invocation MUST explicitly establish:

1. **agent role** — one of: autoforge-discovery, autoforge-griller, autoforge-architect, autoforge-planner, autoforge-worker, autoforge-reviewer, autoforge-validator, autoforge-investigator
2. **resolved model + budget** — per `model-policy.yaml` hierarchy (global default `gpt-5-nano` → role (`architect/planner/reviewer` = `inherit` orchestrator, others = `gpt-5-nano`) → task/module → runtime override); then lookup `model-registry.yaml` for `context_window / max_output / capabilities / guidance` and compute budget `min(context_window * 0.30, 80000)` tok (e.g. `muse-spark-1.2 1M→80k cap, gpt-5 400k→80k cap`). Orchestrator MUST shape inputs to fit budget (verbatim vs summarized vs chunked) and note it in prompt.
3. **task contract** — bounded, concrete objective
4. **relevant artifacts** — paths + summaries of prior phase outputs (always include `discovery/tracker-index.md` when present)
5. **repository scope** — which files/dirs to read/search; root = project
6. **dependencies** — blocked-by edges from work order + shared-state `touches` overlap guard
7. **constraints** — permissions, time, non-goals
8. **required skills** — e.g. Wayfinder, grill-with-docs, codebase-design
9. **expected outputs** — artifact paths + format (must include `touches: [globs]` for planner/worker)
10. **acceptance criteria** — how completion is judged

## Template (paste into Task prompt)

```
Role: autoforge-<role> (model: opencode/gpt-5-nano per model-policy; budget 80k tok cap = 400k*0.30 — see model-registry.yaml) or (inherits orchestrator per model-policy; budget = registry[main]*0.30 capped)
Model budget: 80k tok (cap; e.g. muse-spark-1.2 1M*0.30, gpt-5 400k*0.30) — inputs sized to fit budget
Objective: <one-line>
Scope: <repo paths>
Dependencies: <blocked-by> + touches overlap guard <list modules sharing globs>
Inputs: <.autoforge/... artifacts + summaries, including discovery/tracker-index.md (verbatim vs summarized per budget)>
Constraints: <least-privilege, non-goals, AGENTS.md>
Required skills: <Wayfinder / grill-with-docs / ...>
Expected outputs: <.autoforge/... path + format, with touches: [globs]>
Acceptance: <criteria, evidence required>
Return: <concise summary + artifact path> for orchestrator integration (cap at max_output).
```

Concrete Task call (opencode-task-model):

```
Task(
  subagent_type="autoforge-worker",
  model="opencode/gpt-5-nano",
  description="worker-M1",
  prompt="Role: autoforge-worker (model: opencode/gpt-5-nano per model-policy; budget 80k cap = 400k*0.30)\nModel budget: 80k tok (capabilities: tools/fast) — inputs summarized to fit\nObjective: implement M1\nScope: src/app/**\nDependencies: none, touches: [\"src/app/foo.tsx\"] — parallel-safe (no overlap with M2)\nInputs: .autoforge/plans/plan.md summary; .autoforge/discovery/tracker-index.md entry #1\nConstraints: smallest correct change, respect AGENTS.md\nRequired skills: tdd\nExpected outputs: .autoforge/execution/M1.md\nAcceptance: tests pass, file edited"
)
# Planner inherits orchestrator — omit model, budget is registry[main]*0.30 capped:
# Task(subagent_type="autoforge-planner", description="plan",
#   prompt="Role: autoforge-planner (inherits orchestrator per model-policy; budget 80k cap = registry[main]*0.30)\nModel budget: 80k tok (main=muse-spark-1.2 1M*0.30 or gpt-5 400k*0.30) ...")
```

Do NOT spawn vague sessions ("Look at this and fix it."). Keep shared invariants in `protocol.md`; role-specific behavior in agent file. For parallel modules, emit multiple Task calls in same turn when touches disjoint; otherwise serialize by blocked_by + touches overlap.

## Model override
Specify `model: provider/model` on Task invocation to apply runtime override. Do not mutate `model-policy.yaml` for transient overrides.

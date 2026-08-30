# Spec Addendum — Intentional Divergences from `autoforge-architecture.md`

This repo **implements** the AutoForge architecture (`autoforge-architecture.md`, §12/15) with lean, model-aware, ICM-hybrid choices. The spec is normative; this file records **approved** deviations that `docs/architecture.png` (diagram) and the live install reflect.

> Diagram’s MODEL POLICY pane shows the original spec (all `gpt-5-nano`); live policy is D1 below. Diagram remains correct for the 12-phase lifecycle.

## D1 — Role-specialized models (Spec §12 vs live, corrected per inherit)

- **Spec:** every `child_agents: * → provider: opencode, model: gpt-5-nano` (8× uniform).
- **Live (after inherit fix):** `autoforge/_shared/model-policy.yaml`:
  - `architect, planner, reviewer → inherit` (no `model:` pin in `agents/autoforge-{architect,planner,reviewer}.md` — they run **same model as orchestrator/main session**). If main is `muse-spark-1.2-contributor-free` (1,048,576, 80k cap) or `gpt-5/5-nano` (400k, 80k cap) or `qwen3.5-plus` (1M) they get that window; if main is `gpt-5-nano` they get nano (no upgrade).
  - `discovery, griller, worker, validator, investigator → opencode/gpt-5-nano` (400k, 80k cap) pinned for throughput — regardless of main.
  - `defaults: gpt-5-nano` (400k) unchanged. Hierarchy stays `Global → Role → Task → Runtime` (`protocol.md §Model policy`).
- **Why:** planner/reviewer/architect benefit from main's full window for tracker-index + 2 reports verbatim; workers are throughput-optimized. **No default `gpt-5` pin** — `gpt-5` only used when you run main as `gpt-5`.

Sync gate: `scripts/verify.mjs` asserts `planner/reviewer/architect inherit` (no `model:` field) + `worker == gpt-5-nano`.

## D2 — Model-aware delegation (new, not in spec)

- **Added:** `autoforge/_shared/model-registry.yaml` — **11** seeded `opencode/*` models (`gpt-5-nano/gpt-5/gpt-5.1 400k, muse-spark-1.2 1M, muse-spark-1.2-contributor-free 1M, claude-sonnet/opus 200k, gemini-3-flash/3.1-pro 1M, qwen3.5-plus 1M, grok-4.5 500k` + `unknown 64k` fallback) with `context_window / max_output / capabilities / guidance` from `models.dev` (2026-08-05) and Opencode Zen.
- **Policy:** `registry: ./model-registry.yaml` pointer in `model-policy.yaml`.
- **Behavior:** orchestrator (`commands/autoforge.md:9`, `spawn-contract.md §2b`) **must** `resolve model → lookup registry → budget = min(context_window*0.30, 80000) → shape Task inputs` (verbatim vs summarized paragraph+`file:line` vs chunked; `fast` gets checklist, `reasoning` gets tradeoffs). Every `Task` prompt includes `Model budget: X tok (…) — inputs sized to fit`. For `inherit` roles, lookup is `registry[orchestrator_model]`.
- **Ops:** `node scripts/sync-models.mjs --check` warns if policy models are missing from registry; `opencode models` is advisory only (11-seed covers policy + common mains).

This is an **extension** — spec §12 did not mention windows. **Fix:** `muse-spark-1.2(-contributor-free)` was `128k` → corrected to `1,048,576/131,072` per `models.dev: meta/muse-spark-1.2`; `gpt-5*` corrected `128k/272k→400k/128k` per `openai/gpt-5`.

## D3 — Lifecycle → 7-stage mapping (Spec §5:12 → repo `stages/`)

Logical lifecycle is still 12 phases (`protocol.md: Lifecycle Discover→…→Reassess`). Physical **stages** compress them for ICM “one folder one job” leanness:

| Logical phase (§5) | Physical stage | CONTEXT |
|---|---|---|
| 01 Discover | `01_discovery` | maps trackers + repo state |
| 02 Grill | `02_grill` | requirements interrogation |
| 03 Architect | `03_architect` | design alternatives |
| 04 Plan + **05 Critique + 06 Approve + 07 Decompose** | `04_plan` | DAG + work-order + `touches: [globs]` + peer review of plan |
| 08 Execute | `05_execute` | workers, `touches` overlap → serial, disjoint → parallel |
| 09 Review (+10 Integrate) | `06_review` | independent reviewer + orchestrator integration |
| 11 Validate + 12 Reassess | `07_validate` | validator + investigator |

Spec §15.2’s `01_discovery, 02_requirements, 03_architecture, 04_plan, 05_execution, 06_validation + map/` is the full System Map form; this repo’s hybrid keeps the 7-stage pipeline plus flat homes (`protocol.md: Artifacts … flat homes ↔ stages/*/output`) for walk-test brevity.

## D5 — Global install layout (Spec §15.1 vs actual)

- **Spec:** `~/.config/opencode/{commands/autoforge.md, agents/autoforge/*.md (subdir), skills/autoforge/SKILL.md, autoforge/{model-policy.yaml, CONTEXT.md, schemas/, templates/, references/}}`
- **Actual:** `~/.config/opencode/{commands/autoforge*.md (6 flat), agents/autoforge-*.md (8 flat), autoforge/{AGENTS.md, CONTEXT.md, _shared/{model-policy,model-registry,protocol,spawn-contract}.yaml/md, stages/01…07/CONTEXT.md, _templates/run-template/}}`
- **Deltas:** agents are flat (opencode expects flat `agents/*.md`), `skills/autoforge/SKILL.md` not shipped (protocol is the skill), `schemas/` is `_shared/` + `stages/*/CONTEXT.md` contracts, `references/` is `stages/*/references` symlink view. `AGENTS.md` routing (<60 lines) is the small stable entry (§22 walk test).

## D6 — Planner permissions (Spec §13 vs bug fixed)

- **Spec §13:** planner `read/search/artifacts; write planning artifacts`.
- **Before fix:** `agents/autoforge-planner.md` had `edit: deny, write: deny`.
- **After fix (this commit):** `edit: allow, write: allow` (still `external_directory: ~/.config/opencode/**` + `bash: ask`), spec-compliant. `verify.mjs` does not yet assert write, but `opencode debug config` reflects it.

## D8 — Node/edge contract (Spec §6–7 vs lean)

- Spec’s full YAML frontmatter (`id/type/status/inputs/outputs/depends_on/blocked_by/reviews/skills/acceptance`) + `nodes.yaml/edges.yaml` + 13 edge verbs is **simplified** to `execution/work-order.json` with `touches: [globs] + blocked_by + DAG` (per `protocol.md: Artifacts`). One-home-per-fact + links preserved; decoration avoided per §6.2.

## D9 — Plan command model hardcode

- `commands/autoforge-plan.md` previously hard-coded `model: opencode/gpt-5` for planner/critic (and `gpt-5-nano` before that); now **no `model:`** — `Task(subagent_type="autoforge-planner", description="plan", ...)` and `reviewer` both **inherit orchestrator** per D1. Orchestrator main spec already used `model-registry` budgets.

## D10 — Validation contract (§23)

Live `scripts/verify.mjs` covers 11/15 §23 checks (commands, agents, modes, model resolution, default, override, permissions, spawn template, planner/reviewer/architect inherit + worker nano, registry 400k/1M, spawn-contract). Not yet automated: `skill routing`, `artifact exchange`, `parallel execution test`, `E2E lifecycle`, `ICM walk` — they are exercised via `node scripts/vault-sync.mjs --check` and manual walk in AuditorAI’s mission-control worktree (`feat/mission-control-afk @9482b99`).

---

**Status:** Diagram `docs/architecture.png` is authoritative for the 12-phase flow; this addendum is the delta log between that vision and the lean, model-aware implementation the installer ships. Future `map/` + full `nodes.yaml` can be added when a codebase needs System-Map change-impact (`§15.3` — don’t create `processes/effects` until real).

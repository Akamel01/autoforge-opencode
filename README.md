# autoforge-opencode

Hierarchical multi-agent orchestration for [OpenCode](https://opencode.ai) — **model-aware delegation**, ICM `stages/` pipeline, 8 specialized subagents + 6 slash commands.

Replicates the entire AutoForge factory from this repo to any macOS machine in one command. Public, versioned, `git clone && ./install.sh` is the canonical path (like `vault-sync`).

## Quick start (new machine)

```bash
# 1. clone
git clone https://github.com/<you>/autoforge-opencode.git
cd autoforge-opencode

# 2. install (global ~/.config/opencode — macOS symlinks preserved)
./install.sh
# also patch a project that needs opencode-task-model:
./install.sh --project /path/to/your/repo

# 3. restart opencode (Task plugin cache)
pkill -f opencode; opencode debug config | jq '.agent | keys'

# 4. verify
node scripts/verify.mjs
# or: ./install.sh --check   # dry-run, CI-friendly

# 5. use
opencode run "/autoforge"          # full lifecycle (auto-discovers trackers)
opencode run "/autoforge discover" # discovery only
```

## What gets installed

| Source in this repo | Dest on machine | Notes |
|---|---|---|
| `autoforge/` | `~/.config/opencode/autoforge/` | factory: `AGENTS.md`, `CONTEXT.md`, `_shared/{protocol,spawn-contract,model-policy,model-registry}.yaml`, `stages/01…07/CONTEXT.md` |
| `agents/autoforge-*.md` ×8 | `~/.config/opencode/agents/` | `discovery, griller, architect, planner(gpt-5), worker(gpt-5-nano), reviewer(gpt-5), validator, investigator` |
| `commands/autoforge*.md` ×6 | `~/.config/opencode/commands/` | `/autoforge`, `/autoforge-{discover,plan,execute,review,validate}` (`agent:build, subtask:false`) |
| `opencode.jsonc.fragment` | merged into `~/.config/opencode/opencode.jsonc` | `plugin @dietrichgebert/ponytail` + `subagent_depth:2` + `permission.task autoforge-*:allow` |
| `opencode.json.fragment` | merged into `<project>/opencode.json` (via `--project`) | `plugin opencode-task-model@1.3.1` + same depth/permissions |

Installer uses `rsync -a --delete` (preserves symlinks) + `jq` deep-merge — never clobbers your other plugins/agents; backs up to `*.bak`. Idempotent.

## Model-aware delegation

`autoforge/_shared/model-registry.yaml` is the window/capability authority (10 seeded entries: `gpt-5-nano 128k`, `gpt-5/5.1 272k`, `claude-sonnet/opus 200k`, `gemini 1M`, `qwen/muse/grok 128k` + `unknown 64k` fallback). `model-policy.yaml` points to it via `registry: ./model-registry.yaml`.

- **Bigger models for critical tasks:** `planner, reviewer, architect → opencode/gpt-5` (272k, budget 80k); others `→ gpt-5-nano` (128k, budget 38k). Hierarchy `defaults → role → task → runtime` per `protocol.md:51`.
- **Orchestrator sizes every `Task`:** `budget = min(context_window * 0.30, 80000)` tok; if `sum(inputs) > budget` it summarizes reports (paragraph + `file:line`) or chunks; `fast` models get checklist, `reasoning` models get tradeoffs/risks. Prompt always includes `Model budget: X tok (...) — inputs sized to fit` (see `spawn-contract.md` template).

Edit `model-registry.yaml` to add a model, edit `model-policy.yaml` to route a role, no code change. `node scripts/sync-models.mjs --check` warns if `opencode models` exposes a name not yet in the registry.

## Verification

```bash
node scripts/verify.mjs
# expects: commands 6, agents 8, subagent_depth 2, permission allow,
#          planner/reviewer on gpt-5, registry 10+ entries, spawn-contract Model budget

node scripts/sync-models.mjs --check  # CI: fails if registry missing a model you use
opencode debug config | jq '.agent["autoforge-planner"].model'  # "opencode/gpt-5"
```

## Updating

```bash
git pull
./install.sh          # re-syncs factory + re-merges fragments
node scripts/verify.mjs
```

## Requirements

- macOS (symlinks), `opencode >=1.18`, `jq`, `rsync`, `node >=18`, `opencode-task-model` pinned at `1.3.1`, `@dietrichgebert/ponytail` (global).

## License

MIT — see `LICENSE` if present.

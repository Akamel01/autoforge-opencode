# AutoForge — global factory

Hierarchical multi-agent engineering orchestration. Folders carry sequencing, links beat copies, state is files.

## Where things live

| Path | Holds |
|---|---|
| `_shared/` | factory: `protocol.md`, `spawn-contract.md`, `model-policy.yaml` (stable every run) |
| `stages/` | pipeline contracts — `NN_name/CONTEXT.md` + `references/` per phase |
| `_templates/` | blank run starter — copy to start new `.autoforge` run |
| `~/.config/opencode/agents/autoforge-*.md` | agent definitions (factory) |
| `~/.config/opencode/commands/autoforge*.md` | slash commands (factory) |

## Route by what just happened

| If | Go to | Then |
|---|---|---|
| ` /autoforge` full run | `.autoforge/AGENTS.md` (product) | scan `stages/*/output/` for status |
| need factory rules | `_shared/protocol.md` | read model-policy + spawn-contract |
| new stage contract | `stages/NN_name/CONTEXT.md` | implement only that job |
| status of a run | `.autoforge/stages/*/output/` | reports what exists |

One rule: no CONTECT.md is ever copied — link to `_shared/` instead.

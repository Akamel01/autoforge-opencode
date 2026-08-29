# AutoForge — the pipeline

The flow in one line: discover → grill → architect → plan → execute → review → validate → loop until GO.

| Stage | Job | Input | Output | Human check |
|---|---|---|---|---|
| `01_discovery` | map trackers & repo | handoff / repo / .autoforge prior | `output/report.md` + `tracker-index.md` | index lists every frontier ticket |
| `02_grill` | interrogate requirements | 01 output | `output/grilling.md` | assumptions & escalations named |
| `03_architect` | choose boundaries | 01+02 output | `output/decisions.md` | smallest correct change chosen |
| `04_plan` | DAG with touches | tracker-index + 01-03 | `output/plan.md` + `work-order.json` | every index entry → module with touches |
| `05_execute` | implement modules | work-order DAG | `output/<id>.md` + code | tests/typecheck per module |
| `06_review` | independent review | 05 output + contract | `output/<id>.md` | verdict APPROVED/... |
| `07_validate` | evidence + adversarial | all prior + code | `report.md` + `investigation.md` | GO/REPLAN with evidence |

Factory (stable, every run): `_shared/{protocol,spawn-contract,model-policy}`
Product (new each run): `.autoforge/stages/*/output/` (project-local)

Status is whatever exists: a stage is COMPLETE when its `output/` holds files other than `.gitkeep`.

#!/usr/bin/env node
// verify.mjs — gates for AutoForge installation (model-aware)
import { execSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, lstatSync } from "node:fs";
import { join } from "node:path";

const GLOBAL = `${process.env.HOME}/.config/opencode`;
let fail = 0;
const ok = (m) => console.log(`✓ ${m}`);
const bad = (m) => { console.error(`✗ ${m}`); fail++; };

function sh(cmd) {
  try { return execSync(cmd, { encoding: "utf8", stdio: ["pipe","pipe","pipe"] }); } catch (e) { return e.stdout?.toString() ?? ""; }
}

// 1. opencode debug config
try {
  const raw = execSync("opencode debug config 2>&1", { encoding: "utf8" });
  const cfg = JSON.parse(raw);
  const cmds = Object.keys(cfg.command || {}).filter(k => k.includes("autoforge"));
  const agents = Object.keys(cfg.agent || {}).filter(k => k.includes("autoforge"));
  if (cmds.length >= 6) ok(`commands: ${cmds.length} (${cmds.join(", ")})`); else bad(`commands expected 6, got ${cmds.length}: ${cmds}`);
  if (agents.length >= 8) ok(`agents: ${agents.length} (${agents.join(", ")})`); else bad(`agents expected 8, got ${agents.length}`);
  if (cfg.subagent_depth === 2) ok("subagent_depth: 2"); else bad(`subagent_depth expected 2, got ${cfg.subagent_depth}`);
  if (cfg.permission?.task?.["autoforge-*"] === "allow") ok("permission.task autoforge-*: allow"); else bad("permission.task autoforge-* missing");
   // check model specialization: planner/reviewer/architect inherit orchestrator (no pin), workers pin nano
  const planner = cfg.agent?.["autoforge-planner"]?.model;
  const reviewer = cfg.agent?.["autoforge-reviewer"]?.model;
  const architect = cfg.agent?.["autoforge-architect"]?.model;
  const worker = cfg.agent?.["autoforge-worker"]?.model;
  if (!planner || planner === cfg.model || planner === cfg.default_model) ok(`planner inherits orchestrator (no pin, got ${planner ?? "inherit"})`);
  else if (planner === "opencode/gpt-5") bad(`planner still pinned gpt-5 — should inherit orchestrator (remove model field) got ${planner}`);
  else ok(`planner inherits (model=${planner}) — verify inherits main`);
  if (!reviewer || reviewer === cfg.model || reviewer === cfg.default_model) ok(`reviewer inherits orchestrator (got ${reviewer ?? "inherit"})`);
  else if (reviewer === "opencode/gpt-5") bad(`reviewer still pinned gpt-5 — should inherit`);
  else ok(`reviewer inherits (model=${reviewer})`);
  if (!architect || architect === cfg.model) ok(`architect inherits orchestrator (got ${architect ?? "inherit"})`);
  else if (architect === "opencode/gpt-5") bad(`architect still pinned gpt-5 — should inherit`);
  else ok(`architect inherits (model=${architect})`);
  if (worker === "opencode/gpt-5-nano") ok(`worker pinned gpt-5-nano`);
  else bad(`worker expected gpt-5-nano, got ${worker}`);
} catch (e) {
  bad(`opencode debug config failed: ${e.message}`);
}

// 2. factory files
for (const p of ["autoforge/_shared/model-registry.yaml","autoforge/_shared/model-policy.yaml","autoforge/_shared/protocol.md","autoforge/_shared/spawn-contract.md"]) {
  if (existsSync(join(GLOBAL, p))) ok(p); else bad(`missing ${p}`);
}
for (const s of ["01_discovery","02_grill","03_architect","04_plan","05_execute","06_review","07_validate"]) {
  const c = join(GLOBAL, `autoforge/stages/${s}/CONTEXT.md`);
  if (existsSync(c)) ok(`stages/${s}/CONTEXT.md`); else bad(`missing ${c}`);
}

// 3. model-registry lookup
try {
  const regRaw = readFileSync(join(GLOBAL, "autoforge/_shared/model-registry.yaml"), "utf8");
  const hasNano = regRaw.includes("opencode/gpt-5-nano") && regRaw.includes("context_window: 400000");
  const hasGpt5 = regRaw.includes("opencode/gpt-5:") && regRaw.includes("context_window: 400000");
  const hasSpark = regRaw.includes("opencode/muse-spark-1.2-contributor-free") && regRaw.includes("1048576");
  const count = (regRaw.match(/opencode\//g) || []).length;
  if (hasNano) ok("registry gpt-5-nano 400k"); else bad("registry gpt-5-nano missing 400k");
  if (hasGpt5) ok("registry gpt-5 400k"); else bad("registry gpt-5 missing 400k");
  if (hasSpark) ok("registry muse-spark-1.2-contributor-free 1M"); else bad("registry muse-spark 1M missing");
  if (count >= 11) ok(`registry entries: ${count} >=11`); else bad(`registry entries ${count} <11`);
  const polRaw = readFileSync(join(GLOBAL, "autoforge/_shared/model-policy.yaml"), "utf8");
  if (polRaw.includes("registry:")) ok("model-policy references registry"); else bad("model-policy missing registry pointer");
  if (polRaw.includes("planner:") && polRaw.includes("model: inherit")) ok("model-policy planner->inherit"); else bad("model-policy planner not inherit");
} catch (e) { bad(`registry check: ${e.message}`); }

// 4. spawn-contract model-aware
try {
  const sc = readFileSync(join(GLOBAL, "autoforge/_shared/spawn-contract.md"), "utf8");
  if (sc.includes("Model budget")) ok("spawn-contract model-aware (Model budget)"); else bad("spawn-contract missing Model budget");
  const proto = readFileSync(join(GLOBAL, "autoforge/protocol.md"), "utf8");
  if (proto.includes("model-registry")) ok("protocol references model-registry"); else bad("protocol missing model-registry");
} catch (e) { bad(`${e.message}`); }

console.log(fail ? `\n${fail} check(s) failed` : "\nall checks passed");
process.exit(fail ? 1 : 0);

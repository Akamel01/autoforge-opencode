#!/usr/bin/env node
// sync-models.mjs — diff `opencode models` vs model-registry.yaml
// Usage: node scripts/sync-models.mjs [--check]
// --check: exit 1 if registry missing any model that opencode exposes (warn, not auto-mutate)
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const check = process.argv.includes("--check");
const regPath = join(process.env.HOME, ".config/opencode/autoforge/_shared/model-registry.yaml");
let opencodeModels = [];
try {
  const out = execSync("opencode models 2>&1", { encoding: "utf8" });
  opencodeModels = out.split("\n").map(s=>s.trim()).filter(s=>s.startsWith("opencode/"));
} catch (e) {
  console.error(`opencode models failed: ${e.message}`);
  process.exit(2);
}
let regRaw = "";
try { regRaw = readFileSync(regPath, "utf8"); } catch { console.error(`missing ${regPath}`); process.exit(2); }

const policyPath = join(process.env.HOME, ".config/opencode/autoforge/_shared/model-policy.yaml");
let policyModels = [];
try {
  const polRaw = readFileSync(policyPath, "utf8");
  policyModels = [...polRaw.matchAll(/model:\s*(g[\w\-.]+|claude[\w\-.]+|gemini[\w\-.]+|qwen[\w\-.]+|muse[\w\-.]+|grok[\w\-.]+|opencode\/[\w\-.]+)/g)].map(m=>m[1]).map(s=> s.includes("/") ? s : `opencode/${s}`);
  policyModels = [...new Set(policyModels)];
} catch { policyModels = []; }
const missingPolicy = policyModels.filter(m => !regRaw.includes(m));
const missingFromOpencode = opencodeModels.filter(m => !regRaw.includes(m));
if (missingPolicy.length === 0) {
  console.log(`✓ registry covers ${policyModels.length} policy models: ${policyModels.join(", ")}`);
} else {
  console.log(`✗ registry missing ${missingPolicy.length} policy model(s) (used in model-policy.yaml):`);
  missingPolicy.forEach(m => console.log(`  - ${m}`));
  if (check) process.exit(1);
}
if (missingFromOpencode.length > 0) {
  console.log(`ℹ registry seeds 10/${opencodeModels.length} opencode models — ${missingFromOpencode.length} opencode models not seeded (add if you plan to use them).`);
}

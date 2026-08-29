#!/usr/bin/env bash
set -euo pipefail
# AutoForge installer — macOS, symlinks preserved, idempotent, no blanket clobber.
# Usage: ./install.sh [--check] [--project DIR]
#   --check   dry-run: diff what would change, exit 1 if drift
#   --project DIR  also patch DIR/opencode.json with task-model fragment

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
GLOBAL_CFG="$HOME/.config/opencode"
CHECK=0
PROJECT_DIR=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --check) CHECK=1; shift ;;
    --project) PROJECT_DIR="$2"; shift 2 ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

need() { command -v "$1" >/dev/null 2>&1 || { echo "missing: $1" >&2; exit 1; }; }
need rsync
need jq

mkdir -p "$GLOBAL_CFG/autoforge/_shared" "$GLOBAL_CFG/agents" "$GLOBAL_CFG/commands"

# 1) autoforge factory (preserve symlinks)
echo "→ syncing autoforge factory to $GLOBAL_CFG/autoforge/"
if [[ $CHECK -eq 1 ]]; then
  rsync -a --delete -n --out-format="%n" "$REPO_DIR/autoforge/" "$GLOBAL_CFG/autoforge/" || true
  diffs=$(rsync -a --delete -n "$REPO_DIR/autoforge/" "$GLOBAL_CFG/autoforge/" | wc -l)
  if [[ "$diffs" -gt 0 ]]; then echo "drift: $diffs files would change"; exit 1; fi
  echo "check: factory in sync"
else
  rsync -a --delete "$REPO_DIR/autoforge/" "$GLOBAL_CFG/autoforge/"
fi

# 2) agents
echo "→ syncing agents"
if [[ $CHECK -eq 1 ]]; then
  rsync -a -n --out-format="%n" "$REPO_DIR/agents/autoforge-"*.md "$GLOBAL_CFG/agents/" || true
else
  rsync -a "$REPO_DIR/agents/autoforge-"*.md "$GLOBAL_CFG/agents/"
fi

# 3) commands
echo "→ syncing commands"
if [[ $CHECK -eq 1 ]]; then
  rsync -a -n --out-format="%n" "$REPO_DIR/commands/autoforge"*.md "$GLOBAL_CFG/commands/" || true
else
  rsync -a "$REPO_DIR/commands/autoforge"*.md "$GLOBAL_CFG/commands/"
fi

# 4) merge global opencode.jsonc (ponytail + depth2 + permissions) — jq merge, backup
merge_global() {
  local target="$GLOBAL_CFG/opencode.jsonc"
  local fragment="$REPO_DIR/opencode.jsonc.fragment"
  if [[ ! -f "$target" ]]; then
    echo "→ creating $target"
    [[ $CHECK -eq 1 ]] && { echo "would create $target"; return; }
    cp "$fragment" "$target"
    return
  fi
  local tmp
  tmp=$(mktemp)
  # merge: keep existing keys, deep-merge permission.task, dedup plugin array
  jq -s '
    (.[0] * .[1])
    | .plugin = ((.[0].plugin // []) + (.[1].plugin // []) | unique)
    | .permission.task = ((.[0].permission.task // {}) * (.[1].permission.task // {}))
  ' "$target" "$fragment" > "$tmp"
  if ! diff -q "$target" "$tmp" >/dev/null 2>&1; then
    echo "→ merging $target (backup: $target.bak)"
    [[ $CHECK -eq 1 ]] && { echo "would merge $target"; cat "$tmp" | head -n 30; rm "$tmp"; return; }
    cp "$target" "$target.bak"
    mv "$tmp" "$target"
  else
    rm "$tmp"
    echo "  $target already merged"
  fi
}
merge_global

# 5) merge project opencode.json if requested
if [[ -n "$PROJECT_DIR" ]]; then
  target="$PROJECT_DIR/opencode.json"
  fragment="$REPO_DIR/opencode.json.fragment"
  echo "→ merging project $target"
  if [[ ! -f "$target" ]]; then
    [[ $CHECK -eq 1 ]] && { echo "would create $target"; exit 0; }
    cp "$fragment" "$target"
  else
    tmp=$(mktemp)
    jq -s '
      (.[0] * .[1])
      | .plugin = ((.[0].plugin // []) + (.[1].plugin // []) | unique)
      | .permission.task = ((.[0].permission.task // {}) * (.[1].permission.task // {}))
    ' "$target" "$fragment" > "$tmp"
    if ! diff -q "$target" "$tmp" >/dev/null 2>&1; then
      [[ $CHECK -eq 1 ]] && { echo "would merge $target"; rm "$tmp"; exit 1; }
      cp "$target" "$target.bak"
      mv "$tmp" "$target"
    else
      rm "$tmp"
      echo "  project already merged"
    fi
  fi
fi

# 6) deps (global)
echo "→ installing deps in $GLOBAL_CFG"
if [[ $CHECK -eq 0 ]]; then
  if command -v bun >/dev/null 2>&1; then
    (cd "$GLOBAL_CFG" && bun install --silent 2>&1 | tail -n 5) || (cd "$GLOBAL_CFG" && npm install --silent 2>&1 | tail -n 5)
  else
    (cd "$GLOBAL_CFG" && npm install --silent 2>&1 | tail -n 5)
  fi
fi

echo "→ verify"
if command -v node >/dev/null 2>&1 && [[ -f "$REPO_DIR/scripts/verify.mjs" ]]; then
  node "$REPO_DIR/scripts/verify.mjs" || {
    echo "verify failed — run: node scripts/verify.mjs" >&2
    exit 1
  }
else
  echo "  skip verify (no node/scripts)"
fi

echo "✓ done. Restart opencode to reload Task plugin cache: pkill -f opencode; opencode debug config"
echo "  quick check: opencode debug config | jq '.agent | keys | map(select(startswith(\"autoforge\")))'"

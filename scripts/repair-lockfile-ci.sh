#!/usr/bin/env bash
# ============================================================================
# STARFRONT 3D — RELEASE GATE R2.1
# Script: scripts/repair-lockfile-ci.sh
# Purpose: Explicit, auditable lockfile regeneration script for networked CI
#          or developer workstations with access to https://registry.npmjs.org.
#
# Per Task A Non-Negotiable Rules:
# - Never silently rewrite dependencies to pass the gate.
# - Regenerate package-lock.json explicitly from package.json pinning
#   official three@0.160.0, @types/three@0.160.0, typescript@5.3.3,
#   vite@5.0.12, and vitest@1.2.2, then commit as a separate reviewed change.
# ============================================================================
set -euo pipefail

echo "=== [Task A] Regenerating package-lock.json from registry.npmjs.org ==="
rm -rf node_modules package-lock.json

npm install --package-lock-only --registry=https://registry.npmjs.org \
  three@0.160.0 \
  --save-exact

npm install --package-lock-only --registry=https://registry.npmjs.org -D \
  @types/three@0.160.0 \
  typescript@5.3.3 \
  vite@5.0.12 \
  vitest@1.2.2 \
  @babel/core@7.29.0 \
  @babel/preset-typescript@7.28.5

echo "=== [Task A] Auditing generated package-lock.json ==="
node -e '
  const fs = require("fs");
  const lock = JSON.parse(fs.readFileSync("package-lock.json", "utf8"));
  const pkgs = lock.packages || {};
  for (const k of ["node_modules/three", "node_modules/@types/three", "node_modules/typescript", "node_modules/vite", "node_modules/vitest"]) {
    if (!pkgs[k] || !pkgs[k].resolved || !pkgs[k].integrity) {
      throw new Error("Missing resolved/integrity for " + k);
    }
    console.log("Verified lockfile entry:", k, pkgs[k].version, pkgs[k].integrity.slice(0, 24) + "...");
  }
'

echo "=== [Task A] Testing clean install via npm ci ==="
npm ci
echo "=== [Task A] Lockfile repair complete. Commit package.json and package-lock.json in a dedicated PR. ==="

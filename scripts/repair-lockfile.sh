#!/usr/bin/env bash
# ============================================================================
# STARFRONT 3D — PHASE 1: LOCKFILE REPAIR SCRIPT (NETWORKED ENVIRONMENT)
# Repairs the incomplete offline package-lock.json against registry.npmjs.org
# and outputs lockfile-repair.diff for separate review before committing.
# ============================================================================
set -euo pipefail

echo "=== Step 1: Removing air-gapped local node_modules shim ==="
rm -rf node_modules

echo "=== Step 2: Resolving complete dependency tree from official npm registry ==="
npm install --package-lock-only --registry=https://registry.npmjs.org

echo "=== Step 3: Verifying lockfile completeness ==="
node -e '
const fs = require("fs");
const lock = JSON.parse(fs.readFileSync("package-lock.json", "utf8"));
const pkgs = Object.keys(lock.packages || {});
const three = lock.packages?.["node_modules/three"];
console.log("Total locked packages:", pkgs.length);
console.log("node_modules/three:", JSON.stringify(three, null, 2));
if (!three || three.version !== "0.160.0" || !three.resolved || !three.integrity) {
  console.error("ERROR: node_modules/three is missing official registry resolved/integrity metadata!");
  process.exit(1);
}
'

echo "=== Step 4: Generating lockfile diff for separate review ==="
git diff package-lock.json > lockfile-repair.diff || true
echo "Lockfile repaired successfully. Review package-lock.json and lockfile-repair.diff before committing."

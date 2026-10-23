#!/usr/bin/env node
// ============================================================================
// STARFRONT 3D — PHASE 2: OFFICIAL THREE.JS PROOF VERIFIER
// Verifies that:
// 1. `npm ls three` resolves `three@0.160.0` from `node_modules/three`
// 2. `node_modules/three/package.json` is the official upstream package
//    (contains `build/three.module.js`, not the offline `three-webgl2.js` shim)
// 3. `dist/build-import-graph.json` emitted by `npm run build:vite` includes
//    `node_modules/three/build/three.module.js` and zero references to
//    `src/vendor/three-webgl2.js`
// 4. `dist/index.html` has zero external CDN `<script>` or `<link>` tags
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';

const ROOT = process.cwd();
const require = createRequire(import.meta.url);

function detectCustomShim(entrySource, threePkg) {
  const markers = [
    '160-offline-webgl2-shim',
    '160-webgl2-vs001',
    'offline-webgl2-shim',
    'Offline Air-Gapped WebGL2 Fallback',
    'Three.js WebGL2 3D Engine Module for STARFRONT',
    'IS_OFFICIAL_THREE = false',
    '0.160.0-offline-shim'
  ];
  const sourceHit = markers.some((m) => entrySource.includes(m));
  const versionHit =
    typeof threePkg.version === 'string' &&
    (threePkg.version.includes('offline') || threePkg.version.includes('shim'));
  const falseOfficialFlag = /export\s+const\s+IS_OFFICIAL_THREE\s*=\s*false/.test(entrySource);
  return sourceHit || versionHit || falseOfficialFlag;
}

function verifyOfficialThree() {
  let npmLsOutput = '';
  try {
    npmLsOutput = execSync('npm ls three --json', { encoding: 'utf8' });
  } catch (e) {
    npmLsOutput = e.stdout || String(e);
  }

  const threePkgPath = path.join(ROOT, 'node_modules', 'three', 'package.json');
  if (!fs.existsSync(threePkgPath)) {
    throw new Error('Missing node_modules/three/package.json');
  }
  const threePkg = JSON.parse(fs.readFileSync(threePkgPath, 'utf8'));
  const resolvedEntry = require.resolve('three');
  const threeModuleFile = path.join(ROOT, 'node_modules', 'three', 'build', 'three.module.js');
  const hasOfficialBuildModule = fs.existsSync(threeModuleFile);
  const entrySource = fs.readFileSync(resolvedEntry, 'utf8');
  const isCustomShim = detectCustomShim(entrySource, threePkg);

  const importGraphPath = path.join(ROOT, 'dist', 'build-import-graph.json');
  let importGraph = null;
  if (fs.existsSync(importGraphPath)) {
    importGraph = JSON.parse(fs.readFileSync(importGraphPath, 'utf8'));
  }

  const distHtmlPath = path.join(ROOT, 'dist', 'index.html');
  const distHtml = fs.existsSync(distHtmlPath) ? fs.readFileSync(distHtmlPath, 'utf8') : '';
  // Vite relative asset URLs are fine; only absolute http(s) CDN refs are prohibited.
  const hasExternalCdn = /<(?:script|link)[^>]+(?:src|href)\s*=\s*["']https?:\/\//i.test(distHtml);

  const vendorShimInDist =
    distHtml.includes('three-webgl2') ||
    distHtml.includes('160-offline-webgl2-shim') ||
    (importGraph?.customShimModuleCount ?? 0) > 0;

  const report = {
    timestamp: new Date().toISOString(),
    npmLsThree: JSON.parse(npmLsOutput || '{}'),
    resolvedVersion: threePkg.version,
    resolvedMainPath: resolvedEntry,
    hasOfficialThreeModuleBuild: hasOfficialBuildModule,
    isCustomWebGL2Shim: isCustomShim,
    vendorShimReferencedInDist: vendorShimInDist,
    viteImportGraph: importGraph
      ? {
          totalModules: importGraph.totalModules,
          threeModuleCount: importGraph.threeModuleCount,
          customShimModuleCount: importGraph.customShimModuleCount,
          usesOfficialThree: importGraph.usesOfficialThree,
          threeModules: importGraph.threeModules
        }
      : null,
    hasExternalCdnDependency: hasExternalCdn,
    verdict:
      threePkg.version === '0.160.0' &&
      hasOfficialBuildModule &&
      !isCustomShim &&
      !vendorShimInDist &&
      importGraph?.usesOfficialThree === true &&
      !hasExternalCdn
        ? 'PASS'
        : 'BLOCKED_OFFLINE_SHIM_PRESENT'
  };

  const outPath = path.join(ROOT, 'artifacts', 'official-three-proof.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');

  console.log(JSON.stringify(report, null, 2));
  if (report.verdict !== 'PASS') {
    process.exitCode = 1;
  }
}

verifyOfficialThree();

#!/usr/bin/env node
/**
 * STARFRONT 3D — Offline / air-gapped standalone HTML+JS builder.
 *
 * CRITICAL (R2.1):
 * - MUST NOT overwrite node_modules/three.
 * - Official production uses `npm run build:vite` with npm three@0.160.0.
 * - This builder always inlines the isolated offline shim from src/vendor/
 *   into dist/ standalone artifacts for air-gapped / mocked-DOM tests only.
 * - A copy is also written under dist/offline-shim/three/ — never node_modules.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
let babel;
let tsPlugin;
try {
  babel = require('@babel/core');
  tsPlugin = require('@babel/plugin-transform-typescript');
} catch {
  babel = require('/usr/share/nodejs/@babel/core');
  tsPlugin = require('/usr/share/nodejs/@babel/plugin-transform-typescript');
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const shimPath = path.join(rootDir, 'src/vendor/three-webgl2.js');

function transpileTS(relPath) {
  const fullPath = path.join(rootDir, relPath);
  const src = fs.readFileSync(fullPath, 'utf8');
  const res = babel.transformSync(src, {
    filename: relPath,
    plugins: [[tsPlugin, { isTSX: false }]],
    configFile: false,
    babelrc: false
  });
  let code = res.code;
  code = code.replace(/^\s*import\s+[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '');
  code = code.replace(/^\s*export\s+\{[^}]*\};?\s*$/gm, '');
  code = code.replace(/^\s*export\s+(const|let|var|function|class)\s+/gm, '$1 ');
  return `\n// ==========================================\n// MODULE: ${relPath}\n// ==========================================\n` + code;
}

console.warn('[BUILD WARNING] Standalone artifacts use the OFFLINE WebGL2 shim (src/vendor/three-webgl2.js).');
console.warn('[BUILD WARNING] These artifacts are NOT valid for Official Three.js R2.1 production proof.');
console.warn('[BUILD WARNING] Use `npm run build:vite` + `node scripts/verify-official-three.mjs` for the official gate.');
console.warn('[BUILD WARNING] node_modules/three is intentionally left untouched (shim isolation).');

const threeRaw = fs.readFileSync(shimPath, 'utf8');
const threeBody = threeRaw.replace(/^\s*export\s+(const|let|var|function|class)\s+/gm, '$1 ');

const specsCode = transpileTS('src/core/specs.ts');
const typesCode = transpileTS('src/core/types.ts');
const simCode = transpileTS('src/core/simulation.ts');
const adapterCode = transpileTS('src/adapter/worldAdapter.ts');
const modelsCode = transpileTS('src/render/models3d.ts');
const sceneCode = transpileTS('src/render/scene3d.ts');
const gestureCode = transpileTS('src/input/unifiedGesture.ts');
const inputCode = transpileTS('src/input/inputController.ts');
const mainCode = transpileTS('src/main.ts');

const bundleJS = `(function() {
  "use strict";

  // --- OFFLINE WEBGL2 SHIM (NOT official three — R2.1 official gate BLOCKED for this artifact) ---
${threeBody}

  const THREE = {
    REVISION,
    IS_OFFICIAL_THREE,
    Vector2, Vector3, Color, Matrix4, Euler, Quaternion, Box3, Sphere, Plane, Ray, Frustum,
    Object3D, Group, Scene, OrthographicCamera, PerspectiveCamera, Raycaster,
    BufferAttribute, Float32BufferAttribute, InstancedBufferAttribute,
    BufferGeometry, InstancedBufferGeometry,
    BoxGeometry, CylinderGeometry, ConeGeometry, SphereGeometry, DodecahedronGeometry, PlaneGeometry, RingGeometry,
    LineSegments, GridHelper,
    Material, LineBasicMaterial, MeshBasicMaterial, MeshLambertMaterial, MeshPhongMaterial, MeshStandardMaterial,
    Mesh, InstancedMesh,
    AmbientLight, DirectionalLight, HemisphereLight,
    WebGLRenderer,
    DoubleSide, FrontSide, BackSide, NoBlending, AdditiveBlending, NormalBlending, BasicShadowMap, PCFShadowMap, PCFSoftShadowMap,
    DynamicDrawUsage, StaticDrawUsage
  };

  if (typeof window !== 'undefined') {
    window.THREE = THREE;
  }

${specsCode}
${typesCode}
${simCode}
${adapterCode}
${modelsCode}
${sceneCode}
${gestureCode}
${inputCode}
${mainCode}
})();
`;

const distDir = path.join(rootDir, 'dist');
fs.mkdirSync(distDir, { recursive: true });
fs.writeFileSync(path.join(distDir, 'starfront-3d-slice.js'), bundleJS, 'utf8');

const htmlTemplate = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
// Offline standalone inlines the shim IIFE (replaces the Vite boot module entry).
const standaloneHTML = htmlTemplate
  .replace('<script type="module" src="/src/boot.ts"></script>', () => `<script>\n${bundleJS}\n</script>`)
  .replace('<script type="module" src="/src/main.ts"></script>', () => `<script>\n${bundleJS}\n</script>`);
fs.writeFileSync(path.join(distDir, 'standalone-shim.html'), standaloneHTML, 'utf8');

// Deterministic Game Core + Adapter ES module for Node tests — NO Three.js dependency.
const coreModuleJS = `
${specsCode}
${simCode}
${adapterCode}
export {
  WEAPON_LOADOUTS,
  UNIT_SPECS,
  BUILDING_SPECS,
  FACTION_COLORS,
  WORLD_SCALE,
  VS_WORLD_W,
  VS_WORLD_H,
  SLICE_WORLD_W,
  SLICE_WORLD_H,
  FIXED_DT,
  MAX_FRAME_DELTA,
  MAX_CATCHUP_STEPS,
  FIGHTER_SORTIE_COST,
  sanitizeResource,
  GameCore,
  WorldAdapter,
  lerpAngle
};
`;
fs.writeFileSync(path.join(distDir, 'core-bundle.mjs'), coreModuleJS, 'utf8');

// Isolate offline shim under dist/offline-shim/ — NEVER write into node_modules/three.
const offlineShimDir = path.join(distDir, 'offline-shim', 'three');
fs.mkdirSync(offlineShimDir, { recursive: true });
fs.writeFileSync(
  path.join(offlineShimDir, 'package.json'),
  JSON.stringify(
    {
      name: 'three-offline-webgl2-shim',
      version: '0.160.0-offline-shim',
      type: 'module',
      main: './index.js',
      description: 'ISOLATED offline shim. NOT official three. Must not be placed in node_modules/three.'
    },
    null,
    2
  ),
  'utf8'
);
fs.copyFileSync(shimPath, path.join(offlineShimDir, 'index.js'));

const provenance = {
  generatedAt: new Date().toISOString(),
  artifact: 'standalone-offline-shim',
  usedOfficialThree: false,
  usedCustomShim: true,
  shimSourcePath: 'src/vendor/three-webgl2.js',
  isolatedShimCopy: 'dist/offline-shim/three',
  standaloneHtml: 'dist/standalone-shim.html',
  standaloneJs: 'dist/starfront-3d-slice.js',
  coreBundle: 'dist/core-bundle.mjs',
  nodeModulesThreeUntouched: true,
  releaseGateNote:
    'Standalone shim artifacts are for offline/mocked-DOM tests only. Official R2.1 production proof requires npm run build:vite.'
};
fs.writeFileSync(path.join(distDir, 'standalone-build-provenance.json'), JSON.stringify(provenance, null, 2), 'utf8');

console.log('Built dist/standalone-shim.html, dist/starfront-3d-slice.js, dist/core-bundle.mjs');
console.log('Isolated offline shim copy: dist/offline-shim/three/ (node_modules/three NOT modified)');
console.log(JSON.stringify(provenance, null, 2));

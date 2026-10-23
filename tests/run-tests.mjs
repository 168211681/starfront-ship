#!/usr/bin/env node
// ============================================================================
// STARFRONT 3D — VERTICAL SLICE 001: SEPARATED TEST PIPELINE (R2.1)
//
// Suites (selectable via CLI flags; default = all local suites):
//   --core     Deterministic Game Core + WorldAdapter (TEST-01..10)
//   --shim     Offline WebGL2 shim API compatibility (TEST-11)
//   --offline  Offline standalone IIFE mocked-DOM audit (TEST-12)
//   --all      All of the above (default)
//
// Official Three.js production proof:  node scripts/verify-official-three.mjs
// Browser verification (Vite dist):    node tests/browser-verify.mjs
// ============================================================================
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const args = new Set(process.argv.slice(2));
const runAll = args.size === 0 || args.has('--all');
const runCore = runAll || args.has('--core');
const runShim = runAll || args.has('--shim');
const runOffline = runAll || args.has('--offline');

function ensureCoreBundle() {
  const coreBundlePath = path.join(ROOT, 'dist', 'core-bundle.mjs');
  const slicePath = path.join(ROOT, 'dist', 'starfront-3d-slice.js');
  const needCore = runCore && !fs.existsSync(coreBundlePath);
  const needSlice = runOffline && !fs.existsSync(slicePath);
  if (!needCore && !needSlice) return;
  console.log('[tests] Building offline standalone / core-bundle via scripts/build-standalone.mjs …');
  const r = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'build-standalone.mjs')], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: 'inherit'
  });
  if (r.status !== 0) {
    throw new Error('build-standalone.mjs failed; cannot run tests that need dist artifacts');
  }
}

ensureCoreBundle();

const results = [];

function runTest(id, name, suite, fn) {
  try {
    const detail = fn();
    results.push({ id, name, suite, status: 'PASS', detail: detail || 'OK' });
    console.log(`✅ [PASS] ${id}: ${name} — ${detail || 'OK'}`);
  } catch (err) {
    results.push({ id, name, suite, status: 'FAIL', detail: err.message });
    console.error(`❌ [FAIL] ${id}: ${name} — ${err.message}`);
  }
}

console.log('====================================================================');
console.log('STARFRONT 3D — VERTICAL SLICE 001: RELEASE GATE R2.1 TEST SUITE');
console.log(`Suites: core=${runCore} shim=${runShim} offline=${runOffline}`);
console.log('====================================================================');

if (runCore) {
  const {
    GameCore,
    WorldAdapter,
    FIXED_DT,
    FACTION_COLORS
  } = await import('../dist/core-bundle.mjs');

  console.log('\n--- SUITE: Deterministic Game Core ---');

  runTest('TEST-01', 'A1: Fighter cannot launch without required buildings (Airfield + Radar)', 'core', () => {
    const core = new GameCore();
    core.state.crystals = 1000;
    core.state.cdFighterSortie = 0;

    const r1 = core.scrambleFighterInterceptors(600, 400, true);
    const r2 = core.activateFighterAirDefense();
    assert.equal(r1, false, 'Should block fighter launch without airfield');
    assert.equal(r2, false, 'Should block air defense without airfield');

    core.spawnBuilding('airfield', 220, 600, 'player');
    const r3 = core.scrambleFighterInterceptors(600, 400, true);
    assert.equal(r3, false, 'Should block fighter launch without radar');
    assert.equal(core.state.crystals, 1000, 'Crystals must not be deducted on blocked launch');
    assert.equal(core.state.cdFighterSortie, 0, 'Cooldown must remain 0 on blocked launch');
    return 'Blocked when missing Airfield or Radar; crystals unchanged (1000/1000), cd=0';
  });

  runTest('TEST-02', 'A1: Fighter cannot launch without sufficient resources (< 180 GDP)', 'core', () => {
    const core = new GameCore();
    core.spawnBuilding('airfield', 220, 600, 'player');
    core.spawnBuilding('radar', 280, 600, 'player');

    core.state.crystals = 0;
    assert.equal(core.scrambleFighterInterceptors(600, 400, true), false, 'Should block at 0 crystals');

    core.state.crystals = 179;
    assert.equal(core.scrambleFighterInterceptors(600, 400, false), false, 'Should block at 179 crystals');
    assert.equal(core.state.crystals, 179, 'Crystals unchanged at 179');
    return 'Blocked at 0 and 179 GDP';
  });

  runTest('TEST-03', 'A1: Valid Fighter launch deducts 180 GDP, sets 11s cooldown, spawns 2 F-22s', 'core', () => {
    const core = new GameCore();
    core.spawnBuilding('airfield', 220, 600, 'player');
    core.spawnBuilding('radar', 280, 600, 'player');
    core.state.crystals = 500;
    core.state.cdFighterSortie = 0;

    const ok = core.scrambleFighterInterceptors(600, 400, true);
    assert.equal(ok, true);
    assert.equal(core.state.crystals, 320);
    assert.equal(core.state.cdFighterSortie, 11);
    assert.equal(core.state.airStrikes.length, 2);
    return `Crystals=320, cd=11s, airStrikes=${core.state.airStrikes.length}`;
  });

  runTest('TEST-04', 'A2: Bot 2 captures neutral outpost as bot2 (never assigned to enemy)', 'core', () => {
    const core = new GameCore();
    core.state.units = [];
    const op = core.state.outposts[0];
    op.owner = 'neutral';
    op.capturingTeam = null;
    op.progress = 0;

    core.spawnUnit('tank', op.x, op.y, 'bot2');
    core.spawnUnit('marine', op.x + 10, op.y, 'bot2');

    for (let i = 0; i < 240; i++) core.updateGame(FIXED_DT);
    assert.equal(op.owner, 'bot2', `Expected owner 'bot2', got '${op.owner}'`);
    assert.equal(op.progress, 100);
    return `owner=${op.owner}, progress=${op.progress}`;
  });

  runTest('TEST-05', 'A2: Enemy captures neutral outpost as enemy & contested outpost locks ownership', 'core', () => {
    const core = new GameCore();
    core.state.units = [];
    const op = core.state.outposts[0];
    op.owner = 'neutral';
    op.capturingTeam = null;
    op.progress = 0;

    const eTank = core.spawnUnit('tank', op.x, op.y, 'enemy');
    for (let i = 0; i < 260; i++) core.updateGame(FIXED_DT);
    assert.equal(op.owner, 'enemy');

    const pTank = core.spawnUnit('tank', op.x + 8, op.y, 'player');
    eTank.dmg = 0;
    pTank.dmg = 0;
    for (let i = 0; i < 120; i++) core.updateGame(FIXED_DT);
    assert.equal(op.contested, true);
    assert.equal(op.owner, 'enemy', 'Contested outpost must not flip ownership');
    return `owner=${op.owner}, contested=${op.contested}`;
  });

  runTest('TEST-06', 'A3: Zero resource balance stays valid (no || 400 fallback) & sanitizes NaN/negative', 'core', () => {
    const core = new GameCore();
    core.state.crystals = 0;
    core.state.enemyCrystals = 0;
    core.state.bot2Crystals = 0;

    core.updateGame(0);
    assert.equal(core.state.bot2Crystals, 0, 'bot2Crystals at 0 must stay 0');

    core.updateGame(FIXED_DT);
    assert.ok(core.state.bot2Crystals > 0 && core.state.bot2Crystals < 2, `Expected small 1-tick income, got ${core.state.bot2Crystals}`);

    core.state.crystals = Number.NaN;
    core.state.enemyCrystals = -999;
    core.updateGame(0);
    assert.equal(core.state.crystals, 0);
    assert.equal(core.state.enemyCrystals, 0);
    return `bot2 after 1 tick=${core.state.bot2Crystals.toFixed(3)} (no +400 jump)`;
  });

  runTest('TEST-07', 'A4: Fixed-timestep simulation produces identical state at 60 FPS and 20 FPS', 'core', () => {
    const core60 = new GameCore();
    core60.setDeterministicSeed(999);
    core60.initVerticalSlice('normal');
    core60.state.units.forEach(u => {
      if (u.team === 'player') {
        u.selected = true;
      }
    });
    core60.issueMoveOrder(600, 400, true);

    const core20 = new GameCore();
    core20.setDeterministicSeed(999);
    core20.initVerticalSlice('normal');
    core20.state.units.forEach(u => {
      if (u.team === 'player') {
        u.selected = true;
      }
    });
    core20.issueMoveOrder(600, 400, true);

    for (let i = 0; i < 300; i++) core60.stepSimulation(1 / 60, 1);
    for (let i = 0; i < 100; i++) core20.stepSimulation(1 / 20, 1);

    assert.ok(Math.abs(core60.state.timeElapsed - core20.state.timeElapsed) < 1e-6);
    assert.ok(Math.abs(core60.state.crystals - core20.state.crystals) < 1e-5);
    assert.equal(core60.state.units.length, core20.state.units.length);
    assert.ok(Math.abs(core60.state.units[0].x - core20.state.units[0].x) < 1e-5);
    return `t60=${core60.state.timeElapsed.toFixed(2)}s, t20=${core20.state.timeElapsed.toFixed(2)}s, unit0.x match`;
  });

  runTest('TEST-08', 'Phase B/C: Ground units clamp outside deep river and cross smoothly via central bridge', 'core', () => {
    const core = new GameCore();
    core.state.units = [];
    const uRiver = core.spawnUnit('marine', 480, 130, 'player');
    uRiver.x = 480;
    uRiver.y = 130;
    core.resolveCollisions();
    const rInfo = core.getRiverTelemetry(uRiver.x, uRiver.y);
    assert.ok(rInfo.dist >= 30 + uRiver.radius - 0.5, `Unit must be pushed outside river bank (dist=${rInfo.dist})`);

    core.state.units = [];
    const br = core.state.bridges[0];
    const cos = Math.cos(br.angle);
    const sin = Math.sin(br.angle);
    const startX = br.x - cos * 110;
    const startY = br.y - sin * 110;
    const destX = br.x + cos * 120;
    const destY = br.y + sin * 120;

    const uBridge = core.spawnUnit('apc', startX, startY, 'player');
    uBridge.x = startX;
    uBridge.y = startY;
    uBridge.state = 'move';
    uBridge.targetX = destX;
    uBridge.targetY = destY;

    const sideStart = core.getRiverTelemetry(startX, startY).side;
    const sideDest = core.getRiverTelemetry(destX, destY).side;
    for (let i = 0; i < 240; i++) core.updateGame(FIXED_DT);
    const sideEnd = core.getRiverTelemetry(uBridge.x, uBridge.y).side;
    const distToDest = Math.hypot(uBridge.x - destX, uBridge.y - destY);

    assert.notEqual(sideStart, sideDest);
    assert.equal(sideEnd, sideDest, 'Unit must reach opposite side of river via bridge');
    assert.ok(distToDest < 25, `Unit must arrive near destination (dist=${distToDest.toFixed(1)})`);
    return `Crossed from side ${sideStart} to ${sideEnd} (distToDest=${distToDest.toFixed(1)})`;
  });

  runTest('TEST-09', 'WorldAdapter: Maps 2D (x,y) to 3D (x, elevation, z) and interpolates between ticks', 'core', () => {
    const core = new GameCore();
    const adapter = new WorldAdapter(1.0);
    const u = core.state.units[0];
    u.prevX = 100;
    u.prevY = 200;
    u.x = 160;
    u.y = 280;

    const tf0 = adapter.getInterpolatedUnitTransform(core, u, 0);
    const tfHalf = adapter.getInterpolatedUnitTransform(core, u, 0.5);
    const tf1 = adapter.getInterpolatedUnitTransform(core, u, 1.0);

    assert.equal(tf0.pos.x, 100);
    assert.equal(tf0.pos.z, 200);
    assert.equal(tfHalf.pos.x, 130);
    assert.equal(tfHalf.pos.z, 240);
    assert.equal(tf1.pos.x, 160);
    assert.equal(tf1.pos.z, 280);

    const brPos = adapter.toWorld3D(600, 400, core.getTerrainHeightAt(600, 400));
    assert.equal(brPos.y, 3.5, 'Bridge center elevation should be +3.5');
    return `Bridge 3D=(${brPos.x}, ${brPos.y}, ${brPos.z}), mid-tick interp=(${tfHalf.pos.x}, ${tfHalf.pos.z})`;
  });

  runTest('TEST-10', 'Victory / Defeat: Destroying both hostile HQs triggers victory; player HQ triggers defeat', 'core', () => {
    const core = new GameCore();
    const enemyHQ = core.state.buildings.find(b => b.team === 'enemy' && b.type === 'hq');
    const bot2HQ = core.state.buildings.find(b => b.team === 'bot2' && b.type === 'hq');

    enemyHQ.hp = 0;
    core.updateGame(FIXED_DT);
    assert.equal(core.state.winner, null, 'Game continues while bot2 HQ still stands');

    bot2HQ.hp = 0;
    core.updateGame(FIXED_DT);
    assert.equal(core.state.winner, 'player', 'Player wins when both hostile HQs are destroyed');

    const coreDefeat = new GameCore();
    const playerHQ = coreDefeat.state.buildings.find(b => b.team === 'player' && b.type === 'hq');
    playerHQ.hp = 0;
    coreDefeat.updateGame(FIXED_DT);
    assert.equal(coreDefeat.state.winner, 'enemy', 'Player loses when player HQ is destroyed');
    return 'Victory after both hostile HQs destroyed; Defeat when Player HQ destroyed';
  });

  // Keep FACTION_COLORS shape check in core suite (no Three.js).
  runTest('TEST-10b', 'Faction palette numeric colors remain numbers (renderer-agnostic)', 'core', () => {
    for (const team of ['player', 'enemy', 'bot2', 'neutral']) {
      const pal = FACTION_COLORS[team];
      assert.equal(typeof pal.primary, 'number', `FACTION_COLORS.${team}.primary must be a number`);
      assert.equal(typeof pal.accent, 'number', `FACTION_COLORS.${team}.accent must be a number`);
      assert.equal(typeof pal.dark, 'number', `FACTION_COLORS.${team}.dark must be a number`);
    }
    return 'FACTION_COLORS palettes validated';
  });
}

if (runShim) {
  console.log('\n--- SUITE: Offline WebGL2 Shim Compatibility ---');
  const THREE = await import('../src/vendor/three-webgl2.js');

  runTest('TEST-11', 'R2 Blocker 2 & 3: No composeEuler(); Matrix4.compose uses Quaternion; InstancedMesh.setColorAt requires THREE.Color', 'shim', () => {
    assert.equal(THREE.REVISION, '160-offline-webgl2-shim', 'Shim REVISION must identify offline shim');
    assert.equal(THREE.IS_OFFICIAL_THREE, false, 'Shim must set IS_OFFICIAL_THREE=false');

    assert.equal(THREE.Matrix4.prototype.composeEuler, undefined, 'Matrix4.prototype.composeEuler must not exist');
    const mat = new THREE.Matrix4();
    const pos = new THREE.Vector3(10, 20, 30);
    const euler = new THREE.Euler(0, Math.PI / 4, 0);
    const quat = new THREE.Quaternion().setFromEuler(euler);
    const scale = new THREE.Vector3(2, 3, 4);
    mat.compose(pos, quat, scale);
    assert.equal(mat.elements[12], 10);
    assert.equal(mat.elements[13], 20);
    assert.equal(mat.elements[14], 30);

    assert.throws(() => {
      mat.compose(pos, euler, scale);
    }, /Quaternion/, 'Matrix4.compose must reject non-Quaternion rotation');

    const inst = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial(), 4);
    assert.throws(() => {
      inst.setColorAt(0, 0xff0000);
    }, /THREE\.Color/, 'InstancedMesh.setColorAt must reject raw hex numbers');
    const cObj = new THREE.Color(0x0ea5e9);
    inst.setColorAt(0, cObj);
    assert.ok(Math.abs(inst.instanceColor.array[0] - cObj.r) < 1e-5);
    return 'Shim API compatible; REVISION identifies offline shim; IS_OFFICIAL_THREE=false';
  });
}

if (runOffline) {
  console.log('\n--- SUITE: Offline Standalone IIFE (mocked DOM) ---');
  const {
    FACTION_COLORS
  } = await import('../dist/core-bundle.mjs');

  runTest('TEST-12', 'Offline standalone IIFE in mocked DOM: hardware instancing & mesh count audit', 'offline', () => {
    const prodJsPath = path.join(ROOT, 'dist', 'starfront-3d-slice.js');
    const prodCode = fs.readFileSync(prodJsPath, 'utf8');
    assert.equal(prodCode.includes('composeEuler'), false, 'Production bundle must contain zero references to composeEuler');
    assert.ok(
      prodCode.includes('160-offline-webgl2-shim') || prodCode.includes('IS_OFFICIAL_THREE'),
      'Offline IIFE must embed identifiable shim markers'
    );

    const elements = new Map();
    const makeEl = (id, tag = 'div') => ({
      id,
      tagName: tag.toUpperCase(),
      style: {},
      clientWidth: 1280,
      clientHeight: 720,
      width: 1280,
      height: 720,
      children: [],
      classList: { toggle() {}, add() {}, remove() {} },
      appendChild(child) { this.children.push(child); return child; },
      addEventListener() {},
      getBoundingClientRect() { return { left: 0, top: 0, width: 1280, height: 720 }; },
      getContext() { return null; }
    });

    const viewportEl = makeEl('viewport3d', 'main');
    const selBoxEl = makeEl('selectionBox', 'div');
    elements.set('viewport3d', viewportEl);
    elements.set('selectionBox', selBoxEl);

    const sandbox = {
      console,
      Math,
      Date,
      Float32Array,
      Uint16Array,
      Uint32Array,
      Int32Array,
      Map,
      Set,
      WeakMap,
      Array,
      Object,
      Number,
      String,
      Boolean,
      Error,
      TypeError,
      performance: { now: () => 1000 },
      requestAnimationFrame: () => 1,
      setTimeout: () => 1,
      clearTimeout: () => {},
      window: null,
      document: {
        getElementById(id) {
          if (!elements.has(id)) elements.set(id, makeEl(id));
          return elements.get(id);
        },
        createElement(tag) {
          return makeEl('', tag);
        }
      }
    };
    sandbox.window = {
      innerWidth: 1280,
      innerHeight: 720,
      devicePixelRatio: 1,
      addEventListener() {},
      setTimeout: () => 1,
      clearTimeout: () => {},
      document: sandbox.document
    };

    vm.createContext(sandbox);
    vm.runInContext(prodCode, sandbox);

    const app = sandbox.window.__STARFRONT_3D__;
    assert.ok(app && app.core && app.scene3d, 'window.__STARFRONT_3D__ must initialize in mocked DOM');
    assert.equal(app.core.state.units.length, 26, 'Must spawn 26 initial combat units');
    assert.equal(app.core.state.buildings.length, 12, 'Must spawn 12 initial buildings');
    assert.equal(viewportEl.children.length, 1, 'Renderer canvas must be attached to #viewport3d');
    assert.equal(app.scene3d.renderer.domElement, viewportEl.children[0], 'Renderer must own attached canvas');

    const counts = app.scene3d.getSceneMeshCounts();
    assert.ok(counts.visibleNonInstancedMeshes <= 5, `Expected <= 5 visible non-instanced meshes, got ${counts.visibleNonInstancedMeshes}`);
    assert.ok(counts.visibleInstancedMeshes >= 25, `Expected >= 25 visible instanced meshes, got ${counts.visibleInstancedMeshes}`);

    const tank = app.core.state.units.find(u => u.type === 'tank' && u.team === 'player');
    tank.angle = 0;
    tank.prevAngle = 0;
    tank.turretAngle = Math.PI / 2;
    tank.prevTurretAngle = Math.PI / 2;
    app.scene3d.syncFromGameCore(1.0);

    void FACTION_COLORS;
    return `Units=${app.core.state.units.length}, Buildings=${app.core.state.buildings.length}, visibleInstancedMeshes=${counts.visibleInstancedMeshes}, visibleNonInstancedMeshes=${counts.visibleNonInstancedMeshes}, totalActiveInstances=${counts.totalActiveInstances}`;
  });
}

console.log('====================================================================');
const passedCount = results.filter(r => r.status === 'PASS').length;
const bySuite = {};
for (const r of results) {
  bySuite[r.suite] = bySuite[r.suite] || { pass: 0, fail: 0, total: 0 };
  bySuite[r.suite].total++;
  if (r.status === 'PASS') bySuite[r.suite].pass++;
  else bySuite[r.suite].fail++;
}
console.log(`SUMMARY: ${passedCount}/${results.length} TESTS PASSED`);
console.log('BY SUITE:', JSON.stringify(bySuite));
console.log('NOTE: Official Three.js proof = node scripts/verify-official-three.mjs');
console.log('NOTE: Browser verification = node tests/browser-verify.mjs (Vite dist/)');
console.log('====================================================================');

const evidence = {
  timestamp: new Date().toISOString(),
  suitesRequested: { core: runCore, shim: runShim, offline: runOffline },
  summary: { passed: passedCount, total: results.length, bySuite },
  results
};
fs.mkdirSync(path.join(ROOT, 'artifacts'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'artifacts', 'deterministic-test-results.json'), JSON.stringify(evidence, null, 2));

if (passedCount !== results.length) {
  process.exit(1);
}

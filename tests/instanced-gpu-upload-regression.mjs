// Runs the real TypeScript renderer's per-instance buffer upload path without
// requiring WebGL. Three.js only uploads an InstancedBufferAttribute when its
// version increases; merely calling setMatrixAt() is insufficient.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';
import * as THREE from 'three';

const base = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(path.join(base, 'src/render/scene3d.ts'), 'utf8');
let compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 }
}).outputText;
const stubUrl = (code) => `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
const dependencies = {
  three: pathToFileURL(path.join(base, 'node_modules/three/build/three.module.js')).href,
  '../core/specs': stubUrl('export const SLICE_WORLD_W=1000, SLICE_WORLD_H=1000, FACTION_COLORS={};'),
  '../adapter/worldAdapter': stubUrl('export class WorldAdapter {}'),
  './models3d': stubUrl('export class LowPolyModelFactory {}')
};
for (const [name, url] of Object.entries(dependencies)) {
  const target = `from '${name}'`;
  assert.ok(compiled.includes(target), `expected import ${name}`);
  compiled = compiled.replace(target, `from '${url}'`);
}

const { BattlefieldScene3D } = await import(stubUrl(compiled));
// Avoid DOM / WebGL setup; test the actual renderer method with a fake GPU call.
const renderer = Object.create(BattlefieldScene3D.prototype);
renderer.dirtyInstanceMatrices = new Set();
renderer.dirtyInstanceColors = new Set();
renderer.initializedInstanceMatrices = new WeakMap();
renderer.initializedInstanceColors = new WeakMap();
renderer.tempMatrix = new THREE.Matrix4();
renderer.tempPos = new THREE.Vector3();
renderer.tempRot = new THREE.Euler();
renderer.tempQuat = new THREE.Quaternion();
renderer.tempScale = new THREE.Vector3();
renderer.tempColor = new THREE.Color();
renderer.scene = {};
renderer.camera = {};
let gpuFrameCount = 0;
renderer.renderer = { render: () => { gpuFrameCount++; } };

const batch = new THREE.InstancedMesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial(), 2);
assert.equal(batch.instanceMatrix.version, 0);
renderer.setInstTransform(batch, 0, 100, 5, 150, 0, 0, 0, 1, 1, 1, 0x0088ff);
renderer.setInstTransform(batch, 1, 120, 5, 150, 0, 0, 0, 1, 1, 1, 0x0088ff);
assert.equal(batch.instanceMatrix.version, 0, 'setMatrixAt leaves GPU attribute unmarked');
assert.equal(batch.instanceColor.version, 0, 'setColorAt leaves GPU attribute unmarked');

renderer.render();
assert.equal(gpuFrameCount, 1);
assert.equal(batch.instanceMatrix.version, 1, 'mark each dirty matrix batch for GPU upload');
assert.equal(batch.instanceColor.version, 1, 'mark each dirty color batch for GPU upload');

renderer.setInstTransform(batch, 0, 100, 5, 150, 0, 0, 0, 1, 1, 1, 0x0088ff);
renderer.setInstTransform(batch, 1, 120, 5, 150, 0, 0, 0, 1, 1, 1, 0x0088ff);
renderer.render();
assert.equal(batch.instanceMatrix.version, 1, 'unchanged transforms must not re-upload');
assert.equal(batch.instanceColor.version, 1, 'unchanged colors must not re-upload');

renderer.setInstTransform(batch, 0, 220, 5, 150, 0, 0, 0, 1, 1, 1);
renderer.render();
assert.equal(batch.instanceMatrix.version, 2, 'a moving unit triggers another GPU upload');
assert.equal(batch.instanceColor.version, 1, 'unchanged colors do not trigger uploads');
renderer.setInstTransform(batch, 0, 220, 5, 150, 0, 0, 0, 1, 1, 1, 0xff8800);
renderer.render();
assert.equal(batch.instanceMatrix.version, 2, 'color-only change must not upload matrices');
assert.equal(batch.instanceColor.version, 2, 'a new faction color must upload');
const matrix = new THREE.Matrix4();
batch.getMatrixAt(0, matrix);
assert.equal(matrix.elements[12], 220, 'rendered instance matrix reflects the latest world x');
console.log('PASS: instanced GPU upload (real renderer method, dirty matrix/color versions, batched once per frame)');

// Diagnostic accounting: count only actual InstancedMesh render submissions,
// not all active mesh batches; reset per frame to avoid stale counts.
renderer.scene = new THREE.Scene();
renderer.factory = {
  getGeo: () => new THREE.BoxGeometry(),
  getCommonMat: () => new THREE.MeshBasicMaterial()
};
renderer.instancedDrawsThisFrame = 0;
const observed = renderer.createBatch('box', 'basic', 2);
observed.count = 1;
let submitted = 0;
renderer.renderer = {
  render: () => { submitted++; observed.onBeforeRender(); },
  info: { render: { frame: 1, calls: 2, triangles: 12, lines: 0 }, memory: { geometries: 1 } }
};
renderer.render();
assert.equal(submitted, 1);
assert.equal(renderer.getRenderStats().instancedCalls, 1, 'only rendered InstancedMesh submitted');
assert.equal(renderer.getRenderTelemetry().instancedDrawCalls, 1);
assert.ok(renderer.getRenderTelemetry().instancedDrawCalls <= renderer.getRenderTelemetry().drawCalls);
renderer.renderer.render = () => { submitted++; };
renderer.render();
assert.equal(renderer.getRenderStats().instancedCalls, 0, 'zero submissions on next frame, no stale count');
const mainSource = readFileSync(path.join(base, 'src/main.ts'), 'utf8');
assert.ok(mainSource.includes("input: ReturnType<InputController3D['getDiagnostics']>"));
assert.ok(mainSource.includes('input: inputCtrl.getDiagnostics()'), 'gesture counters serialized into per-second samples');
console.log('PASS: rendered-instance accounting and exported physical input snapshots');

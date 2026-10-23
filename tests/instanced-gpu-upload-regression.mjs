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

renderer.render();
assert.equal(batch.instanceMatrix.version, 1, 'clean batches must not be uploaded again');
assert.equal(batch.instanceColor.version, 1);

renderer.setInstTransform(batch, 0, 220, 5, 150, 0, 0, 0, 1, 1, 1);
renderer.render();
assert.equal(batch.instanceMatrix.version, 2, 'a moving unit triggers another GPU upload');
assert.equal(batch.instanceColor.version, 1, 'unchanged colors do not trigger uploads');
const matrix = new THREE.Matrix4();
batch.getMatrixAt(0, matrix);
assert.equal(matrix.elements[12], 220, 'rendered instance matrix reflects the latest world x');
console.log('PASS: instanced GPU upload (real renderer method, dirty matrix/color versions, batched once per frame)');

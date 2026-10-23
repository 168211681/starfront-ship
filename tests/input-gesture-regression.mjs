// Runs the REAL TypeScript input controller without Chromium or the WebGL layer.
// This isolates Safari's independent Touch.identifier / PointerEvent.pointerId
// streams while retaining the same event listener and order-dispatch code.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import ts from 'typescript';

const base = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(path.join(base, 'src/input/inputController.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 }
}).outputText;
const { InputController3D } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

class Target {
  constructor() { this.listeners = new Map(); this.style = {}; }
  addEventListener(name, fn) {
    if (!this.listeners.has(name)) this.listeners.set(name, []);
    this.listeners.get(name).push(fn);
  }
  emit(name, ev) {
    for (const fn of this.listeners.get(name) ?? []) fn(ev);
  }
  getBoundingClientRect() { return { left: 0, top: 0, width: 402, height: 566 }; }
}

const dom = new Target();
const win = new Target();
globalThis.window = win;
const box = new Target();
const units = [
  { id: 1, name: 'A', team: 'player', x: 100, y: 100, radius: 5, hp: 100, maxHp: 100, selected: true, state: 'idle' },
  { id: 2, name: 'B', team: 'player', x: 130, y: 100, radius: 5, hp: 100, maxHp: 100, selected: true, state: 'idle' }
];
let orderCalls = 0;
let cameraPans = 0;
let cameraZooms = 0;
const core = {
  state: { units, buildings: [], running: true, paused: false, tacticalPause: false },
  getTerrainHeightAt: () => 0,
  issueMoveOrder(x, y, attack) {
    orderCalls++;
    const selected = units.filter(u => u.selected);
    selected.forEach(u => { u.state = attack ? 'attackMove' : 'move'; u.targetX = x; u.targetY = y; });
    return selected.length;
  }
};
const scene = {
  adapter: { toGame2D: (x, z) => ({ x, y: z }) },
  screenToGroundWorld: (x, y) => ({ x, z: y }),
  worldToScreen: (x, _h, y) => ({ x, y }),
  panCameraByScreenDelta() { cameraPans++; },
  zoomAtScreenPoint() { cameraZooms++; },
  rotateCamera() {}
};
const ctrl = new InputController3D(dom, box, core, scene, () => {});
const ev = (extra = {}) => ({ cancelable: true, preventDefault() {}, ...extra });
const touch = (identifier, clientX, clientY) => ({ identifier, clientX, clientY });
const fireTouch = (name, changedTouches, touches) => dom.emit(name, ev({ changedTouches, touches }));
const firePointer = (name, pointerId, pointerType, clientX, clientY) => dom.emit(name, ev({
  pointerId, pointerType, clientX, clientY, button: 0
}));
const reset = () => { units.forEach(u => { u.selected = true; u.state = 'idle'; }); ctrl.mode = 'select'; };

// Two genuinely different id namespaces. Pointercancel must NOT steal the tap.
reset();
firePointer('pointerdown', 42, 'touch', 250, 240);
fireTouch('touchstart', [touch(917, 250, 240)], [touch(917, 250, 240)]);
firePointer('pointercancel', 42, 'touch', 250, 240);
fireTouch('touchmove', [touch(917, 272, 248)], [touch(917, 272, 248)]);
const before1 = orderCalls;
fireTouch('touchend', [touch(917, 272, 248)], []);
firePointer('pointerup', 42, 'touch', 272, 248);
assert.equal(orderCalls - before1, 1, 'one touch = one order, despite duplicate pointer stream');
assert.equal(ctrl.getDiagnostics().selectedCount, 2, 'finger drift preserves selection');
assert.equal(ctrl.getDiagnostics().lastGesture, 'touch-tap');

// Genuine TouchEvent-only Safari stream: never requires a pointerdown at all.
reset();
const before2 = orderCalls;
fireTouch('touchstart', [touch(31, 320, 300)], [touch(31, 320, 300)]);
fireTouch('touchend', [touch(31, 320, 300)], []);
assert.equal(orderCalls - before2, 1, 'touch-only tap dispatches command');

// Some WebKit paths end with touchend after pointerdown, without touchstart.
reset();
const before3 = orderCalls;
firePointer('pointerdown', 81, 'touch', 255, 210);
fireTouch('touchend', [touch(819, 255, 210)], []);
assert.equal(orderCalls - before3, 1, 'touchend fallback matches by stream, not numeric id');
assert.ok(ctrl.getDiagnostics().touchEndFallback > 0);

// Pan mode never orders a move, even if lifted with no detectable drift.
reset();
ctrl.mode = 'pan';
const before4 = orderCalls;
fireTouch('touchstart', [touch(22, 280, 240)], [touch(22, 280, 240)]);
fireTouch('touchend', [touch(22, 280, 240)], []);
assert.equal(orderCalls - before4, 0);
assert.equal(ctrl.getDiagnostics().lastGesture, 'pan-only');

// Large finger drag over empty terrain on mobile should move the current army,
// not clear its selection. Pan still must not issue an order.
reset();
const before5 = orderCalls;
fireTouch('touchstart', [touch(55, 240, 230)], [touch(55, 240, 230)]);
fireTouch('touchmove', [touch(55, 320, 260)], [touch(55, 320, 260)]);
fireTouch('touchend', [touch(55, 320, 260)], []);
assert.equal(orderCalls - before5, 1);
assert.equal(ctrl.getDiagnostics().selectedCount, 2);
assert.equal(ctrl.getDiagnostics().lastGesture, 'drag-move');

// Two-finger gesture drives camera and must not leak a move order.
reset();
const before6 = orderCalls;
fireTouch('touchstart', [touch(5, 220, 240)], [touch(5, 220, 240)]);
fireTouch('touchstart', [touch(6, 260, 240)], [touch(5, 220, 240), touch(6, 260, 240)]);
fireTouch('touchmove', [touch(5, 205, 240), touch(6, 275, 240)], [touch(5, 205, 240), touch(6, 275, 240)]);
fireTouch('touchend', [touch(5, 205, 240)], [touch(6, 275, 240)]);
fireTouch('touchend', [touch(6, 275, 240)], []);
assert.equal(orderCalls - before6, 0);
assert.ok(cameraZooms > 0, 'pinch changes camera zoom');

// Pointer-only desktop remains supported; a short cancel completes a tap.
await new Promise((resolve) => setTimeout(resolve, 310)); // post-pinch suppression window
reset();
const before7 = orderCalls;
firePointer('pointerdown', 14, 'mouse', 310, 310);
firePointer('pointerup', 14, 'mouse', 310, 310);
assert.equal(orderCalls - before7, 1);

reset();
const before8 = orderCalls;
firePointer('pointerdown', 15, 'touch', 330, 300);
firePointer('pointercancel', 15, 'touch', 330, 300);
assert.equal(orderCalls - before8, 1);

console.log('PASS: 8 gesture regressions (ID separation, touch-only, fallback, pan, drag, pinch, mouse, cancel)');

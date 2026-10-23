import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function makeDispatcher(base = {}) {
  const listeners = new Map();
  const el = {
    id: '',
    tagName: 'DIV',
    style: {},
    clientWidth: 400,
    clientHeight: 400,
    width: 400,
    height: 400,
    children: [],
    classList: { toggle() {}, add() {}, remove() {} },
    captured: new Set(),
    ...base,
    addEventListener(type, fn) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(fn);
    },
    removeEventListener(type, fn) {
      const list = listeners.get(type);
      if (!list) return;
      listeners.set(type, list.filter((x) => x !== fn));
    },
    dispatchEvent(event) {
      event.target = event.target || el;
      const list = listeners.get(event.type) || [];
      for (const fn of list) fn(event);
      return !event.defaultPrevented;
    },
    appendChild(child) {
      this.children.push(child);
      return child;
    },
    getBoundingClientRect() {
      return { left: 0, top: 0, right: 400, bottom: 400, width: 400, height: 400 };
    },
    getContext() {
      return null;
    },
    setAttribute(name, value) {
      this[name] = value;
    },
    setPointerCapture(id) {
      this.captured.add(id);
    },
    releasePointerCapture(id) {
      this.captured.delete(id);
    },
    hasPointerCapture(id) {
      return this.captured.has(id);
    }
  };
  return el;
}

function bootInputApp() {
  let now = 1000;
  const elements = new Map();
  const viewportEl = makeDispatcher({ id: 'viewport3d', tagName: 'MAIN', clientWidth: 400, clientHeight: 400 });
  const selBoxEl = makeDispatcher({ id: 'selectionBox', tagName: 'DIV' });
  elements.set('viewport3d', viewportEl);
  elements.set('selectionBox', selBoxEl);

  const document = {
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, makeDispatcher({ id }));
      return elements.get(id);
    },
    createElement(tag) {
      return makeDispatcher({ tagName: String(tag).toUpperCase() });
    },
    addEventListener() {}
  };

  const windowObj = makeDispatcher({
    innerWidth: 400,
    innerHeight: 400,
    devicePixelRatio: 2
  });
  windowObj.document = document;

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
    performance: { now: () => now },
    requestAnimationFrame: () => 1,
    setTimeout: () => 1,
    clearTimeout: () => {},
    window: windowObj,
    document
  };
  sandbox.globalThis = sandbox;
  windowObj.performance = sandbox.performance;
  windowObj.setTimeout = sandbox.setTimeout;
  windowObj.clearTimeout = sandbox.clearTimeout;
  windowObj.requestAnimationFrame = sandbox.requestAnimationFrame;

  const prodCode = fs.readFileSync(path.join(ROOT, 'dist', 'starfront-3d-slice.js'), 'utf8');
  vm.createContext(sandbox);
  vm.runInContext(prodCode, sandbox);

  const app = sandbox.window.__STARFRONT_3D__ || sandbox.window.STARFRONT_3D;
  if (!app || !app.core || !app.inputCtrl || !app.scene3d) {
    throw new Error('Input regression boot failed: STARFRONT_3D missing');
  }
  const canvas = app.scene3d.renderer.domElement;
  return {
    app,
    canvas,
    window: windowObj,
    advance(ms) {
      now += ms;
    },
    settle(ticks = 24) {
      for (let i = 0; i < ticks; i++) app.core.updateGame(1 / 60);
      app.scene3d.syncFromGameCore(1);
    }
  };
}

function selectArmy(core) {
  let n = 0;
  for (const u of core.state.units) {
    if (u.team === 'player' && u.hp > 0) {
      u.selected = true;
      u.state = 'idle';
      u.targetEntity = null;
      n++;
    } else {
      u.selected = false;
    }
  }
  return n;
}

function playerUnits(core) {
  return core.state.units.filter((u) => u.team === 'player' && u.hp > 0);
}

function destOnCanvas(app, wx, wy) {
  const elev = app.core.getTerrainHeightAt(wx, wy);
  const scr = app.scene3d.worldToScreen(wx, elev, wy);
  return { x: scr.x, y: scr.y };
}

function pointer(canvas, windowObj, type, id, x, y, extra = {}) {
  const ev = {
    type,
    pointerId: id,
    pointerType: extra.pointerType || 'touch',
    button: extra.button ?? 0,
    buttons: extra.buttons ?? (type === 'pointerdown' ? 1 : 0),
    clientX: x,
    clientY: y,
    cancelable: true,
    defaultPrevented: false,
    preventDefault() {
      this.defaultPrevented = true;
    }
  };
  if (type === 'pointerdown' || type === 'pointermove') canvas.dispatchEvent(ev);
  else {
    canvas.dispatchEvent(ev);
    windowObj.dispatchEvent(ev);
  }
}

function touch(canvas, type, id, x, y) {
  const t = { identifier: id, clientX: x, clientY: y };
  const ev = {
    type,
    cancelable: true,
    defaultPrevented: false,
    changedTouches: {
      length: 1,
      item(i) {
        return i === 0 ? t : null;
      }
    },
    preventDefault() {
      this.defaultPrevented = true;
    }
  };
  canvas.dispatchEvent(ev);
}

function emptyDest(app) {
  const dest = destOnCanvas(app, 560, 280);
  if (dest.x < 8 || dest.x > 392 || dest.y < 8 || dest.y > 392) {
    return { x: 260, y: 80 };
  }
  return dest;
}

export function runInputRegressions(runTest) {
  console.log('\n--- SUITE: Input regressions (unified Touch/Pointer) ---');

  runTest('INPUT-01', 'Army + pointer tap empty terrain issues a move', 'input', () => {
    const { app, canvas, window: win, settle } = bootInputApp();
    const n = selectArmy(app.core);
    const dest = emptyDest(app);
    const before = playerUnits(app.core).map((u) => ({ id: u.id, x: u.x, y: u.y }));
    pointer(canvas, win, 'pointerdown', 1, dest.x, dest.y);
    pointer(canvas, win, 'pointerup', 1, dest.x, dest.y);
    const moving = playerUnits(app.core).filter((u) => u.state === 'move').length;
    settle();
    const after = playerUnits(app.core);
    const travel = after.reduce((s, u) => {
      const b = before.find((p) => p.id === u.id);
      return s + (b ? Math.hypot(u.x - b.x, u.y - b.y) : 0);
    }, 0);
    assert.ok(n >= 5, 'army selected');
    assert.ok(moving >= 5, `expected move orders, got ${moving}`);
    assert.ok(app.inputCtrl.getDiagnostics().lastMoveCount >= 5);
    assert.ok(travel > 8, `units must travel, got ${travel}`);
    return `selected=${n} moving=${moving} travel=${travel.toFixed(1)}`;
  });

  runTest('INPUT-02', 'Army + Safari touch-only sequence (no pointer events) issues a move', 'input', () => {
    const { app, canvas, settle } = bootInputApp();
    selectArmy(app.core);
    const dest = emptyDest(app);
    const before = playerUnits(app.core).map((u) => ({ id: u.id, x: u.x, y: u.y }));
    touch(canvas, 'touchstart', 0, dest.x, dest.y);
    touch(canvas, 'touchend', 0, dest.x, dest.y);
    const moving = playerUnits(app.core).filter((u) => u.state === 'move').length;
    settle();
    const travel = playerUnits(app.core).reduce((s, u) => {
      const b = before.find((p) => p.id === u.id);
      return s + (b ? Math.hypot(u.x - b.x, u.y - b.y) : 0);
    }, 0);
    assert.ok(moving >= 5, `touch-only must order a move, got ${moving}`);
    assert.ok(travel > 8, `touch-only units must travel, got ${travel}`);
    return `moving=${moving} travel=${travel.toFixed(1)} fallback=${app.inputCtrl.getDiagnostics().touchEndFallback}`;
  });

  runTest('INPUT-03', '22px finger drift still moves and does not clear the army', 'input', () => {
    const { app, canvas, window: win, settle } = bootInputApp();
    const n = selectArmy(app.core);
    const dest = emptyDest(app);
    pointer(canvas, win, 'pointerdown', 7, dest.x, dest.y);
    pointer(canvas, win, 'pointermove', 7, dest.x + 16, dest.y + 12);
    pointer(canvas, win, 'pointerup', 7, dest.x + 22, dest.y + 10);
    const selected = playerUnits(app.core).filter((u) => u.selected).length;
    const moving = playerUnits(app.core).filter((u) => u.state === 'move').length;
    settle();
    assert.equal(selected, n, 'selection must survive a 22px finger slide');
    assert.ok(moving >= 5, `drift tap must move, got ${moving}`);
    return `selected=${selected} moving=${moving}`;
  });

  runTest('INPUT-04', 'Single-unit pointer select then destination moves only that unit', 'input', () => {
    const { app, canvas, window: win, settle } = bootInputApp();
    for (const u of app.core.state.units) u.selected = false;
    const unit = playerUnits(app.core)[0];
    const scr = app.scene3d.worldToScreen(unit.x, app.core.getTerrainHeightAt(unit.x, unit.y) + 8, unit.y);
    pointer(canvas, win, 'pointerdown', 2, scr.x, scr.y);
    pointer(canvas, win, 'pointerup', 2, scr.x, scr.y);
    assert.equal(playerUnits(app.core).filter((u) => u.selected).length, 1);
    assert.equal(unit.selected, true);
    const dest = emptyDest(app);
    const x0 = unit.x;
    const y0 = unit.y;
    pointer(canvas, win, 'pointerdown', 3, dest.x, dest.y);
    pointer(canvas, win, 'pointerup', 3, dest.x, dest.y);
    assert.equal(unit.state, 'move');
    settle();
    const dist = Math.hypot(unit.x - x0, unit.y - y0);
    assert.ok(dist > 4, `selected unit must walk, dist=${dist}`);
    return `id=${unit.id} dist=${dist.toFixed(1)}`;
  });

  runTest('INPUT-05', 'Attack-Move tap issues attackMove and units travel', 'input', () => {
    const { app, canvas, window: win, settle } = bootInputApp();
    selectArmy(app.core);
    app.inputCtrl.mode = 'attackMove';
    const dest = emptyDest(app);
    const before = playerUnits(app.core).map((u) => ({ id: u.id, x: u.x, y: u.y }));
    pointer(canvas, win, 'pointerdown', 4, dest.x, dest.y);
    pointer(canvas, win, 'pointerup', 4, dest.x, dest.y);
    const attacking = playerUnits(app.core).filter((u) => u.state === 'attackMove').length;
    assert.ok(attacking >= 5, `expected attackMove, got ${attacking}`);
    assert.equal(app.inputCtrl.mode, 'select');
    settle();
    const travel = playerUnits(app.core).reduce((s, u) => {
      const b = before.find((p) => p.id === u.id);
      return s + (b ? Math.hypot(u.x - b.x, u.y - b.y) : 0);
    }, 0);
    assert.ok(travel > 8);
    return `attackMove=${attacking} travel=${travel.toFixed(1)}`;
  });

  runTest('INPUT-06', 'Pan drag moves the camera and does not issue a move order', 'input', () => {
    const { app, canvas, window: win } = bootInputApp();
    selectArmy(app.core);
    app.inputCtrl.mode = 'pan';
    const orders = app.inputCtrl.getDiagnostics().moveOrdersIssued;
    const cam0 = { x: app.scene3d.cameraTarget.x, z: app.scene3d.cameraTarget.z };
    pointer(canvas, win, 'pointerdown', 5, 200, 200);
    pointer(canvas, win, 'pointermove', 5, 140, 230);
    pointer(canvas, win, 'pointerup', 5, 120, 240);
    const moving = playerUnits(app.core).filter((u) => u.state === 'move' || u.state === 'attackMove').length;
    const camD = Math.hypot(app.scene3d.cameraTarget.x - cam0.x, app.scene3d.cameraTarget.z - cam0.z);
    assert.equal(app.inputCtrl.getDiagnostics().moveOrdersIssued, orders);
    assert.equal(moving, 0);
    assert.ok(camD > 5, `camera must pan, delta=${camD}`);
    return `camDelta=${camD.toFixed(1)} orders=${orders}`;
  });

  runTest('INPUT-07', 'Safari dual-id tap aliases; two real fingers do not issue a move', 'input', () => {
    const { app, canvas, window: win, settle } = bootInputApp();
    selectArmy(app.core);
    const dest = emptyDest(app);
    touch(canvas, 'touchstart', 0, dest.x, dest.y);
    pointer(canvas, win, 'pointerdown', 1, dest.x + 2, dest.y + 1);
    pointer(canvas, win, 'pointerup', 1, dest.x + 2, dest.y + 1);
    touch(canvas, 'touchend', 0, dest.x, dest.y);
    const firstMoving = playerUnits(app.core).filter((u) => u.state === 'move').length;
    assert.ok(firstMoving >= 5, `aliased Safari tap must move once, got ${firstMoving}`);
    assert.equal(app.inputCtrl.getDiagnostics().lastMoveCount, firstMoving);

    selectArmy(app.core);
    const orders = app.inputCtrl.getDiagnostics().moveOrdersIssued;
    pointer(canvas, win, 'pointerdown', 10, 120, 200);
    pointer(canvas, win, 'pointerdown', 11, 260, 200);
    pointer(canvas, win, 'pointermove', 10, 90, 200);
    pointer(canvas, win, 'pointermove', 11, 300, 200);
    pointer(canvas, win, 'pointerup', 10, 90, 200);
    pointer(canvas, win, 'pointerup', 11, 300, 200);
    assert.equal(app.inputCtrl.getDiagnostics().moveOrdersIssued, orders, 'pinch must not issue a move');
    settle();
    return `aliasMove=${firstMoving} pinchOrdersUnchanged=${orders}`;
  });

  runTest('INPUT-08', 'Short pointercancel is a tap; Pause freezes, Play resumes', 'input', () => {
    const { app, canvas, window: win, settle } = bootInputApp();
    selectArmy(app.core);
    const dest = emptyDest(app);
    pointer(canvas, win, 'pointerdown', 8, dest.x, dest.y);
    pointer(canvas, win, 'pointercancel', 8, dest.x, dest.y);
    const moving = playerUnits(app.core).filter((u) => u.state === 'move').length;
    assert.ok(moving >= 5, `pointercancel tap must move, got ${moving}`);

    const mid = playerUnits(app.core).map((u) => ({ id: u.id, x: u.x, y: u.y }));
    app.core.state.tacticalPause = true;
    settle(18);
    const pausedTravel = playerUnits(app.core).reduce((s, u) => {
      const b = mid.find((p) => p.id === u.id);
      return s + (b ? Math.hypot(u.x - b.x, u.y - b.y) : 0);
    }, 0);
    assert.ok(pausedTravel < 2, `pause must freeze, travel=${pausedTravel}`);

    const resume = playerUnits(app.core).map((u) => ({ id: u.id, x: u.x, y: u.y }));
    app.core.state.tacticalPause = false;
    app.core.state.running = true;
    app.core.state.paused = false;
    settle(18);
    const resumeTravel = playerUnits(app.core).reduce((s, u) => {
      const b = resume.find((p) => p.id === u.id);
      return s + (b ? Math.hypot(u.x - b.x, u.y - b.y) : 0);
    }, 0);
    assert.ok(resumeTravel > 5, `play must resume, travel=${resumeTravel}`);
    return `cancelMove=${moving} paused=${pausedTravel.toFixed(2)} resumed=${resumeTravel.toFixed(1)}`;
  });
}

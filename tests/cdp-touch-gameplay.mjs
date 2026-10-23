/**
 * Browser-level touch gameplay. Uses Chrome CDP Input.dispatchTouchEvent,
 * not element.dispatchEvent(new PointerEvent()).
 */
import fs from 'node:fs';
import path from 'node:path';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const round = (n) => Math.round(n * 10) / 10;

async function touchTap(cdp, x, y, drift = 0) {
  const id = 1;
  const start = { x: round(x), y: round(y), id, radiusX: 8, radiusY: 8 };
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
  await sleep(45);
  if (drift > 0) {
    const steps = 3;
    for (let i = 1; i <= steps; i++) {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [
          {
            x: round(x + (drift * i) / steps),
            y: round(y + (drift * 0.45 * i) / steps),
            id,
            radiusX: 8,
            radiusY: 8
          }
        ]
      });
      await sleep(16);
    }
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

async function touchDrag(cdp, x1, y1, x2, y2) {
  const id = 1;
  const a = { x: round(x1), y: round(y1), id, radiusX: 8, radiusY: 8 };
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [a] });
  await sleep(30);
  const steps = 5;
  for (let i = 1; i <= steps; i++) {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [
        {
          x: round(a.x + ((x2 - a.x) * i) / steps),
          y: round(a.y + ((y2 - a.y) * i) / steps),
          id,
          radiusX: 8,
          radiusY: 8
        }
      ]
    });
    await sleep(16);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

async function pinchOut(cdp, x, y) {
  const startA = { x: round(x - 36), y: round(y), id: 1, radiusX: 8, radiusY: 8 };
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [startA] });
  await sleep(30);
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: round(x + 36), y: round(y), id: 2, radiusX: 8, radiusY: 8 }]
  });
  await sleep(30);
  for (let i = 1; i <= 4; i++) {
    const spread = 36 + i * 22;
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [
        { x: round(x - spread), y: round(y), id: 1, radiusX: 8, radiusY: 8 },
        { x: round(x + spread), y: round(y), id: 2, radiusX: 8, radiusY: 8 }
      ]
    });
    await sleep(20);
  }
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [{ x: round(x - 124), y: round(y), id: 1 }]
  });
  await sleep(30);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

function sumDelta(before, after) {
  const map = new Map(before.positions.map((p) => [p.id, p]));
  let sum = 0;
  let max = 0;
  for (const p of after.positions) {
    const b = map.get(p.id);
    if (!b) continue;
    const d = Math.hypot(p.x - b.x, p.y - b.y);
    sum += d;
    max = Math.max(max, d);
  }
  return { sum: Math.round(sum * 10) / 10, max: Math.round(max * 10) / 10 };
}

export async function runTouchGameplay(cdp, evalExpr, screenshotsDir) {
  async function setViewport(w, h) {
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: w,
      height: h,
      deviceScaleFactor: 2,
      mobile: true
    });
    await sleep(280);
    await evalExpr(`(() => { window.STARFRONT_3D.scene3d.handleResize(); return true; })()`);
    await sleep(80);
  }

  async function snap() {
    return evalExpr(`(() => {
      const app = window.STARFRONT_3D;
      const players = app.core.state.units.filter(u => u.team === 'player' && u.hp > 0);
      const diag = app.inputCtrl.getDiagnostics();
      const mesh = app.scene3d.instTankHulls;
      let rendered = null;
      if (mesh && mesh.count > 0) {
        const e = mesh.instanceMatrix.array;
        rendered = [Math.round(e[12] * 10) / 10, Math.round(e[14] * 10) / 10];
      }
      const cam = app.scene3d.cameraTarget;
      return {
        running: app.core.state.running,
        paused: app.core.state.paused,
        tacticalPause: app.core.state.tacticalPause,
        selected: players.filter(u => u.selected).length,
        positions: players.map(u => ({ id: u.id, x: u.x, y: u.y, state: u.state, selected: !!u.selected })),
        diag,
        renderedTank0: rendered,
        mode: app.inputCtrl.mode,
        toast: (document.getElementById('statusToast') && document.getElementById('statusToast').textContent) || '',
        cam: { x: cam.x, z: cam.z, zoom: app.scene3d.cameraZoom }
      };
    })()`);
  }

  async function buttonCenter(id) {
    return evalExpr(`(() => {
      const el = document.getElementById(${JSON.stringify(id)});
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, left: r.left, right: r.right };
    })()`);
  }

  async function project(wx, wy) {
    return evalExpr(`(() => {
      const app = window.STARFRONT_3D;
      const canvas = document.getElementById('battlefieldCanvas3D');
      const rect = canvas.getBoundingClientRect();
      const elev = app.core.getTerrainHeightAt(${wx}, ${wy});
      const scr = app.scene3d.worldToScreen(${wx}, elev, ${wy});
      const clientX = rect.left + scr.x;
      const clientY = rect.top + scr.y;
      return {
        clientX, clientY,
        inside: clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom
      };
    })()`);
  }

  async function settlePlayers() {
    await evalExpr(`(() => {
      const app = window.STARFRONT_3D;
      app.inputCtrl.mode = 'select';
      app.core.state.running = true;
      app.core.state.paused = false;
      app.core.state.tacticalPause = false;
      const pauseBtn = document.getElementById('btnPauseGame');
      if (pauseBtn) pauseBtn.textContent = 'Pause';
      app.scene3d.resetCamera();
      for (const u of app.core.state.units) {
        u.targetEntity = null;
        if (u.team === 'player' && u.hp > 0) {
          u.state = 'idle';
          u.selected = false;
        } else if (u.hp > 0) {
          u.state = 'hold';
        }
      }
      return true;
    })()`);
  }

  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await setViewport(402, 566);
  await evalExpr(`(() => {
    const app = window.STARFRONT_3D;
    app.core.initVerticalSlice('normal');
    app.scene3d.resetCamera();
    app.scene3d.syncFromGameCore(0);
    app.scene3d.render();
    return app.core.state.units.filter(u => u.team === 'player' && u.hp > 0).length;
  })()`);
  await settlePlayers();

  const before1 = await snap();
  const army = await buttonCenter('btnSelectAll');
  await touchTap(cdp, army.x, army.y, 0);
  await sleep(140);
  const selected1 = await snap();
  const dest = await project(560, 280);
  const ordersBefore = selected1.diag.moveOrdersIssued;
  await touchTap(cdp, dest.clientX, dest.clientY, 22);
  await sleep(50);
  const immediate1 = await snap();
  await sleep(700);
  const after1 = await snap();
  const renderedMoved =
    before1.renderedTank0 &&
    after1.renderedTank0 &&
    Math.hypot(after1.renderedTank0[0] - before1.renderedTank0[0], after1.renderedTank0[1] - before1.renderedTank0[1]) > 2;

  const test1 = {
    armySelected: selected1.selected,
    destInside: dest.inside,
    ordersIncreased: immediate1.diag.moveOrdersIssued > ordersBefore,
    lastMoveCount: immediate1.diag.lastMoveCount,
    moving: immediate1.positions.filter((p) => p.state === 'move' || p.state === 'attackMove').length,
    stillSelected: immediate1.selected,
    toast: immediate1.toast,
    delta: sumDelta(immediate1, after1),
    renderedMoved: Boolean(renderedMoved),
    renderedBefore: before1.renderedTank0,
    renderedAfter: after1.renderedTank0,
    hit: { x: immediate1.diag.lastHitX, y: immediate1.diag.lastHitY, failed: immediate1.diag.lastHitFailed },
    sim: { running: immediate1.running, paused: immediate1.paused, tacticalPause: immediate1.tacticalPause },
    positionsBefore: immediate1.positions.map((p) => [p.id, Math.round(p.x), Math.round(p.y)]),
    positionsAfter: after1.positions.map((p) => [p.id, Math.round(p.x), Math.round(p.y)])
  };

  if (screenshotsDir) {
    const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(screenshotsDir, 'touch-move-portrait.png'), Buffer.from(shot.data, 'base64'));
  }

  await settlePlayers();
  const unitTap = await evalExpr(`(() => {
    const app = window.STARFRONT_3D;
    const u = app.core.state.units.find(unit => unit.team === 'player' && unit.hp > 0);
    const canvas = document.getElementById('battlefieldCanvas3D');
    const rect = canvas.getBoundingClientRect();
    const scr = app.scene3d.worldToScreen(u.x, app.core.getTerrainHeightAt(u.x, u.y) + 8, u.y);
    return { id: u.id, clientX: rect.left + scr.x, clientY: rect.top + scr.y };
  })()`);
  await touchTap(cdp, unitTap.clientX, unitTap.clientY, 6);
  await sleep(120);
  const sel2 = await evalExpr(`(() => {
    const units = window.STARFRONT_3D.core.state.units;
    const u = units.find(unit => unit.id === ${unitTap.id});
    const selected = units.filter(unit => unit.selected && unit.hp > 0);
    return { selectedId: u && u.selected ? u.id : null, count: selected.length };
  })()`);
  const dest2 = await project(470, 340);
  const posBefore2 = await snap();
  await touchTap(cdp, dest2.clientX, dest2.clientY, 20);
  await sleep(700);
  const after2 = await snap();
  const movedUnit = after2.positions.find((p) => p.id === unitTap.id);
  const beforeUnit = posBefore2.positions.find((p) => p.id === unitTap.id);
  const test2 = {
    selectedId: sel2.selectedId,
    selectedCount: sel2.count,
    state: movedUnit ? movedUnit.state : null,
    delta: beforeUnit && movedUnit ? Math.round(Math.hypot(movedUnit.x - beforeUnit.x, movedUnit.y - beforeUnit.y) * 10) / 10 : 0
  };

  await settlePlayers();
  await touchTap(cdp, (await buttonCenter('btnSelectAll')).x, (await buttonCenter('btnSelectAll')).y, 0);
  await sleep(100);
  const attackRow = await evalExpr(`(() => {
    const el = document.getElementById('btnAttackMove').parentElement;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width * 0.82, y: r.top + r.height / 2 };
  })()`);
  await touchDrag(cdp, attackRow.x, attackRow.y, attackRow.x - 150, attackRow.y);
  await sleep(80);
  const attackBtn = await buttonCenter('btnAttackMove');
  await touchTap(cdp, attackBtn.x, attackBtn.y, 0);
  await sleep(100);
  const mode3 = await evalExpr(`window.STARFRONT_3D.inputCtrl.mode`);
  const dest3 = await evalExpr(`(() => {
    const canvas = document.getElementById('battlefieldCanvas3D');
    const rect = canvas.getBoundingClientRect();
    return { clientX: rect.left + rect.width * 0.62, clientY: rect.top + rect.height * 0.4, inside: true };
  })()`);
  const before3 = await snap();
  await touchTap(cdp, dest3.clientX, dest3.clientY, 18);
  await sleep(700);
  const after3 = await snap();
  const test3 = {
    modeAfterAttack: mode3,
    modeAfterTap: after3.mode,
    selectedBefore: before3.selected,
    attackMoving: after3.positions.filter((p) => p.state === 'attackMove').length,
    delta: sumDelta(before3, after3),
    toast: after3.toast,
    hit: { x: after3.diag.lastHitX, y: after3.diag.lastHitY, failed: after3.diag.lastHitFailed },
    lastMoveCount: after3.diag.lastMoveCount
  };

  await settlePlayers();
  await touchTap(cdp, (await buttonCenter('btnModePan')).x, (await buttonCenter('btnModePan')).y, 0);
  await sleep(100);
  const before4 = await snap();
  const canvasMid = await evalExpr(`(() => {
    const r = document.getElementById('battlefieldCanvas3D').getBoundingClientRect();
    return { x: r.left + r.width * 0.5, y: r.top + r.height * 0.55 };
  })()`);
  await touchDrag(cdp, canvasMid.x, canvasMid.y, canvasMid.x - 80, canvasMid.y + 36);
  await sleep(100);
  const afterPan = await snap();
  await pinchOut(cdp, canvasMid.x, canvasMid.y);
  await sleep(120);
  const afterPinch = await snap();
  const test4 = {
    modeAfter: afterPan.mode,
    camDelta: Math.round(Math.hypot(afterPan.cam.x - before4.cam.x, afterPan.cam.z - before4.cam.z) * 10) / 10,
    ordersBefore: before4.diag.moveOrdersIssued,
    ordersAfterPan: afterPan.diag.moveOrdersIssued,
    ordersAfterPinch: afterPinch.diag.moveOrdersIssued,
    zoomBefore: afterPan.cam.zoom,
    zoomAfter: afterPinch.cam.zoom
  };

  await evalExpr(`(() => { document.querySelectorAll('.dock-scroll').forEach(el => { el.scrollLeft = 0; }); return true; })()`);
  const dockBefore = await evalExpr(`(() => {
    const rows = Array.from(document.querySelectorAll('.dock-scroll'));
    const retreat = document.getElementById('btnRetreatOrder').getBoundingClientRect();
    const row = rows[1].getBoundingClientRect();
    const tank = document.getElementById('btnTrainTank').getBoundingClientRect();
    const row0 = rows[0].getBoundingClientRect();
    return {
      scroll0: rows[0].scrollLeft,
      scroll1: rows[1].scrollLeft,
      retreatClipped: retreat.right > row.right + 4,
      tankClipped: tank.right > row0.right + 4,
      docScroll: document.documentElement.scrollLeft,
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      touchActionRow: getComputedStyle(rows[1]).touchAction,
      touchActionBody: getComputedStyle(document.body).touchAction,
      touchActionCanvas: getComputedStyle(document.getElementById('battlefieldCanvas3D')).touchAction
    };
  })()`);
  const row0 = await evalExpr(`(() => { const r = document.querySelectorAll('.dock-scroll')[0].getBoundingClientRect(); return { x: r.left + r.width * 0.85, y: r.top + r.height / 2 }; })()`);
  const row1 = await evalExpr(`(() => { const r = document.querySelectorAll('.dock-scroll')[1].getBoundingClientRect(); return { x: r.left + r.width * 0.85, y: r.top + r.height / 2 }; })()`);
  await touchDrag(cdp, row0.x, row0.y, row0.x - 170, row0.y);
  await touchDrag(cdp, row1.x, row1.y, row1.x - 170, row1.y);
  await sleep(100);
  const dockAfter = await evalExpr(`(() => {
    const rows = Array.from(document.querySelectorAll('.dock-scroll'));
    const retreat = document.getElementById('btnRetreatOrder').getBoundingClientRect();
    const row = rows[1].getBoundingClientRect();
    return {
      scroll0: rows[0].scrollLeft,
      scroll1: rows[1].scrollLeft,
      retreatVisible: retreat.left < row.right - 8 && retreat.right > row.left + 8,
      docScroll: document.documentElement.scrollLeft,
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    };
  })()`);
  await settlePlayers();
  await evalExpr(`(() => {
    for (const u of window.STARFRONT_3D.core.state.units) {
      if (u.team === 'player' && u.hp > 0) u.selected = true;
    }
    return true;
  })()`);
  const retreatBtn = await buttonCenter('btnRetreatOrder');
  await touchTap(cdp, retreatBtn.x, retreatBtn.y, 0);
  await sleep(160);
  const afterRetreat = await snap();
  const test5 = {
    before: dockBefore,
    after: dockAfter,
    retreatMoved: afterRetreat.positions.filter((p) => p.state === 'move').length >= 5,
    retreatToast: afterRetreat.toast
  };

  await settlePlayers();
  await setViewport(402, 566);
  await touchTap(cdp, (await buttonCenter('btnSelectAll')).x, (await buttonCenter('btnSelectAll')).y, 0);
  await sleep(80);
  const p6 = await project(500, 300);
  await touchTap(cdp, p6.clientX, p6.clientY, 0);
  await sleep(80);
  const hit6 = await snap();
  const portraitErr = Math.hypot((hit6.diag.lastHitX || 0) - 500, (hit6.diag.lastHitY || 0) - 300);

  await setViewport(402, 554);
  await settlePlayers();
  await touchTap(cdp, (await buttonCenter('btnSelectAll')).x, (await buttonCenter('btnSelectAll')).y, 0);
  await sleep(80);
  const pMicro = await project(500, 300);
  await touchTap(cdp, pMicro.clientX, pMicro.clientY, 0);
  await sleep(80);
  const hitMicro = await snap();
  const microErr = Math.hypot((hitMicro.diag.lastHitX || 0) - 500, (hitMicro.diag.lastHitY || 0) - 300);

  await setViewport(844, 390);
  await settlePlayers();
  await touchTap(cdp, (await buttonCenter('btnSelectAll')).x, (await buttonCenter('btnSelectAll')).y, 0);
  await sleep(80);
  const pLand = await project(500, 300);
  const beforeLand = await snap();
  await touchTap(cdp, pLand.clientX, pLand.clientY, 12);
  await sleep(650);
  const afterLand = await snap();
  const test6 = {
    portraitInside: p6.inside,
    portraitErr: Math.round(portraitErr * 10) / 10,
    microInside: pMicro.inside,
    microErr: Math.round(microErr * 10) / 10,
    landInside: pLand.inside,
    landErr: Math.round(Math.hypot((afterLand.diag.lastHitX || 0) - 500, (afterLand.diag.lastHitY || 0) - 300) * 10) / 10,
    landDelta: sumDelta(beforeLand, afterLand),
    landMoving: afterLand.positions.filter((p) => p.state === 'move').length
  };

  await setViewport(402, 566);
  await settlePlayers();
  await touchTap(cdp, (await buttonCenter('btnSelectAll')).x, (await buttonCenter('btnSelectAll')).y, 0);
  await sleep(70);
  const dest7 = await project(600, 340);
  await touchTap(cdp, dest7.clientX, dest7.clientY, 0);
  await sleep(220);
  const moving7 = await snap();
  const pauseBtn = await buttonCenter('btnPauseGame');
  await touchTap(cdp, pauseBtn.x, pauseBtn.y, 0);
  await sleep(50);
  const pausedSnap = await snap();
  await sleep(500);
  const whilePaused = await snap();
  await touchTap(cdp, pauseBtn.x, pauseBtn.y, 0);
  await sleep(50);
  const resumed = await snap();
  await sleep(550);
  const afterResume = await snap();
  const test7 = {
    ordered: moving7.positions.filter((p) => p.state === 'move').length,
    pausedFlag: pausedSnap.tacticalPause,
    pausedDelta: sumDelta(pausedSnap, whilePaused),
    resumedFlag: resumed.tacticalPause,
    resumeDelta: sumDelta(resumed, afterResume),
    running: afterResume.running,
    paused: afterResume.paused
  };

  const pointerCancelTap = await evalExpr(`(() => {
    const app = window.STARFRONT_3D;
    app.inputCtrl.mode = 'select';
    app.core.state.tacticalPause = false;
    app.core.state.paused = false;
    app.core.state.running = true;
    for (const u of app.core.state.units) {
      if (u.team === 'player' && u.hp > 0) { u.selected = true; u.state = 'idle'; u.targetEntity = null; }
    }
    const canvas = document.getElementById('battlefieldCanvas3D');
    const rect = canvas.getBoundingClientRect();
    const dest = { x: 530, y: 310 };
    const elev = app.core.getTerrainHeightAt(dest.x, dest.y);
    const scr = app.scene3d.worldToScreen(dest.x, elev, dest.y);
    const x = rect.left + scr.x;
    const y = rect.top + scr.y;
    const before = app.inputCtrl.getDiagnostics().pointerCancel;
    canvas.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 42, pointerType: 'touch', button: 0, buttons: 1, clientX: x, clientY: y, bubbles: true, cancelable: true }));
    const cancelEv = new PointerEvent('pointercancel', { pointerId: 42, pointerType: 'touch', button: 0, buttons: 0, clientX: x, clientY: y, bubbles: true, cancelable: false });
    canvas.dispatchEvent(cancelEv);
    window.dispatchEvent(cancelEv);
    const players = app.core.state.units.filter(u => u.team === 'player' && u.hp > 0);
    const diag = app.inputCtrl.getDiagnostics();
    return {
      moving: players.filter(u => u.state === 'move').length,
      cancelCount: diag.pointerCancel,
      cancelCountBefore: before,
      lastMove: diag.lastMoveCount,
      hit: [diag.lastHitX, diag.lastHitY]
    };
  })()`);

  const lostPointerUp = await evalExpr(`(() => {
    const app = window.STARFRONT_3D;
    app.inputCtrl.mode = 'select';
    for (const u of app.core.state.units) {
      if (u.team === 'player' && u.hp > 0) { u.selected = true; u.state = 'idle'; u.targetEntity = null; }
    }
    const canvas = document.getElementById('battlefieldCanvas3D');
    const rect = canvas.getBoundingClientRect();
    const x = rect.left + rect.width * 0.58;
    const y = rect.top + rect.height * 0.42;
    canvas.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 3, pointerType: 'touch', button: 0, buttons: 1, clientX: x, clientY: y, bubbles: true, cancelable: true }));
    let used = 'none';
    let touchClient = null;
    try {
      const t = new Touch({ identifier: 3, target: canvas, clientX: x, clientY: y });
      const ev = new TouchEvent('touchend', { bubbles: true, cancelable: true, changedTouches: [t] });
      touchClient = ev.changedTouches && ev.changedTouches[0] ? { x: ev.changedTouches[0].clientX, y: ev.changedTouches[0].clientY } : null;
      canvas.dispatchEvent(ev);
      used = 'TouchEvent';
    } catch (err) {
      used = String(err && err.message ? err.message : err);
    }
    const players = app.core.state.units.filter(u => u.team === 'player' && u.hp > 0);
    const diag = app.inputCtrl.getDiagnostics();
    return {
      used,
      touchClient,
      moving: players.filter(u => u.state === 'move').length,
      selected: players.filter(u => u.selected).length,
      fallback: diag.touchEndFallback,
      lastMove: diag.lastMoveCount,
      hit: [diag.lastHitX, diag.lastHitY]
    };
  })()`);

  await settlePlayers();
  await evalExpr(`(() => { window.STARFRONT_3D.inputCtrl.mode = 'select'; return true; })()`);

  return { test1, test2, test3, test4, test5, test6, test7, pointerCancelTap, lostPointerUp };
}

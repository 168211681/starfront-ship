// ============================================================================
// STARFRONT 3D — VERTICAL SLICE 001
// Module: src/main.ts
// Entrypoint, Tactical HUD Wiring, Main Animation Loop, and Phase 3
// Lightweight iPhone Safari Diagnostic Performance HUD + JSON Telemetry Export
// ============================================================================

import * as THREE from 'three';
import { GameCore } from './core/simulation';
import { BattlefieldScene3D } from './render/scene3d';
import { InputController3D } from './input/inputController';
import type { BuildingType, QualityPreset, UnitType } from './core/types';

// Expose THREE on window for browser verification provenance (official REVISION vs offline shim).
(window as unknown as { THREE: typeof THREE }).THREE = THREE;

export interface HudErrorRecord {
  context: string;
  message: string;
  stack?: string;
  timestampIso: string;
}

const hudErrors: HudErrorRecord[] = [];

function runHudSafe(context: string, fn: () => void): void {
  try {
    fn();
  } catch (err: unknown) {
    const errorObj = err instanceof Error ? err : new Error(String(err));
    hudErrors.push({
      context,
      message: errorObj.message,
      stack: errorObj.stack,
      timestampIso: new Date().toISOString()
    });
    console.error(`[STARFRONT_HUD_ERROR] ${context}:`, err);
  }
}

const core = new GameCore();
const viewportEl = document.getElementById('viewport3d') as HTMLElement;
const selBoxEl = document.getElementById('selectionBox') as HTMLElement;
const scene3d = new BattlefieldScene3D(viewportEl, core);

let statusToastTimer: number | undefined;

function setStatusMessage(msg?: string): void {
  runHudSafe('setStatusMessage', () => {
    if (msg) {
      const toast = document.getElementById('statusToast');
      if (toast) {
        toast.textContent = msg;
        toast.style.opacity = '1';
        clearTimeout(statusToastTimer);
        statusToastTimer = window.setTimeout(() => {
          toast.style.opacity = '0';
        }, 2200);
      }
    }
    updateHUD();
  });
}

const inputCtrl = new InputController3D(
  scene3d.renderer.domElement,
  selBoxEl,
  core,
  scene3d,
  setStatusMessage
);

function updateHUD(): void {
  runHudSafe('updateHUD', () => {
    const s = core.state;
    const stats = core.getPlayerStats();

    const elGdp = document.getElementById('hudGdp');
    const elRate = document.getElementById('hudGdpRate');
    const elSupply = document.getElementById('hudSupply');
    const elPower = document.getElementById('hudPower');
    const elOutpost = document.getElementById('hudOutpost');
    const elSelected = document.getElementById('hudSelected');

    if (elGdp) elGdp.textContent = `${Math.floor(s.crystals)}`;
    if (elRate) elRate.textContent = `+${stats.passiveIncome}/s`;
    if (elSupply) elSupply.textContent = `${stats.supplyUsed}/${stats.supplyMax}`;
    if (elPower) elPower.textContent = `${stats.powerUsed}/${stats.powerMax}`;

    const op = s.outposts[0];
    if (elOutpost && op) {
      const ownerTag =
        op.contested
          ? 'CONTESTED'
          : op.owner === 'player'
          ? 'AEGIS (PLAYER)'
          : op.owner === 'bot2'
          ? 'TITAN (BOT 2)'
          : op.owner === 'enemy'
          ? 'CRIMSON (ENEMY)'
          : `NEUTRAL (${Math.round(op.progress)}%)`;
      elOutpost.textContent = ownerTag;
    }

    const sel = s.units.filter((u) => u.team === 'player' && u.selected && u.hp > 0);
    if (elSelected) {
      if (sel.length === 0) {
        elSelected.textContent = 'No units selected — Tap or drag-box friendly units';
      } else {
        const totalHp = Math.round(sel.reduce((acc, u) => acc + u.hp, 0));
        elSelected.textContent = `Selected: ${sel.length} unit(s) • Total HP: ${totalHp}`;
      }
    }

    const btnSelect = document.getElementById('btnModeSelect');
    const btnPan = document.getElementById('btnModePan');
    const btnAtk = document.getElementById('btnAttackMove');
    if (btnSelect && btnPan && btnAtk) {
      btnSelect.classList.toggle('active-btn', inputCtrl.mode === 'select');
      btnPan.classList.toggle('active-btn', inputCtrl.mode === 'pan');
      btnAtk.classList.toggle('active-atk', inputCtrl.mode === 'attackMove');
    }

    const modal = document.getElementById('victoryModal');
    if (modal) {
      if (s.winner) {
        modal.style.display = 'flex';
        const title = document.getElementById('victoryTitle');
        if (title) {
          title.textContent = s.winner === 'player' ? 'VICTORY — SECTOR SECURED!' : 'DEFEAT — HQ DESTROYED';
        }
      } else {
        modal.style.display = 'none';
      }
    }
  });
}

// ============================================================================
// PHASE 3: Lightweight Debug-Only iPhone Performance HUD & Telemetry Recorder
// - Zero PII collection, zero automatic network transmission
// - Fixed-size ring buffer (240 frames) updated with O(1) array write per frame
// - Percentile sorting (p95 frame time & ~1% low FPS) runs only at 2 Hz UI tick
// - Explicitly labels browser rAF frame delta & CPU-side render submission time
// ============================================================================
const RING_SIZE = 240;
const frameDeltaRing = new Float32Array(RING_SIZE);
const sortScratch = new Float32Array(RING_SIZE);
let ringIdx = 0;
let ringCount = 0;

export interface PerSecondTelemetrySample {
  timestampIso: string;
  elapsedSec: number;
  simTimeSec: number;
  fpsRollingAvg: number;
  fpsApprox1PercentLow: number;
  browserFrameTimeAvgMs: number;
  browserFrameTimeP95Ms: number;
  cpuRenderCallAvgMs: number;
  /** CPU timing split; averages updated each frame, excludes GPU execution. */
  cpuSimulationAvgMs: number;
  cpuSceneSyncAvgMs: number;
  cpuGameFrameAvgMs: number;
  simulationStepsAvgPerFrame: number;
  drawCalls: number;
  instancedDrawCalls: number;
  renderedTriangles: number;
  renderedLines: number;
  activeUnitCount: number;
  activeBuildingCount: number;
  activeInstancedMeshCount: number;
  activeInstanceCount: number;
  devicePixelRatio: number;
  rendererPixelRatio: number;
  graphicsPreset: QualityPreset;
  webglContextLossCount: number;
  viewportCssWidth: number;
  viewportCssHeight: number;
  drawingBufferWidth: number;
  drawingBufferHeight: number;
  orientation: 'portrait' | 'landscape';
}

export interface DeviceMetrics {
  userAgent: string;
  language: string;
  devicePixelRatio: number;
  screenWidth: number;
  screenHeight: number;
  innerWidth: number;
  innerHeight: number;
  hardwareConcurrency: number;
  maxTouchPoints: number;
}

/** Documented browser-side method. Not a vendor 1% low and not a GPU timestamp query. */
export interface FpsMeasurementMethod {
  sampleSource: string;
  ringFrames: number;
  averageFps: string;
  approx1PercentLowFps: string;
  browserFrameTime: string;
  cpuRenderSubmissionTime: string;
  notMeasured: string[];
}

export type TelemetrySessionEvent =
  | {
      kind: 'viewport-resize';
      timestampIso: string;
      perfMs: number;
      cssWidth: number;
      cssHeight: number;
      applied: boolean;
      reason: string;
      devicePixelRatio: number;
      drawingBufferWidth: number;
      drawingBufferHeight: number;
    }
  | {
      kind: 'visibility';
      timestampIso: string;
      perfMs: number;
      visibilityState: DocumentVisibilityState;
      hidden: boolean;
    }
  | {
      kind: 'graphics-preset';
      timestampIso: string;
      perfMs: number;
      preset: QualityPreset;
      devicePixelRatio: number;
      rendererPixelRatio: number;
    }
  | {
      kind: 'webgl-context-loss';
      timestampIso: string;
      perfMs: number;
      count: number;
    };

export interface TelemetryReportExport {
  schemaVersion: 'starfront-3d-r2.2-telemetry-v1';
  measurementNote: string;
  measurementMethod: FpsMeasurementMethod;
  device: DeviceMetrics;
  recordingStartedAt: string;
  recordingStoppedAt: string;
  durationSeconds: number;
  sampleCount: number;
  /** @deprecated Preserved for backward compatibility with R2.0 telemetry schema consumers */
  samplesCount: number;
  /** Individual requestAnimationFrame deltas, oldest first, capped at the ring size. */
  recentFrameDeltasMs: number[];
  summary: {
    overallAvgFps: number;
    min1PercentLowFps: number;
    maxBrowserFrameTimeP95Ms: number;
    peakDrawCalls: number;
    peakTriangles: number;
    peakActiveUnits: number;
    totalWebglContextLosses: number;
  };
  samples: PerSecondTelemetrySample[];
  events: TelemetrySessionEvent[];
}

let isRecordingTelemetry = false;
let recordingStartIso = '';
let recordingStartPerfMs = 0;
let lastSamplePerfMs = 0;
let recordedSamples: PerSecondTelemetrySample[] = [];
let diagHudVisible = false;
let avgSimulationMs = 0;
let avgSceneSyncMs = 0;
let avgGameFrameMs = 0;
let avgSimulationSteps = 0;

function smoothFrameCost(previous: number, current: number): number {
  return previous === 0 ? current : previous * 0.9 + current * 0.1;
}

const MAX_TELEMETRY_EVENTS = 240;
const sessionEvents: TelemetrySessionEvent[] = [];

const FPS_MEASUREMENT_METHOD: FpsMeasurementMethod = {
  sampleSource:
    'Individual requestAnimationFrame deltas from performance.now() between callbacks. A fixed ring of 240 deltas is kept.',
  ringFrames: RING_SIZE,
  averageFps: '1000 divided by the arithmetic mean of the rAF deltas in the ring.',
  approx1PercentLowFps:
    '1000 divided by the p99 rAF delta. Deltas are sorted ascending; the index is min(n-1, floor(n * 0.99)). This is an approximate browser-side 1% low, not PresentMon and not a GPU timestamp.',
  browserFrameTime:
    'The rAF delta itself (simulation, scene sync, submission, and time until the next callback). It is not GPU execution time.',
  cpuRenderSubmissionTime:
    'performance.now() wrapped only around renderer.render(). That is CPU-side submission time, not GPU execution time.',
  notMeasured: [
    'native thermal state',
    'GPU execution time',
    'EXT_disjoint_timer_query',
    'ProcessInfo.ThermalState'
  ]
};

function readDeviceMetrics(): DeviceMetrics {
  return {
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    language: typeof navigator !== 'undefined' ? navigator.language : '',
    devicePixelRatio: Number((window.devicePixelRatio || 1).toFixed(2)),
    screenWidth: window.screen?.width ?? 0,
    screenHeight: window.screen?.height ?? 0,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    hardwareConcurrency: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 0 : 0,
    maxTouchPoints: typeof navigator !== 'undefined' ? navigator.maxTouchPoints || 0 : 0
  };
}

function pushSessionEvent(event: TelemetrySessionEvent): void {
  sessionEvents.push(event);
  if (sessionEvents.length > MAX_TELEMETRY_EVENTS) sessionEvents.shift();
}

function recentFrameDeltasMs(): number[] {
  const out: number[] = [];
  if (ringCount === 0) return out;
  if (ringCount < RING_SIZE) {
    for (let i = 0; i < ringCount; i++) out.push(Number(frameDeltaRing[i].toFixed(2)));
    return out;
  }
  for (let i = 0; i < RING_SIZE; i++) {
    out.push(Number(frameDeltaRing[(ringIdx + i) % RING_SIZE].toFixed(2)));
  }
  return out;
}

const PRESET_SHORT: Record<QualityPreset, string> = {
  eco: 'ECO',
  balanced: 'BAL',
  quality: 'QUAL'
};

function setDiagHudVisible(visible: boolean): void {
  diagHudVisible = visible;
  const panel = document.getElementById('diagHudPanel');
  const btn = document.getElementById('btnToggleDiagHud');
  if (panel) {
    panel.style.display = visible ? 'block' : 'none';
    if (typeof panel.setAttribute === 'function') {
      panel.setAttribute('aria-hidden', visible ? 'false' : 'true');
    }
  }
  if (btn) {
    btn.classList.toggle('active-btn', visible);
    if (typeof btn.setAttribute === 'function') {
      btn.setAttribute('aria-expanded', visible ? 'true' : 'false');
    }
    btn.textContent = visible ? 'Hide' : 'Diag';
  }
  if (visible) updateDiagnosticHUD(buildCurrentTelemetrySample(performance.now()));
}

function recordFrameDelta(dtMs: number): void {
  if (dtMs <= 0 || dtMs > 1000) return;
  frameDeltaRing[ringIdx] = dtMs;
  ringIdx = (ringIdx + 1) % RING_SIZE;
  if (ringCount < RING_SIZE) ringCount++;
}

function computeFrameMetrics(): {
  fpsRollingAvg: number;
  fpsApprox1PercentLow: number;
  frameTimeAvgMs: number;
  frameTimeP95Ms: number;
} {
  if (ringCount === 0) {
    return {
      fpsRollingAvg: 60,
      fpsApprox1PercentLow: 60,
      frameTimeAvgMs: 16.67,
      frameTimeP95Ms: 16.67
    };
  }
  let sumMs = 0;
  for (let i = 0; i < ringCount; i++) {
    const v = frameDeltaRing[i];
    sumMs += v;
    sortScratch[i] = v;
  }
  const sub = sortScratch.subarray(0, ringCount);
  sub.sort(); // Ascending frame times in ms (small = fast, large = slow)

  const avgMs = sumMs / ringCount;
  const p95Idx = Math.min(ringCount - 1, Math.floor(ringCount * 0.95));
  const p99Idx = Math.min(ringCount - 1, Math.floor(ringCount * 0.99));
  const p95Ms = sub[p95Idx];
  const p99Ms = sub[p99Idx];

  const fpsAvg = avgMs > 0 ? 1000 / avgMs : 60;
  const fps1Low = p99Ms > 0 ? 1000 / p99Ms : fpsAvg;

  return {
    fpsRollingAvg: Number(fpsAvg.toFixed(1)),
    fpsApprox1PercentLow: Number(fps1Low.toFixed(1)),
    frameTimeAvgMs: Number(avgMs.toFixed(2)),
    frameTimeP95Ms: Number(p95Ms.toFixed(2))
  };
}

function buildCurrentTelemetrySample(nowPerfMs: number): PerSecondTelemetrySample {
  const fm = computeFrameMetrics();
  const rt = scene3d.getRenderTelemetry();
  const canvas = scene3d.renderer.domElement;
  const cssW = Math.round(viewportEl.clientWidth || window.innerWidth || 0);
  const cssH = Math.round(viewportEl.clientHeight || window.innerHeight || 0);
  const bufW = canvas?.width || 0;
  const bufH = canvas?.height || 0;
  const activeUnits = core.state.units.reduce((acc, u) => (u.hp > 0 ? acc + 1 : acc), 0);
  const activeBuildings = core.state.buildings.reduce((acc, b) => (b.hp > 0 ? acc + 1 : acc), 0);

  return {
    timestampIso: new Date().toISOString(),
    elapsedSec: isRecordingTelemetry ? Number(((nowPerfMs - recordingStartPerfMs) / 1000).toFixed(2)) : 0,
    simTimeSec: Number(core.state.timeElapsed.toFixed(2)),
    fpsRollingAvg: fm.fpsRollingAvg,
    fpsApprox1PercentLow: fm.fpsApprox1PercentLow,
    browserFrameTimeAvgMs: fm.frameTimeAvgMs,
    browserFrameTimeP95Ms: fm.frameTimeP95Ms,
    cpuRenderCallAvgMs: rt.avgFrameRenderMs,
    cpuSimulationAvgMs: Number(avgSimulationMs.toFixed(3)),
    cpuSceneSyncAvgMs: Number(avgSceneSyncMs.toFixed(3)),
    cpuGameFrameAvgMs: Number(avgGameFrameMs.toFixed(3)),
    simulationStepsAvgPerFrame: Number(avgSimulationSteps.toFixed(2)),
    drawCalls: rt.drawCalls,
    instancedDrawCalls: rt.instancedDrawCalls,
    renderedTriangles: rt.triangles,
    renderedLines: rt.lines,
    activeUnitCount: activeUnits,
    activeBuildingCount: activeBuildings,
    activeInstancedMeshCount: rt.visibleInstancedMeshes,
    activeInstanceCount: rt.activeInstances,
    devicePixelRatio: Number((window.devicePixelRatio || 1).toFixed(2)),
    rendererPixelRatio: Number((scene3d.renderer.getPixelRatio ? scene3d.renderer.getPixelRatio() : 1).toFixed(2)),
    graphicsPreset: scene3d.getQualityPreset(),
    webglContextLossCount: rt.contextLossCount,
    viewportCssWidth: cssW,
    viewportCssHeight: cssH,
    drawingBufferWidth: bufW,
    drawingBufferHeight: bufH,
    orientation: cssW >= cssH ? 'landscape' : 'portrait'
  };
}

function updateDiagnosticHUD(sample: PerSecondTelemetrySample): void {
  runHudSafe('updateDiagnosticHUD', () => {
    const elDrawTop = document.getElementById('hudDrawCalls');
    const elFpsTop = document.getElementById('hudFps');
    if (elDrawTop) {
      elDrawTop.textContent = `${sample.drawCalls} (${sample.instancedDrawCalls} inst)`;
    }
    if (elFpsTop) {
      elFpsTop.textContent = `${Math.round(sample.fpsRollingAvg)}`;
    }

    if (!diagHudVisible) return;

    const setTxt = (id: string, val: string) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setTxt('diagFpsAvg', `${sample.fpsRollingAvg.toFixed(1)}`);
    setTxt('diagFps1Low', `${sample.fpsApprox1PercentLow.toFixed(1)}`);
    setTxt('diagFrameTime', `${sample.browserFrameTimeAvgMs.toFixed(1)} / ${sample.browserFrameTimeP95Ms.toFixed(1)} ms`);
    setTxt('diagCpuRender', `${sample.cpuRenderCallAvgMs.toFixed(2)} ms`);
    setTxt('diagDrawCalls', `${sample.drawCalls} (${sample.instancedDrawCalls} inst)`);
    setTxt('diagTriangles', sample.renderedTriangles.toLocaleString());
    setTxt('diagUnits', `${sample.activeUnitCount}`);
    setTxt('diagInstMeshes', `${sample.activeInstancedMeshCount} (${sample.activeInstanceCount} inst)`);
    setTxt('diagDpr', `${sample.rendererPixelRatio.toFixed(2)} / ${sample.devicePixelRatio.toFixed(2)}`);
    setTxt('diagPreset', sample.graphicsPreset.toUpperCase());
    setTxt('diagCtxLoss', `${sample.webglContextLossCount}`);
    setTxt('diagViewport', `${sample.viewportCssWidth}×${sample.viewportCssHeight} (${sample.drawingBufferWidth}×${sample.drawingBufferHeight})`);

    const inputDiag = inputCtrl.getDiagnostics();
    setTxt('diagPointerCounts', `${inputDiag.pointerDown}/${inputDiag.pointerUp}/${inputDiag.pointerCancel}`);
    setTxt('diagTouchCounts', `${inputDiag.touchStart}/${inputDiag.touchEnd}/${inputDiag.touchCancel}`);
    setTxt('diagLastGesture', inputDiag.lastGesture);
    setTxt('diagInputMode', inputDiag.mode);
    setTxt('diagSelectedCount', `${inputDiag.selectedCount}`);
    setTxt(
      'diagWorldHit',
      inputDiag.lastHitFailed
        ? 'MISS'
        : inputDiag.lastHitX === null
          ? '—'
          : `${inputDiag.lastHitX}, ${inputDiag.lastHitY}`
    );
    setTxt('diagMoveOrders', `${inputDiag.moveOrdersIssued} (last ${inputDiag.lastMoveCount})`);
    setTxt('diagUnitDelta', inputDiag.unitPositionDelta.toFixed(1));
    const simLabel = !inputDiag.running
      ? 'stopped'
      : inputDiag.paused
        ? 'paused'
        : inputDiag.tacticalPause
          ? 'tactical-pause'
          : 'running';
    setTxt('diagSimState', simLabel);

    const recStatus = document.getElementById('diagRecStatus');
    if (recStatus) {
      if (isRecordingTelemetry) {
        recStatus.textContent = `● REC (${recordedSamples.length}s)`;
        recStatus.style.color = '#fb7185';
      } else {
        recStatus.textContent = recordedSamples.length > 0 ? `SAVED (${recordedSamples.length}s)` : 'IDLE';
        recStatus.style.color = '#94a3b8';
      }
    }
  });
}

function startTelemetryRecording(): void {
  isRecordingTelemetry = true;
  recordingStartIso = new Date().toISOString();
  recordingStartPerfMs = performance.now();
  lastSamplePerfMs = recordingStartPerfMs - 1000;
  recordedSamples = [];

  const firstSample = buildCurrentTelemetrySample(recordingStartPerfMs);
  firstSample.elapsedSec = 0;
  recordedSamples.push(firstSample);
  lastSamplePerfMs = recordingStartPerfMs;

  runHudSafe('startTelemetryRecording', () => {
    const btnStart = document.getElementById('btnDiagStartRec') as HTMLButtonElement | null;
    const btnStop = document.getElementById('btnDiagStopExport') as HTMLButtonElement | null;
    if (btnStart) {
      btnStart.textContent = 'Recording';
      btnStart.classList.add('recording');
      btnStart.disabled = true;
    }
    if (btnStop) {
      btnStop.disabled = false;
    }
  });
  updateDiagnosticHUD(firstSample);
  setStatusMessage('Started per-second performance telemetry recording');
}

function stopAndExportTelemetryReport(): TelemetryReportExport {
  const stopPerfMs = performance.now();
  if (isRecordingTelemetry) {
    const finalSample = buildCurrentTelemetrySample(stopPerfMs);
    recordedSamples.push(finalSample);
  }
  isRecordingTelemetry = false;
  const stopIso = new Date().toISOString();

  runHudSafe('stopAndExportTelemetryReport', () => {
    const btnStart = document.getElementById('btnDiagStartRec') as HTMLButtonElement | null;
    const btnStop = document.getElementById('btnDiagStopExport') as HTMLButtonElement | null;
    if (btnStart) {
      btnStart.textContent = 'Start';
      btnStart.classList.remove('recording');
      btnStart.disabled = false;
    }
    if (btnStop) {
      btnStop.disabled = true;
    }
  });

  const samples = recordedSamples.length > 0 ? recordedSamples : [buildCurrentTelemetrySample(stopPerfMs)];
  const avgFps = samples.reduce((acc, s) => acc + s.fpsRollingAvg, 0) / samples.length;
  const min1Low = Math.min(...samples.map((s) => s.fpsApprox1PercentLow));
  const maxP95 = Math.max(...samples.map((s) => s.browserFrameTimeP95Ms));
  const peakCalls = Math.max(...samples.map((s) => s.drawCalls));
  const peakTris = Math.max(...samples.map((s) => s.renderedTriangles));
  const peakUnits = Math.max(...samples.map((s) => s.activeUnitCount));
  const maxCtxLoss = Math.max(...samples.map((s) => s.webglContextLossCount));

  const report: TelemetryReportExport = {
    schemaVersion: 'starfront-3d-r2.2-telemetry-v1',
    measurementNote:
      'Browser requestAnimationFrame frame-to-frame deltas and CPU-side WebGL render submission times. browserFrameTime* is the rAF delta. cpuRenderCallAvgMs is renderer.render() submission only. Not hardware GPU timer queries or native thermal state.',
    measurementMethod: FPS_MEASUREMENT_METHOD,
    device: readDeviceMetrics(),
    recordingStartedAt: recordingStartIso || stopIso,
    recordingStoppedAt: stopIso,
    durationSeconds: Number(((stopPerfMs - (recordingStartPerfMs || stopPerfMs)) / 1000).toFixed(2)),
    sampleCount: samples.length,
    samplesCount: samples.length,
    recentFrameDeltasMs: recentFrameDeltasMs(),
    summary: {
      overallAvgFps: Number(avgFps.toFixed(1)),
      min1PercentLowFps: Number(min1Low.toFixed(1)),
      maxBrowserFrameTimeP95Ms: Number(maxP95.toFixed(2)),
      peakDrawCalls: peakCalls,
      peakTriangles: peakTris,
      peakActiveUnits: peakUnits,
      totalWebglContextLosses: maxCtxLoss
    },
    samples,
    events: sessionEvents.slice()
  };

  (window as any).__STARFRONT_LAST_TELEMETRY_EXPORT__ = report;

  try {
    const jsonStr = JSON.stringify(report, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `starfront-3d-telemetry-${stopIso.replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  } catch (_e) {
    // Headless environment fallback: report remains on window.__STARFRONT_LAST_TELEMETRY_EXPORT__
  }

  updateDiagnosticHUD(samples[samples.length - 1]);
  setStatusMessage(`Exported JSON telemetry report (${samples.length} samples)`);
  return report;
}

// Wire HUD Controls inside isolated HUD error boundary
runHudSafe('bindHudControls', () => {
  document.getElementById('btnToggleDiagHud')?.addEventListener('click', () => {
    runHudSafe('btnToggleDiagHud', () => {
      setDiagHudVisible(!diagHudVisible);
    });
  });

  document.getElementById('btnDiagClose')?.addEventListener('click', () => {
    runHudSafe('btnDiagClose', () => {
      setDiagHudVisible(false);
    });
  });

  setDiagHudVisible(false);

  document.getElementById('btnDiagStartRec')?.addEventListener('click', () => {
    startTelemetryRecording();
  });

  document.getElementById('btnDiagStopExport')?.addEventListener('click', () => {
    stopAndExportTelemetryReport();
  });

  document.getElementById('btnModeSelect')?.addEventListener('click', () => {
    inputCtrl.mode = 'select';
    setStatusMessage('Box-Select / Command Mode active');
  });

  document.getElementById('btnModePan')?.addEventListener('click', () => {
    inputCtrl.mode = 'pan';
    setStatusMessage('One-Finger Camera Pan Mode active');
  });

  document.getElementById('btnSelectAll')?.addEventListener('click', () => {
    let count = 0;
    for (const u of core.state.units) {
      if (u.team === 'player' && u.hp > 0) {
        u.selected = true;
        count++;
      } else {
        u.selected = false;
      }
    }
    setStatusMessage(`Selected all ${count} friendly combat units`);
  });

  document.getElementById('btnAttackMove')?.addEventListener('click', () => {
    const sel = core.state.units.filter((u) => u.team === 'player' && u.selected && u.hp > 0);
    if (sel.length === 0) {
      for (const u of core.state.units) {
        if (u.team === 'player' && u.hp > 0) u.selected = true;
      }
    }
    inputCtrl.mode = 'attackMove';
    setStatusMessage('Attack-Move armed — Tap target destination on 3D battlefield');
  });

  document.getElementById('btnHoldOrder')?.addEventListener('click', () => {
    const sel = core.state.units.filter((u) => u.team === 'player' && u.selected && u.hp > 0);
    sel.forEach((u) => {
      u.state = 'hold';
      u.targetEntity = null;
    });
    setStatusMessage(`${sel.length} unit(s) holding position`);
  });

  document.getElementById('btnRetreatOrder')?.addEventListener('click', () => {
    const hq = core.state.buildings.find((b) => b.team === 'player' && b.type === 'hq') || { x: 145, y: 650 };
    core.issueMoveOrder(hq.x + 80, hq.y - 60, false);
    setStatusMessage('Retreating selected squad to Aegis HQ');
  });

  const bindTrain = (btnId: string, uType: UnitType) => {
    document.getElementById(btnId)?.addEventListener('click', () => {
      const res = core.trainPlayerUnit(uType);
      if (res.ok) {
        setStatusMessage(`Deployed ${res.unit?.name || uType}`);
      } else {
        setStatusMessage(`Cannot deploy: ${res.reason}`);
      }
    });
  };
  bindTrain('btnTrainMarine', 'marine');
  bindTrain('btnTrainTrooper', 'trooper');
  bindTrain('btnTrainApc', 'apc');
  bindTrain('btnTrainTank', 'tank');

  document.getElementById('btnBuildTurret')?.addEventListener('click', () => {
    const res = core.constructPlayerBuilding('turret' as BuildingType);
    if (res.ok) {
      setStatusMessage('Constructed Laser Defense Turret (-150 GDP)');
    } else {
      setStatusMessage(`Cannot build Turret: ${res.reason}`);
    }
  });

  // Camera Controls
  document.getElementById('btnCamFocus')?.addEventListener('click', () => {
    const sel = core.state.units.filter((u) => u.team === 'player' && u.selected && u.hp > 0);
    const pool = sel.length > 0 ? sel : core.state.units.filter((u) => u.team === 'player' && u.hp > 0);
    if (pool.length > 0) {
      const cx = pool.reduce((s, u) => s + u.x, 0) / pool.length;
      const cy = pool.reduce((s, u) => s + u.y, 0) / pool.length;
      scene3d.focusOnWorldPoint(cx, cy);
      setStatusMessage('Camera focused on friendly squad');
    }
  });

  document.getElementById('btnCamOutpost')?.addEventListener('click', () => {
    scene3d.focusOnWorldPoint(600, 400);
    setStatusMessage('Camera centered on Omega Bridge & Outpost');
  });

  document.getElementById('btnCamRotateL')?.addEventListener('click', () => scene3d.rotateCamera(-Math.PI / 8));
  document.getElementById('btnCamRotateR')?.addEventListener('click', () => scene3d.rotateCamera(Math.PI / 8));
  document.getElementById('btnCamZoomIn')?.addEventListener('click', () =>
    scene3d.zoomAtScreenPoint(1.18, window.innerWidth / 2, window.innerHeight / 2)
  );
  document.getElementById('btnCamZoomOut')?.addEventListener('click', () =>
    scene3d.zoomAtScreenPoint(0.84, window.innerWidth / 2, window.innerHeight / 2)
  );
  document.getElementById('btnCamReset')?.addEventListener('click', () => {
    scene3d.resetCamera();
    setStatusMessage('Camera reset to default 45° tactical view');
  });

  document.getElementById('btnQualityPreset')?.addEventListener('click', () => {
    const order: QualityPreset[] = ['eco', 'balanced', 'quality'];
    const next = order[(order.indexOf(scene3d.getQualityPreset()) + 1) % order.length];
    scene3d.setQualityPreset(next);
    const el = document.getElementById('btnQualityPreset');
    if (el) el.textContent = PRESET_SHORT[next];
    pushSessionEvent({
      kind: 'graphics-preset',
      timestampIso: new Date().toISOString(),
      perfMs: Math.round(performance.now()),
      preset: next,
      devicePixelRatio: Number((window.devicePixelRatio || 1).toFixed(2)),
      rendererPixelRatio: Number((scene3d.renderer.getPixelRatio ? scene3d.renderer.getPixelRatio() : 1).toFixed(2))
    });
    setStatusMessage(`Graphics preset: ${next.toUpperCase()}`);
  });

  document.getElementById('btnPauseGame')?.addEventListener('click', () => {
    core.state.tacticalPause = !core.state.tacticalPause;
    const el = document.getElementById('btnPauseGame');
    if (el) el.textContent = core.state.tacticalPause ? 'Play' : 'Pause';
    setStatusMessage(core.state.tacticalPause ? 'Tactical Pause Active' : 'Simulation Resumed');
  });

  document.getElementById('btnRestartGame')?.addEventListener('click', () => {
    core.initVerticalSlice('normal');
    scene3d.resetCamera();
    setStatusMessage('Battlefield restarted!');
  });
});

scene3d.onContextLost = (info) => {
  pushSessionEvent({
    kind: 'webgl-context-loss',
    timestampIso: info.timestampIso,
    perfMs: Math.round(performance.now()),
    count: info.count
  });
};

scene3d.onViewportDecision = (info) => {
  const canvas = scene3d.renderer.domElement;
  pushSessionEvent({
    kind: 'viewport-resize',
    timestampIso: new Date().toISOString(),
    perfMs: Math.round(performance.now()),
    cssWidth: info.cssWidth,
    cssHeight: info.cssHeight,
    applied: info.applied,
    reason: info.reason,
    devicePixelRatio: Number((window.devicePixelRatio || 1).toFixed(2)),
    drawingBufferWidth: canvas?.width || 0,
    drawingBufferHeight: canvas?.height || 0
  });
};

function onViewportSignal(): void {
  scene3d.handleResize();
}

window.addEventListener('resize', onViewportSignal);
if (window.visualViewport && typeof window.visualViewport.addEventListener === 'function') {
  window.visualViewport.addEventListener('resize', onViewportSignal);
}
if (typeof document.addEventListener === 'function') {
  document.addEventListener('visibilitychange', () => {
    pushSessionEvent({
      kind: 'visibility',
      timestampIso: new Date().toISOString(),
      perfMs: Math.round(performance.now()),
      visibilityState: document.visibilityState,
      hidden: document.hidden
    });
  });
}
if (typeof ResizeObserver !== 'undefined') {
  const viewportObserver = new ResizeObserver(() => onViewportSignal());
  viewportObserver.observe(viewportEl);
}

pushSessionEvent({
  kind: 'graphics-preset',
  timestampIso: new Date().toISOString(),
  perfMs: Math.round(performance.now()),
  preset: scene3d.getQualityPreset(),
  devicePixelRatio: Number((window.devicePixelRatio || 1).toFixed(2)),
  rendererPixelRatio: Number((scene3d.renderer.getPixelRatio ? scene3d.renderer.getPixelRatio() : 1).toFixed(2))
});
pushSessionEvent({
  kind: 'visibility',
  timestampIso: new Date().toISOString(),
  perfMs: Math.round(performance.now()),
  visibilityState: document.visibilityState,
  hidden: document.hidden
});
pushSessionEvent({
  kind: 'viewport-resize',
  timestampIso: new Date().toISOString(),
  perfMs: Math.round(performance.now()),
  cssWidth: Math.round(viewportEl.clientWidth),
  cssHeight: Math.round(viewportEl.clientHeight),
  applied: true,
  reason: 'initial',
  devicePixelRatio: Number((window.devicePixelRatio || 1).toFixed(2)),
  drawingBufferWidth: scene3d.renderer.domElement?.width || 0,
  drawingBufferHeight: scene3d.renderer.domElement?.height || 0
});

// Main Loop with Lightweight Telemetry & Diagnostic HUD
let lastFrameTime = performance.now();
let hudAccum = 0;
let diagAccum = 0;
let firstFrameRendered = false;

function animate(now: number): void {
  requestAnimationFrame(animate);
  const dtMs = Math.max(0, now - lastFrameTime);
  const elapsed = dtMs / 1000;
  lastFrameTime = now;

  recordFrameDelta(dtMs);

  const frameWorkStart = performance.now();
  const { steps, alpha } = core.stepSimulation(elapsed);
  const afterSimulation = performance.now();
  scene3d.syncFromGameCore(alpha);
  const afterSceneSync = performance.now();
  scene3d.render();
  const afterRender = performance.now();
  avgSimulationMs = smoothFrameCost(avgSimulationMs, afterSimulation - frameWorkStart);
  avgSceneSyncMs = smoothFrameCost(avgSceneSyncMs, afterSceneSync - afterSimulation);
  avgGameFrameMs = smoothFrameCost(avgGameFrameMs, afterRender - frameWorkStart);
  avgSimulationSteps = smoothFrameCost(avgSimulationSteps, steps);

  if (isRecordingTelemetry && now - lastSamplePerfMs >= 1000) {
    lastSamplePerfMs = now;
    recordedSamples.push(buildCurrentTelemetrySample(now));
  }

  diagAccum += elapsed;
  if (diagAccum >= 0.5) {
    diagAccum = 0;
    updateDiagnosticHUD(buildCurrentTelemetrySample(now));
  }

  hudAccum += elapsed;
  if (hudAccum >= 0.2) {
    hudAccum = 0;
    updateHUD();
  }
}

// Render the initial 3D battlefield frame before exposing application readiness
core.stepSimulation(0);
scene3d.syncFromGameCore(0);
scene3d.render();
firstFrameRendered = true;

updateHUD();
updateDiagnosticHUD(buildCurrentTelemetrySample(performance.now()));
requestAnimationFrame(animate);

// Canonical application harness at window.STARFRONT_3D (exposed only after init & first frame render)
const appHarness = {
  ready: true,
  firstFrameRendered,
  core,
  scene3d,
  inputCtrl,
  startTelemetryRecording,
  stopAndExportTelemetryReport,
  getLastTelemetryReport: () => (window as any).__STARFRONT_LAST_TELEMETRY_EXPORT__,
  getSessionTelemetry: () => ({
    events: sessionEvents.slice(),
    measurementMethod: FPS_MEASUREMENT_METHOD,
    device: readDeviceMetrics()
  }),
  getHudHealth: () => ({
    ok: hudErrors.length === 0,
    errorCount: hudErrors.length,
    errors: [...hudErrors]
  })
};

(window as any).STARFRONT_3D = appHarness;
// Legacy alias preserved for backward compatibility with mocked-DOM TEST-12 in tests/run-tests.mjs
(window as any).__STARFRONT_3D__ = appHarness;

(window as any).__STARFRONT_DIAG__ = {
  startRecording: startTelemetryRecording,
  stopAndExport: stopAndExportTelemetryReport,
  getSnapshot: () => buildCurrentTelemetrySample(performance.now()),
  isRecording: () => isRecordingTelemetry
};

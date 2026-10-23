import { GameCore, SimUnit, SimBuilding } from '../core/simulation';
import { BattlefieldScene3D } from '../render/scene3d';
import {
  BOX_SELECT_MIN_PX,
  PAN_SLOP_PX,
  SessionIdMap,
  classifyRelease,
  eventClientPoint,
  isUnreliableLift,
  shouldAliasExisting,
  type GestureSource,
  type InteractionMode
} from './unifiedGesture';

export type { InteractionMode };

export interface InputDiagnostics {
  pointerDown: number;
  pointerUp: number;
  pointerCancel: number;
  touchStart: number;
  touchEndFallback: number;
  mode: InteractionMode;
  selectedCount: number;
  lastHitX: number | null;
  lastHitY: number | null;
  lastHitFailed: boolean;
  moveOrdersIssued: number;
  lastMoveCount: number;
  running: boolean;
  paused: boolean;
  tacticalPause: boolean;
  unitPositionDelta: number;
}

export class InputController3D {
  public mode: InteractionMode = 'select';
  private activePointers = new Map<number, { x: number; y: number }>();
  private endedSessions = new Set<number>();
  private ids = new SessionIdMap();
  private primaryPointerId: number | null = null;
  private startX = 0;
  private startY = 0;
  private currX = 0;
  private currY = 0;
  private sawMove = false;
  private isDragging = false;
  private multiTouchGuardUntil = 0;
  private prevPinchDist = 0;
  private prevPinchMidX = 0;
  private prevPinchMidY = 0;
  private prevPinchAngle = 0;
  private pointerDownCount = 0;
  private pointerUpCount = 0;
  private pointerCancelCount = 0;
  private touchStartCount = 0;
  private touchEndFallbackCount = 0;
  private moveOrdersIssued = 0;
  private lastMoveCount = 0;
  private lastHitX: number | null = null;
  private lastHitY: number | null = null;
  private lastHitFailed = false;
  private orderAnchor: Map<number, { x: number; y: number }> | null = null;

  constructor(
    private domElement: HTMLElement,
    private selectionBoxEl: HTMLElement,
    private core: GameCore,
    private scene3d: BattlefieldScene3D,
    private onStatusUpdate: (msg?: string) => void
  ) {
    this.bindEvents();
  }

  public getDiagnostics(): InputDiagnostics {
    const selectedCount = this.core.state.units.filter(
      (u) => u.team === 'player' && u.selected && u.hp > 0
    ).length;
    return {
      pointerDown: this.pointerDownCount,
      pointerUp: this.pointerUpCount,
      pointerCancel: this.pointerCancelCount,
      touchStart: this.touchStartCount,
      touchEndFallback: this.touchEndFallbackCount,
      mode: this.mode,
      selectedCount,
      lastHitX: this.lastHitX,
      lastHitY: this.lastHitY,
      lastHitFailed: this.lastHitFailed,
      moveOrdersIssued: this.moveOrdersIssued,
      lastMoveCount: this.lastMoveCount,
      running: this.core.state.running,
      paused: this.core.state.paused,
      tacticalPause: this.core.state.tacticalPause,
      unitPositionDelta: this.measureOrderDelta()
    };
  }

  private bindEvents(): void {
    this.domElement.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    this.domElement.addEventListener('pointermove', (e) => this.onPointerMove(e));
    this.domElement.addEventListener('pointerup', (e) => this.onPointerEnd(e, false));
    this.domElement.addEventListener('pointercancel', (e) => this.onPointerEnd(e, true));
    window.addEventListener('pointerup', (e) => this.onPointerEnd(e, false));
    window.addEventListener('pointercancel', (e) => this.onPointerEnd(e, true));
    this.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
    this.domElement.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.12 : 0.89;
        this.scene3d.zoomAtScreenPoint(factor, e.clientX, e.clientY);
      },
      { passive: false }
    );

    this.domElement.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
    this.domElement.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
    this.domElement.addEventListener('touchend', (e) => this.onTouchEnd(e, false), { passive: false });
    this.domElement.addEventListener('touchcancel', (e) => this.onTouchEnd(e, true), { passive: false });
  }

  private onTouchStart(e: TouchEvent): void {
    if (e.cancelable) e.preventDefault();
    const changed = e.changedTouches;
    if (!changed) return;
    for (let i = 0; i < changed.length; i++) {
      const t = changed.item(i);
      if (!t) continue;
      this.touchStartCount++;
      this.ingestDown(t.identifier, t.clientX, t.clientY, 'touch', null);
    }
  }

  private onTouchMove(e: TouchEvent): void {
    if (e.cancelable) e.preventDefault();
    const changed = e.changedTouches;
    if (!changed) return;
    for (let i = 0; i < changed.length; i++) {
      const t = changed.item(i);
      if (!t) continue;
      this.ingestMove(t.identifier, t.clientX, t.clientY);
    }
  }

  private onTouchEnd(e: TouchEvent, isCancel: boolean): void {
    if (e.cancelable) e.preventDefault();
    const changed = e.changedTouches;
    if (!changed) return;
    for (let i = 0; i < changed.length; i++) {
      const t = changed.item(i);
      if (!t) continue;
      this.ingestUp(t.identifier, t.clientX, t.clientY, isCancel, 'touch');
    }
  }

  private tryCapture(pointerId: number): void {
    const el = this.domElement as HTMLElement & {
      setPointerCapture?: (id: number) => void;
    };
    if (typeof el.setPointerCapture !== 'function') return;
    try {
      el.setPointerCapture(pointerId);
    } catch {
      // Synthetic PointerEvents and some WebKit builds have no active pointer id.
    }
  }

  private tryRelease(pointerId: number): void {
    const el = this.domElement as HTMLElement & {
      hasPointerCapture?: (id: number) => boolean;
      releasePointerCapture?: (id: number) => void;
    };
    if (typeof el.releasePointerCapture !== 'function') return;
    try {
      if (typeof el.hasPointerCapture === 'function' && !el.hasPointerCapture(pointerId)) return;
      el.releasePointerCapture(pointerId);
    } catch {
      // Already released.
    }
  }

  private findAliasSession(x: number, y: number): number | null {
    let best: number | null = null;
    let bestD = Number.POSITIVE_INFINITY;
    for (const [id, p] of this.activePointers) {
      if (!shouldAliasExisting(p, { x, y })) continue;
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < bestD) {
        bestD = d;
        best = id;
      }
    }
    return best;
  }

  private ingestDown(
    rawId: number,
    clientX: number,
    clientY: number,
    source: GestureSource,
    captureId: number | null
  ): void {
    if (this.activePointers.size === 0) {
      this.endedSessions.clear();
      this.ids.clear();
    }

    const nearby = this.findAliasSession(clientX, clientY);
    if (nearby !== null && nearby !== rawId) {
      this.ids.bind(rawId, nearby);
      this.activePointers.set(nearby, { x: clientX, y: clientY });
      if (captureId !== null) this.tryCapture(captureId);
      return;
    }

    if (this.activePointers.has(rawId)) {
      this.activePointers.set(rawId, { x: clientX, y: clientY });
      if (captureId !== null) this.tryCapture(captureId);
      return;
    }

    this.activePointers.set(rawId, { x: clientX, y: clientY });
    if (captureId !== null) this.tryCapture(captureId);

    if (this.activePointers.size >= 2) {
      this.primaryPointerId = null;
      this.isDragging = false;
      this.hideSelectionBox();
      this.multiTouchGuardUntil = performance.now() + 280;
      const pts = Array.from(this.activePointers.values());
      this.prevPinchDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      this.prevPinchMidX = (pts[0].x + pts[1].x) * 0.5;
      this.prevPinchMidY = (pts[0].y + pts[1].y) * 0.5;
      this.prevPinchAngle = Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x);
      return;
    }

    if (performance.now() < this.multiTouchGuardUntil) return;

    this.primaryPointerId = rawId;
    this.startX = clientX;
    this.startY = clientY;
    this.currX = clientX;
    this.currY = clientY;
    this.sawMove = false;
    this.isDragging = false;
    void source;
  }

  private ingestMove(rawId: number, clientX: number, clientY: number): void {
    const id = this.ids.resolve(rawId);
    if (this.activePointers.has(id)) {
      this.activePointers.set(id, { x: clientX, y: clientY });
    }

    if (this.activePointers.size >= 2) {
      this.multiTouchGuardUntil = performance.now() + 280;
      const pts = Array.from(this.activePointers.values());
      const newDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      const newMidX = (pts[0].x + pts[1].x) * 0.5;
      const newMidY = (pts[0].y + pts[1].y) * 0.5;
      const newAngle = Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x);

      const dxMid = newMidX - this.prevPinchMidX;
      const dyMid = newMidY - this.prevPinchMidY;
      if (Math.hypot(dxMid, dyMid) > 0.5) {
        this.scene3d.panCameraByScreenDelta(dxMid, dyMid);
      }

      if (this.prevPinchDist > 16 && newDist > 16) {
        const scale = newDist / this.prevPinchDist;
        if (Math.abs(scale - 1) > 0.004) {
          this.scene3d.zoomAtScreenPoint(scale, newMidX, newMidY);
        }
      }

      const dAng = Math.atan2(Math.sin(newAngle - this.prevPinchAngle), Math.cos(newAngle - this.prevPinchAngle));
      if (Math.abs(dAng) > 0.015 && Math.abs(dAng) < 0.4) {
        this.scene3d.rotateCamera(dAng * 0.75);
      }

      this.prevPinchDist = newDist;
      this.prevPinchMidX = newMidX;
      this.prevPinchMidY = newMidY;
      this.prevPinchAngle = newAngle;
      return;
    }

    if (this.primaryPointerId === null || id !== this.primaryPointerId) return;

    const dx = clientX - this.currX;
    const dy = clientY - this.currY;
    this.currX = clientX;
    this.currY = clientY;
    this.sawMove = true;

    const totalDist = Math.hypot(this.currX - this.startX, this.currY - this.startY);

    if (this.mode === 'pan') {
      if (totalDist > PAN_SLOP_PX) {
        this.isDragging = true;
        this.scene3d.panCameraByScreenDelta(dx, dy);
      }
      return;
    }

    if (this.mode === 'select' && totalDist > BOX_SELECT_MIN_PX) {
      this.isDragging = true;
      this.updateSelectionBoxOverlay();
    }
  }

  private ingestUp(
    rawId: number,
    clientX: number,
    clientY: number,
    isCancel: boolean,
    source: GestureSource
  ): void {
    const id = this.ids.resolve(rawId);
    if (this.endedSessions.has(id) || this.endedSessions.has(rawId)) return;
    const wasTracked = this.activePointers.has(id) || this.primaryPointerId === id;
    if (!wasTracked) return;

    if (source === 'touch') this.touchEndFallbackCount++;
    else if (isCancel) this.pointerCancelCount++;
    else this.pointerUpCount++;

    this.activePointers.delete(id);
    this.tryRelease(rawId);
    this.tryRelease(id);
    this.endedSessions.add(id);
    this.endedSessions.add(rawId);
    this.ids.dropSession(id);

    if (this.activePointers.size > 0) {
      this.primaryPointerId = null;
      this.isDragging = false;
      this.hideSelectionBox();
      this.multiTouchGuardUntil = performance.now() + 280;
      return;
    }

    if (this.primaryPointerId === null || id !== this.primaryPointerId) return;
    this.primaryPointerId = null;

    if (performance.now() < this.multiTouchGuardUntil) {
      this.isDragging = false;
      this.hideSelectionBox();
      return;
    }

    const lift = { x: clientX, y: clientY };
    const last = { x: this.currX, y: this.currY };
    const start = { x: this.startX, y: this.startY };
    if (!isUnreliableLift(start, last, lift, this.sawMove)) {
      this.currX = clientX;
      this.currY = clientY;
    }

    const totalDist = Math.hypot(this.currX - this.startX, this.currY - this.startY);
    const action = classifyRelease(this.mode, totalDist, isCancel);

    if (action === 'tap') this.handleSingleTap(this.currX, this.currY);
    else if (action === 'box-select') this.performBoxSelection();

    this.isDragging = false;
    this.hideSelectionBox();
  }

  private onPointerDown(e: PointerEvent): void {
    this.pointerDownCount++;
    if (e.button === 2) {
      const ground = this.scene3d.screenToGroundWorld(e.clientX, e.clientY);
      if (ground) {
        const pt = this.scene3d.adapter.toGame2D(ground.x, ground.z);
        this.noteHit(pt.x, pt.y, false);
        const enemy = this.pickHostileAt(pt.x, pt.y);
        if (enemy) {
          this.core.issueAttackTargetOrder(enemy);
          this.onStatusUpdate(`Focus-firing ${enemy.name}!`);
        } else {
          this.noteMove(this.core.issueMoveOrder(pt.x, pt.y, false));
          this.onStatusUpdate(`Moving selected squad to (${Math.round(pt.x)}, ${Math.round(pt.y)})`);
        }
      } else {
        this.noteHit(0, 0, true);
      }
      return;
    }

    if (e.cancelable) e.preventDefault();
    const pt = eventClientPoint(e);
    this.ingestDown(e.pointerId, pt.x, pt.y, 'pointer', e.pointerId);
  }

  private onPointerMove(e: PointerEvent): void {
    const pt = eventClientPoint(e);
    this.ingestMove(e.pointerId, pt.x, pt.y);
  }

  private onPointerEnd(e: PointerEvent, isCancel: boolean): void {
    const pt = eventClientPoint(e);
    this.ingestUp(e.pointerId, pt.x, pt.y, isCancel, 'pointer');
  }

  private updateSelectionBoxOverlay(): void {
    const rect = this.domElement.getBoundingClientRect();
    const x1 = Math.min(this.startX, this.currX) - rect.left;
    const y1 = Math.min(this.startY, this.currY) - rect.top;
    const w = Math.abs(this.currX - this.startX);
    const h = Math.abs(this.currY - this.startY);
    this.selectionBoxEl.style.display = 'block';
    this.selectionBoxEl.style.left = `${x1}px`;
    this.selectionBoxEl.style.top = `${y1}px`;
    this.selectionBoxEl.style.width = `${w}px`;
    this.selectionBoxEl.style.height = `${h}px`;
  }

  private hideSelectionBox(): void {
    this.selectionBoxEl.style.display = 'none';
  }

  private performBoxSelection(): void {
    const rect = this.domElement.getBoundingClientRect();
    const minX = Math.min(this.startX, this.currX) - rect.left;
    const maxX = Math.max(this.startX, this.currX) - rect.left;
    const minY = Math.min(this.startY, this.currY) - rect.top;
    const maxY = Math.max(this.startY, this.currY) - rect.top;

    let count = 0;
    for (const u of this.core.state.units) {
      if (u.team !== 'player' || u.hp <= 0) {
        u.selected = false;
        continue;
      }
      const scr = this.scene3d.worldToScreen(u.x, this.core.getTerrainHeightAt(u.x, u.y) + 8, u.y);
      const inside = scr.x >= minX && scr.x <= maxX && scr.y >= minY && scr.y <= maxY;
      u.selected = inside;
      if (inside) count++;
    }
    this.onStatusUpdate(count > 0 ? `Selected ${count} friendly units` : 'Cleared selection');
  }

  private pickFriendlyUnitAt(gx: number, gy: number): SimUnit | null {
    let best: SimUnit | null = null;
    let bestD = 28;
    for (const u of this.core.state.units) {
      if (u.team !== 'player' || u.hp <= 0) continue;
      const d = Math.hypot(u.x - gx, u.y - gy) - u.radius;
      if (d <= bestD) {
        bestD = d;
        best = u;
      }
    }
    return best;
  }

  private pickHostileAt(gx: number, gy: number): SimUnit | SimBuilding | null {
    let best: SimUnit | SimBuilding | null = null;
    let bestD = 30;
    for (const u of this.core.state.units) {
      if (u.team === 'player' || u.hp <= 0) continue;
      const d = Math.hypot(u.x - gx, u.y - gy) - u.radius;
      if (d <= bestD) {
        bestD = d;
        best = u;
      }
    }
    if (best) return best;
    for (const b of this.core.state.buildings) {
      if (b.team === 'player' || b.hp <= 0) continue;
      const d = Math.hypot(b.x - gx, b.y - gy) - b.radius;
      if (d <= bestD) {
        bestD = d;
        best = b;
      }
    }
    return best;
  }

  private noteHit(x: number, y: number, failed: boolean): void {
    this.lastHitFailed = failed;
    this.lastHitX = failed ? null : Math.round(x);
    this.lastHitY = failed ? null : Math.round(y);
  }

  private noteMove(count: number): void {
    this.lastMoveCount = count;
    if (count > 0) {
      this.moveOrdersIssued++;
      this.captureOrderAnchor();
    }
  }

  private captureOrderAnchor(): void {
    const anchor = new Map<number, { x: number; y: number }>();
    for (const u of this.core.state.units) {
      if (u.team !== 'player' || u.hp <= 0) continue;
      anchor.set(u.id, { x: u.x, y: u.y });
    }
    this.orderAnchor = anchor;
  }

  private measureOrderDelta(): number {
    if (!this.orderAnchor) return 0;
    let sum = 0;
    for (const u of this.core.state.units) {
      const prev = this.orderAnchor.get(u.id);
      if (!prev || u.hp <= 0) continue;
      sum += Math.hypot(u.x - prev.x, u.y - prev.y);
    }
    return Math.round(sum * 10) / 10;
  }

  private handleSingleTap(clientX: number, clientY: number): void {
    const hit3D = this.scene3d.screenToGroundWorld(clientX, clientY);
    if (!hit3D) {
      this.noteHit(0, 0, true);
      return;
    }
    const pt = this.scene3d.adapter.toGame2D(hit3D.x, hit3D.z);
    this.noteHit(pt.x, pt.y, false);

    if (this.mode === 'attackMove') {
      const count = this.core.issueMoveOrder(pt.x, pt.y, true);
      this.noteMove(count);
      this.mode = 'select';
      this.onStatusUpdate(`Attack-Move ordered for ${count} units`);
      return;
    }

    const friendly = this.pickFriendlyUnitAt(pt.x, pt.y);
    if (friendly) {
      for (const u of this.core.state.units) {
        u.selected = u.id === friendly.id;
      }
      this.onStatusUpdate(`Selected ${friendly.name} (HP ${Math.round(friendly.hp)}/${friendly.maxHp})`);
      return;
    }

    const selectedUnits = this.core.state.units.filter((u) => u.team === 'player' && u.selected && u.hp > 0);
    if (selectedUnits.length > 0) {
      const hostile = this.pickHostileAt(pt.x, pt.y);
      if (hostile) {
        this.core.issueAttackTargetOrder(hostile);
        this.onStatusUpdate(`Attacking ${hostile.name} (${hostile.team.toUpperCase()})!`);
      } else {
        const count = this.core.issueMoveOrder(pt.x, pt.y, false);
        this.noteMove(count);
        this.onStatusUpdate(`Moving ${count} units to (${Math.round(pt.x)}, ${Math.round(pt.y)})`);
      }
    }
  }
}

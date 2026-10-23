import { GameCore, SimUnit, SimBuilding } from '../core/simulation';
import { BattlefieldScene3D } from '../render/scene3d';

export type InteractionMode = 'select' | 'pan' | 'attackMove';

/**
 * A finger on glass routinely travels 15–40 CSS pixels between touchdown and lift.
 * The previous 18px cutoff treated that as a box-select and cleared the army,
 * so issueMoveOrder never ran. Real box-select still starts at this distance.
 */
const BOX_SELECT_MIN_PX = 56;
const PAN_SLOP_PX = 8;

type Contact = { x: number; y: number; source: 'touch' | 'pointerTouch' | 'pointer' };

export interface InputDiagnostics {
  pointerDown: number;
  pointerUp: number;
  pointerCancel: number;
  touchEndFallback: number;
  touchStart: number;
  touchEnd: number;
  touchCancel: number;
  lastGesture: string;
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
  // Touch.identifier and PointerEvent.pointerId are *not* the same namespace.
  // Safari fires both event streams; TouchEvents own the gesture once observed.
  private contacts = new Map<string, Contact>();
  private primaryContact: string | null = null;
  private touchStreamActive = false;
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
  private touchEndFallbackCount = 0;
  private touchStartCount = 0;
  private touchEndCount = 0;
  private touchCancelCount = 0;
  private lastGesture = 'none';
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
      touchEndFallback: this.touchEndFallbackCount,
      touchStart: this.touchStartCount,
      touchEnd: this.touchEndCount,
      touchCancel: this.touchCancelCount,
      lastGesture: this.lastGesture,
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
    // Capture retargets pointerup to the canvas. Also listen on window so a
    // synthetic pointerup (and a browser that refuses setPointerCapture) still completes.
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

    // TouchEvents are authoritative for fingers, including when Safari drops
    // pointerup/pointercancel. Never join them by their unrelated numeric ids.
    this.domElement.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
    this.domElement.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
    this.domElement.addEventListener('touchend', (e) => this.onTouchEnd(e, false), { passive: false });
    this.domElement.addEventListener('touchcancel', (e) => this.onTouchEnd(e, true), { passive: false });
  }

  private preventTouchBrowserGesture(e: TouchEvent): void {
    if (e.cancelable) e.preventDefault();
  }

  private onTouchStart(e: TouchEvent): void {
    this.preventTouchBrowserGesture(e);
    this.touchStartCount++;
    if (!this.touchStreamActive) {
      // A pointerdown may precede touchstart. Abandon its provisional contact
      // without dispatching a command; the Touch stream will complete it.
      this.resetGesture();
      this.touchStreamActive = true;
    }
    for (const touch of Array.from(e.changedTouches)) {
      this.beginContact(`t:${touch.identifier}`, touch.clientX, touch.clientY, 'touch');
    }
  }

  private onTouchMove(e: TouchEvent): void {
    this.preventTouchBrowserGesture(e);
    if (!this.touchStreamActive) return;
    // Update both fingers before calculating pinch; no phantom intermediate pan.
    for (const touch of Array.from(e.touches)) {
      const key = `t:${touch.identifier}`;
      if (this.contacts.has(key)) {
        this.contacts.set(key, { x: touch.clientX, y: touch.clientY, source: 'touch' });
      }
    }
    const primary = this.primaryContact;
    if (this.contacts.size >= 2) this.applyGestureMove('');
    else if (primary) this.applyGestureMove(primary);
  }

  private onTouchEnd(e: TouchEvent, isCancel: boolean): void {
    this.preventTouchBrowserGesture(e);
    if (isCancel) this.touchCancelCount++;
    else this.touchEndCount++;

    if (this.touchStreamActive) {
      for (const touch of Array.from(e.changedTouches)) {
        this.finishContact(`t:${touch.identifier}`, touch.clientX, touch.clientY, isCancel);
      }
      if (e.touches.length === 0) {
        this.touchStreamActive = false;
        // A malformed touch sequence must never leave a phantom active finger.
        if (this.contacts.size > 0) this.resetGesture();
      }
      return;
    }

    // Defensive recovery for devices that emit pointerdown and touchend without
    // touchstart. Match the ONE provisional finger by source, not by id number.
    const pending = [...this.contacts.entries()].filter(([, c]) => c.source === 'pointerTouch');
    if (pending.length === 1 && e.changedTouches.length === 1) {
      const [key] = pending[0];
      const touch = e.changedTouches[0];
      this.touchEndFallbackCount++;
      this.finishContact(key, touch.clientX, touch.clientY, isCancel);
    }
  }

  private resetGesture(): void {
    for (const key of this.contacts.keys()) {
      if (key.startsWith('p:')) this.tryRelease(Number(key.slice(2)));
    }
    this.contacts.clear();
    this.primaryContact = null;
    this.isDragging = false;
    this.hideSelectionBox();
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

  private onPointerDown(e: PointerEvent): void {
    this.pointerDownCount++;
    if (e.pointerType === 'touch' && this.touchStreamActive) return;
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
    this.tryCapture(e.pointerId);
    this.beginContact(
      `p:${e.pointerId}`,
      e.clientX,
      e.clientY,
      e.pointerType === 'touch' ? 'pointerTouch' : 'pointer'
    );
  }

  private beginContact(key: string, x: number, y: number, source: Contact['source']): void {
    if (this.contacts.has(key)) return;
    this.contacts.set(key, { x, y, source });
    if (this.contacts.size >= 2) {
      this.primaryContact = null;
      this.isDragging = false;
      this.hideSelectionBox();
      this.multiTouchGuardUntil = performance.now() + 280;
      const pts = Array.from(this.contacts.values());
      this.prevPinchDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      this.prevPinchMidX = (pts[0].x + pts[1].x) * 0.5;
      this.prevPinchMidY = (pts[0].y + pts[1].y) * 0.5;
      this.prevPinchAngle = Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x);
      return;
    }

    if (performance.now() < this.multiTouchGuardUntil) return;

    this.primaryContact = key;
    this.startX = x;
    this.startY = y;
    this.currX = x;
    this.currY = y;
    this.sawMove = false;
    this.isDragging = false;
  }

  private onPointerMove(e: PointerEvent): void {
    if (e.pointerType === 'touch' && this.touchStreamActive) return;
    const key = `p:${e.pointerId}`;
    const contact = this.contacts.get(key);
    if (!contact) return;
    this.contacts.set(key, { ...contact, x: e.clientX, y: e.clientY });
    this.applyGestureMove(key);
  }

  private applyGestureMove(key: string): void {
    if (this.contacts.size >= 2) {
      this.multiTouchGuardUntil = performance.now() + 280;
      const pts = Array.from(this.contacts.values());
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

    if (this.primaryContact === null || key !== this.primaryContact) return;
    const current = this.contacts.get(key);
    if (!current) return;

    const dx = current.x - this.currX;
    const dy = current.y - this.currY;
    this.currX = current.x;
    this.currY = current.y;
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

  private onPointerEnd(e: PointerEvent, isCancel: boolean): void {
    if (e.pointerType === 'touch' && this.touchStreamActive) return;
    const key = `p:${e.pointerId}`;
    if (!this.contacts.has(key)) return;
    if (isCancel) this.pointerCancelCount++;
    else this.pointerUpCount++;
    this.finishContact(key, e.clientX, e.clientY, isCancel);
  }

  private finishContact(key: string, clientX: number, clientY: number, isCancel: boolean): void {
    if (!this.contacts.has(key)) return;
    this.contacts.delete(key);
    if (key.startsWith('p:')) this.tryRelease(Number(key.slice(2)));

    if (this.contacts.size > 0) {
      this.primaryContact = null;
      this.isDragging = false;
      this.hideSelectionBox();
      this.multiTouchGuardUntil = performance.now() + 280;
      this.lastGesture = 'multi-contact-end';
      return;
    }

    if (this.primaryContact === null || key !== this.primaryContact) return;
    this.primaryContact = null;

    if (performance.now() < this.multiTouchGuardUntil) {
      this.isDragging = false;
      this.hideSelectionBox();
      this.lastGesture = 'multi-contact-suppressed';
      return;
    }

    // A lift that jumps across the screen without any pointermove is a dropped
    // coordinate (synthetic TouchEvent zeros, or a WebKit pointerup at 0,0).
    // Complete the tap at the last real point instead of box-selecting the page.
    const jump = Math.hypot(clientX - this.currX, clientY - this.currY);
    const unreliableLift = !this.sawMove && jump > 48;
    if (!unreliableLift && Number.isFinite(clientX) && Number.isFinite(clientY)) {
      this.currX = clientX;
      this.currY = clientY;
    }

    const totalDist = Math.hypot(this.currX - this.startX, this.currY - this.startY);

    // A long drag that the browser cancels must not wipe the selection.
    // A short cancel is how iOS delivers a tap when it never sends pointerup.
    if (isCancel && totalDist >= BOX_SELECT_MIN_PX) {
      this.isDragging = false;
      this.hideSelectionBox();
      this.lastGesture = 'cancelled-drag';
      return;
    }

    if (this.mode === 'pan') {
      // Pan mode owns ALL one-finger gestures, even a stationary tap.
      this.lastGesture = 'pan-only';
    } else if (this.mode === 'select' && totalDist >= BOX_SELECT_MIN_PX) {
      this.lastGesture = this.performBoxSelection();
    } else {
      this.handleSingleTap(this.currX, this.currY);
      this.lastGesture = `${key.startsWith('t:') ? 'touch' : 'pointer'}-${isCancel ? 'cancel-tap' : 'tap'}`;
    }

    this.isDragging = false;
    this.hideSelectionBox();
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

  private performBoxSelection(): string {
    const rect = this.domElement.getBoundingClientRect();
    const minX = Math.min(this.startX, this.currX) - rect.left;
    const maxX = Math.max(this.startX, this.currX) - rect.left;
    const minY = Math.min(this.startY, this.currY) - rect.top;
    const maxY = Math.max(this.startY, this.currY) - rect.top;

    const priorSelection = new Set(
      this.core.state.units.filter((u) => u.team === 'player' && u.hp > 0 && u.selected).map((u) => u.id)
    );
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
    if (count > 0) {
      this.onStatusUpdate(`Selected ${count} friendly units`);
      return 'box-select';
    }

    if (priorSelection.size > 0) {
      // On glass, a long finger slide to the destination should not erase the
      // user's army just because the selection rectangle covered empty ground.
      for (const u of this.core.state.units) u.selected = priorSelection.has(u.id);
      this.handleSingleTap(this.currX, this.currY);
      return 'drag-move';
    }

    this.onStatusUpdate('No friendly units in selection area');
    return 'empty-box';
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

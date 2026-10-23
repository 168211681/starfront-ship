import { GameCore, SimUnit, SimBuilding } from '../core/simulation';
import { BattlefieldScene3D } from '../render/scene3d';

export type InteractionMode = 'select' | 'pan' | 'attackMove';

export class InputController3D {
  public mode: InteractionMode = 'select';
  private activePointers = new Map<number, { x: number; y: number }>();
  private primaryPointerId: number | null = null;
  private startX = 0;
  private startY = 0;
  private currX = 0;
  private currY = 0;
  private isDragging = false;
  private multiTouchGuardUntil = 0;
  private prevPinchDist = 0;
  private prevPinchMidX = 0;
  private prevPinchMidY = 0;
  private prevPinchAngle = 0;

  constructor(
    private domElement: HTMLElement,
    private selectionBoxEl: HTMLElement,
    private core: GameCore,
    private scene3d: BattlefieldScene3D,
    private onStatusUpdate: (msg?: string) => void
  ) {
    this.bindEvents();
  }

  private bindEvents(): void {
    this.domElement.addEventListener('pointerdown', e => this.onPointerDown(e));
    this.domElement.addEventListener('pointermove', e => this.onPointerMove(e));
    window.addEventListener('pointerup', e => this.onPointerEnd(e, false));
    window.addEventListener('pointercancel', e => this.onPointerEnd(e, true));
    this.domElement.addEventListener('contextmenu', e => e.preventDefault());
    this.domElement.addEventListener(
      'wheel',
      e => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.12 : 0.89;
        this.scene3d.zoomAtScreenPoint(factor, e.clientX, e.clientY);
      },
      { passive: false }
    );
  }

  private onPointerDown(e: PointerEvent): void {
    if (e.button === 2) {
      // Desktop right-click issues immediate Move / Attack-Move
      const ground = this.scene3d.screenToGroundWorld(e.clientX, e.clientY);
      if (ground) {
        const pt = this.scene3d.adapter.toGame2D(ground.x, ground.z);
        const enemy = this.pickHostileAt(pt.x, pt.y);
        if (enemy) {
          this.core.issueAttackTargetOrder(enemy);
          this.onStatusUpdate(`Focus-firing ${enemy.name}!`);
        } else {
          this.core.issueMoveOrder(pt.x, pt.y, false);
          this.onStatusUpdate(`Moving selected squad to (${Math.round(pt.x)}, ${Math.round(pt.y)})`);
        }
      }
      return;
    }

    this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Multi-touch safety: if 2+ fingers are down, cancel single-finger box/tap and enter two-finger pan/zoom/rotate
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

    this.primaryPointerId = e.pointerId;
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.currX = e.clientX;
    this.currY = e.clientY;
    this.isDragging = false;
  }

  private onPointerMove(e: PointerEvent): void {
    if (this.activePointers.has(e.pointerId)) {
      this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    if (this.activePointers.size >= 2) {
      this.multiTouchGuardUntil = performance.now() + 280;
      const pts = Array.from(this.activePointers.values());
      const newDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      const newMidX = (pts[0].x + pts[1].x) * 0.5;
      const newMidY = (pts[0].y + pts[1].y) * 0.5;
      const newAngle = Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x);

      // 1. Two-finger pan
      const dxMid = newMidX - this.prevPinchMidX;
      const dyMid = newMidY - this.prevPinchMidY;
      if (Math.hypot(dxMid, dyMid) > 0.5) {
        this.scene3d.panCameraByScreenDelta(dxMid, dyMid);
      }

      // 2. Two-finger pinch zoom anchored near midpoint
      if (this.prevPinchDist > 16 && newDist > 16) {
        const scale = newDist / this.prevPinchDist;
        if (Math.abs(scale - 1) > 0.004) {
          this.scene3d.zoomAtScreenPoint(scale, newMidX, newMidY);
        }
      }

      // 3. Subtle two-finger twist rotation
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

    if (this.primaryPointerId === null || e.pointerId !== this.primaryPointerId) return;

    const dx = e.clientX - this.currX;
    const dy = e.clientY - this.currY;
    this.currX = e.clientX;
    this.currY = e.clientY;

    const totalDist = Math.hypot(this.currX - this.startX, this.currY - this.startY);
    if (totalDist > 14) {
      this.isDragging = true;
    }

    if (this.isDragging) {
      if (this.mode === 'pan') {
        this.scene3d.panCameraByScreenDelta(dx, dy);
      } else if (this.mode === 'select') {
        this.updateSelectionBoxOverlay();
      }
    }
  }

  private onPointerEnd(e: PointerEvent, isCancel: boolean): void {
    this.activePointers.delete(e.pointerId);

    if (this.activePointers.size > 0) {
      this.primaryPointerId = null;
      this.isDragging = false;
      this.hideSelectionBox();
      this.multiTouchGuardUntil = performance.now() + 280;
      return;
    }

    if (this.primaryPointerId === null || e.pointerId !== this.primaryPointerId) return;
    this.primaryPointerId = null;

    if (isCancel || performance.now() < this.multiTouchGuardUntil) {
      this.isDragging = false;
      this.hideSelectionBox();
      return;
    }

    const totalDist = Math.hypot(this.currX - this.startX, this.currY - this.startY);
    if (this.isDragging && totalDist > 18) {
      if (this.mode === 'select') {
        this.performBoxSelection();
      }
    } else {
      this.handleSingleTap(this.currX, this.currY);
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

  private handleSingleTap(clientX: number, clientY: number): void {
    const hit3D = this.scene3d.screenToGroundWorld(clientX, clientY);
    if (!hit3D) return;
    const pt = this.scene3d.adapter.toGame2D(hit3D.x, hit3D.z);

    if (this.mode === 'attackMove') {
      const count = this.core.issueMoveOrder(pt.x, pt.y, true);
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

    const selectedUnits = this.core.state.units.filter(u => u.team === 'player' && u.selected && u.hp > 0);
    if (selectedUnits.length > 0) {
      const hostile = this.pickHostileAt(pt.x, pt.y);
      if (hostile) {
        this.core.issueAttackTargetOrder(hostile);
        this.onStatusUpdate(`Attacking ${hostile.name} (${hostile.team.toUpperCase()})!`);
      } else {
        this.core.issueMoveOrder(pt.x, pt.y, false);
        this.onStatusUpdate(`Moving ${selectedUnits.length} units to (${Math.round(pt.x)}, ${Math.round(pt.y)})`);
      }
    }
  }
}

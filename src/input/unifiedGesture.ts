export const BOX_SELECT_MIN_PX = 56;
export const PAN_SLOP_PX = 8;
export const PAN_TAP_MAX_PX = 14;
export const ALIAS_MATCH_PX = 36;
export const UNRELIABLE_LIFT_PX = 48;

export type InteractionMode = 'select' | 'pan' | 'attackMove';
export type GestureSource = 'pointer' | 'touch';
export type ReleaseAction = 'tap' | 'box-select' | 'pan-camera' | 'ignore';

export interface ClientPoint {
  x: number;
  y: number;
}

export function eventClientPoint(e: { clientX: number; clientY: number }): ClientPoint {
  return { x: e.clientX, y: e.clientY };
}

export function shouldAliasExisting(existing: ClientPoint, incoming: ClientPoint): boolean {
  return Math.hypot(existing.x - incoming.x, existing.y - incoming.y) <= ALIAS_MATCH_PX;
}

export function isUnreliableLift(start: ClientPoint, last: ClientPoint, lift: ClientPoint, sawMove: boolean): boolean {
  if (!Number.isFinite(lift.x) || !Number.isFinite(lift.y)) return true;
  const jump = Math.hypot(lift.x - last.x, lift.y - last.y);
  return !sawMove && jump > UNRELIABLE_LIFT_PX;
}

export function classifyRelease(
  mode: InteractionMode,
  distPx: number,
  cancelled: boolean
): ReleaseAction {
  if (cancelled && distPx >= BOX_SELECT_MIN_PX) return 'ignore';
  if (mode === 'pan') return distPx <= PAN_TAP_MAX_PX ? 'tap' : 'pan-camera';
  if (mode === 'select' && distPx >= BOX_SELECT_MIN_PX) return 'box-select';
  return 'tap';
}

export class SessionIdMap {
  private alias = new Map<number, number>();

  resolve(rawId: number): number {
    return this.alias.get(rawId) ?? rawId;
  }

  bind(rawId: number, sessionId: number): void {
    this.alias.set(rawId, sessionId);
  }

  dropSession(sessionId: number): void {
    this.alias.delete(sessionId);
    for (const [raw, mapped] of this.alias) {
      if (mapped === sessionId) this.alias.delete(raw);
    }
  }

  clear(): void {
    this.alias.clear();
  }
}

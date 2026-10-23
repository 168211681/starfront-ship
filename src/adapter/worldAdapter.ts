import { GameCore, SimUnit, SimBuilding } from '../core/simulation';
import { WORLD_SCALE } from '../core/specs';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export function lerpAngle(a: number, b: number, t: number): number {
  const diff = Math.atan2(Math.sin(b - a), Math.cos(b - a));
  return a + diff * t;
}

/**
 * WorldAdapter maps 2D simulation coordinates (game.x, game.y)
 * into 3D world space (mesh.position.x, mesh.position.y, mesh.position.z)
 * and provides smooth tick interpolation without mutating GameCore state.
 */
export class WorldAdapter {
  public readonly scale: number;

  constructor(scale = WORLD_SCALE) {
    this.scale = scale;
  }

  public toWorld3D(gameX: number, gameY: number, elevation = 0): Vec3 {
    return {
      x: gameX * this.scale,
      y: elevation * this.scale,
      z: gameY * this.scale
    };
  }

  public toGame2D(worldX: number, worldZ: number) {
    return {
      x: worldX / this.scale,
      y: worldZ / this.scale
    };
  }

  public getInterpolatedUnitTransform(
    core: GameCore,
    u: SimUnit,
    alpha: number
  ) {
    const a = Math.max(0, Math.min(1, alpha));
    const ix = u.prevX + (u.x - u.prevX) * a;
    const iy = u.prevY + (u.y - u.prevY) * a;
    const terrainH = core.getTerrainHeightAt(ix, iy);
    const alt = u.flying ? terrainH + 42 : terrainH;
    const simAngle = lerpAngle(u.prevAngle, u.angle, a);
    const simTurret = lerpAngle(u.prevTurretAngle, u.turretAngle, a);

    // In 2D canvas, +X is 0 rad and +Y (down/south) is +PI/2.
    // In Three.js (X right, Z south), yaw around +Y is -simAngle.
    return {
      pos: this.toWorld3D(ix, iy, alt),
      yaw: -simAngle,
      turretYaw: -simTurret
    };
  }

  public getBuildingTransform(core: GameCore, b: SimBuilding) {
    const terrainH = core.getTerrainHeightAt(b.x, b.y);
    return {
      pos: this.toWorld3D(b.x, b.y, terrainH),
      yaw: 0,
      turretYaw: -b.angle
    };
  }
}

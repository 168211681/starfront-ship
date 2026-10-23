// ============================================================================
// STARFRONT 3D — VERTICAL SLICE 001
// Module: src/render/models3d.ts
// Shared Low-Poly Geometry & Material Cache for Hardware Instanced Batches
// ============================================================================

import * as THREE from 'three';
import { FACTION_COLORS, TeamId } from '../core/specs';

export class LowPolyModelFactory {
  private geometries: Map<string, THREE.BufferGeometry> = new Map();
  private factionMaterials: Map<string, THREE.Material> = new Map();
  private commonMaterials: Map<string, THREE.Material> = new Map();

  constructor() {
    this.initSharedAssets();
  }

  private initSharedAssets(): void {
    // Common shared materials (white base color on instanced materials so per-instance setColorAt(i, THREE.Color) tints cleanly)
    this.commonMaterials.set('instancedLambert', new THREE.MeshLambertMaterial({ color: 0xffffff }));
    this.commonMaterials.set('instancedBasic', new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
    this.commonMaterials.set('darkHull', new THREE.MeshLambertMaterial({ color: 0x1e293b }));
    this.commonMaterials.set('tread', new THREE.MeshLambertMaterial({ color: 0x0f172a }));
    this.commonMaterials.set('steel', new THREE.MeshLambertMaterial({ color: 0x94a3b8 }));
    this.commonMaterials.set('skinVisor', new THREE.MeshLambertMaterial({ color: 0xbae6fd }));
    this.commonMaterials.set('gold', new THREE.MeshLambertMaterial({ color: 0xfacc15 }));
    this.commonMaterials.set(
      'muzzle',
      new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.9 })
    );
    this.commonMaterials.set(
      'selectRing',
      new THREE.MeshBasicMaterial({ color: 0x4ade80, side: THREE.DoubleSide })
    );
    this.commonMaterials.set('hpBg', new THREE.MeshBasicMaterial({ color: 0x020617, side: THREE.DoubleSide }));
    this.commonMaterials.set('hpPlayer', new THREE.MeshBasicMaterial({ color: 0x22c55e, side: THREE.DoubleSide }));
    this.commonMaterials.set('hpEnemy', new THREE.MeshBasicMaterial({ color: 0xf43f5e, side: THREE.DoubleSide }));
    this.commonMaterials.set('hpBot2', new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide }));

    // Faction materials
    (['player', 'enemy', 'bot2', 'neutral'] as TeamId[]).forEach((team) => {
      const pal = FACTION_COLORS[team];
      this.factionMaterials.set(`${team}_primary`, new THREE.MeshLambertMaterial({ color: pal.primary }));
      this.factionMaterials.set(`${team}_accent`, new THREE.MeshLambertMaterial({ color: pal.accent }));
      this.factionMaterials.set(`${team}_dark`, new THREE.MeshLambertMaterial({ color: pal.dark }));
    });

    // Shared low-poly geometries
    this.geometries.set('box', new THREE.BoxGeometry(1, 1, 1));
    this.geometries.set('cyl', new THREE.CylinderGeometry(0.5, 0.5, 1, 8));
    this.geometries.set('oct', new THREE.CylinderGeometry(0.85, 1.0, 1, 8));
    this.geometries.set('cone', new THREE.ConeGeometry(0.5, 1, 6));
    this.geometries.set('sphere', new THREE.SphereGeometry(0.5, 8, 6));
    this.geometries.set('ring', new THREE.RingGeometry(0.82, 1.0, 20));
    this.geometries.set('plane', new THREE.PlaneGeometry(1, 1));
    this.geometries.set('rock', new THREE.DodecahedronGeometry(1, 0));
  }

  public getGeo(key: string): THREE.BufferGeometry {
    return this.geometries.get(key)!;
  }

  public getCommonMat(key: string): THREE.Material {
    return this.commonMaterials.get(key)!;
  }

  public getFactionMat(team: TeamId, variant: 'primary' | 'accent' | 'dark' = 'primary'): THREE.Material {
    return this.factionMaterials.get(`${team}_${variant}`)!;
  }
}

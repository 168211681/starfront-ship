// ============================================================================
// STARFRONT 3D — VERTICAL SLICE 001 (R2.1)
// Module: src/render/scene3d.ts
// Three.js WebGL2 Hardware-Instanced Battlefield Renderer, Tactical Camera,
// WebGL Context-Loss Telemetry, and Authoritative GameCore Sync Loop
// ============================================================================

import * as THREE from 'three';
import { GameCore } from '../core/simulation';
import { SLICE_WORLD_W, SLICE_WORLD_H, FACTION_COLORS } from '../core/specs';
import { WorldAdapter } from '../adapter/worldAdapter';
import { LowPolyModelFactory } from './models3d';

interface OutpostVisual {
  ring: THREE.Mesh;
  beacon: THREE.Mesh;
  progRing: THREE.Mesh;
}

export class BattlefieldScene3D {
  public readonly scene: THREE.Scene;
  public readonly camera: THREE.OrthographicCamera;
  public readonly renderer: THREE.WebGLRenderer;
  public readonly adapter: WorldAdapter;
  public readonly factory: LowPolyModelFactory;

  private cameraTarget = new THREE.Vector3(380, 0, 520);
  private cameraZoom = 1.05;
  private cameraYaw = Math.PI / 4; // 45 degrees tactical azimuth
  private cameraPitch = Math.PI / 4; // 45 degrees above ground
  private cameraDist = 900;
  private frustumSize = 680;

  private qualityPreset: 'eco' | 'balanced' | 'quality' = 'balanced';
  private dirLight!: THREE.DirectionalLight;

  private outpostMeshes = new Map<number, OutpostVisual>();

  // 28 Hardware-Instanced Mesh Batches (gl.drawArraysInstanced)
  // Static Battlefield Instanced Batches (6)
  private instRiverWater!: THREE.InstancedMesh;
  private instRoads!: THREE.InstancedMesh;
  private instBridgeDeck!: THREE.InstancedMesh;
  private instBridgeRails!: THREE.InstancedMesh;
  private instBridgeBollards!: THREE.InstancedMesh;
  private instRocks!: THREE.InstancedMesh;

  // Dynamic Building Instanced Batches (8)
  private instBldgPads!: THREE.InstancedMesh;
  private instBldgHqMain!: THREE.InstancedMesh;
  private instBldgHqSpire!: THREE.InstancedMesh;
  private instBldgHqDish!: THREE.InstancedMesh;
  private instBldgBoxes!: THREE.InstancedMesh; // Barracks hall/roof, Factory bay, Turret head
  private instBldgCyls!: THREE.InstancedMesh;  // Factory stacks, Turret barrels
  private instBldgTurretBase!: THREE.InstancedMesh;

  // Dynamic Unit Instanced Batches (9)
  private instTankTreads!: THREE.InstancedMesh;
  private instTankHulls!: THREE.InstancedMesh;
  private instTankGlacis!: THREE.InstancedMesh;
  private instTankTurrets!: THREE.InstancedMesh;
  private instApcWheels!: THREE.InstancedMesh;
  private instApcBodies!: THREE.InstancedMesh;
  private instInfantryLegs!: THREE.InstancedMesh;
  private instInfantryTorsos!: THREE.InstancedMesh;
  private instInfantryHelmets!: THREE.InstancedMesh;
  private instUnitBarrels!: THREE.InstancedMesh; // Tank barrels, APC guns, Infantry weapons

  // Shared Combat & UI Instanced Batches (5)
  private instMuzzleFlashes!: THREE.InstancedMesh;
  private instSelectRings!: THREE.InstancedMesh;
  private instHpBg!: THREE.InstancedMesh;
  private instHpFill!: THREE.InstancedMesh;
  private instProjectiles!: THREE.InstancedMesh;
  private particleInstancedMesh!: THREE.InstancedMesh;

  private readonly maxParticles = 80;
  private readonly tempMatrix = new THREE.Matrix4();
  private readonly tempPos = new THREE.Vector3();
  private readonly tempRot = new THREE.Euler();
  private readonly tempQuat = new THREE.Quaternion();
  private readonly tempScale = new THREE.Vector3();
  private readonly tempColor = new THREE.Color();

  // Measured Renderer & Context Telemetry (Phase 2 & Phase 3)
  public lastFrameRenderMs = 0;
  public avgFrameRenderMs = 0;
  public contextLossCount = 0;

  constructor(private readonly container: HTMLElement, private readonly core: GameCore) {
    this.adapter = new WorldAdapter(1.0);
    this.factory = new LowPolyModelFactory();
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x07101f);

    const aspect = Math.max(1, container.clientWidth) / Math.max(1, container.clientHeight);
    this.camera = new THREE.OrthographicCamera(
      (-this.frustumSize * aspect) / 2,
      (this.frustumSize * aspect) / 2,
      this.frustumSize / 2,
      -this.frustumSize / 2,
      1,
      2600
    );

    const canvas = document.createElement('canvas');
    canvas.id = 'battlefieldCanvas3D';
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.touchAction = 'none';
    container.appendChild(canvas);

    // Track WebGL context-loss & restore events for Phase 3 iPhone Diagnostic HUD
    canvas.addEventListener(
      'webglcontextlost',
      (e) => {
        e.preventDefault();
        this.contextLossCount++;
        this.onContextLost?.({
          timestampIso: new Date().toISOString(),
          count: this.contextLossCount
        });
      },
      false
    );

    // Official three@0.160 throws if the WebGL context is not yet available
    // (common on headless SwiftShader cold-start and some mobile Safari resumes).
    // Retry briefly instead of hard-crashing the tactical HUD boot path.
    this.renderer = this.createRendererWithRetry(canvas);

    this.setupLighting();
    this.buildStaticBattlefield();
    this.initDynamicInstancedBatches();
    this.setQualityPreset('balanced');
    this.handleResize();
    this.updateCameraTransform();
  }

  private createRendererWithRetry(canvas: HTMLCanvasElement): THREE.WebGLRenderer {
    // Prefer high-performance; fall back for constrained mobile / software GL.
    // preserveDrawingBuffer: required for diagnostic screenshots / readPixels verification
    // against official three (default false clears the buffer after composite).
    const attempts: Array<ConstructorParameters<typeof THREE.WebGLRenderer>[0]> = [
      { canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true },
      { canvas, antialias: true, powerPreference: 'default', preserveDrawingBuffer: true },
      { canvas, antialias: false, powerPreference: 'low-power', preserveDrawingBuffer: true },
      { canvas, antialias: false, preserveDrawingBuffer: true }
    ];
    let lastError: unknown = null;
    for (const params of attempts) {
      try {
        return new THREE.WebGLRenderer(params);
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError instanceof Error
      ? lastError
      : new Error('Error creating WebGL context after attribute fallbacks');
  }

  private setInstTransform(
    mesh: THREE.InstancedMesh,
    idx: number,
    px: number,
    py: number,
    pz: number,
    rx: number,
    ry: number,
    rz: number,
    sx: number,
    sy: number,
    sz: number,
    colorHex?: number | string
  ): void {
    this.tempPos.set(px, py, pz);
    this.tempRot.set(rx, ry, rz);
    this.tempQuat.setFromEuler(this.tempRot);
    this.tempScale.set(sx, sy, sz);
    this.tempMatrix.compose(this.tempPos, this.tempQuat, this.tempScale);
    mesh.setMatrixAt(idx, this.tempMatrix);
    if (colorHex !== undefined) {
      this.tempColor.set(colorHex);
      mesh.setColorAt(idx, this.tempColor);
    }
  }

  private createBatch(geoKey: string, matKey: string, maxCount: number, castShadow = false): THREE.InstancedMesh {
    const geo = this.factory.getGeo(geoKey);
    const mat = this.factory.getCommonMat(matKey);
    const inst = new THREE.InstancedMesh(geo, mat, maxCount);
    inst.count = 0;
    inst.visible = true;
    inst.castShadow = castShadow;
    inst.receiveShadow = castShadow;
    this.scene.add(inst);
    return inst;
  }

  private setupLighting(): void {
    const hemi = new THREE.HemisphereLight(0xbae6fd, 0x0f172a, 0.85);
    hemi.position.set(0, 500, 0);
    this.scene.add(hemi);

    this.dirLight = new THREE.DirectionalLight(0xfffbeb, 1.15);
    this.dirLight.position.set(350, 620, 260);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.camera.left = -700;
    this.dirLight.shadow.camera.right = 700;
    this.dirLight.shadow.camera.top = 700;
    this.dirLight.shadow.camera.bottom = -700;
    this.dirLight.shadow.camera.near = 100;
    this.dirLight.shadow.camera.far = 1500;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.scene.add(this.dirLight);
  }

  /** Fired when WebGL context is lost. Does not read native thermal state. */
  public onContextLost: ((info: { timestampIso: string; count: number }) => void) | null = null;

  /** Fired for every resize decision, including Safari chrome changes that do not reallocate the buffer. */
  public onViewportDecision:
    | ((info: { cssWidth: number; cssHeight: number; applied: boolean; reason: string }) => void)
    | null = null;

  private appliedCssW = 0;
  private appliedCssH = 0;

  public setQualityPreset(preset: 'eco' | 'balanced' | 'quality'): void {
    this.qualityPreset = preset;
    const rawDpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
    if (preset === 'eco') {
      this.renderer.setPixelRatio(Math.min(rawDpr, 1.0));
      this.renderer.shadowMap.enabled = false;
      this.dirLight.castShadow = false;
    } else if (preset === 'balanced') {
      this.renderer.setPixelRatio(Math.min(rawDpr, 1.35));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.BasicShadowMap;
      this.dirLight.castShadow = true;
    } else {
      this.renderer.setPixelRatio(Math.min(rawDpr, 2.0));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.dirLight.castShadow = true;
    }
    this.handleResize(true);
  }

  public getQualityPreset(): 'eco' | 'balanced' | 'quality' {
    return this.qualityPreset;
  }

  private buildStaticBattlefield(): void {
    // 1. Non-Instanced Mesh #1: Low-Poly Ground Terrain Plane (1200 x 800)
    const groundGeo = new THREE.PlaneGeometry(SLICE_WORLD_W, SLICE_WORLD_H, 48, 32);
    groundGeo.rotateX(-Math.PI / 2);
    const posAttr = groundGeo.attributes.position as THREE.BufferAttribute;
    const colors: number[] = [];
    const cBase = new THREE.Color(0x0c192e);
    const cHigh = new THREE.Color(0x1e293b);
    const cBank = new THREE.Color(0x0f2942);

    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i) + SLICE_WORLD_W / 2;
      const vz = posAttr.getZ(i) + SLICE_WORLD_H / 2;
      const h = this.core.getTerrainHeightAt(vx, vz);
      posAttr.setY(i, h);
      const col = h > 8 ? cHigh : h < -1 ? cBank : cBase;
      colors.push(col.r, col.g, col.b);
    }
    groundGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    groundGeo.computeVertexNormals();

    const groundMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.position.set(SLICE_WORLD_W / 2, 0, SLICE_WORLD_H / 2);
    groundMesh.receiveShadow = true;
    this.scene.add(groundMesh);

    // Tactical Grid Helper overlay (LineSegments)
    const grid = new THREE.GridHelper(SLICE_WORLD_W, 24, 0x1e3a5f, 0x11223a);
    grid.position.set(SLICE_WORLD_W / 2, 0.25, SLICE_WORLD_H / 2);
    this.scene.add(grid);

    // 2. Instanced River Water Segments
    const riverPts = this.core.state.river;
    const riverSegCount = Math.max(1, riverPts.length - 1);
    this.instRiverWater = this.createBatch('box', 'instancedBasic', riverSegCount, false);
    this.instRiverWater.count = riverPts.length - 1;
    for (let i = 0; i < riverPts.length - 1; i++) {
      const a = riverPts[i];
      const b = riverPts[i + 1];
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      this.setInstTransform(
        this.instRiverWater,
        i,
        (a.x + b.x) / 2,
        -1.8,
        (a.y + b.y) / 2,
        0,
        -ang,
        0,
        len + 18,
        0.4,
        64,
        0x0284c7
      );
    }

    // 3. Instanced Tactical Roads
    const roads = this.core.state.roads;
    this.instRoads = this.createBatch('box', 'instancedLambert', Math.max(1, roads.length), false);
    this.instRoads.count = roads.length;
    for (let i = 0; i < roads.length; i++) {
      const r = roads[i];
      const len = Math.hypot(r.x2 - r.x1, r.y2 - r.y1);
      const ang = Math.atan2(r.y2 - r.y1, r.x2 - r.x1);
      this.setInstTransform(
        this.instRoads,
        i,
        (r.x1 + r.x2) / 2,
        0.4,
        (r.y1 + r.y2) / 2,
        0,
        -ang,
        0,
        len,
        0.3,
        r.w,
        0x1e293b
      );
    }

    // 4. Instanced Bridge Deck, Guardrails & Bollards
    const bridges = this.core.state.bridges;
    this.instBridgeDeck = this.createBatch('box', 'instancedLambert', Math.max(1, bridges.length), true);
    this.instBridgeRails = this.createBatch('box', 'instancedLambert', Math.max(2, bridges.length * 2), true);
    this.instBridgeBollards = this.createBatch('box', 'instancedLambert', Math.max(12, bridges.length * 12), true);

    let deckIdx = 0;
    let railIdx = 0;
    let bollardIdx = 0;
    for (const br of bridges) {
      const yaw = -br.angle;
      const cos = Math.cos(br.angle);
      const sin = Math.sin(br.angle);

      this.setInstTransform(this.instBridgeDeck, deckIdx++, br.x, 3.5, br.y, 0, yaw, 0, br.len, 3.5, br.w, 0x334155);

      for (const side of [-1, 1]) {
        const rz = side * (br.w / 2 - 2.5);
        const wx = br.x - sin * rz;
        const wz = br.y + cos * rz;
        this.setInstTransform(this.instBridgeRails, railIdx++, wx, 7.0, wz, 0, yaw, 0, br.len, 4.5, 3.5, 0xf59e0b);

        for (let i = 0; i < 6; i++) {
          const rx = -br.len * 0.42 + (i / 5) * (br.len * 0.84);
          const bx = br.x + cos * rx - sin * rz;
          const bz = br.y + sin * rx + cos * rz;
          this.setInstTransform(
            this.instBridgeBollards,
            bollardIdx++,
            bx,
            8.3,
            bz,
            0,
            yaw,
            0,
            3.2,
            6.5,
            3.2,
            i % 2 === 0 ? 0xfacc15 : 0x38bdf8
          );
        }
      }
    }
    this.instBridgeDeck.count = deckIdx;
    this.instBridgeRails.count = railIdx;
    this.instBridgeBollards.count = bollardIdx;

    // 5. Instanced Low-Poly Rock Obstacles
    const obstacles = this.core.state.obstacles;
    this.instRocks = this.createBatch('rock', 'instancedLambert', Math.max(1, obstacles.length), true);
    this.instRocks.count = obstacles.length;
    for (let i = 0; i < obstacles.length; i++) {
      const obs = obstacles[i];
      this.setInstTransform(
        this.instRocks,
        i,
        obs.x,
        obs.r * 0.45,
        obs.y,
        0,
        i * 1.1,
        0,
        obs.r,
        obs.r * 0.65,
        obs.r,
        0x475569
      );
    }
  }

  private initDynamicInstancedBatches(): void {
    // Building Batches (7)
    this.instBldgPads = this.createBatch('oct', 'darkHull', 32, true);
    this.instBldgHqMain = this.createBatch('oct', 'instancedLambert', 8, true);
    this.instBldgHqSpire = this.createBatch('box', 'instancedLambert', 8, true);
    this.instBldgHqDish = this.createBatch('box', 'steel', 8, true);
    this.instBldgBoxes = this.createBatch('box', 'instancedLambert', 64, true);
    this.instBldgCyls = this.createBatch('cyl', 'steel', 64, true);
    this.instBldgTurretBase = this.createBatch('oct', 'instancedLambert', 32, true);

    // Unit Batches (10)
    this.instTankTreads = this.createBatch('box', 'tread', 128, true);
    this.instTankHulls = this.createBatch('box', 'darkHull', 64, true);
    this.instTankGlacis = this.createBatch('box', 'instancedLambert', 64, true);
    this.instTankTurrets = this.createBatch('oct', 'instancedLambert', 64, true);

    this.instApcWheels = this.createBatch('cyl', 'tread', 384, true);
    this.instApcBodies = this.createBatch('box', 'instancedLambert', 192, true);

    this.instInfantryLegs = this.createBatch('box', 'darkHull', 128, true);
    this.instInfantryTorsos = this.createBatch('box', 'instancedLambert', 128, true);
    this.instInfantryHelmets = this.createBatch('sphere', 'instancedLambert', 128, true);

    this.instUnitBarrels = this.createBatch('cyl', 'instancedLambert', 256, true);

    // Combat & UI Batches (5)
    this.instMuzzleFlashes = this.createBatch('cone', 'muzzle', 128, false);
    this.instSelectRings = this.createBatch('ring', 'selectRing', 128, false);
    this.instHpBg = this.createBatch('plane', 'hpBg', 256, false);
    this.instHpFill = this.createBatch('plane', 'instancedBasic', 256, false);
    this.instProjectiles = this.createBatch('sphere', 'instancedBasic', 256, false);

    // Particle Pool Instanced Batch (1) => Total = 6 static + 7 bldg + 10 unit + 6 fx = 29 InstancedMeshes
    this.particleInstancedMesh = this.createBatch('sphere', 'instancedBasic', this.maxParticles, false);
  }

  public syncFromGameCore(alpha: number): void {
    const state = this.core.state;

    // 1. Sync Outpost (3 non-instanced meshes: ring, progRing, beacon)
    for (const op of state.outposts) {
      let visual = this.outpostMeshes.get(op.id);
      if (!visual) {
        const ringGeo = new THREE.RingGeometry(op.radius - 3, op.radius, 32);
        ringGeo.rotateX(-Math.PI / 2);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x94a3b8,
          side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.set(op.x, 4.2, op.y);
        this.scene.add(ring);

        const progGeo = new THREE.RingGeometry(op.radius * 0.35, op.radius * 0.48, 24);
        progGeo.rotateX(-Math.PI / 2);
        const progMat = new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          side: THREE.DoubleSide
        });
        const progRing = new THREE.Mesh(progGeo, progMat);
        progRing.position.set(op.x, 4.3, op.y);
        this.scene.add(progRing);

        const beacon = new THREE.Mesh(
          this.factory.getGeo('oct'),
          new THREE.MeshLambertMaterial({ color: 0x94a3b8 })
        );
        beacon.scale.set(10, 18, 10);
        beacon.position.set(op.x, 12, op.y);
        this.scene.add(beacon);

        visual = { ring, beacon, progRing };
        this.outpostMeshes.set(op.id, visual);
      }

      const ownerColor = FACTION_COLORS[op.owner].primary;
      (visual.ring.material as THREE.MeshBasicMaterial).color.setHex(ownerColor);
      (visual.beacon.material as THREE.MeshLambertMaterial).color.setHex(ownerColor);
      visual.beacon.rotation.y += 0.03;

      const capTeam = op.capturingTeam || (op.owner !== 'neutral' ? op.owner : null);
      const capColor = capTeam ? FACTION_COLORS[capTeam].accent : 0x94a3b8;
      (visual.progRing.material as THREE.MeshBasicMaterial).color.setHex(capColor);
      const s = Math.max(0.1, op.progress / 100);
      visual.progRing.scale.set(s, 1, s);
    }

    // 2. Sync Buildings into Instanced Batches
    let padIdx = 0;
    let hqMainIdx = 0;
    let hqSpireIdx = 0;
    let hqDishIdx = 0;
    let bldgBoxIdx = 0;
    let bldgCylIdx = 0;
    let bldgTurretBaseIdx = 0;
    let hpBgIdx = 0;
    let hpFillIdx = 0;

    for (const b of state.buildings) {
      if (b.hp <= 0) continue;
      const tf = this.adapter.getBuildingTransform(this.core, b);
      const bx = tf.pos.x;
      const by = tf.pos.y;
      const bz = tf.pos.z;
      const r = b.radius;
      const pal = FACTION_COLORS[b.team];
      const hpColor = b.team === 'player' ? 0x22c55e : b.team === 'bot2' ? 0xf59e0b : 0xf43f5e;

      // Foundation pad
      this.setInstTransform(this.instBldgPads, padIdx++, bx, by + 2, bz, 0, 0, 0, r, 4, r);

      if (b.type === 'hq') {
        this.setInstTransform(this.instBldgHqMain, hqMainIdx++, bx, by + 13, bz, 0, 0, 0, r * 0.75, 22, r * 0.75, pal.primary);
        this.setInstTransform(this.instBldgHqSpire, hqSpireIdx++, bx, by + 28, bz, 0, 0, 0, 16, 16, 16, pal.accent);
        this.setInstTransform(this.instBldgHqDish, hqDishIdx++, bx, by + 38, bz, 0, state.timeElapsed * 1.4, 0, 22, 3.5, 4);
      } else if (b.type === 'barracks') {
        this.setInstTransform(this.instBldgBoxes, bldgBoxIdx++, bx, by + 10, bz, 0, 0, 0, r * 1.35, 16, r * 1.05, pal.primary);
        this.setInstTransform(this.instBldgBoxes, bldgBoxIdx++, bx, by + 19.5, bz, 0, 0, 0, r * 1.1, 3, r * 0.6, pal.accent);
      } else if (b.type === 'factory') {
        this.setInstTransform(this.instBldgBoxes, bldgBoxIdx++, bx, by + 11, bz, 0, 0, 0, r * 1.45, 18, r * 1.25, pal.primary);
        for (const sx of [-12, 12]) {
          this.setInstTransform(this.instBldgCyls, bldgCylIdx++, bx + sx, by + 24, bz - r * 0.35, 0, 0, 0, 6, 16, 6);
        }
      } else if (b.type === 'turret') {
        this.setInstTransform(this.instBldgTurretBase, bldgTurretBaseIdx++, bx, by + 8, bz, 0, 0, 0, r * 0.72, 12, r * 0.72, pal.primary);
        const tyaw = tf.turretYaw;
        const cosT = Math.cos(tyaw);
        const sinT = Math.sin(tyaw);
        this.setInstTransform(this.instBldgBoxes, bldgBoxIdx++, bx, by + 16, bz, 0, tyaw, 0, 14, 7, 13, pal.accent);
        for (const bzOff of [-3.5, 3.5]) {
          const wx = bx + cosT * 11 + sinT * bzOff;
          const wz = bz - sinT * 11 + cosT * bzOff;
          this.setInstTransform(this.instBldgCyls, bldgCylIdx++, wx, by + 16, wz, 0, tyaw, Math.PI / 2, 2.0, 18, 2.0);
        }
      } else {
        this.setInstTransform(this.instBldgBoxes, bldgBoxIdx++, bx, by + 9.5, bz, 0, 0, 0, r * 1.2, 15, r * 1.2, pal.primary);
      }

      // Building HP Bar
      const hpW = r * 1.6;
      const hpY = by + (b.type === 'hq' ? 46 : 28);
      const hpRatio = Math.max(0.01, b.hp / b.maxHp);
      const fillW = (hpW - 1.5) * hpRatio;
      const fillX = bx - ((1 - hpRatio) * (hpW - 1.5)) * 0.5;
      this.setInstTransform(this.instHpBg, hpBgIdx++, bx, hpY, bz, -Math.PI / 4, 0, 0, hpW, 3.8, 1);
      this.setInstTransform(this.instHpFill, hpFillIdx++, fillX, hpY + 0.1, bz + 0.2, -Math.PI / 4, 0, 0, fillW, 2.6, 1, hpColor);
    }

    this.instBldgPads.count = padIdx;
    this.instBldgHqMain.count = hqMainIdx;
    this.instBldgHqSpire.count = hqSpireIdx;
    this.instBldgHqDish.count = hqDishIdx;
    this.instBldgBoxes.count = bldgBoxIdx;
    this.instBldgCyls.count = bldgCylIdx;
    this.instBldgTurretBase.count = bldgTurretBaseIdx;

    // 3. Sync Units into Hardware-Instanced Batches
    let tankTreadIdx = 0;
    let tankHullIdx = 0;
    let tankGlacisIdx = 0;
    let tankTurretIdx = 0;
    let apcWheelIdx = 0;
    let apcBodyIdx = 0;
    let infLegIdx = 0;
    let infTorsoIdx = 0;
    let infHelmetIdx = 0;
    let barrelIdx = 0;
    let muzzleIdx = 0;
    let selectIdx = 0;

    for (const u of state.units) {
      if (u.hp <= 0) continue;
      const tf = this.adapter.getInterpolatedUnitTransform(this.core, u, alpha);
      const ux = tf.pos.x;
      const uy = tf.pos.y;
      const uz = tf.pos.z;
      const yaw = tf.yaw;
      const tyaw = tf.turretYaw;
      const cosY = Math.cos(yaw);
      const sinY = Math.sin(yaw);
      const cosT = Math.cos(tyaw);
      const sinT = Math.sin(tyaw);
      const pal = FACTION_COLORS[u.team];
      const hpColor = u.team === 'player' ? 0x22c55e : u.team === 'bot2' ? 0xf59e0b : 0xf43f5e;

      if (u.type === 'tank') {
        for (const zOff of [-9, 9]) {
          const tx = ux + sinY * zOff;
          const tz = uz + cosY * zOff;
          this.setInstTransform(this.instTankTreads, tankTreadIdx++, tx, uy + 3, tz, 0, yaw, 0, 28, 6, 7);
        }
        this.setInstTransform(this.instTankHulls, tankHullIdx++, ux, uy + 5.5, uz, 0, yaw, 0, 26, 6.5, 15);
        this.setInstTransform(
          this.instTankGlacis,
          tankGlacisIdx++,
          ux + cosY * 1,
          uy + 8.2,
          uz - sinY * 1,
          0,
          yaw,
          0,
          22,
          3,
          14,
          pal.primary
        );
        const turX = ux - cosY * 1;
        const turZ = uz + sinY * 1;
        this.setInstTransform(this.instTankTurrets, tankTurretIdx++, turX, uy + 10.5, turZ, 0, tyaw, 0, 8.5, 4.5, 7.5, pal.primary);
        this.setInstTransform(
          this.instUnitBarrels,
          barrelIdx++,
          turX + cosT * 12,
          uy + 11.0,
          turZ - sinT * 12,
          0,
          tyaw,
          Math.PI / 2,
          2.2,
          20,
          2.2,
          0x94a3b8
        );
      } else if (u.type === 'apc') {
        for (const wxOff of [-9, 0, 9]) {
          for (const wzOff of [-8.5, 8.5]) {
            const wx = ux + cosY * wxOff + sinY * wzOff;
            const wz = uz - sinY * wxOff + cosY * wzOff;
            this.setInstTransform(this.instApcWheels, apcWheelIdx++, wx, uy + 3.2, wz, Math.PI / 2, yaw, 0, 6.5, 3, 6.5);
          }
        }
        this.setInstTransform(this.instApcBodies, apcBodyIdx++, ux, uy + 6.5, uz, 0, yaw, 0, 25, 7.5, 14, pal.primary);
        this.setInstTransform(
          this.instApcBodies,
          apcBodyIdx++,
          ux + cosY * 11.5,
          uy + 6.0,
          uz - sinY * 11.5,
          0,
          yaw,
          0,
          6,
          4.5,
          12.5,
          pal.accent
        );
        this.setInstTransform(this.instApcBodies, apcBodyIdx++, ux, uy + 11.5, uz, 0, tyaw, 0, 7, 3.8, 6.5, 0x1e293b);
        this.setInstTransform(
          this.instUnitBarrels,
          barrelIdx++,
          ux + cosT * 8,
          uy + 11.9,
          uz - sinT * 8,
          0,
          tyaw,
          Math.PI / 2,
          1.4,
          14,
          1.4,
          0x94a3b8
        );
      } else {
        // Infantry (Marine / SpecOps Trooper)
        this.setInstTransform(this.instInfantryLegs, infLegIdx++, ux, uy + 3, uz, 0, yaw, 0, 4.5, 6, 5.5);
        this.setInstTransform(this.instInfantryTorsos, infTorsoIdx++, ux, uy + 9.5, uz, 0, yaw, 0, 6.2, 7.5, 7.5, pal.primary);
        this.setInstTransform(this.instInfantryHelmets, infHelmetIdx++, ux, uy + 14.5, uz, 0, tyaw, 0, 6.5, 6.5, 6.5, pal.accent);
        const weapX = ux + cosT * 5.5 + sinT * 3.8;
        const weapZ = uz - sinT * 5.5 + cosT * 3.8;
        this.setInstTransform(
          this.instUnitBarrels,
          barrelIdx++,
          weapX,
          uy + 11.0,
          weapZ,
          0,
          tyaw,
          Math.PI / 2,
          2.0,
          u.type === 'trooper' ? 13 : 10.5,
          2.0,
          u.type === 'trooper' ? 0xfacc15 : 0x94a3b8
        );
      }

      if (u.muzzleFlash > 0) {
        const mfDist = u.type === 'tank' ? 22 : u.type === 'apc' ? 16 : 12;
        const mfSide = u.type === 'tank' || u.type === 'apc' ? 0 : 3.8;
        const mx = ux + cosT * mfDist + sinT * mfSide;
        const mz = uz - sinT * mfDist + cosT * mfSide;
        this.setInstTransform(this.instMuzzleFlashes, muzzleIdx++, mx, uy + 11.0, mz, 0, tyaw, -Math.PI / 2, 5, 9, 5);
      }

      if (u.selected) {
        const sr = u.radius + 5;
        this.setInstTransform(this.instSelectRings, selectIdx++, ux, uy + 0.8, uz, -Math.PI / 2, 0, 0, sr, sr, 1);
      }

      // Unit HP Bar
      const hpW = Math.max(18, u.radius * 1.9);
      const hpY = uy + (u.type === 'tank' || u.type === 'apc' ? 21 : 23);
      const hpRatio = Math.max(0.01, u.hp / u.maxHp);
      const fillW = (hpW - 1) * hpRatio;
      const fillX = ux - ((1 - hpRatio) * (hpW - 1)) * 0.5;
      this.setInstTransform(this.instHpBg, hpBgIdx++, ux, hpY, uz, -Math.PI / 4, 0, 0, hpW, 2.6, 1);
      this.setInstTransform(this.instHpFill, hpFillIdx++, fillX, hpY + 0.1, uz + 0.2, -Math.PI / 4, 0, 0, fillW, 1.8, 1, hpColor);
    }

    this.instTankTreads.count = tankTreadIdx;
    this.instTankHulls.count = tankHullIdx;
    this.instTankGlacis.count = tankGlacisIdx;
    this.instTankTurrets.count = tankTurretIdx;
    this.instApcWheels.count = apcWheelIdx;
    this.instApcBodies.count = apcBodyIdx;
    this.instInfantryLegs.count = infLegIdx;
    this.instInfantryTorsos.count = infTorsoIdx;
    this.instInfantryHelmets.count = infHelmetIdx;
    this.instUnitBarrels.count = barrelIdx;
    this.instMuzzleFlashes.count = muzzleIdx;
    this.instSelectRings.count = selectIdx;
    this.instHpBg.count = hpBgIdx;
    this.instHpFill.count = hpFillIdx;

    // 4. Sync Projectiles into Instanced Batch
    let projIdx = 0;
    for (const p of state.projectiles) {
      if (projIdx >= 256) break;
      if (p.isBeam) {
        const mx = (p.sx + p.tx) * 0.5;
        const mz = (p.sy + p.ty) * 0.5;
        const len = Math.hypot(p.tx - p.sx, p.ty - p.sy);
        const ang = Math.atan2(p.ty - p.sy, p.tx - p.sx);
        this.setInstTransform(this.instProjectiles, projIdx++, mx, 12, mz, 0, -ang, 0, len, 1.8, 1.8, p.color);
      } else {
        const ix = p.prevX + (p.x - p.prevX) * alpha;
        const iy = p.prevY + (p.y - p.prevY) * alpha;
        const iz = p.prevZ + (p.z - p.prevZ) * alpha;
        const s = p.projType === 'cannon' || p.projType === 'rocket' ? 4.2 : 2.8;
        this.setInstTransform(this.instProjectiles, projIdx++, ix, iz, iy, 0, 0, 0, s, s, s, p.color);
      }
    }
    this.instProjectiles.count = projIdx;

    // 5. Sync GPU-Instanced Particles
    const particles = state.particles;
    const ptCount = Math.min(this.maxParticles, particles.length);
    this.particleInstancedMesh.count = ptCount;
    for (let i = 0; i < ptCount; i++) {
      const pt = particles[i];
      const sc = pt.isRing ? (1 - pt.life / pt.maxLife) * (pt.maxR || 18) : pt.r * 2;
      this.setInstTransform(
        this.particleInstancedMesh,
        i,
        pt.x,
        Math.max(1, pt.z),
        pt.y,
        0,
        0,
        0,
        sc,
        pt.isRing ? 0.5 : sc,
        sc,
        pt.color
      );
    }
  }

  public panCameraByScreenDelta(dxPx: number, dyPx: number): void {
    const viewH = this.frustumSize / this.cameraZoom;
    const worldPerPx = viewH / Math.max(1, this.container.clientHeight);
    const rightX = Math.sin(this.cameraYaw);
    const rightZ = -Math.cos(this.cameraYaw);
    const fwdX = -Math.cos(this.cameraYaw);
    const fwdZ = -Math.sin(this.cameraYaw);

    this.cameraTarget.x -= (dxPx * rightX - dyPx * fwdX * 1.35) * worldPerPx;
    this.cameraTarget.z -= (dxPx * rightZ - dyPx * fwdZ * 1.35) * worldPerPx;
    this.clampCameraTarget();
    this.updateCameraTransform();
  }

  public zoomAtScreenPoint(zoomFactor: number, clientX: number, clientY: number): void {
    const beforeWorld = this.screenToGroundWorld(clientX, clientY);
    this.cameraZoom = Math.max(0.55, Math.min(2.4, this.cameraZoom * zoomFactor));
    this.camera.zoom = this.cameraZoom;
    this.camera.updateProjectionMatrix();
    const afterWorld = this.screenToGroundWorld(clientX, clientY);
    if (beforeWorld && afterWorld) {
      this.cameraTarget.x += beforeWorld.x - afterWorld.x;
      this.cameraTarget.z += beforeWorld.z - afterWorld.z;
    }
    this.clampCameraTarget();
    this.updateCameraTransform();
  }

  public rotateCamera(deltaYaw: number): void {
    this.cameraYaw = (this.cameraYaw + deltaYaw) % (Math.PI * 2);
    this.updateCameraTransform();
  }

  public resetCamera(): void {
    this.cameraYaw = Math.PI / 4;
    this.cameraZoom = 1.05;
    this.cameraTarget.set(380, 0, 520);
    this.camera.zoom = this.cameraZoom;
    this.camera.updateProjectionMatrix();
    this.updateCameraTransform();
  }

  public focusOnWorldPoint(wx: number, wz: number): void {
    this.cameraTarget.set(wx, 0, wz);
    this.clampCameraTarget();
    this.updateCameraTransform();
  }

  private clampCameraTarget(): void {
    this.cameraTarget.x = Math.max(60, Math.min(SLICE_WORLD_W - 60, this.cameraTarget.x));
    this.cameraTarget.z = Math.max(60, Math.min(SLICE_WORLD_H - 60, this.cameraTarget.z));
  }

  public updateCameraTransform(): void {
    const horizDist = this.cameraDist * Math.cos(this.cameraPitch);
    const vertDist = this.cameraDist * Math.sin(this.cameraPitch);
    this.camera.position.set(
      this.cameraTarget.x + Math.cos(this.cameraYaw) * horizDist,
      this.cameraTarget.y + vertDist,
      this.cameraTarget.z + Math.sin(this.cameraYaw) * horizDist
    );
    this.camera.lookAt(this.cameraTarget);
    this.camera.updateMatrixWorld();
  }

  public screenToGroundWorld(clientX: number, clientY: number): THREE.Vector3 | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    // clientX/clientY are visual-viewport CSS pixels. getBoundingClientRect is layout-viewport.
    // visualViewport offset is 0 on a non-scrolled desktop and non-zero when iOS Safari chrome
    // or pinch-zoom shifts the visual viewport. Identity when offset is 0.
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    const ox = vv ? vv.offsetLeft : 0;
    const oy = vv ? vv.offsetTop : 0;
    const ndcX = ((clientX + ox - rect.left) / rect.width) * 2 - 1;
    const ndcY = -((clientY + oy - rect.top) / rect.height) * 2 + 1;
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera);
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const hit = new THREE.Vector3();
    return raycaster.ray.intersectPlane(groundPlane, hit);
  }

  public worldToScreen(wx: number, wy: number, wz: number): { x: number; y: number } {
    const v = new THREE.Vector3(wx, wy, wz);
    v.project(this.camera);
    const rect = this.renderer.domElement.getBoundingClientRect();
    return {
      x: (v.x * 0.5 + 0.5) * rect.width,
      y: (-(v.y * 0.5) + 0.5) * rect.height
    };
  }

  public handleResize(force = false): void {
    const w = Math.max(1, Math.round(this.container.clientWidth));
    const h = Math.max(1, Math.round(this.container.clientHeight));
    const dw = Math.abs(w - this.appliedCssW);
    const dh = Math.abs(h - this.appliedCssH);
    // iPhone Safari chrome can shrink visual height by ~12px (observed 566 → 554)
    // without a real orientation change. Reallocating the drawing buffer on that
    // hitch drops frame time. Ignore height-only micro changes; still report them.
    const safariChromeMicro = this.appliedCssW > 0 && dw < 2 && dh > 0 && dh < 24;
    if (!force && safariChromeMicro) {
      this.onViewportDecision?.({
        cssWidth: w,
        cssHeight: h,
        applied: false,
        reason: 'ignored-safari-chrome-micro-resize'
      });
      return;
    }
    if (!force && dw === 0 && dh === 0) return;

    const aspect = w / Math.max(1, h);
    this.camera.left = (-this.frustumSize * aspect) / 2;
    this.camera.right = (this.frustumSize * aspect) / 2;
    this.camera.top = this.frustumSize / 2;
    this.camera.bottom = -this.frustumSize / 2;
    this.camera.zoom = this.cameraZoom;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    this.appliedCssW = w;
    this.appliedCssH = h;
    this.onViewportDecision?.({
      cssWidth: w,
      cssHeight: h,
      applied: true,
      reason: force ? 'forced' : 'layout-change'
    });
  }

  public render(): void {
    const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.renderer.render(this.scene, this.camera);
    const dtMs = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0;
    this.lastFrameRenderMs = dtMs;
    this.avgFrameRenderMs = this.avgFrameRenderMs === 0 ? dtMs : this.avgFrameRenderMs * 0.9 + dtMs * 0.1;
  }

  public getSceneMeshCounts(): {
    visibleNonInstancedMeshes: number;
    visibleInstancedMeshes: number;
    activeInstancedMeshes: number;
    totalActiveInstances: number;
  } {
    let visibleNonInstancedMeshes = 0;
    let visibleInstancedMeshes = 0;
    let activeInstancedMeshes = 0;
    let totalActiveInstances = 0;

    this.scene.traverse((obj: any) => {
      if (!obj.visible) return;
      if (obj.isInstancedMesh) {
        visibleInstancedMeshes++;
        if (obj.count > 0) {
          activeInstancedMeshes++;
          totalActiveInstances += obj.count;
        }
      } else if (obj.isMesh) {
        visibleNonInstancedMeshes++;
      }
    });

    return {
      visibleNonInstancedMeshes,
      visibleInstancedMeshes,
      activeInstancedMeshes,
      totalActiveInstances
    };
  }

  public getRenderStats(): {
    frame: number;
    calls: number;
    instancedCalls: number;
    activeInstances: number;
    activeInstancedMeshes: number;
    visibleInstancedMeshes: number;
    triangles: number;
    lines: number;
    geometries: number;
    frameTimeMs: number;
    avgFrameTimeMs: number;
    contextLossCount: number;
  } {
    const info = (this.renderer as any).info;
    const meshCounts = this.getSceneMeshCounts();
    return {
      frame: info?.render?.frame ?? 0,
      calls: info?.render?.calls ?? 0,
      instancedCalls: info?.render?.instancedCalls ?? meshCounts.activeInstancedMeshes,
      activeInstances: info?.render?.activeInstances ?? meshCounts.totalActiveInstances,
      activeInstancedMeshes: meshCounts.activeInstancedMeshes,
      visibleInstancedMeshes: meshCounts.visibleInstancedMeshes,
      triangles: info?.render?.triangles ?? 0,
      lines: info?.render?.lines ?? 0,
      geometries: info?.memory?.geometries ?? 0,
      frameTimeMs: Number(this.lastFrameRenderMs.toFixed(3)),
      avgFrameTimeMs: Number(this.avgFrameRenderMs.toFixed(3)),
      contextLossCount: this.contextLossCount
    };
  }

  public getRenderTelemetry(): {
    frame: number;
    drawCalls: number;
    instancedDrawCalls: number;
    activeInstances: number;
    activeInstancedMeshes: number;
    visibleInstancedMeshes: number;
    triangles: number;
    lines: number;
    geometries: number;
    lastFrameRenderMs: number;
    avgFrameRenderMs: number;
    contextLossCount: number;
  } {
    const stats = this.getRenderStats();
    return {
      frame: stats.frame,
      drawCalls: stats.calls,
      instancedDrawCalls: stats.instancedCalls,
      visibleInstancedMeshes: stats.visibleInstancedMeshes,
      activeInstances: stats.activeInstances,
      activeInstancedMeshes: stats.activeInstancedMeshes,
      triangles: stats.triangles,
      lines: stats.lines,
      geometries: stats.geometries,
      lastFrameRenderMs: stats.frameTimeMs,
      avgFrameRenderMs: stats.avgFrameTimeMs,
      contextLossCount: stats.contextLossCount
    };
  }
}

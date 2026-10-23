import {
  UNIT_SPECS,
  BUILDING_SPECS,
  SLICE_WORLD_W,
  SLICE_WORLD_H,
  FIXED_DT,
  MAX_FRAME_DELTA,
  MAX_CATCHUP_STEPS,
  FIGHTER_SORTIE_COST,
  FactionId,
  OutpostOwner,
  UnitType,
  BuildingType
} from './specs';

export interface SimUnit {
  id: number;
  isUnit: true;
  type: UnitType;
  name: string;
  team: FactionId;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  speed: number;
  effectiveRange: number;
  range: number;
  dmg: number;
  splash: number;
  reload: number;
  cooldown: number;
  projType: string;
  flying: boolean;
  canTargetAir: boolean;
  isHarvester: boolean;
  isSupplyTruck: boolean;
  selected: boolean;
  angle: number;
  prevAngle: number;
  turretAngle: number;
  prevTurretAngle: number;
  kills: number;
  veteran: number;
  recoil: number;
  muzzleFlash: number;
  onHighGround: boolean;
  inDefilade: boolean;
  state: 'idle' | 'move' | 'attackMove' | 'attackTarget' | 'hold' | 'harvest' | 'returnCrystal';
  targetX: number;
  targetY: number;
  targetEntity: SimUnit | SimBuilding | null;
  stuckTimer: number;
  walkCycle: number;
  _scx?: number;
  _scy?: number;
  _ccx?: number;
  _ccy?: number;
}

export interface SimBuilding {
  id: number;
  isBuilding: true;
  type: BuildingType;
  name: string;
  team: FactionId;
  x: number;
  y: number;
  radius: number;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  range: number;
  dmg: number;
  reload: number;
  cooldown: number;
  selected: boolean;
  angle: number;
  recoil: number;
  targetEntity: SimUnit | SimBuilding | null;
}

export interface SimOutpost {
  id: number;
  name: string;
  x: number;
  y: number;
  radius: number;
  owner: OutpostOwner;
  capturingTeam: FactionId | null;
  progress: number;
  contested: boolean;
  isCore?: boolean;
}

export interface SimProjectile {
  id: number;
  isBeam: boolean;
  shooterId: number;
  team: FactionId;
  sx: number;
  sy: number;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  z: number;
  prevZ: number;
  tx: number;
  ty: number;
  target: SimUnit | SimBuilding | null;
  totalDist: number;
  traveled: number;
  arcHeight: number;
  speed: number;
  dmg: number;
  splash: number;
  projType: string;
  color: string;
  life: number;
  maxLife: number;
}

export interface SimParticle {
  id: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  r: number;
  color: string;
  isRing?: boolean;
  maxR?: number;
  life: number;
  maxLife: number;
}

export interface BridgeHit {
  br: SimBridge;
  lx: number;
  ly: number;
}

export interface RiverTelemetry {
  x: number;
  y: number;
  dist: number;
  side: number;
  nx: number;
  ny: number;
}

export interface BridgeWaypoint {
  x: number;
  y: number;
  usingBridge: boolean;
}

export interface TerrainStatus {
  inForest: boolean;
  onHighGround: boolean;
  inTrench: boolean;
  inSmoke: boolean;
  inDefilade: boolean;
  defiladeCoverAng: number;
}

export interface SupplyConnection {
  connected: boolean;
  rate: number;
  heal: number;
  hubX?: number;
  hubY?: number;
  sourceType?: string;
}

export interface FighterCheck {
  ok: boolean;
  reason?: string;
  airfield?: SimBuilding;
  radar?: SimBuilding;
}

export interface DetectedAircraft {
  units: SimUnit[];
  strikes: SimAirStrike[];
  groundThreats: SimUnit[];
  hasRadar: boolean;
}

export interface SimBridge {
  x: number;
  y: number;
  angle: number;
  len: number;
  w: number;
  name: string;
  _cos?: number;
  _sin?: number;
  _endA?: { x: number; y: number };
  _endB?: { x: number; y: number };
  _sideA?: number;
  _distAB?: number;
}

export interface SimHighGround {
  id: string;
  name: string;
  x: number;
  y: number;
  rx: number;
  ry: number;
  height: number;
  angle: number;
  rampAngle: number;
}

export interface SimRoad {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  w: number;
}

export interface SimAirStrike {
  id: number;
  team: FactionId;
  role: 'fighter' | 'bomber';
  name: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  hp: number;
  patrolTimer: number;
}

export interface GameState {
  running: boolean;
  paused: boolean;
  tacticalPause: boolean;
  gameSpeed: number;
  difficulty: 'easy' | 'normal' | 'hard';
  timeElapsed: number;
  crystals: number;
  enemyCrystals: number;
  bot2Crystals: number;
  totalMined: number;
  kills: number;
  upgWeapon: number;
  upgArmor: number;
  upgEcon: number;
  cdFighterSortie: number;
  cdBomberSortie: number;
  aiBuildTimer: number;
  bot2BuildTimer: number;
  waveNumber: number;
  waveTimer: number;
  formation: 'wedge' | 'line' | 'scatter';
  winner: OutpostOwner | null;
  units: SimUnit[];
  buildings: SimBuilding[];
  outposts: SimOutpost[];
  projectiles: SimProjectile[];
  particles: SimParticle[];
  river: { x: number; y: number }[];
  bridges: SimBridge[];
  highGrounds: SimHighGround[];
  roads: SimRoad[];
  obstacles: { x: number; y: number; r: number }[];
  airStrikes: SimAirStrike[];
  nextId: number;
  _simTick: number;
}

export function sanitizeResource(val: unknown, fallback = 0): number {
  return typeof val === 'number' && Number.isFinite(val) ? Math.max(0, val) : fallback;
}

export class GameCore {
  public state: GameState;
  private simAccumulator = 0;
  private rngSeed = 1337;
  private useSeededRng = true;

  private readonly SPATIAL_CELL = 120;
  private readonly SPATIAL_COLS = Math.ceil(SLICE_WORLD_W / 120) + 1;
  private readonly SPATIAL_ROWS = Math.ceil(SLICE_WORLD_H / 120) + 1;
  private spatialBuckets: SimUnit[][];
  private touchedSpatial: number[] = [];

  private readonly COLL_CELL = 50;
  private readonly COLL_COLS = Math.ceil(SLICE_WORLD_W / 50) + 1;
  private readonly COLL_ROWS = Math.ceil(SLICE_WORLD_H / 50) + 1;
  private collBuckets: SimUnit[][];
  private touchedColl: number[] = [];

  constructor() {
    this.spatialBuckets = Array.from({ length: this.SPATIAL_COLS * this.SPATIAL_ROWS }, () => []);
    this.collBuckets = Array.from({ length: this.COLL_COLS * this.COLL_ROWS }, () => []);
    this.state = this.createEmptyState();
    this.initVerticalSlice('normal');
  }

  public setDeterministicSeed(seed: number | null): void {
    if (seed === null) {
      this.useSeededRng = false;
    } else {
      this.useSeededRng = true;
      this.rngSeed = (seed >>> 0) || 1337;
    }
  }

  public random(): number {
    if (!this.useSeededRng) return Math.random();
    this.rngSeed = (this.rngSeed * 1664525 + 1013904223) >>> 0;
    return this.rngSeed / 4294967296;
  }

  private createEmptyState(): GameState {
    return {
      running: false,
      paused: false,
      tacticalPause: false,
      gameSpeed: 1,
      difficulty: 'normal',
      timeElapsed: 0,
      crystals: 620,
      enemyCrystals: 480,
      bot2Crystals: 480,
      totalMined: 0,
      kills: 0,
      upgWeapon: 1,
      upgArmor: 1,
      upgEcon: 1,
      cdFighterSortie: 0,
      cdBomberSortie: 0,
      aiBuildTimer: 8,
      bot2BuildTimer: 9,
      waveNumber: 1,
      waveTimer: 45,
      formation: 'wedge',
      winner: null,
      units: [],
      buildings: [],
      outposts: [],
      projectiles: [],
      particles: [],
      river: [],
      bridges: [],
      highGrounds: [],
      roads: [],
      obstacles: [],
      airStrikes: [],
      nextId: 1,
      _simTick: 0
    };
  }

  public initVerticalSlice(difficulty: 'easy' | 'normal' | 'hard' = 'normal'): void {
    const s = this.createEmptyState();
    s.difficulty = difficulty;
    s.crystals = difficulty === 'easy' ? 750 : difficulty === 'normal' ? 620 : 500;
    s.enemyCrystals = difficulty === 'easy' ? 380 : difficulty === 'normal' ? 520 : 680;
    s.bot2Crystals = difficulty === 'easy' ? 380 : difficulty === 'normal' ? 520 : 680;
    s.running = true;
    s.paused = false;
    this.simAccumulator = 0;
    this.state = s;

    // 1. River running diagonally from North-West (420, 0) to South-East (780, 800)
    s.river = [
      { x: 430, y: 0 },
      { x: 540, y: 260 },
      { x: 600, y: 400 },
      { x: 660, y: 540 },
      { x: 770, y: 800 }
    ];

    // 2. Functional Central Armored Bridge at (600, 400)
    s.bridges = [
      {
        x: 600,
        y: 400,
        angle: -0.42,
        len: 155,
        w: 76,
        name: 'Omega Central Bridge'
      }
    ];

    // 3. Low-Poly Raised Terrain Plateaus (High Ground +22% Damage & +22% Range)
    s.highGrounds = [
      {
        id: 'hg_west',
        name: 'Aegis Western Ridge',
        x: 340,
        y: 460,
        rx: 92,
        ry: 64,
        height: 18,
        angle: -0.25,
        rampAngle: 2.4
      },
      {
        id: 'hg_east',
        name: 'Crimson Northern Bluff',
        x: 840,
        y: 260,
        rx: 92,
        ry: 64,
        height: 18,
        angle: 0.25,
        rampAngle: -0.8
      }
    ];

    // 4. Tactical Ground Markings / Roads connecting the 3 bases across the central bridge
    s.roads = [
      { x1: 160, y1: 640, x2: 600, y2: 400, w: 34 },
      { x1: 600, y1: 400, x2: 1020, y2: 160, w: 34 },
      { x1: 600, y1: 400, x2: 1000, y2: 640, w: 32 }
    ];

    // 5. Rock Obstacles
    s.obstacles = [
      { x: 280, y: 210, r: 36 },
      { x: 490, y: 670, r: 34 },
      { x: 740, y: 130, r: 34 }
    ];

    // 6. One Neutral Capturable Outpost at the central bridgehead (600, 400)
    s.outposts = [
      {
        id: s.nextId++,
        name: 'Omega Central Outpost',
        x: 600,
        y: 400,
        radius: 52,
        owner: 'neutral',
        capturingTeam: null,
        progress: 0,
        contested: false,
        isCore: true
      }
    ];

    // 7. Three Faction Bases (HQ, Barracks, Factory, Turret)
    // Faction 1: PLAYER (Aegis Federation — South-West, Cyan #0ea5e9)
    this.spawnBuilding('hq', 145, 650, 'player');
    this.spawnBuilding('barracks', 255, 665, 'player');
    this.spawnBuilding('factory', 155, 535, 'player');
    this.spawnBuilding('turret', 310, 560, 'player');

    // Faction 2: ENEMY (Crimson Dominion — North-East, Rose #f43f5e)
    this.spawnBuilding('hq', 1045, 145, 'enemy');
    this.spawnBuilding('barracks', 935, 130, 'enemy');
    this.spawnBuilding('factory', 1035, 255, 'enemy');
    this.spawnBuilding('turret', 885, 225, 'enemy');

    // Faction 3: BOT 2 (Titan Syndicate — South-East, Amber #f59e0b)
    this.spawnBuilding('hq', 1035, 650, 'bot2');
    this.spawnBuilding('barracks', 925, 665, 'bot2');
    this.spawnBuilding('factory', 1025, 540, 'bot2');
    this.spawnBuilding('turret', 885, 565, 'bot2');

    // 8. Spawn 26 Active Combat Units across the 3 factions (Infantry, APC, Tank)
    // Player Starting Force (10 units)
    this.spawnUnit('marine', 290, 610, 'player');
    this.spawnUnit('marine', 315, 625, 'player');
    this.spawnUnit('marine', 340, 605, 'player');
    this.spawnUnit('trooper', 275, 585, 'player');
    this.spawnUnit('trooper', 305, 575, 'player');
    this.spawnUnit('apc', 355, 575, 'player');
    this.spawnUnit('apc', 385, 600, 'player');
    this.spawnUnit('tank', 245, 535, 'player');
    this.spawnUnit('tank', 285, 520, 'player');
    this.spawnUnit('tank', 330, 535, 'player');

    // Enemy Starting Force (8 units - North-East)
    this.spawnUnit('marine', 870, 175, 'enemy');
    this.spawnUnit('marine', 895, 195, 'enemy');
    this.spawnUnit('marine', 850, 205, 'enemy');
    this.spawnUnit('trooper', 910, 165, 'enemy');
    this.spawnUnit('trooper', 880, 150, 'enemy');
    this.spawnUnit('apc', 840, 245, 'enemy');
    this.spawnUnit('tank', 945, 240, 'enemy');
    this.spawnUnit('tank', 915, 270, 'enemy');

    // Bot 2 Starting Force (8 units - South-East)
    this.spawnUnit('marine', 865, 615, 'bot2');
    this.spawnUnit('marine', 890, 635, 'bot2');
    this.spawnUnit('trooper', 845, 595, 'bot2');
    this.spawnUnit('trooper', 875, 585, 'bot2');
    this.spawnUnit('apc', 835, 535, 'bot2');
    this.spawnUnit('apc', 865, 515, 'bot2');
    this.spawnUnit('tank', 940, 535, 'bot2');
    this.spawnUnit('tank', 915, 505, 'bot2');
  }

  public getTeamMultipliers(team: FactionId) {
    if (team === 'player') {
      return {
        dmg: 1 + (this.state.upgWeapon - 1) * 0.25,
        hp: 1 + (this.state.upgArmor - 1) * 0.25,
        econ: 1 + (this.state.upgEcon - 1) * 0.35
      };
    }
    const diffMult = this.state.difficulty === 'easy' ? 0.88 : this.state.difficulty === 'normal' ? 1.0 : 1.2;
    return { dmg: diffMult, hp: diffMult, econ: diffMult };
  }

  public spawnBuilding(type: BuildingType, x: number, y: number, team: FactionId): SimBuilding {
    const spec = BUILDING_SPECS[type];
    const mult = this.getTeamMultipliers(team);
    const maxHp = Math.round(spec.hp * mult.hp);
    const b: SimBuilding = {
      id: this.state.nextId++,
      isBuilding: true,
      type,
      name: spec.name,
      team,
      x,
      y,
      radius: spec.radius,
      hp: maxHp,
      maxHp,
      shield: spec.shield ? Math.round(spec.shield * mult.hp) : 0,
      maxShield: spec.shield ? Math.round(spec.shield * mult.hp) : 0,
      range: spec.range || 0,
      dmg: spec.dmg ? Math.round(spec.dmg * mult.dmg) : 0,
      reload: spec.reload || 1,
      cooldown: 0,
      selected: false,
      angle: team === 'player' ? -Math.PI / 4 : (3 * Math.PI) / 4,
      recoil: 0,
      targetEntity: null
    };
    this.state.buildings.push(b);
    return b;
  }

  public spawnUnit(type: UnitType, x: number, y: number, team: FactionId): SimUnit {
    const spec = UNIT_SPECS[type];
    const mult = this.getTeamMultipliers(team);
    const maxHp = Math.round(spec.hp * mult.hp);
    const angle = team === 'player' ? -Math.PI / 4 : team === 'enemy' ? (3 * Math.PI) / 4 : (-3 * Math.PI) / 4;
    const jx = (this.random() - 0.5) * 6;
    const jy = (this.random() - 0.5) * 6;
    const ux = Math.max(spec.radius + 8, Math.min(SLICE_WORLD_W - spec.radius - 8, x + jx));
    const uy = Math.max(spec.radius + 8, Math.min(SLICE_WORLD_H - spec.radius - 8, y + jy));

    const u: SimUnit = {
      id: this.state.nextId++,
      isUnit: true,
      type,
      name: spec.name,
      team,
      x: ux,
      y: uy,
      prevX: ux,
      prevY: uy,
      vx: 0,
      vy: 0,
      radius: spec.radius,
      hp: maxHp,
      maxHp,
      shield: spec.shield ? Math.round(spec.shield * mult.hp) : 0,
      maxShield: spec.shield ? Math.round(spec.shield * mult.hp) : 0,
      speed: spec.speed,
      effectiveRange: spec.effectiveRange || Math.round((spec.range || 180) * 0.72),
      range: spec.range || 200,
      dmg: Math.round(spec.dmg * mult.dmg),
      splash: spec.splash || 0,
      reload: spec.reload,
      cooldown: this.random() * 0.15,
      projType: spec.projType || 'laser',
      flying: !!spec.flying,
      canTargetAir: spec.canTargetAir !== undefined ? spec.canTargetAir : true,
      isHarvester: !!spec.isHarvester,
      isSupplyTruck: !!spec.isSupplyTruck,
      selected: false,
      angle,
      prevAngle: angle,
      turretAngle: angle,
      prevTurretAngle: angle,
      kills: 0,
      veteran: 0,
      recoil: 0,
      muzzleFlash: 0,
      onHighGround: false,
      inDefilade: false,
      state: 'idle',
      targetX: ux,
      targetY: uy,
      targetEntity: null,
      stuckTimer: 0,
      walkCycle: 0
    };
    this.state.units.push(u);
    return u;
  }

  public getPlayerStats() {
    let powerUsed = 0;
    let powerMax = 10;
    let supplyUsed = 0;
    let supplyMax = 12;
    let passiveIncome = 6;
    let hasBarracks = false;
    let hasFactory = false;
    let hasAirfield = false;
    let hasRadar = false;
    let combatCount = 0;

    for (const b of this.state.buildings) {
      if (b.team !== 'player' || b.hp <= 0) continue;
      const spec = BUILDING_SPECS[b.type];
      if (spec.powerGen > 0) powerMax += spec.powerGen;
      else powerUsed += Math.abs(spec.powerGen);
      supplyMax += spec.supplyGen;
      passiveIncome += spec.incomeGen;
      if (b.type === 'barracks') hasBarracks = true;
      if (b.type === 'factory') hasFactory = true;
      if (b.type === 'airfield') hasAirfield = true;
      if (b.type === 'radar') hasRadar = true;
    }

    for (const op of this.state.outposts) {
      if (op.owner === 'player') {
        passiveIncome += op.isCore ? 10 : 6;
        powerMax += op.isCore ? 12 : 8;
        supplyMax += 6;
      }
    }

    for (const u of this.state.units) {
      if (u.team !== 'player' || u.hp <= 0) continue;
      const spec = UNIT_SPECS[u.type];
      supplyUsed += spec.supply;
      if (!u.isHarvester) combatCount++;
    }

    const mult = this.getTeamMultipliers('player');
    passiveIncome = Math.round(passiveIncome * mult.econ);

    return {
      powerUsed,
      powerMax,
      supplyUsed,
      supplyMax,
      passiveIncome,
      hasBarracks,
      hasFactory,
      hasAirfield,
      hasRadar,
      combatCount
    };
  }

  // =========================================================
  // PHASE A1 FIX: Single Authoritative Fighter Launch Validation
  // =========================================================
  public canLaunchFighterSortie(): FighterCheck {
    const stats = this.getPlayerStats();
    const airfield = this.state.buildings.find(b => b.team === 'player' && b.type === 'airfield' && b.hp > 0);
    const radar = this.state.buildings.find(b => b.team === 'player' && b.type === 'radar' && b.hp > 0);
    if (!stats.hasAirfield || !airfield) {
      return { ok: false, reason: 'no_airfield' };
    }
    if (!stats.hasRadar || !radar) {
      return { ok: false, reason: 'no_radar' };
    }
    if ((this.state.cdFighterSortie || 0) > 0) {
      return { ok: false, reason: 'cooldown' };
    }
    this.state.crystals = sanitizeResource(this.state.crystals, 0);
    if (this.state.crystals < FIGHTER_SORTIE_COST) {
      return { ok: false, reason: 'insufficient_funds' };
    }
    return { ok: true, airfield, radar };
  }

  public scrambleFighterInterceptors(tx: number, ty: number, _isEmergencyIntercept = false): boolean {
    const check = this.canLaunchFighterSortie();
    if (!check.ok || !check.airfield) {
      return false;
    }
    this.state.crystals = Math.max(0, sanitizeResource(this.state.crystals, 0) - FIGHTER_SORTIE_COST);
    this.state.cdFighterSortie = 11;

    for (let i = 0; i < 2; i++) {
      const offset = (i === 0 ? -1 : 1) * 35;
      this.state.airStrikes.push({
        id: this.state.nextId++,
        team: 'player',
        role: 'fighter',
        name: `F-22 Raptor #${i + 1}`,
        x: check.airfield.x,
        y: check.airfield.y + offset,
        targetX: tx + offset,
        targetY: ty + offset,
        speed: 380,
        hp: 320,
        patrolTimer: 12.0
      });
    }
    return true;
  }

  public activateFighterAirDefense(): boolean {
    const check = this.canLaunchFighterSortie();
    if (!check.ok) return false;
    return this.scrambleFighterInterceptors(600, 400, true);
  }

  public trainPlayerUnit(unitType: UnitType) {
    if (!this.state.running || this.state.paused) return { ok: false, reason: 'paused' };
    if (unitType === 'fighter') {
      const ok = this.activateFighterAirDefense();
      return { ok, reason: ok ? undefined : 'fighter_validation_failed' };
    }

    const spec = UNIT_SPECS[unitType];
    const stats = this.getPlayerStats();
    if (spec.req === 'barracks' && !stats.hasBarracks) return { ok: false, reason: 'no_barracks' };
    if (spec.req === 'factory' && !stats.hasFactory) return { ok: false, reason: 'no_factory' };
    if (spec.req === 'airfield' && !stats.hasAirfield) return { ok: false, reason: 'no_airfield' };

    if (stats.supplyUsed + spec.supply > stats.supplyMax) {
      return { ok: false, reason: 'supply_cap' };
    }
    this.state.crystals = sanitizeResource(this.state.crystals, 0);
    if (this.state.crystals < spec.cost) {
      return { ok: false, reason: 'insufficient_funds' };
    }

    const spawner =
      this.state.buildings.find(b => b.team === 'player' && b.type === (spec.req || 'barracks') && b.hp > 0) ||
      this.state.buildings.find(b => b.team === 'player' && b.type === 'hq' && b.hp > 0);
    if (!spawner) return { ok: false, reason: 'no_spawner' };

    this.state.crystals -= spec.cost;
    const ang = -Math.PI / 4 + (this.random() - 0.5) * 0.6;
    const sx = spawner.x + Math.cos(ang) * (spawner.radius + spec.radius + 18);
    const sy = spawner.y + Math.sin(ang) * (spawner.radius + spec.radius + 18);
    const u = this.spawnUnit(unitType, sx, sy, 'player');
    u.state = 'attackMove';
    u.targetX = sx + Math.cos(-Math.PI / 4) * 55;
    u.targetY = sy + Math.sin(-Math.PI / 4) * 55;
    return { ok: true, unit: u };
  }

  public constructPlayerBuilding(bType: BuildingType, x?: number, y?: number) {
    const spec = BUILDING_SPECS[bType];
    this.state.crystals = sanitizeResource(this.state.crystals, 0);
    if (this.state.crystals < spec.cost) {
      return { ok: false, reason: 'insufficient_funds' };
    }
    const hq = this.state.buildings.find(b => b.team === 'player' && b.type === 'hq') || { x: 145, y: 650 };
    const bx = x !== undefined ? x : hq.x + 115 + (this.random() - 0.5) * 60;
    const by = y !== undefined ? y : hq.y - 95 + (this.random() - 0.5) * 60;
    this.state.crystals -= spec.cost;
    const b = this.spawnBuilding(bType, bx, by, 'player');
    return { ok: true, building: b };
  }

  // =========================================================
  // PHASE A4 FIX: Deterministic Fixed-Timestep Simulation
  // =========================================================
  public stepSimulation(realElapsedSeconds: number, customSpeed?: number) {
    if (!Number.isFinite(realElapsedSeconds) || realElapsedSeconds <= 0) {
      return { steps: 0, alpha: this.simAccumulator / FIXED_DT };
    }
    if (!this.state.running || this.state.paused || this.state.tacticalPause) {
      this.simAccumulator = 0;
      return { steps: 0, alpha: 0 };
    }
    const clampedElapsed = Math.min(MAX_FRAME_DELTA, realElapsedSeconds);
    const speedMult =
      customSpeed !== undefined
        ? customSpeed
        : Number.isFinite(this.state.gameSpeed) && this.state.gameSpeed > 0
          ? this.state.gameSpeed
          : 1;

    this.simAccumulator = Math.round((this.simAccumulator + clampedElapsed * speedMult) * 60000) / 60000;
    let steps = 0;
    while (this.simAccumulator + 1e-9 >= FIXED_DT && steps < MAX_CATCHUP_STEPS) {
      this.updateGame(FIXED_DT);
      this.simAccumulator = Math.max(0, Math.round((this.simAccumulator - FIXED_DT) * 60000) / 60000);
      if (Math.abs(this.simAccumulator) < 1e-9) this.simAccumulator = 0;
      steps++;
    }
    if (steps >= MAX_CATCHUP_STEPS) {
      this.simAccumulator = 0;
    }
    return { steps, alpha: Math.max(0, Math.min(1, this.simAccumulator / FIXED_DT)) };
  }

  public updateGame(dt: number): void {
    if (!this.state.running || this.state.paused || this.state.tacticalPause) return;

    this.state._simTick = ((this.state._simTick || 0) + 1) | 0;
    this.state.timeElapsed += dt;

    // Save previous positions/angles for smooth 3D interpolation
    for (const u of this.state.units) {
      u.prevX = u.x;
      u.prevY = u.y;
      u.prevAngle = u.angle;
      u.prevTurretAngle = u.turretAngle;
      if (u.recoil > 0) u.recoil = Math.max(0, u.recoil - dt * 28);
      if (u.muzzleFlash > 0) u.muzzleFlash = Math.max(0, u.muzzleFlash - dt);
    }
    for (const p of this.state.projectiles) {
      p.prevX = p.x;
      p.prevY = p.y;
      p.prevZ = p.z;
    }

    if (this.state.cdFighterSortie > 0) {
      this.state.cdFighterSortie = Math.max(0, this.state.cdFighterSortie - dt);
    }
    if (this.state.cdBomberSortie > 0) {
      this.state.cdBomberSortie = Math.max(0, this.state.cdBomberSortie - dt);
    }

    // PHASE A3 FIX: Sanitize resources so 0 never triggers `|| 400` and NaN/negative never occur
    this.state.crystals = sanitizeResource(this.state.crystals, 0);
    this.state.enemyCrystals = sanitizeResource(this.state.enemyCrystals, 0);
    this.state.bot2Crystals = sanitizeResource(this.state.bot2Crystals, 0);
    this.state.totalMined = sanitizeResource(this.state.totalMined, 0);

    const stats = this.getPlayerStats();
    if (dt > 0) {
      this.state.crystals = sanitizeResource(this.state.crystals + stats.passiveIncome * dt, 0);
      this.state.totalMined = sanitizeResource(this.state.totalMined + stats.passiveIncome * dt, 0);

      let enemyOutpostBonus = 0;
      let bot2OutpostBonus = 0;
      for (const op of this.state.outposts) {
        if (op.owner === 'enemy') enemyOutpostBonus += op.isCore ? 8 : 4;
        else if (op.owner === 'bot2') bot2OutpostBonus += op.isCore ? 8 : 4;
      }
      const enemyMult = this.getTeamMultipliers('enemy');
      this.state.enemyCrystals = sanitizeResource(
        this.state.enemyCrystals + (7 + enemyOutpostBonus) * enemyMult.econ * dt,
        0
      );
      this.state.bot2Crystals = sanitizeResource(
        this.state.bot2Crystals + (7 + bot2OutpostBonus) * enemyMult.econ * dt,
        0
      );
    }

    // PHASE A2 FIX: Three-Faction Independent Outpost Capture (player, enemy, bot2)
    for (const op of this.state.outposts) {
      if (!Number.isFinite(op.progress)) op.progress = op.owner === 'neutral' ? 0 : 100;
      if (op.progress < 0) op.progress = Math.abs(op.progress);
      if (op.owner !== 'neutral' && op.capturingTeam !== op.owner && op.progress >= 100) {
        op.capturingTeam = op.owner;
      }

      let pUnits = 0;
      let eUnits = 0;
      let b2Units = 0;
      for (const u of this.state.units) {
        if (u.hp <= 0 || u.isHarvester) continue;
        const d = Math.hypot(u.x - op.x, u.y - op.y);
        if (d <= op.radius + 28) {
          if (u.team === 'player') pUnits++;
          else if (u.team === 'enemy') eUnits++;
          else if (u.team === 'bot2') b2Units++;
        }
        if (u.team === op.owner && u.hp < u.maxHp && d <= op.radius + 55) {
          u.hp = Math.min(u.maxHp, u.hp + 10 * dt);
        }
      }

      const activeFactions = (pUnits > 0 ? 1 : 0) + (eUnits > 0 ? 1 : 0) + (b2Units > 0 ? 1 : 0);
      op.contested = activeFactions > 1;

      if (activeFactions === 1) {
        const domTeam: FactionId = pUnits > 0 ? 'player' : eUnits > 0 ? 'enemy' : 'bot2';
        const unitCount = pUnits || eUnits || b2Units;
        const capDelta = (20 + unitCount * 6) * dt;

        if (op.owner === domTeam) {
          op.capturingTeam = domTeam;
          op.progress = Math.min(100, op.progress + capDelta);
        } else {
          if (op.capturingTeam && op.capturingTeam !== domTeam && op.progress > 0) {
            op.progress = Math.max(0, op.progress - capDelta);
            if (op.progress <= 0) {
              op.owner = 'neutral';
              op.capturingTeam = domTeam;
            }
          } else {
            op.capturingTeam = domTeam;
            op.progress = Math.min(100, op.progress + capDelta);
            if (op.progress >= 100 && op.owner !== domTeam) {
              op.owner = domTeam;
              op.capturingTeam = domTeam;
              op.progress = 100;
            }
          }
        }
      }
    }

    this.rebuildSpatialGrid();

    // Update Turrets & Buildings
    for (const b of this.state.buildings) {
      if (b.hp <= 0) continue;
      if (b.recoil > 0) b.recoil = Math.max(0, b.recoil - dt * 25);
      if (b.type === 'turret') {
        b.cooldown = Math.max(0, b.cooldown - dt);
        const target = this.findBestTarget(b.x, b.y, b.range, b.team, true);
        b.targetEntity = target;
        if (target) {
          b.angle = Math.atan2(target.y - b.y, target.x - b.x);
          if (b.cooldown <= 0) {
            b.cooldown = b.reload;
            b.recoil = 5;
            this.fireProjectile(b, target, 'turret');
          }
        }
      }
    }

    // Update AI Commanders (Enemy & Bot 2)
    this.updateAI(dt);

    // Update Units
    this.updateUnits(dt);

    // Update Projectiles
    this.updateProjectiles(dt);

    // Update Air Strikes
    for (let i = this.state.airStrikes.length - 1; i >= 0; i--) {
      const s = this.state.airStrikes[i];
      s.patrolTimer -= dt;
      if (s.patrolTimer <= 0 || s.hp <= 0) {
        this.state.airStrikes.splice(i, 1);
      }
    }

    // Update Particles
    for (let i = this.state.particles.length - 1; i >= 0; i--) {
      const pt = this.state.particles[i];
      pt.life -= dt;
      if (pt.life <= 0) {
        this.state.particles.splice(i, 1);
        continue;
      }
      if (!pt.isRing) {
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.z = Math.max(0, pt.z + pt.vz * dt);
        pt.vz -= 65 * dt;
      }
    }

    // Cleanup dead units
    for (let i = this.state.units.length - 1; i >= 0; i--) {
      const u = this.state.units[i];
      if (u.hp <= 0) {
        this.addBurst(u.x, u.y, 4, u.team === 'player' ? '#38bdf8' : u.team === 'bot2' ? '#f59e0b' : '#f43f5e', 10);
        if (u.team !== 'player') this.state.kills++;
        this.state.units.splice(i, 1);
      }
    }

    // Cleanup destroyed buildings & check Victory / Defeat
    for (let i = this.state.buildings.length - 1; i >= 0; i--) {
      const b = this.state.buildings[i];
      if (b.hp <= 0) {
        this.addBurst(b.x, b.y, 8, '#fb923c', 18);
        const wasHQ = b.type === 'hq';
        const destroyedTeam = b.team;
        this.state.buildings.splice(i, 1);
        if (wasHQ) {
          if (destroyedTeam === 'player') {
            this.state.winner = 'enemy';
            this.state.paused = true;
            return;
          } else {
            const remainingHostileHQs = this.state.buildings.filter(
              ob => ob.team !== 'player' && ob.type === 'hq' && ob.hp > 0
            );
            if (remainingHostileHQs.length === 0) {
              this.state.winner = 'player';
              this.state.paused = true;
              return;
            }
          }
        }
      }
    }
  }

  private updateAI(dt: number): void {
    const enemyHQ = this.state.buildings.find(b => b.team === 'enemy' && b.type === 'hq' && b.hp > 0);
    const bot2HQ = this.state.buildings.find(b => b.team === 'bot2' && b.type === 'hq' && b.hp > 0);

    if (enemyHQ) {
      this.state.aiBuildTimer -= dt;
      if (this.state.aiBuildTimer <= 0) {
        this.state.aiBuildTimer = this.state.difficulty === 'easy' ? 11 : this.state.difficulty === 'normal' ? 8.5 : 6.5;
        const enemyCount = this.state.units.filter(u => u.team === 'enemy').length;
        if (enemyCount < 14 && this.state.enemyCrystals >= 135) {
          const pool: UnitType[] = ['marine', 'trooper', 'apc', 'tank'];
          const pick = pool[Math.floor(this.random() * pool.length)];
          const cost = UNIT_SPECS[pick].cost;
          if (this.state.enemyCrystals >= cost) {
            this.state.enemyCrystals = Math.max(0, this.state.enemyCrystals - cost);
            const u = this.spawnUnit(pick, enemyHQ.x - 55, enemyHQ.y + 45, 'enemy');
            u.state = 'attackMove';
            u.targetX = 600 + (this.random() - 0.5) * 90;
            u.targetY = 400 + (this.random() - 0.5) * 90;
          }
        }
      }
    }

    if (bot2HQ) {
      this.state.bot2BuildTimer -= dt;
      if (this.state.bot2BuildTimer <= 0) {
        this.state.bot2BuildTimer = this.state.difficulty === 'easy' ? 11.5 : this.state.difficulty === 'normal' ? 9.0 : 7.0;
        const bot2Count = this.state.units.filter(u => u.team === 'bot2').length;
        this.state.bot2Crystals = sanitizeResource(this.state.bot2Crystals, 0);
        if (bot2Count < 14 && this.state.bot2Crystals >= 135) {
          const pool: UnitType[] = ['marine', 'trooper', 'apc', 'tank'];
          const pick = pool[Math.floor(this.random() * pool.length)];
          const cost = UNIT_SPECS[pick].cost;
          if (this.state.bot2Crystals >= cost) {
            this.state.bot2Crystals = Math.max(0, this.state.bot2Crystals - cost);
            const u = this.spawnUnit(pick, bot2HQ.x - 55, bot2HQ.y - 45, 'bot2');
            u.state = 'attackMove';
            u.targetX = 600 + (this.random() - 0.5) * 90;
            u.targetY = 400 + (this.random() - 0.5) * 90;
          }
        }
      }
    }

    this.state.waveTimer -= dt;
    if (this.state.waveTimer <= 0) {
      this.state.waveNumber++;
      this.state.waveTimer = this.state.difficulty === 'easy' ? 50 : 38;
      // Direct idle AI units toward the central outpost or player base
      const op = this.state.outposts[0] || { x: 600, y: 400 };
      for (const u of this.state.units) {
        if ((u.team === 'enemy' || u.team === 'bot2') && u.state === 'idle') {
          u.state = 'attackMove';
          u.targetX = op.x + (this.random() - 0.5) * 80;
          u.targetY = op.y + (this.random() - 0.5) * 80;
        }
      }
    }
  }

  private rebuildSpatialGrid(): void {
    for (let i = 0; i < this.touchedSpatial.length; i++) {
      this.spatialBuckets[this.touchedSpatial[i]].length = 0;
    }
    this.touchedSpatial.length = 0;
    for (const u of this.state.units) {
      if (u.hp <= 0) continue;
      const cx = Math.max(0, Math.min(this.SPATIAL_COLS - 1, (u.x / this.SPATIAL_CELL) | 0));
      const cy = Math.max(0, Math.min(this.SPATIAL_ROWS - 1, (u.y / this.SPATIAL_CELL) | 0));
      u._scx = cx;
      u._scy = cy;
      const idx = cy * this.SPATIAL_COLS + cx;
      const b = this.spatialBuckets[idx];
      if (b.length === 0) this.touchedSpatial.push(idx);
      b.push(u);
    }
  }

  private rebuildCollisionGrid(): void {
    for (let i = 0; i < this.touchedColl.length; i++) {
      this.collBuckets[this.touchedColl[i]].length = 0;
    }
    this.touchedColl.length = 0;
    for (const u of this.state.units) {
      if (u.hp <= 0) continue;
      const cx = Math.max(0, Math.min(this.COLL_COLS - 1, (u.x / this.COLL_CELL) | 0));
      const cy = Math.max(0, Math.min(this.COLL_ROWS - 1, (u.y / this.COLL_CELL) | 0));
      u._ccx = cx;
      u._ccy = cy;
      const idx = cy * this.COLL_COLS + cx;
      const b = this.collBuckets[idx];
      if (b.length === 0) this.touchedColl.push(idx);
      b.push(u);
    }
  }

  public findBestTarget(
    x: number,
    y: number,
    maxRange: number,
    myTeam: FactionId,
    canTargetAir = true
  ): SimUnit | SimBuilding | null {
    let best: SimUnit | SimBuilding | null = null;
    let bestDist = maxRange;

    const pad = maxRange + 28;
    const c0 = Math.max(0, ((x - pad) / this.SPATIAL_CELL) | 0);
    const c1 = Math.min(this.SPATIAL_COLS - 1, ((x + pad) / this.SPATIAL_CELL) | 0);
    const r0 = Math.max(0, ((y - pad) / this.SPATIAL_CELL) | 0);
    const r1 = Math.min(this.SPATIAL_ROWS - 1, ((y + pad) / this.SPATIAL_CELL) | 0);

    for (let r = r0; r <= r1; r++) {
      const rowOff = r * this.SPATIAL_COLS;
      for (let c = c0; c <= c1; c++) {
        const bucket = this.spatialBuckets[rowOff + c];
        for (let i = 0; i < bucket.length; i++) {
          const u = bucket[i];
          if (u.team === myTeam || u.hp <= 0) continue;
          if (u.flying && !canTargetAir) continue;
          const d = Math.hypot(u.x - x, u.y - y) - u.radius;
          if (d <= bestDist) {
            bestDist = d;
            best = u;
          }
        }
      }
    }
    if (best) return best;

    for (const b of this.state.buildings) {
      if (b.team === myTeam || b.hp <= 0) continue;
      const d = Math.hypot(b.x - x, b.y - y) - b.radius;
      if (d <= bestDist) {
        bestDist = d;
        best = b;
      }
    }
    return best;
  }

  public getTerrainHeightAt(x: number, y: number): number {
    // Check bridge first
    if (this.getBridgeAtPoint(x, y, 6)) {
      return 3.5;
    }
    // Check raised high-ground plateaus
    for (const hg of this.state.highGrounds) {
      const dx = x - hg.x;
      const dy = y - hg.y;
      const cos = Math.cos(-hg.angle);
      const sin = Math.sin(-hg.angle);
      const lx = dx * cos - dy * sin;
      const ly = dx * sin + dy * cos;
      const norm = (lx * lx) / (hg.rx * hg.rx) + (ryNorm(ly, hg.ry));
      if (norm <= 1.0) {
        return hg.height;
      }
      if (norm <= 1.35) {
        const t = 1 - (norm - 1.0) / 0.35;
        return hg.height * Math.max(0, t);
      }
    }
    // Check river depression
    const rInfo = this.getRiverTelemetry(x, y);
    if (rInfo.dist < 32) {
      return -3.5;
    }
    return 0;
  }

  private updateUnits(dt: number): void {
    for (const u of this.state.units) {
      if (u.hp <= 0) continue;

      // Check high ground status
      u.onHighGround = this.getTerrainHeightAt(u.x, u.y) >= 12;
      const baseSpec = UNIT_SPECS[u.type];
      u.range = Math.round(baseSpec.range * (u.onHighGround ? 1.22 : 1.0));

      u.cooldown = Math.max(0, u.cooldown - dt);

      if (u.targetEntity && u.targetEntity.hp <= 0) {
        u.targetEntity = null;
      }

      if (u.state === 'move') {
        const dist = Math.hypot(u.targetX - u.x, u.targetY - u.y);
        const opp = u.cooldown <= 0.04 ? this.findBestTarget(u.x, u.y, u.range, u.team, u.canTargetAir) : null;
        if (opp) {
          u.turretAngle = Math.atan2(opp.y - u.y, opp.x - u.x);
          if (u.cooldown <= 0) {
            u.cooldown = u.reload;
            this.fireProjectile(u, opp, u.projType);
          }
        }
        if (dist < 12 || (dist < 42 && u.stuckTimer > 0.75)) {
          u.state = 'idle';
          u.stuckTimer = 0;
        } else {
          this.moveTowards(u, u.targetX, u.targetY, dt);
        }
      } else if (u.state === 'attackTarget' && u.targetEntity) {
        const t = u.targetEntity;
        const dist = Math.hypot(t.x - u.x, t.y - u.y) - t.radius;
        if (dist <= u.range) {
          u.turretAngle = Math.atan2(t.y - u.y, t.x - u.x);
          u.angle = u.turretAngle;
          if (u.cooldown <= 0) {
            u.cooldown = u.reload;
            this.fireProjectile(u, t, u.projType);
          }
        } else {
          this.moveTowards(u, t.x, t.y, dt, t.id);
        }
      } else if (u.state === 'hold') {
        const enemy = this.findBestTarget(u.x, u.y, u.range, u.team, u.canTargetAir);
        if (enemy) {
          u.turretAngle = Math.atan2(enemy.y - u.y, enemy.x - u.x);
          u.angle = u.turretAngle;
          if (u.cooldown <= 0) {
            u.cooldown = u.reload;
            this.fireProjectile(u, enemy, u.projType);
          }
        }
      } else {
        // idle or attackMove
        const scanRange = u.range + 75;
        const enemy = this.findBestTarget(u.x, u.y, scanRange, u.team, u.canTargetAir);
        if (enemy) {
          const dist = Math.hypot(enemy.x - u.x, enemy.y - u.y) - enemy.radius;
          if (dist <= u.range) {
            u.turretAngle = Math.atan2(enemy.y - u.y, enemy.x - u.x);
            u.angle = u.turretAngle;
            if (u.cooldown <= 0) {
              u.cooldown = u.reload;
              this.fireProjectile(u, enemy, u.projType);
            }
          } else {
            this.moveTowards(u, enemy.x, enemy.y, dt, enemy.id);
          }
        } else if (u.state === 'attackMove') {
          const dist = Math.hypot(u.targetX - u.x, u.targetY - u.y);
          if (dist < 16 || (dist < 48 && u.stuckTimer > 0.75)) {
            u.state = 'idle';
            u.stuckTimer = 0;
          } else {
            this.moveTowards(u, u.targetX, u.targetY, dt);
          }
        }
      }
    }

    this.resolveCollisions();
  }

  public getBridgeAtPoint(x: number, y: number, extraMargin = 0): BridgeHit | null {
    for (const br of this.state.bridges) {
      const dx = x - br.x;
      const dy = y - br.y;
      const cos = Math.cos(-br.angle);
      const sin = Math.sin(-br.angle);
      const lx = dx * cos - dy * sin;
      const ly = dx * sin + dy * cos;
      if (Math.abs(lx) <= br.len * 0.56 + 18 + extraMargin && Math.abs(ly) <= br.w * 0.52 + 8 + extraMargin) {
        return { br, lx, ly };
      }
    }
    return null;
  }

  public getRiverTelemetry(px: number, py: number): RiverTelemetry {
    if (!this.state.river || this.state.river.length < 2) {
      return { x: px, y: py, dist: 9999, side: -1, nx: -1, ny: 0 };
    }
    let bestDistSq = Infinity;
    let bestCx = px;
    let bestCy = py;
    let bestVx = 1;
    let bestVy = 1;
    let bestCross = -1;
    let bestLenSq = 1;

    for (let i = 0; i < this.state.river.length - 1; i++) {
      const a = this.state.river[i];
      const b = this.state.river[i + 1];
      const vx = b.x - a.x;
      const vy = b.y - a.y;
      const lenSq = vx * vx + vy * vy || 1;
      const t = Math.max(0, Math.min(1, ((px - a.x) * vx + (py - a.y) * vy) / lenSq));
      const cx = a.x + t * vx;
      const cy = a.y + t * vy;
      const dx = px - cx;
      const dy = py - cy;
      const dSq = dx * dx + dy * dy;
      if (dSq < bestDistSq) {
        bestDistSq = dSq;
        bestCx = cx;
        bestCy = cy;
        bestVx = vx;
        bestVy = vy;
        bestLenSq = lenSq;
        bestCross = vx * (py - a.y) - vy * (px - a.x);
      }
    }
    const side = bestCross >= 0 ? -1 : 1;
    const segLen = Math.sqrt(bestLenSq) || 1;
    const sign = bestCross >= 0 ? 1 : -1;
    return {
      x: bestCx,
      y: bestCy,
      dist: Math.sqrt(bestDistSq),
      side,
      nx: (-bestVy / segLen) * sign,
      ny: (bestVx / segLen) * sign
    };
  }

  public getNearestBridgeWaypoint(u: SimUnit, tx: number, ty: number): BridgeWaypoint {
    if (!this.state.bridges || this.state.bridges.length === 0) {
      return { x: tx, y: ty, usingBridge: false };
    }
    const rU = this.getRiverTelemetry(u.x, u.y);
    const tSide = this.getRiverTelemetry(tx, ty).side;
    const bridgeHit = this.getBridgeAtPoint(u.x, u.y, 16);
    const onBridgeNow = !!bridgeHit;

    const targetBridge = this.getBridgeAtPoint(tx, ty, 10);
    if (onBridgeNow && targetBridge && targetBridge.br === bridgeHit.br) {
      return { x: tx, y: ty, usingBridge: false };
    }
    if (rU.side === tSide && !onBridgeNow) {
      return { x: tx, y: ty, usingBridge: false };
    }

    const bestBridge = this.state.bridges[0];
    const cos = Math.cos(bestBridge.angle);
    const sin = Math.sin(bestBridge.angle);
    const endA = { x: bestBridge.x - cos * (bestBridge.len * 0.55), y: bestBridge.y - sin * (bestBridge.len * 0.55) };
    const endB = { x: bestBridge.x + cos * (bestBridge.len * 0.55), y: bestBridge.y + sin * (bestBridge.len * 0.55) };
    const sideA = this.getRiverTelemetry(endA.x, endA.y).side;

    const exitPt = sideA === tSide ? endA : endB;
    const entryPt = sideA === tSide ? endB : endA;

    const distEntry = Math.hypot(u.x - entryPt.x, u.y - entryPt.y);
    if (onBridgeNow || distEntry <= 42) {
      const distExit = Math.hypot(u.x - exitPt.x, u.y - exitPt.y);
      const distAB = Math.hypot(exitPt.x - entryPt.x, exitPt.y - entryPt.y) || 1;
      const prog = ((u.x - entryPt.x) * (exitPt.x - entryPt.x) + (u.y - entryPt.y) * (exitPt.y - entryPt.y)) / (distAB * distAB);
      if (distExit <= 34 || prog >= 0.92 || (rU.side === tSide && rU.dist > 55)) {
        return { x: tx, y: ty, usingBridge: false };
      }
      return { x: exitPt.x, y: exitPt.y, usingBridge: true };
    }
    return { x: entryPt.x, y: entryPt.y, usingBridge: true };
  }

  private moveTowards(u: SimUnit, tx: number, ty: number, dt: number, ignoreId: number | null = null): void {
    if (!u.flying) {
      const wp = this.getNearestBridgeWaypoint(u, tx, ty);
      tx = wp.x;
      ty = wp.y;
    }
    const dx = tx - u.x;
    const dy = ty - u.y;
    const dist = Math.hypot(dx, dy) || 1;
    const baseSpd = u.speed;
    let vx = (dx / dist) * baseSpd;
    let vy = (dy / dist) * baseSpd;

    if (!u.flying) {
      const applyAvoidance = (bx: number, by: number, br: number, padDist: number) => {
        const safeR = br + u.radius + padDist;
        const ox = u.x - bx;
        const oy = u.y - by;
        if (Math.abs(ox) > safeR || Math.abs(oy) > safeR) return;
        const od = Math.hypot(ox, oy) || 1;
        if (od >= safeR) return;
        const factor = (safeR - od) / safeR;
        const nx = ox / od;
        const ny = oy / od;
        vx += nx * factor * baseSpd * 1.5;
        vy += ny * factor * baseSpd * 1.5;
        const t1x = -ny;
        const t1y = nx;
        const dir = t1x * dx + t1y * dy >= 0 ? 1 : -1;
        vx += t1x * dir * factor * baseSpd * 1.3;
        vy += t1y * dir * factor * baseSpd * 1.3;
      };

      for (const obs of this.state.obstacles) {
        applyAvoidance(obs.x, obs.y, obs.r, 14);
      }
      for (const b of this.state.buildings) {
        if (b.id === ignoreId) continue;
        applyAvoidance(b.x, b.y, b.radius, 12);
      }

      const bHit = this.getBridgeAtPoint(u.x, u.y, 14);
      if (bHit) {
        const maxLat = bHit.br.w * 0.38;
        if (Math.abs(bHit.ly) > maxLat) {
          const pushSign = bHit.ly > 0 ? -1 : 1;
          const perpAng = bHit.br.angle + Math.PI / 2;
          vx += Math.cos(perpAng) * pushSign * baseSpd * 0.85;
          vy += Math.sin(perpAng) * pushSign * baseSpd * 0.85;
        }
      } else {
        const rInfo = this.getRiverTelemetry(u.x, u.y);
        const safeRiverDist = 30 + u.radius + 8;
        if (rInfo.dist < safeRiverDist) {
          const ox = u.x - rInfo.x;
          const oy = u.y - rInfo.y;
          const od = rInfo.dist || 1;
          const factor = (safeRiverDist - rInfo.dist) / safeRiverDist;
          const nx = ox / od;
          const ny = oy / od;
          vx += nx * factor * baseSpd * 1.8;
          vy += ny * factor * baseSpd * 1.8;
        }
      }
    }

    const prevX = u.x;
    const prevY = u.y;
    u.x += vx * dt;
    u.y += vy * dt;

    const moved = Math.hypot(u.x - prevX, u.y - prevY);
    if (moved < baseSpd * dt * 0.22) {
      u.stuckTimer = (u.stuckTimer || 0) + dt;
    } else {
      u.stuckTimer = Math.max(0, (u.stuckTimer || 0) - dt * 0.5);
    }

    u.angle = Math.atan2(vy, vx);
    u.turretAngle = u.angle;
    u.walkCycle = (u.walkCycle || 0) + dt * (u.speed * 0.14);
  }

  public resolveCollisions(): void {
    this.rebuildCollisionGrid();

    for (let i = 0; i < this.state.units.length; i++) {
      const a = this.state.units[i];
      if (a.hp <= 0) continue;

      a.x = Math.max(a.radius + 8, Math.min(SLICE_WORLD_W - a.radius - 8, a.x));
      a.y = Math.max(a.radius + 8, Math.min(SLICE_WORLD_H - a.radius - 8, a.y));

      const acx = a._ccx !== undefined ? a._ccx : Math.max(0, Math.min(this.COLL_COLS - 1, (a.x / this.COLL_CELL) | 0));
      const acy = a._ccy !== undefined ? a._ccy : Math.max(0, Math.min(this.COLL_ROWS - 1, (a.y / this.COLL_CELL) | 0));
      const r0 = Math.max(0, acy - 1);
      const r1 = Math.min(this.COLL_ROWS - 1, acy + 1);
      const c0 = Math.max(0, acx - 1);
      const c1 = Math.min(this.COLL_COLS - 1, acx + 1);

      for (let gr = r0; gr <= r1; gr++) {
        const rowOff = gr * this.COLL_COLS;
        for (let gc = c0; gc <= c1; gc++) {
          const bucket = this.collBuckets[rowOff + gc];
          for (let bi = 0; bi < bucket.length; bi++) {
            const b = bucket[bi];
            if (b.id <= a.id || a.flying !== b.flying || b.hp <= 0) continue;
            let dx = b.x - a.x;
            let dy = b.y - a.y;
            const minD = a.radius + b.radius + 2;
            if (Math.abs(dx) >= minD || Math.abs(dy) >= minD) continue;
            let d = Math.hypot(dx, dy);
            if (d < minD) {
              if (d < 0.05) {
                const ang = ((a.id * 7 + b.id * 13) % 12) * (Math.PI / 6);
                dx = Math.cos(ang);
                dy = Math.sin(ang);
                d = 1;
              }
              const overlap = (minD - d) * 0.5;
              const nx = dx / d;
              const ny = dy / d;
              a.x -= nx * overlap;
              a.y -= ny * overlap;
              b.x += nx * overlap;
              b.y += ny * overlap;
            }
          }
        }
      }

      if (!a.flying) {
        // 1. River bank collision unless on the bridge
        const bColl = this.getBridgeAtPoint(a.x, a.y, 12);
        if (bColl) {
          const maxLy = bColl.br.w * 0.45;
          if (Math.abs(bColl.ly) > maxLy) {
            const clampedLy = Math.sign(bColl.ly) * maxLy;
            const rcos = Math.cos(bColl.br.angle);
            const rsin = Math.sin(bColl.br.angle);
            a.x = bColl.br.x + (bColl.lx * rcos - clampedLy * rsin);
            a.y = bColl.br.y + (bColl.lx * rsin + clampedLy * rcos);
          }
        } else {
          const rInfo = this.getRiverTelemetry(a.x, a.y);
          const minRiverD = 30 + a.radius;
          if (rInfo.dist < minRiverD) {
            let dx = a.x - rInfo.x;
            let dy = a.y - rInfo.y;
            let d = Math.hypot(dx, dy);
            if (d < 0.1) {
              dx = rInfo.nx || (rInfo.side < 0 ? -1 : 1);
              dy = rInfo.ny || 0;
              d = Math.hypot(dx, dy) || 1;
            }
            a.x = rInfo.x + (dx / d) * (minRiverD + 0.5);
            a.y = rInfo.y + (dy / d) * (minRiverD + 0.5);
          }
        }

        // 2. Obstacles
        for (const obs of this.state.obstacles) {
          const minD = obs.r + a.radius + 2;
          const dx = a.x - obs.x;
          const dy = a.y - obs.y;
          if (Math.abs(dx) > minD || Math.abs(dy) > minD) continue;
          const d = Math.hypot(dx, dy) || 0.1;
          if (d < minD) {
            a.x = obs.x + (dx / d) * minD;
            a.y = obs.y + (dy / d) * minD;
          }
        }

        // 3. Base Buildings
        for (const b of this.state.buildings) {
          if (b.hp <= 0) continue;
          const minD = b.radius + a.radius + 3;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          if (Math.abs(dx) > minD || Math.abs(dy) > minD) continue;
          const d = Math.hypot(dx, dy) || 0.1;
          if (d < minD) {
            a.x = b.x + (dx / d) * minD;
            a.y = b.y + (dy / d) * minD;
          }
        }
      }
    }
  }

  public fireProjectile(shooter: SimUnit | SimBuilding, target: SimUnit | SimBuilding, projType: string): void {
    const vetMult = 'veteran' in shooter && shooter.veteran ? 1 + shooter.veteran * 0.2 : 1;
    const dmg = Math.max(1, Math.round(shooter.dmg * vetMult));
    shooter.recoil = projType === 'cannon' ? 6 : 3.5;
    if ('muzzleFlash' in shooter) {
      shooter.muzzleFlash = 0.09;
    }

    const ang = ('turretAngle' in shooter ? shooter.turretAngle : shooter.angle) || 0;
    const muzzleX = shooter.x + Math.cos(ang) * (shooter.radius + 4);
    const muzzleY = shooter.y + Math.sin(ang) * (shooter.radius + 4);

    if (projType === 'turret') {
      this.applyDamage(shooter, target, dmg);
      this.state.projectiles.push({
        id: this.state.nextId++,
        isBeam: true,
        shooterId: shooter.id,
        team: shooter.team,
        sx: muzzleX,
        sy: muzzleY,
        x: target.x,
        y: target.y,
        prevX: muzzleX,
        prevY: muzzleY,
        z: 10,
        prevZ: 10,
        tx: target.x,
        ty: target.y,
        target,
        totalDist: Math.hypot(target.x - muzzleX, target.y - muzzleY),
        traveled: 0,
        arcHeight: 0,
        speed: 900,
        dmg,
        splash: 0,
        projType,
        color: shooter.team === 'player' ? '#38bdf8' : shooter.team === 'bot2' ? '#f59e0b' : '#fb7185',
        life: 0.14,
        maxLife: 0.14
      });
      this.addBurst(target.x, target.y, 6, '#38bdf8', 4);
      return;
    }

    const totalDist = Math.max(12, Math.hypot(target.x - muzzleX, target.y - muzzleY));
    const startZ = this.getTerrainHeightAt(muzzleX, muzzleY) + 5;

    this.state.projectiles.push({
      id: this.state.nextId++,
      isBeam: false,
      shooterId: shooter.id,
      team: shooter.team,
      sx: muzzleX,
      sy: muzzleY,
      x: muzzleX,
      y: muzzleY,
      prevX: muzzleX,
      prevY: muzzleY,
      z: startZ,
      prevZ: startZ,
      tx: target.x,
      ty: target.y,
      target,
      totalDist,
      traveled: 0,
      arcHeight: projType === 'rocket' ? 14 : projType === 'cannon' ? 8 : 2,
      speed: projType === 'laser' ? 420 : projType === 'autocannon' ? 460 : projType === 'cannon' ? 360 : 340,
      dmg,
      splash: 'splash' in shooter ? shooter.splash : 0,
      projType,
      color:
        shooter.team === 'player'
          ? projType === 'rocket'
            ? '#fb923c'
            : projType === 'autocannon'
              ? '#2dd4bf'
              : '#38bdf8'
          : shooter.team === 'bot2'
            ? '#f59e0b'
            : '#f43f5e',
      life: 2.5,
      maxLife: 2.5
    });
  }

  private updateProjectiles(dt: number): void {
    for (let i = this.state.projectiles.length - 1; i >= 0; i--) {
      const p = this.state.projectiles[i];
      if (p.isBeam) {
        p.life -= dt;
        if (p.life <= 0) this.state.projectiles.splice(i, 1);
        continue;
      }

      if (p.target && p.target.hp > 0) {
        p.tx = p.target.x;
        p.ty = p.target.y;
      }

      const dx = p.tx - p.x;
      const dy = p.ty - p.y;
      const dist = Math.hypot(dx, dy);
      const step = p.speed * dt;

      if (dist <= step + 8) {
        const shooter =
          this.state.units.find(u => u.id === p.shooterId) ||
          this.state.buildings.find(b => b.id === p.shooterId) ||
          null;
        if (p.splash > 0) {
          this.addBurst(p.tx, p.ty, 5, '#fb923c', 9);
          for (const u of this.state.units) {
            if (u.team !== p.team && Math.hypot(u.x - p.tx, u.y - p.ty) <= p.splash + u.radius) {
              this.applyDamage(shooter, u, p.dmg);
            }
          }
          for (const b of this.state.buildings) {
            if (b.team !== p.team && Math.hypot(b.x - p.tx, b.y - p.ty) <= p.splash + b.radius) {
              this.applyDamage(shooter, b, p.dmg);
            }
          }
        } else if (p.target && p.target.hp > 0) {
          this.applyDamage(shooter, p.target, p.dmg);
          this.addBurst(p.tx, p.ty, 4, p.color, 5);
        }
        this.state.projectiles.splice(i, 1);
      } else {
        p.x += (dx / dist) * step;
        p.y += (dy / dist) * step;
        p.traveled += step;
        const prog = Math.max(0, Math.min(1, p.traveled / (p.totalDist || 100)));
        const groundH = this.getTerrainHeightAt(p.x, p.y);
        p.z = groundH + 4 + Math.sin(prog * Math.PI) * p.arcHeight;
      }
    }
  }

  public getTacticalDamageMultiplier(shooter: SimUnit | SimBuilding | null, target: SimUnit | SimBuilding): number {
    let mult = 1.0;
    if (!shooter || !target) return mult;

    if ('isUnit' in shooter && 'isUnit' in target) {
      const sType = shooter.type;
      const tType = target.type;
      const isArmored = tType === 'tank' || tType === 'apc';
      const isInfantry = tType === 'marine' || tType === 'trooper';

      if (sType === 'trooper' && isArmored) mult *= 1.45;
      if ((sType === 'marine' || sType === 'apc') && isInfantry) mult *= 1.35;
      else if (sType === 'marine' && tType === 'tank') mult *= 0.58;
    }

    if ('isUnit' in shooter && shooter.onHighGround && (!('isUnit' in target) || !target.onHighGround)) {
      mult *= 1.22;
    }
    if ('isUnit' in target && target.onHighGround && (!('isUnit' in shooter) || !shooter.onHighGround)) {
      mult *= 0.82;
    }

    return mult;
  }

  public applyDamage(shooter: SimUnit | SimBuilding | null, target: SimUnit | SimBuilding, dmg: number): void {
    if (!target || target.hp <= 0) return;
    const tacMult = this.getTacticalDamageMultiplier(shooter, target);
    let rem = Math.max(2, Math.round(dmg * tacMult));
    if (target.shield > 0) {
      const absorbed = Math.min(target.shield, rem);
      target.shield -= absorbed;
      rem -= absorbed;
    }
    target.hp -= rem;
    if (target.hp <= 0 && shooter && 'isUnit' in shooter) {
      shooter.kills = (shooter.kills || 0) + 1;
      if (shooter.kills === 3 && shooter.veteran < 1) {
        shooter.veteran = 1;
        shooter.maxHp = Math.round(shooter.maxHp * 1.15);
        shooter.hp = shooter.maxHp;
      }
    }
  }

  public addBurst(x: number, y: number, z: number, color: string, count = 8): void {
    if (this.state.particles.length > 140) return;
    this.state.particles.push({
      id: this.state.nextId++,
      x,
      y,
      z,
      vx: 0,
      vy: 0,
      vz: 0,
      r: 3,
      color,
      isRing: true,
      maxR: 16 + count * 1.2,
      life: 0.32,
      maxLife: 0.32
    });
    for (let i = 0; i < count; i++) {
      const ang = this.random() * Math.PI * 2;
      const spd = 18 + this.random() * 55;
      this.state.particles.push({
        id: this.state.nextId++,
        x,
        y,
        z: z + 2,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        vz: 20 + this.random() * 35,
        r: 1.5 + this.random() * 2,
        color: i % 2 === 0 ? color : '#fde047',
        life: 0.25 + this.random() * 0.25,
        maxLife: 0.5
      });
    }
  }

  public getFormationOffsets(units: SimUnit[], destX: number, destY: number) {
    const count = units.length;
    const offsets = new Map<number, { x: number; y: number }>();
    if (count === 0) return offsets;

    const avgX = units.reduce((s, u) => s + u.x, 0) / count;
    const avgY = units.reduce((s, u) => s + u.y, 0) / count;
    const moveAng = Math.atan2(destY - avgY, destX - avgX);
    const perpAng = moveAng + Math.PI / 2;

    const sorted = [...units].sort((a, b) => {
      const w = (u: SimUnit) => (u.type === 'tank' ? 1 : u.type === 'apc' ? 2 : 3);
      return w(a) - w(b);
    });

    sorted.forEach((u, idx) => {
      const rank = Math.floor((idx + 1) / 2);
      const side = idx === 0 ? 0 : idx % 2 === 1 ? 1 : -1;
      const forward = -rank * 22;
      const lateral = side * rank * 22;
      offsets.set(u.id, {
        x: Math.max(20, Math.min(SLICE_WORLD_W - 20, destX + Math.cos(moveAng) * forward + Math.cos(perpAng) * lateral)),
        y: Math.max(20, Math.min(SLICE_WORLD_H - 20, destY + Math.sin(moveAng) * forward + Math.sin(perpAng) * lateral))
      });
    });
    return offsets;
  }

  public issueMoveOrder(wx: number, wy: number, attackMove = false): number {
    const selected = this.state.units.filter(u => u.team === 'player' && u.selected && u.hp > 0);
    if (selected.length === 0) return 0;
    const formMap = this.getFormationOffsets(selected, wx, wy);
    for (const u of selected) {
      const pt = formMap.get(u.id) || { x: wx, y: wy };
      u.targetX = pt.x;
      u.targetY = pt.y;
      u.state = attackMove ? 'attackMove' : 'move';
      u.targetEntity = null;
    }
    this.addBurst(wx, wy, this.getTerrainHeightAt(wx, wy) + 1, attackMove ? '#f43f5e' : '#4ade80', 4);
    return selected.length;
  }

  public issueAttackTargetOrder(target: SimUnit | SimBuilding): number {
    const selected = this.state.units.filter(u => u.team === 'player' && u.selected && u.hp > 0);
    if (selected.length === 0) return 0;
    for (const u of selected) {
      u.state = 'attackTarget';
      u.targetEntity = target;
    }
    this.addBurst(target.x, target.y, this.getTerrainHeightAt(target.x, target.y) + 2, '#f43f5e', 5);
    return selected.length;
  }
}

function ryNorm(ly: number, ry: number): number {
  return (ly * ly) / (ry * ry);
}

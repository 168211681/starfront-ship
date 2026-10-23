// ============================================================================
// STARFRONT 3D — VERTICAL SLICE 001
// Module: src/core/specs.ts
// Reused & Adapted Unit, Weapon, Building, and Map Specifications from 2D Core
// ============================================================================

export type TeamId = 'player' | 'enemy' | 'bot2' | 'neutral';
export type DifficultyId = 'easy' | 'normal' | 'hard';
export type UnitType =
  | 'harvester'
  | 'supplyTruck'
  | 'marine'
  | 'trooper'
  | 'apc'
  | 'artillery'
  | 'tank'
  | 'fighter'
  | 'bomber'
  | 'mech'
  | 'hero';

export type BuildingType =
  | 'hq'
  | 'refinery'
  | 'supplyDepot'
  | 'barracks'
  | 'factory'
  | 'airfield'
  | 'radar'
  | 'turret'
  | 'reactor'
  | 'shieldDome'
  | 'silo';

export const WORLD_SCALE = 1.0;
export const VS_WORLD_W = 1200;
export const VS_WORLD_H = 800;
export const SLICE_WORLD_W = VS_WORLD_W;
export const SLICE_WORLD_H = VS_WORLD_H;

export const FIXED_DT = 1 / 60;
export const MAX_FRAME_DELTA = 0.25;
export const MAX_CATCHUP_STEPS = 24;
export const FIGHTER_SORTIE_COST = 180;

export interface FactionPalette {
  primary: number;
  accent: number;
  dark: number;
  hex: string;
  num: number;
  darkNum: number;
  trimNum: number;
  label: string;
}

export const FACTION_COLORS: Record<TeamId, FactionPalette> = {
  player: {
    primary: 0x0ea5e9,
    accent: 0x7dd3fc,
    dark: 0x0c4a6e,
    hex: '#0ea5e9',
    num: 0x0ea5e9,
    darkNum: 0x0c4a6e,
    trimNum: 0x7dd3fc,
    label: 'Aegis Federation (Player)'
  },
  enemy: {
    primary: 0xf43f5e,
    accent: 0xfda4af,
    dark: 0x881337,
    hex: '#f43f5e',
    num: 0xf43f5e,
    darkNum: 0x881337,
    trimNum: 0xfda4af,
    label: 'Crimson Dominion (Enemy)'
  },
  bot2: {
    primary: 0xf59e0b,
    accent: 0xfde68a,
    dark: 0x78350f,
    hex: '#f59e0b',
    num: 0xf59e0b,
    darkNum: 0x78350f,
    trimNum: 0xfde68a,
    label: 'Titan Syndicate (Bot 2)'
  },
  neutral: {
    primary: 0x94a3b8,
    accent: 0xcbd5e1,
    dark: 0x334155,
    hex: '#94a3b8',
    num: 0x94a3b8,
    darkNum: 0x334155,
    trimNum: 0xcbd5e1,
    label: 'Neutral Territory'
  }
};

export interface WeaponLoadoutSpec {
  id: string;
  name: string;
  shortLabel: string;
  reload: number;
  effectiveRange: number;
  maxRange: number;
  baseAcc: number;
  minAcc: number;
  dmg: number;
  splash: number;
  suppPerShot: number;
  projType: string;
  canTargetAir: boolean;
}

export const WEAPON_LOADOUTS: Record<string, WeaponLoadoutSpec> = {
  carbine: {
    id: 'carbine',
    name: 'M4A1 Carbine',
    shortLabel: 'M4A1 (0.14s)',
    reload: 0.14,
    effectiveRange: 135,
    maxRange: 185,
    baseAcc: 0.92,
    minAcc: 0.38,
    dmg: 7,
    splash: 0,
    suppPerShot: 4.5,
    projType: 'laser',
    canTargetAir: false
  },
  minigun: {
    id: 'minigun',
    name: 'M134 Minigun (3,000 RPM)',
    shortLabel: 'Minigun (0.04s)',
    reload: 0.04,
    effectiveRange: 130,
    maxRange: 195,
    baseAcc: 0.84,
    minAcc: 0.28,
    dmg: 2.6,
    splash: 0,
    suppPerShot: 3.2,
    projType: 'minigun',
    canTargetAir: true
  },
  sniper: {
    id: 'sniper',
    name: '.50 BMG Anti-Materiel',
    shortLabel: '.50 Sniper (1.55s)',
    reload: 1.55,
    effectiveRange: 230,
    maxRange: 290,
    baseAcc: 0.98,
    minAcc: 0.52,
    dmg: 72,
    splash: 0,
    suppPerShot: 24,
    projType: 'railgun',
    canTargetAir: false
  },
  javelin: {
    id: 'javelin',
    name: 'Javelin AT + Stinger AA',
    shortLabel: 'Javelin (1.25s)',
    reload: 1.25,
    effectiveRange: 180,
    maxRange: 235,
    baseAcc: 0.94,
    minAcc: 0.50,
    dmg: 44,
    splash: 28,
    suppPerShot: 18,
    projType: 'rocket',
    canTargetAir: true
  }
};

export interface UnitSpec {
  name: string;
  cost: number;
  supply: number;
  hp: number;
  shield?: number;
  speed: number;
  radius: number;
  minRange?: number;
  effectiveRange?: number;
  range: number;
  baseAcc?: number;
  minAcc?: number;
  dmg: number;
  splash?: number;
  reload: number;
  projType?: string;
  defaultKit?: string;
  canCustomizeWeapon?: boolean;
  canEntrench?: boolean;
  canSpecOps?: boolean;
  canTargetAir?: boolean;
  canGarrison?: boolean;
  cramRange?: number;
  flying?: boolean;
  isHarvester?: boolean;
  isSupplyTruck?: boolean;
  supplyAuraRadius?: number;
  isHero?: boolean;
  req: BuildingType | null;
  color: string;
  activeInVerticalSlice3D: boolean;
}

export const UNIT_SPECS: Record<UnitType, UnitSpec> = {
  harvester: {
    name: 'Trade Convoy',
    cost: 75,
    supply: 1,
    hp: 170,
    speed: 76,
    radius: 11,
    range: 40,
    dmg: 0,
    reload: 1.0,
    isHarvester: true,
    req: null,
    color: '#38bdf8',
    activeInVerticalSlice3D: false
  },
  supplyTruck: {
    name: 'Supply Truck',
    cost: 110,
    supply: 1,
    hp: 270,
    speed: 84,
    radius: 12,
    range: 200,
    dmg: 0,
    reload: 1.0,
    isSupplyTruck: true,
    supplyAuraRadius: 200,
    req: null,
    color: '#84cc16',
    activeInVerticalSlice3D: false
  },
  marine: {
    name: 'Rifle Infantry (M4A1)',
    cost: 90,
    supply: 1,
    hp: 155,
    speed: 78,
    radius: 9,
    effectiveRange: 135,
    range: 185,
    baseAcc: 0.92,
    minAcc: 0.38,
    dmg: 7,
    reload: 0.14,
    projType: 'laser',
    defaultKit: 'carbine',
    canCustomizeWeapon: true,
    canEntrench: true,
    canSpecOps: false,
    canTargetAir: false,
    canGarrison: true,
    req: null,
    color: '#22d3ee',
    activeInVerticalSlice3D: true
  },
  trooper: {
    name: 'AT/AA SpecOps Trooper',
    cost: 135,
    supply: 1,
    hp: 175,
    speed: 80,
    radius: 10,
    effectiveRange: 165,
    range: 215,
    baseAcc: 0.94,
    minAcc: 0.48,
    dmg: 38,
    splash: 24,
    reload: 1.05,
    projType: 'rocket',
    canCustomizeWeapon: false,
    canEntrench: false,
    canSpecOps: true,
    canTargetAir: true,
    canGarrison: true,
    req: 'barracks',
    color: '#fbbf24',
    activeInVerticalSlice3D: true
  },
  apc: {
    name: 'Stryker AA APC',
    cost: 180,
    supply: 2,
    hp: 340,
    speed: 92,
    radius: 13,
    effectiveRange: 155,
    range: 195,
    dmg: 24,
    reload: 0.40,
    projType: 'autocannon',
    canTargetAir: true,
    cramRange: 160,
    req: 'barracks',
    color: '#2dd4bf',
    activeInVerticalSlice3D: true
  },
  tank: {
    name: 'Titan MBT Tank',
    cost: 240,
    supply: 2,
    hp: 450,
    speed: 60,
    radius: 15,
    effectiveRange: 150,
    range: 185,
    dmg: 58,
    splash: 34,
    reload: 1.35,
    projType: 'cannon',
    canTargetAir: false,
    req: 'factory',
    color: '#0ea5e9',
    activeInVerticalSlice3D: true
  },
  artillery: {
    name: '155mm Howitzer (Deferred 3D)',
    cost: 310,
    supply: 3,
    hp: 340,
    speed: 52,
    radius: 16,
    minRange: 260,
    effectiveRange: 650,
    range: 850,
    baseAcc: 0.90,
    minAcc: 0.52,
    dmg: 132,
    splash: 75,
    reload: 3.4,
    projType: 'artillery',
    canTargetAir: false,
    req: 'factory',
    color: '#fb923c',
    activeInVerticalSlice3D: false
  },
  fighter: {
    name: 'F-22 Fighter (Deferred 3D)',
    cost: 180,
    supply: 2,
    hp: 290,
    speed: 138,
    radius: 14,
    effectiveRange: 180,
    range: 230,
    baseAcc: 0.94,
    minAcc: 0.55,
    dmg: 38,
    reload: 0.58,
    projType: 'missile',
    flying: true,
    canTargetAir: true,
    req: 'airfield',
    color: '#38bdf8',
    activeInVerticalSlice3D: false
  },
  bomber: {
    name: 'B-21 Bomber (Deferred 3D)',
    cost: 260,
    supply: 3,
    hp: 460,
    shield: 140,
    speed: 92,
    radius: 18,
    effectiveRange: 170,
    range: 220,
    baseAcc: 0.90,
    minAcc: 0.48,
    dmg: 145,
    splash: 80,
    reload: 2.15,
    projType: 'artillery',
    flying: true,
    canTargetAir: false,
    req: 'airfield',
    color: '#fb923c',
    activeInVerticalSlice3D: false
  },
  mech: {
    name: 'Goliath Mech (Deferred 3D)',
    cost: 380,
    supply: 3,
    hp: 820,
    shield: 220,
    speed: 54,
    radius: 18,
    range: 200,
    dmg: 85,
    splash: 45,
    reload: 1.15,
    projType: 'mechbeam',
    req: 'factory',
    color: '#c084fc',
    activeInVerticalSlice3D: false
  },
  hero: {
    name: 'Commander Prime (Deferred 3D)',
    cost: 600,
    supply: 3,
    hp: 1350,
    shield: 600,
    speed: 74,
    radius: 20,
    range: 215,
    dmg: 125,
    splash: 55,
    reload: 0.85,
    projType: 'mechbeam',
    isHero: true,
    req: null,
    color: '#facc15',
    activeInVerticalSlice3D: false
  }
};

export interface BuildingSpec {
  name: string;
  cost: number;
  hp: number;
  shield?: number;
  radius: number;
  powerGen: number;
  supplyGen: number;
  incomeGen: number;
  range?: number;
  dmg?: number;
  splash?: number;
  reload?: number;
  radarRadius?: number;
  domeRadius?: number;
  supplyHubRadius?: number;
  healAura?: boolean;
  activeInVerticalSlice3D: boolean;
}

export const BUILDING_SPECS: Record<BuildingType, BuildingSpec> = {
  hq: {
    name: 'Command HQ',
    cost: 400,
    hp: 1800,
    radius: 34,
    powerGen: 20,
    supplyGen: 14,
    incomeGen: 8,
    activeInVerticalSlice3D: true
  },
  barracks: {
    name: 'Infantry Barracks',
    cost: 160,
    hp: 750,
    radius: 25,
    powerGen: -3,
    supplyGen: 6,
    incomeGen: 0,
    activeInVerticalSlice3D: true
  },
  factory: {
    name: 'Armor Factory',
    cost: 260,
    hp: 980,
    radius: 28,
    powerGen: -6,
    supplyGen: 6,
    incomeGen: 0,
    activeInVerticalSlice3D: true
  },
  turret: {
    name: 'Laser Defense Turret',
    cost: 150,
    hp: 620,
    radius: 18,
    powerGen: -4,
    supplyGen: 0,
    incomeGen: 0,
    range: 205,
    dmg: 42,
    reload: 0.85,
    activeInVerticalSlice3D: true
  },
  refinery: {
    name: 'Trade Hub',
    cost: 140,
    hp: 680,
    radius: 26,
    powerGen: 6,
    supplyGen: 0,
    incomeGen: 9,
    activeInVerticalSlice3D: false
  },
  supplyDepot: {
    name: 'Supply Depot',
    cost: 150,
    hp: 760,
    radius: 24,
    powerGen: 4,
    supplyGen: 8,
    incomeGen: 4,
    supplyHubRadius: 360,
    activeInVerticalSlice3D: false
  },
  airfield: {
    name: 'Airfield',
    cost: 280,
    hp: 1050,
    radius: 32,
    powerGen: -6,
    supplyGen: 6,
    incomeGen: 0,
    activeInVerticalSlice3D: false
  },
  radar: {
    name: 'AESA Radar Station',
    cost: 200,
    hp: 1250,
    radius: 34,
    powerGen: -5,
    supplyGen: 6,
    incomeGen: 0,
    radarRadius: 1200,
    activeInVerticalSlice3D: false
  },
  reactor: {
    name: 'Fusion Reactor',
    cost: 130,
    hp: 580,
    radius: 22,
    powerGen: 12,
    supplyGen: 10,
    incomeGen: 0,
    healAura: true,
    activeInVerticalSlice3D: false
  },
  shieldDome: {
    name: 'Shield Dome',
    cost: 220,
    hp: 850,
    shield: 650,
    radius: 24,
    powerGen: -5,
    supplyGen: 0,
    incomeGen: 0,
    domeRadius: 210,
    activeInVerticalSlice3D: false
  },
  silo: {
    name: 'Missile Silo',
    cost: 340,
    hp: 900,
    shield: 250,
    radius: 26,
    powerGen: -8,
    supplyGen: 0,
    incomeGen: 0,
    range: 950,
    dmg: 220,
    splash: 90,
    reload: 8.5,
    activeInVerticalSlice3D: false
  }
};

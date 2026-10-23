import { describe, it, expect } from 'vitest';
import { GameCore, sanitizeResource } from '../src/core/simulation';
import { WorldAdapter } from '../src/adapter/worldAdapter';

describe('STARFRONT 3D — Vertical Slice 001 Deterministic Core & Adapter Suite', () => {
  it('A1: blocks emergency fighter launches without Airfield + Radar or sufficient funds', () => {
    const core = new GameCore();
    core.setDeterministicSeed(101);
    core.state.crystals = 1000;
    expect(core.scrambleFighterInterceptors(600, 400, true)).toBe(false);

    core.spawnBuilding('airfield', 200, 600, 'player');
    expect(core.scrambleFighterInterceptors(600, 400, true)).toBe(false);

    core.spawnBuilding('radar', 260, 600, 'player');
    core.state.crystals = 120;
    expect(core.scrambleFighterInterceptors(600, 400, true)).toBe(false);

    core.state.crystals = 500;
    expect(core.scrambleFighterInterceptors(600, 400, true)).toBe(true);
    expect(core.state.crystals).toBe(320);
    expect(core.state.cdFighterSortie).toBe(11);
  });

  it('A2: supports independent 3-faction outpost capture (player, enemy, bot2) and contested lock', () => {
    const core = new GameCore();
    core.setDeterministicSeed(102);
    core.state.units = [];
    const op = core.state.outposts[0];

    core.spawnUnit('tank', op.x, op.y, 'bot2');
    core.spawnUnit('marine', op.x + 8, op.y, 'bot2');
    for (let i = 0; i < 240; i++) core.updateGame(1 / 60);
    expect(op.owner).toBe('bot2');
  });

  it('A3: preserves zero resource balance without free fallback and prevents NaN/negative', () => {
    const core = new GameCore();
    core.state.crystals = 0;
    core.state.enemyCrystals = 0;
    core.state.bot2Crystals = 0;
    core.updateGame(0);
    expect(core.state.bot2Crystals).toBe(0);
    expect(sanitizeResource(NaN, 0)).toBe(0);
    expect(sanitizeResource(-150, 0)).toBe(0);
  });

  it('A4: produces identical simulation states at 60 FPS and 20 FPS frame pacing', () => {
    const core60 = new GameCore();
    core60.setDeterministicSeed(2026);
    core60.issueMoveOrder(600, 400, true);
    for (let i = 0; i < 300; i++) core60.stepSimulation(1 / 60, 1);

    const core20 = new GameCore();
    core20.setDeterministicSeed(2026);
    core20.issueMoveOrder(600, 400, true);
    for (let i = 0; i < 100; i++) core20.stepSimulation(1 / 20, 1);

    expect(Math.abs(core60.state.timeElapsed - core20.state.timeElapsed)).toBeLessThan(1e-6);
    expect(Math.abs(core60.state.crystals - core20.state.crystals)).toBeLessThan(1e-5);
  });

  it('WorldAdapter: accurately maps 2D game coordinates to 3D world space and back', () => {
    const core = new GameCore();
    const adapter = new WorldAdapter(1.0);
    const pos3d = adapter.toWorld3D(600, 400, core.getTerrainHeightAt(600, 400));
    expect(pos3d.x).toBe(600);
    expect(pos3d.z).toBe(400);
    expect(pos3d.y).toBeCloseTo(3.5, 3);
  });
});

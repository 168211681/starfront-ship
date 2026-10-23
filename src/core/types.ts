// ============================================================================
// STARFRONT 3D — VERTICAL SLICE 001
// Module: src/core/types.ts
// Non-protected presentation / HUD type surface.
// Re-exports authoritative Game Core types from specs.ts and defines
// QualityPreset for the renderer / HUD (not part of the protected Game Core).
// ============================================================================

export type { UnitType, BuildingType, TeamId, DifficultyId } from './specs';

/** Mobile graphics quality preset used by BattlefieldScene3D and the tactical HUD. */
export type QualityPreset = 'eco' | 'balanced' | 'quality';

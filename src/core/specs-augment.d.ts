// ============================================================================
// STARFRONT 3D — R2.1 recovery ambient aliases
// simulation.ts (protected) imports FactionId / OutpostOwner from ./specs,
// while the protected specs.ts exports TeamId. This ambient module
// augmentation restores the missing type aliases without modifying the
// protected Game Core byte-for-byte.
// ============================================================================

export {};

declare module './specs' {
  /** Alias of TeamId — used by protected simulation.ts */
  export type FactionId = 'player' | 'enemy' | 'bot2' | 'neutral';
  /** Outpost ownership includes all TeamId values (incl. neutral) */
  export type OutpostOwner = 'player' | 'enemy' | 'bot2' | 'neutral';
}

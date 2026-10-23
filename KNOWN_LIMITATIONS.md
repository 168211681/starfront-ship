# KNOWN LIMITATIONS & RISKS — VERTICAL SLICE 001

## 1. Environment & Tooling Limitations
- **Sandbox Outbound Network & Package Registry Restriction**: The build VM environment has no outbound internet access and does not have `tsc`, `vite`, or `vitest` pre-installed globally.
  - **Mitigation Implemented**: Full `package.json`, `tsconfig.json`, `vite.config.ts`, and `tests/core.test.ts` are provided for standard local development, alongside a zero-dependency Node.js transpiler/bundler (`scripts/build-standalone.mjs`) and deterministic Node test runner (`tests/run-tests.mjs`) that compile and verify the exact TypeScript source files inside the sandbox.
- **Physical iPhone Safari Device Testing**: No physical iPhone hardware is attached to the headless Linux VM.
  - **Status**: Physical iPhone Safari FPS, thermal, and battery measurements are marked **NOT RUN** in `TEST_RESULTS.md`. Automated headless Chromium WebGL2 smoke tests and desktop/mobile-viewport touch-simulation checks were executed instead.

## 2. Intentionally Deferred Systems (Vertical Slice 001 Stop Condition)
Per the Vertical Slice 001 specification, the following systems from the 2D prototype are intentionally excluded from the 3D renderer until Milestone 002 approval:
- **Full 7800 × 5400 Continental Map & 6 Geopolitical Sectors**: Vertical Slice 001 uses a focused `1200 × 800` 3-faction test map.
- **3D Air Warfare Sorties (`Fighter` CAP & `Bomber` Carpet-Bombing visuals)**: Authoritative validation logic (`canLaunchFighterSortie`, `scrambleFighterInterceptors`) is implemented and tested in `GameCore`, while 3D aircraft mesh rendering is deferred.
- **155mm Artillery Fire Base (FOB) & Radio Call-For-Fire (CFF)**: Specs are retained in `src/core/specs.ts`; 3D artillery emplacement visuals are deferred.
- **Navy SEAL Blackhawk Helicopter Rooftop Raids & Urban Building Garrisoning**: Deferred to Milestone 002.
- **Orbital Laser Strike, HOI4 Economic Warfare Laws, and Harvester Trade Convoys**: Deferred to Milestone 002; Vertical Slice 001 uses passive GDP + Outpost capture income for streamlined tactical combat evaluation.

## 3. Technical Risks for Full-Scale Migration
- **Draw Call Scaling at 200+ Units**: Vertical Slice 001 uses shared `BufferGeometry` and shared `MeshLambertMaterial` instances across hierarchical unit rigs (so turrets and barrels can rotate independently). Migrating to the full `7800 × 5400` map with 200+ simultaneous units should convert static hull/infantry sub-parts to `THREE.InstancedMesh` with custom instance attribute matrices for turret yaw.
- **Offline Standalone vs Official Production**: `npm run build:standalone` embeds the isolated WebGL2 shim (`src/vendor/three-webgl2.js`) into `dist/standalone-shim.html` for air-gapped / mocked-DOM tests only. It never writes into `node_modules/three`. Official R2.1 production proof requires `npm run build:vite` with npm `three@0.160.0`.
- **Physical iPhone thermal / sustained FPS**: Still **NOT RUN** until validated on a real device (`npm run preview:iphone` prepares HTTPS LAN serving of the Vite dist).

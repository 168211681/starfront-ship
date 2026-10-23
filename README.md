# STARFRONT: Pocket Command 3D — Vertical Slice 001 (R2.1)

Playable mobile-first 3D tactical RTS vertical slice. Authoritative deterministic Game Core + Three.js WebGL2 renderer.

**Release Gate R2.1:** see [`RELEASE_GATE_R2_1.md`](./RELEASE_GATE_R2_1.md). Official Three.js production + automated browser verification are **PASS**. Physical iPhone Safari QA remains **NOT RUN**.

**R2.2.3:** `BattlefieldScene3D` marks dirty `InstancedMesh` matrix and color attributes `needsUpdate` immediately before each `renderer.render()`, so unit motion is uploaded to the GPU instead of remaining in the CPU instance arrays.

## Architecture

1. **Game Core** (`src/core/specs.ts`, `src/core/simulation.ts`) — deterministic 60 Hz sim; no Three.js dependency  
2. **World Adapter** (`src/adapter/worldAdapter.ts`) — 2D→3D mapping + interpolation  
3. **Renderer** (`src/render/*`) — official `three@0.160.0` WebGL2 + hardware instancing  
4. **Input** (`src/input/inputController.ts`) — pointer, pinch, two-finger rotate  
5. **HUD / boot** (`index.html`, `src/boot.ts`, `src/main.ts`) — iPhone-safe HUD + WebGL warm-up before official renderer boot  

Protected Game Core files are byte-locked (see release gate matrix).

## Official production (required for R2.1)

```bash
npm ci
npx --no-install tsc --noEmit
npm run build:vite
node scripts/verify-official-three.mjs   # must print verdict PASS
npm test                                # deterministic + shim + offline suites
npm run test:input                      # touch and pointer gesture regression
npm run test:gpu                        # InstancedMesh GPU upload regression
npm run test:browser                    # headless Chrome vs Vite dist/
```

Dev server (uncommon port):

```bash
npm run dev    # http://127.0.0.1:3847
```

## Offline / air-gapped standalone (NOT official Three.js proof)

```bash
npm run build:standalone
# Writes dist/standalone-shim.html + dist/offline-shim/three/
# Does NOT modify node_modules/three
```

## iPhone Safari LAN preview

After `npm run build:vite`:

```bash
npm run preview:iphone
```

Serves `dist/` over ephemeral HTTPS for a device on the same LAN. Thermal / sustained-FPS validation is **NOT RUN** until performed on physical hardware.

## Scripts

| Script | Purpose |
|--------|---------|
| `build:vite` | Official production build (npm `three@0.160.0`) |
| `verify:official-three` | Import-graph / package proof |
| `test` / `test:core` / `test:shim` / `test:offline` | Separated Node test suites |
| `test:browser` | Real Chromium WebGL2 verification |
| `build` / `build:standalone` | Offline shim IIFE only |

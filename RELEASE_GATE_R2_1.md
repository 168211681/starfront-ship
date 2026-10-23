# STARFRONT 3D — Release Gate R2.1 Status Matrix

**Generated:** 2026-10-23 (Asia/Bangkok)  
**Project version:** `0.1.3-r2.1`  
**Protected Game Core SHA-256 (unchanged):**

| File | SHA-256 |
|------|---------|
| `src/core/simulation.ts` | `3b1ac30fc8353b1d1dfcfa56f323960f73c97779818d957abe888a08f1f56a2d` |
| `src/core/specs.ts` | `e2a0d9c62e3bb6e11bf0d71db7e466a5797a2cdda375c5bf2dfe7461316650a5` |
| `src/adapter/worldAdapter.ts` | `b7e04c44e3f941a073478d36f2734c6f40c49647debd1eb0d3e5605cd952861f` |

---

## Gate Matrix

| Gate | Status | Evidence |
|------|--------|----------|
| ZIP / source integrity | **PASS** | Regenerated lockfile + Game Core hash lock |
| Missing `./core/types` import | **PASS** | `src/core/types.ts` re-exports specs + defines `QualityPreset` |
| `package-lock.json` official registry | **PASS** | Regenerated via `npm install` from `registry.npmjs.org` |
| Standalone build does not overwrite `node_modules/three` | **PASS** | Shim isolated under `dist/offline-shim/three/` + `src/vendor/` |
| TypeScript `tsc --noEmit` | **PASS** | `artifacts/logs/tsc-noEmit.log` (0 errors) |
| Vite production build (`npm run build:vite`) | **PASS** | `artifacts/logs/vite-build.log` |
| Official `three@0.160.0` installed | **PASS** | `npm ls three` → `three@0.160.0` |
| Official Three.js import graph / no CDN / no shim in Vite dist | **PASS** | `artifacts/official-three-proof.json` → `verdict: PASS` |
| Deterministic Game Core tests | **PASS** | 11/11 core suite (`artifacts/deterministic-test-results.json`) |
| Offline shim compatibility tests | **PASS** | TEST-11 |
| Offline standalone mocked-DOM tests | **PASS** | TEST-12 |
| Automated headless Chromium WebGL2 browser verification (official Vite dist) | **PASS** | 14/14 assertions incl. official provenance; `dist/browser-verify-evidence.json` |
| Browser screenshots | **PASS** | `artifacts/screenshots/*.png` |
| Physical iPhone Safari release QA (thermal / sustained FPS) | **NOT RUN** | Requires physical hardware — see Phase 4 readiness below |
| **R2.1 OVERALL** | **BLOCKED** | Physical iPhone Safari QA still **NOT RUN** (policy: cannot mark R2.1 PASS without it) |

---

## Official Three.js production proof (summary)

- Resolved version: `0.160.0`
- `node_modules/three/build/three.module.js` present
- `isCustomWebGL2Shim`: `false`
- Vite import graph: `usesOfficialThree: true`, `customShimModuleCount: 0`
- External CDN in `dist/index.html`: `false`
- Browser runtime `threeRevision`: `"160"` (`isCustomShim: false`)

---

## Phase 4 — iPhone readiness (prepared; device QA NOT RUN)

Maintained in production artifact / `index.html`:

- Portrait + landscape via `viewport-fit=cover` and flexible HUD layout
- Touch controls / pinch zoom / two-finger rotation (`InputController3D`)
- Safe-area insets (`env(safe-area-inset-*)`) on HUD chrome
- BALANCED and ECO graphics presets (`BattlefieldScene3D.setQualityPreset`)
- HTTPS LAN preview helper: `npm run preview:iphone`

**Still NOT RUN on physical hardware:** thermal throttling, sustained FPS, real Safari WebGL2 longevity.

---

## How to reproduce

```bash
npm ci
npx --no-install tsc --noEmit
npm run build:vite
node scripts/verify-official-three.mjs
npm test                  # core + shim + offline suites
npm run test:browser      # official Vite dist in headless Chrome
```

# STARFRONT 3D — Test Results (R2.1 Recovery)

## Deterministic / compatibility (`npm test`)

**Result: 13/13 PASS**

| Suite | Tests | Status |
|-------|-------|--------|
| Deterministic Game Core | TEST-01 … TEST-10 + TEST-10b (11) | PASS |
| Offline WebGL2 shim API | TEST-11 (1) | PASS |
| Offline standalone mocked DOM | TEST-12 (1) | PASS |

Machine-readable: `artifacts/deterministic-test-results.json`

## Official Three.js proof

**Result: PASS** — `artifacts/official-three-proof.json`

## Browser verification (official Vite production artifact)

**Result: PASS** — 14 assertions (incl. official Three provenance `threeRevision: "160"`, `isCustomShim: false`)

Evidence: `dist/browser-verify-evidence.json`  
Screenshots: `artifacts/screenshots/`

## Physical iPhone Safari

**Result: NOT RUN** (no physical hardware in this environment)

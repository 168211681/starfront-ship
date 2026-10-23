# STARFRONT R2.2.2 — Touch Input Refactor (Preview Candidate)

Status: **local candidate; physical iPhone 17 Safari test required**. Do not
merge or promote to production until the phone confirms that movement works.

## Why R2.2.1 could still fail on Safari

The old controller used numeric `Touch.identifier` to look up a
`PointerEvent.pointerId`. The two ID spaces are independent. If Safari emitted
`pointerdown(id=42)` and later `touchend(identifier=917)`, the fallback rejected
the touch and never called `issueMoveOrder`.

R2.2.2 uses a contact state machine with namespaced IDs (`t:917`, `p:42`).
TouchEvents become the authoritative stream as soon as `touchstart` arrives;
the provisional pointer contact is discarded without issuing an order. A
pointer-only path remains for desktop and for browsers that lack TouchEvents.
If a browser emits pointerdown then touchend with no touchstart, the fallback
completes the unique provisional finger **without comparing numeric IDs**.

Other changes:

- Empty-terrain drag with selected units preserves the selection and issues a
  destination order; real drag-box over friendlies still selects those units.
- Pan mode never dispatches a move order, even on a stationary tap.
- Ground rays use `clientX/clientY - getBoundingClientRect()` in the same CSS
  viewport coordinate space; no extra `visualViewport` offset is added.
- The collapsed Diag HUD gains Touch start/end/cancel and last-gesture fields.
- Source and standalone tests are versioned `0.1.6-r2.2.2`.

## Local verification

- `npm run typecheck` PASS.
- `npm test` 13/13 PASS.
- `npm run test:input` 8/8 PASS, running the real TypeScript controller
  through isolated event listeners.
- `npm run build:vite` PASS.
- `npm run verify:official-three` PASS (Three.js 0.160.0; no offline shim).
- `npm run test:browser` **18/18 PASS** on this host (Google Chrome 156,
  SwiftShader). Includes CDP `Input.dispatchTouchEvent` Army-move, single
  unit, Attack-Move, pan/pinch, dock scroll, pause/play, and independent
  Touch.identifier vs PointerEvent.pointerId ownership.
- Physical iPhone 17 Safari **NOT VERIFIED**.

## iPhone smoke gate (on NEW preview URL only)

1. Tap **Army**, then tap or slightly drag on empty terrain. The toast must
   say `Moving N units` and tank hulls must visibly move.
2. Select one tank and tap ground. Only that unit should move.
3. Tap **Attack** then ground. Attack-move should work.
4. Tap **Pan**, drag or stationary tap. Camera gesture must not order a move.
5. Two-finger pinch must zoom. Bottom row swipes must scroll commands, not page.
6. Repeat movement in landscape and verify Pause/Play.
7. If something fails, open **Diag**. Compare Touch start/end/cancel, last
   gesture, selected count, world hit, move orders, and unit position delta.

Only deploy as **Vercel Preview**, never with `--prod`. Protected GameCore files
must remain byte-for-byte unchanged.

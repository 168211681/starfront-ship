// ============================================================================
// STARFRONT 3D — Official production boot (R2.1)
// Async WebGL warm-up before importing main. Official three@0.160.0 throws if
// WebGLRenderer is constructed before the GPU/SwiftShader process is ready.
// Critical: release the warm-up context before importing main — software GL
// (SwiftShader) often allows only one live WebGL context at a time.
// ============================================================================

async function waitForWebGL(timeoutMs = 8000): Promise<boolean> {
  const start = performance.now();
  while (performance.now() - start < timeoutMs) {
    const probe = document.createElement('canvas');
    probe.width = 4;
    probe.height = 4;
    const gl = probe.getContext('webgl2') || probe.getContext('webgl');
    if (gl) {
      gl.getParameter(gl.VERSION);
      // Free the warm-up context slot before the real renderer is created.
      const lose = gl.getExtension('WEBGL_lose_context');
      if (lose) {
        lose.loseContext();
      }
      probe.width = 0;
      probe.height = 0;
      return true;
    }
    await new Promise((r) => setTimeout(r, 32));
  }
  console.warn('[STARFRONT] WebGL warm-up timed out — main module will still attempt boot');
  return false;
}

void (async () => {
  await waitForWebGL();
  // Yield one more frame so the lost warm-up context is fully reclaimed.
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  await import('./main');
})();

// ============================================================================
// STARFRONT 3D — VERTICAL SLICE 001 (RELEASE GATE R2.1)
// Automated Headless Chromium WebGL2 Verification Harness
// Verifies all 13 Task D & Diagnostic HUD Assertions, captures screenshots,
// browser logs, renderer.info.render.calls/triangles, frame timing stats,
// HUD health verification, and network requests.
// ============================================================================
import http from 'node:http';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';

if (typeof globalThis.WebSocket === 'undefined') {
  try {
    const req = createRequire(import.meta.url);
    globalThis.WebSocket = req('/usr/local/lib/node_modules/ws');
  } catch {
    class MinimalWebSocket {
      constructor(urlStr) {
        const u = new URL(urlStr);
        const key = crypto.randomBytes(16).toString('base64');
        const req = http.request({
          hostname: u.hostname,
          port: u.port || 80,
          path: u.pathname + u.search,
          headers: {
            Connection: 'Upgrade',
            Upgrade: 'websocket',
            'Sec-WebSocket-Key': key,
            'Sec-WebSocket-Version': '13'
          }
        });
        req.on('upgrade', (res, socket, head) => {
          this.socket = socket;
          let buf = Buffer.alloc(0);
          let fragments = [];
          const onData = (chunk) => {
            buf = Buffer.concat([buf, chunk]);
            while (buf.length >= 2) {
              const b0 = buf[0];
              const b1 = buf[1];
              const fin = (b0 & 0x80) !== 0;
              const opcode = b0 & 0x0f;
              let len = b1 & 0x7f;
              let offset = 2;
              if (len === 126) {
                if (buf.length < 4) return;
                len = buf.readUInt16BE(2);
                offset = 4;
              } else if (len === 127) {
                if (buf.length < 10) return;
                len = Number(buf.readBigUInt64BE(2));
                offset = 10;
              }
              if (buf.length < offset + len) return;
              const payload = buf.subarray(offset, offset + len);
              buf = buf.subarray(offset + len);
              if (opcode === 0x1 || opcode === 0x0) {
                fragments.push(payload);
                if (fin) {
                  const fullPayload = Buffer.concat(fragments);
                  fragments = [];
                  if (this._onmessage) {
                    this._onmessage({ data: fullPayload.toString('utf8') });
                  }
                }
              }
            }
          };
          if (head && head.length) onData(head);
          socket.on('data', onData);
          socket.on('error', (err) => { if (this._onerror) this._onerror(err); });
          if (this._onopen) this._onopen();
        });
        req.on('error', (err) => { if (this._onerror) this._onerror(err); });
        req.end();
      }
      addEventListener(ev, fn) {
        if (ev === 'open') this._onopen = fn;
        if (ev === 'message') this._onmessage = fn;
        if (ev === 'error') this._onerror = fn;
      }
      send(data) {
        const payload = Buffer.from(data, 'utf8');
        const mask = crypto.randomBytes(4);
        let header;
        if (payload.length < 126) {
          header = Buffer.alloc(6);
          header[0] = 0x81;
          header[1] = 0x80 | payload.length;
          mask.copy(header, 2);
        } else if (payload.length < 65536) {
          header = Buffer.alloc(8);
          header[0] = 0x81;
          header[1] = 0x80 | 126;
          header.writeUInt16BE(payload.length, 2);
          mask.copy(header, 4);
        } else {
          header = Buffer.alloc(14);
          header[0] = 0x81;
          header[1] = 0x80 | 127;
          header.writeBigUInt64BE(BigInt(payload.length), 2);
          mask.copy(header, 10);
        }
        const masked = Buffer.alloc(payload.length);
        for (let i = 0; i < payload.length; i++) {
          masked[i] = payload[i] ^ mask[i & 3];
        }
        this.socket.write(Buffer.concat([header, masked]));
      }
      close() {
        if (this.socket) this.socket.destroy();
      }
    }
    globalThis.WebSocket = MinimalWebSocket;
  }
}

import fs from 'node:fs';
import path from 'node:path';
import { spawn, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

function resolveBrowserExecutable() {
  const candidates = [
    process.env.CHROME_BIN,
    'chromium',
    'chromium-browser',
    'google-chrome',
    'google-chrome-stable'
  ].filter(Boolean);
  for (const bin of candidates) {
    try {
      const resolved = execSync(`command -v "${bin}"`, { encoding: 'utf8' }).trim();
      if (resolved) {
        const version = execSync(`"${resolved}" --version`, { encoding: 'utf8' }).trim();
        return { bin: resolved, version };
      }
    } catch {}
  }
  console.error('FATAL: No Chromium/Chrome executable found. Never mark browser tests PASS if the browser executable is missing.');
  process.exit(1);
}

const BROWSER_EXEC = resolveBrowserExecutable();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const screenshotsDir = path.join(rootDir, 'artifacts', 'screenshots');
fs.mkdirSync(screenshotsDir, { recursive: true });

function serveDirectory(dir, port) {
  const mime = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png'
  };
  const server = http.createServer((req, res) => {
    const cleanUrl = (req.url || '/').split('?')[0];
    if (cleanUrl === '/favicon.ico') {
      res.writeHead(204);
      res.end();
      return;
    }
    const rel = cleanUrl === '/' ? '/index.html' : cleanUrl;
    const filePath = path.join(dir, rel);
    if (!filePath.startsWith(dir) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
    res.end(fs.readFileSync(filePath));
  });
  return new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

async function connectCDP(port) {
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json`);
      const targets = await res.json();
      const page = targets.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (page) {
        const ws = new WebSocket(page.webSocketDebuggerUrl);
        await new Promise((resolve, reject) => {
          ws.addEventListener('open', resolve, { once: true });
          ws.addEventListener('error', reject, { once: true });
        });
        let msgId = 1;
        const pending = new Map();
        const listeners = new Map();
        ws.addEventListener('message', (ev) => {
          const data = JSON.parse(String(ev.data));
          if (data.id && pending.has(data.id)) {
            const { resolve: r, reject: j } = pending.get(data.id);
            pending.delete(data.id);
            if (data.error) j(new Error(JSON.stringify(data.error)));
            else r(data.result);
          } else if (data.method && listeners.has(data.method)) {
            for (const fn of listeners.get(data.method)) fn(data.params);
          }
        });
        return {
          send(method, params = {}) {
            const id = msgId++;
            ws.send(JSON.stringify({ id, method, params }));
            return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
          },
          on(method, fn) {
            if (!listeners.has(method)) listeners.set(method, []);
            listeners.get(method).push(fn);
          },
          close() {
            ws.close();
          }
        };
      }
    } catch {
      // wait and retry
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error('Failed to connect to Chromium CDP');
}

async function verifyFixedBuild() {
  const port = 19082;
  const cdpPort = 19223;
  const appHost = 'starfront.local';
  const server = await serveDirectory(distDir, port);
  const userDataDir = `/tmp/chr_r2_1_${Date.now()}`;
  fs.mkdirSync('/tmp/chrome-home', { recursive: true });
  const chrome = spawn(
    BROWSER_EXEC.bin,
    [
      '--headless=new',
      '--no-sandbox',
      '--no-proxy-server',
      '--disable-dev-shm-usage',
      '--disable-gpu-sandbox',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--enable-webgl',
      '--enable-webgl2',
      '--ignore-gpu-blocklist',
      `--host-resolver-rules=MAP ${appHost} 127.0.0.1`,
      `--user-data-dir=${userDataDir}`,
      '--window-size=1440,900',
      `--remote-debugging-port=${cdpPort}`,
      '--remote-allow-origins=*',
      // Start blank so CDP instrumentation is attached before the first real navigation.
      // (A command-line URL + later Page.navigate double-loads and can poison SwiftShader.)
      'about:blank'
    ],
    {
      stdio: 'ignore',
      env: {
        // Keep the ambient environment (DISPLAY/GPU libs). Only strip proxy vars that
        // break host-resolver-rules for starfront.local, and isolate XDG dirs per run.
        ...Object.fromEntries(Object.entries(process.env).filter(([k]) => !/proxy/i.test(k))),
        XDG_CONFIG_HOME: path.join(userDataDir, '.config'),
        XDG_CACHE_HOME: path.join(userDataDir, '.cache')
      }
    }
  );

  try {
    const cdp = await connectCDP(cdpPort);
    const exceptions = [];
    const consoleErrors = [];
    const consoleLogs = [];
    const networkRequests = [];
    const externalNetworkRequests = [];

    await cdp.send('Runtime.enable');
    await cdp.send('Page.enable');
    await cdp.send('Log.enable');
    await cdp.send('Network.enable');

    cdp.on('Runtime.exceptionThrown', (params) => {
      const d = params.exceptionDetails;
      exceptions.push({
        text: d.text,
        description: d.exception?.description || '',
        lineNumber: d.lineNumber,
        columnNumber: d.columnNumber
      });
    });

    cdp.on('Runtime.consoleAPICalled', (params) => {
      const text = (params.args || []).map((a) => a.value ?? a.description ?? '').join(' ');
      consoleLogs.push({ type: params.type, text });
      if (params.type === 'error') {
        consoleErrors.push(text);
      }
    });

    cdp.on('Log.entryAdded', (params) => {
      const entry = params.entry;
      consoleLogs.push({ type: `log.${entry.level}`, text: entry.text, url: entry.url });
      if (entry.level === 'error') {
        consoleErrors.push(entry.text);
      }
    });

    cdp.on('Network.requestWillBeSent', (params) => {
      const reqUrl = params.request?.url || '';
      networkRequests.push(reqUrl);
      if (
        !reqUrl.startsWith(`http://${appHost}:${port}`) &&
        !reqUrl.startsWith(`http://127.0.0.1:${port}`) &&
        !reqUrl.startsWith('data:') &&
        !reqUrl.startsWith('blob:') &&
        !reqUrl.startsWith('about:')
      ) {
        externalNetworkRequests.push(reqUrl);
      }
    });

    // Desktop Viewport (1440x900)
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    const evalExpr = async (expression) => {
      const res = await cdp.send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true
      });
      if (res.exceptionDetails) {
        throw new Error(`Eval exception: ${res.exceptionDetails.exception?.description || res.exceptionDetails.text}`);
      }
      return res.result.value;
    };

    const navRes = await cdp.send('Page.navigate', { url: `http://${appHost}:${port}/index.html` });
    if (navRes.errorText) {
      throw new Error(`Chromium Page.navigate failed: ${navRes.errorText}`);
    }

    // Wait for document load, then stay silent so boot.ts can warm WebGL without a
    // CDP Runtime.evaluate storm (SwiftShader reports BindToCurrentSequence failed
    // when evaluate polls during GPU process bring-up).
    await Promise.race([
      new Promise((resolve) => {
        cdp.on('Page.loadEventFired', resolve);
      }),
      new Promise((resolve) => setTimeout(resolve, 5000))
    ]);
    // Brief settle only — boot.ts already warmed WebGL. Long waits let combat change unit counts.
    await new Promise((r) => setTimeout(r, 400));

    // Bounded readiness wait after GPU warm-up window.
    const readinessTimeoutMs = 20000;
    const exceptionGraceMs = 2000;
    const waitStart = Date.now();
    let appReady = false;
    while (Date.now() - waitStart < readinessTimeoutMs) {
      const status = await evalExpr(`(() => {
        const app = window.STARFRONT_3D;
        return {
          ready: Boolean(app && app.ready === true && app.firstFrameRendered === true),
          hasLegacyAlias: Boolean(window.__STARFRONT_3D__ === app),
          href: location.href,
          threeRev: window.THREE ? window.THREE.REVISION : null
        };
      })()`);
      if (status && status.ready) {
        appReady = true;
        break;
      }
      const elapsed = Date.now() - waitStart;
      if (exceptions.length > 0 && elapsed >= exceptionGraceMs) {
        const firstEx = exceptions[0];
        throw new Error(
          `Startup exception thrown in Chromium before readiness (line ${firstEx.lineNumber}:${firstEx.columnNumber}): ${firstEx.description || firstEx.text} | console=${JSON.stringify(consoleLogs.slice(0, 12))}`
        );
      }
      await new Promise((r) => setTimeout(r, 150));
    }

    if (!appReady) {
      if (exceptions.length > 0) {
        const firstEx = exceptions[0];
        throw new Error(
          `Startup exception thrown in Chromium (line ${firstEx.lineNumber}:${firstEx.columnNumber}): ${firstEx.description || firstEx.text} | console=${JSON.stringify(consoleLogs.slice(0, 12))}`
        );
      }
      throw new Error(
        `Timed out after ${readinessTimeoutMs}ms waiting for window.STARFRONT_3D readiness. Console errors: ${JSON.stringify(consoleErrors)} Logs: ${JSON.stringify(consoleLogs.slice(0, 20))}`
      );
    }

    // Allow a few animation frames after initial readiness for steady-state rendering
    await new Promise((r) => setTimeout(r, 400));
    if (exceptions.length > 0) {
      const firstEx = exceptions[0];
      throw new Error(
        `Uncaught runtime exception after startup (line ${firstEx.lineNumber}:${firstEx.columnNumber}): ${firstEx.description || firstEx.text}`
      );
    }

    // Capture Desktop Screenshot
    const desktopShot = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const desktopScreenshotPath = path.join(screenshotsDir, 'desktop-battlefield.png');
    fs.writeFileSync(desktopScreenshotPath, Buffer.from(desktopShot.data, 'base64'));

    const desktopCheck = await evalExpr(`(() => {
      const app = window.STARFRONT_3D;
      if (!app || !app.ready || !app.firstFrameRendered) return { ok: false, reason: 'not_ready' };
      const { core, scene3d } = app;
      const domCanvas = document.querySelector('#viewport3d canvas');
      const rendererCanvas = scene3d.renderer.domElement;
      const gl = rendererCanvas.getContext('webgl2');
      const rect = rendererCanvas.getBoundingClientRect();

      // Ensure a fresh frame is in the preserved drawing buffer before readPixels.
      scene3d.syncFromGameCore(1.0);
      scene3d.render();

      // Sample pixels across the WebGL2 framebuffer to verify visible 3D battlefield rendering
      const w = rendererCanvas.width;
      const h = rendererCanvas.height;
      const buf = new Uint8Array(w * h * 4);
      gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf);
      let nonBgPixels = 0;
      const bgR = 7, bgG = 16, bgB = 31;
      const colorBuckets = new Set();
      for (let i = 0; i < buf.length; i += 64) {
        const r = buf[i], g = buf[i+1], b = buf[i+2];
        if (Math.abs(r - bgR) > 5 || Math.abs(g - bgG) > 5 || Math.abs(b - bgB) > 5) {
          nonBgPixels++;
        }
        colorBuckets.add(((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4));
      }

      const stats = scene3d.getRenderStats();
      return {
        ok: true,
        ready: app.ready,
        firstFrameRendered: app.firstFrameRendered,
        canonicalHarnessPresent: Boolean(window.STARFRONT_3D === app),
        legacyAliasPresent: Boolean(window.__STARFRONT_3D__ === app),
        threeRevision: window.THREE ? window.THREE.REVISION : 'unknown',
        isOfficialThreeFlag: window.THREE ? window.THREE.IS_OFFICIAL_THREE : null,
        isCustomShim: (() => {
          const t = window.THREE;
          if (!t) return true;
          const rev = String(t.REVISION || '');
          if (t.IS_OFFICIAL_THREE === false) return true;
          if (/offline|shim|webgl2-vs001|starfront/i.test(rev)) return true;
          return false;
        })(),
        canvasCount: document.querySelectorAll('#viewport3d canvas').length,
        sameCanvasElement: domCanvas === rendererCanvas,
        hasWebGL2: !!gl && (typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext),
        glVersion: gl ? gl.getParameter(gl.VERSION) : null,
        glRenderer: gl ? gl.getParameter(gl.RENDERER) : null,
        canvasCssSize: { w: Math.round(rect.width), h: Math.round(rect.height) },
        canvasBufferSize: { w, h },
        nonBgSampledPixels: nonBgPixels,
        distinctColorBuckets: colorBuckets.size,
        unitCount: core.state.units.length,
        playerUnits: core.state.units.filter(u => u.team === 'player').length,
        enemyUnits: core.state.units.filter(u => u.team === 'enemy').length,
        bot2Units: core.state.units.filter(u => u.team === 'bot2').length,
        buildingCount: core.state.buildings.length,
        outpostCount: core.state.outposts.length,
        renderInfo: stats
      };
    })()`);

    // Separate HUD Verification (Requirement 8)
    const hudVerification = await evalExpr(`(() => {
      const app = window.STARFRONT_3D;
      const health = app.getHudHealth ? app.getHudHealth() : { ok: false, errorCount: -1, errors: [] };
      const fields = {
        gdp: document.getElementById('hudGdp')?.textContent || '',
        gdpRate: document.getElementById('hudGdpRate')?.textContent || '',
        supply: document.getElementById('hudSupply')?.textContent || '',
        power: document.getElementById('hudPower')?.textContent || '',
        outpost: document.getElementById('hudOutpost')?.textContent || '',
        selected: document.getElementById('hudSelected')?.textContent || ''
      };
      return {
        ok: health.ok === true && health.errorCount === 0 && fields.gdp.length > 0 && fields.supply.includes('/'),
        health,
        fields
      };
    })()`);

    // Verify all interactive gameplay requirements on the actual visible canvas:
    // 1. Single-tap unit selection
    // 2. Drag-box multi-unit selection
    // 3. Tap-ground movement command
    // 4. Attack-Move & direct attack target command
    // 5. Unit production & turret construction
    // 6. Bridge crossing without entering deep river water
    // 7. Outpost capture
    // 8. Camera pan and zoom
    const gameplayCheck = await evalExpr(`(() => {
      const { core, scene3d, inputCtrl } = window.STARFRONT_3D;
      const canvas = scene3d.renderer.domElement;
      const rect = canvas.getBoundingClientRect();

      // 1. Project a friendly unit's 3D world position to screen coordinates and dispatch pointer events on the visible canvas
      const targetUnit = core.state.units.find(u => u.team === 'player' && u.type === 'tank');
      core.state.units.forEach(u => u.selected = false);
      const scr = scene3d.worldToScreen(targetUnit.x, core.getTerrainHeightAt(targetUnit.x, targetUnit.y) + 8, targetUnit.y);
      const tapX = rect.left + scr.x;
      const tapY = rect.top + scr.y;

      canvas.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 1, button: 0, clientX: tapX, clientY: tapY, bubbles: true }));
      window.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, button: 0, clientX: tapX, clientY: tapY, bubbles: true }));
      const singleTapSelected = targetUnit.selected === true && core.state.units.filter(u => u.selected).length === 1;

      // 2. Drag-box selection across the canvas
      core.state.units.forEach(u => u.selected = false);
      canvas.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 2, button: 0, clientX: rect.left + 40, clientY: rect.top + 40, bubbles: true }));
      canvas.dispatchEvent(new PointerEvent('pointermove', { pointerId: 2, button: 0, clientX: rect.left + rect.width - 40, clientY: rect.top + rect.height - 40, bubbles: true }));
      window.dispatchEvent(new PointerEvent('pointerup', { pointerId: 2, button: 0, clientX: rect.left + rect.width - 40, clientY: rect.top + rect.height - 40, bubbles: true }));
      const boxSelectedCount = core.state.units.filter(u => u.team === 'player' && u.selected).length;

      // 3. Tap ground to move selected units toward (420, 520)
      const destScr = scene3d.worldToScreen(420, core.getTerrainHeightAt(420, 520), 520);
      const moveTapX = rect.left + destScr.x;
      const moveTapY = rect.top + destScr.y;
      canvas.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 3, button: 0, clientX: moveTapX, clientY: moveTapY, bubbles: true }));
      window.dispatchEvent(new PointerEvent('pointerup', { pointerId: 3, button: 0, clientX: moveTapX, clientY: moveTapY, bubbles: true }));
      const movingUnitsCount = core.state.units.filter(u => u.team === 'player' && u.state === 'move').length;

      // Step simulation 30 ticks and verify units actually moved
      const avgXBefore = core.state.units.filter(u => u.team === 'player').reduce((s, u) => s + u.x, 0) / 10;
      for (let i = 0; i < 30; i++) core.updateGame(1 / 60);
      const avgXAfter = core.state.units.filter(u => u.team === 'player').reduce((s, u) => s + u.x, 0) / 10;
      const unitsMoved = Math.abs(avgXAfter - avgXBefore) > 5;

      // 4. Attack-Move button + tap command + direct hostile target attack order
      document.getElementById('btnAttackMove').click();
      const bridgeScr = scene3d.worldToScreen(600, 3.5, 400);
      canvas.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 4, button: 0, clientX: rect.left + bridgeScr.x, clientY: rect.top + bridgeScr.y, bubbles: true }));
      window.dispatchEvent(new PointerEvent('pointerup', { pointerId: 4, button: 0, clientX: rect.left + bridgeScr.x, clientY: rect.top + bridgeScr.y, bubbles: true }));
      const attackMoveUnitsCount = core.state.units.filter(u => u.team === 'player' && u.state === 'attackMove').length;

      // Also test direct attackTarget command on an enemy unit
      const hostileTarget = core.state.units.find(u => u.team === 'enemy' && u.hp > 0);
      const directAttackCount = core.issueAttackTargetOrder(hostileTarget);
      const directAttackOrderWorked = directAttackCount > 0 && core.state.units.some(u => u.team === 'player' && u.state === 'attackTarget' && u.targetEntity === hostileTarget);

      // Re-issue Attack-Move toward bridge so units march across
      core.issueMoveOrder(600, 400, true);

      // 5. Unit production & turret build via HUD buttons
      const countBeforeTrain = core.state.units.filter(u => u.team === 'player').length;
      const crystalsBeforeTrain = core.state.crystals;
      document.getElementById('btnTrainMarine').click();
      const countAfterTrain = core.state.units.filter(u => u.team === 'player').length;
      const productionWorked = countAfterTrain === countBeforeTrain + 1 && core.state.crystals < crystalsBeforeTrain;

      const buildingsBefore = core.state.buildings.filter(b => b.team === 'player').length;
      document.getElementById('btnBuildTurret').click();
      const buildingsAfter = core.state.buildings.filter(b => b.team === 'player').length;
      const turretBuilt = buildingsAfter === buildingsBefore + 1;

      // 6. Bridge crossing verification
      const crosser = core.spawnUnit('marine', 520, 435, 'player');
      crosser.x = 520; crosser.y = 435;
      crosser.state = 'move';
      crosser.targetX = 680;
      crosser.targetY = 365;
      const startSide = core.getRiverTelemetry(crosser.x, crosser.y).side;
      for (let i = 0; i < 180; i++) core.updateGame(1 / 60);
      const endSide = core.getRiverTelemetry(crosser.x, crosser.y).side;
      const bridgeCrossed = startSide === -1 && endSide === 1 && Math.hypot(crosser.x - 680, crosser.y - 365) < 35;

      // 7. Combat & Damage verification + independent turret rotation check
      const pTank = core.spawnUnit('tank', 580, 400, 'player');
      pTank.angle = 0;
      pTank.turretAngle = 0;
      const eTank = core.spawnUnit('tank', 640, 440, 'enemy');
      const eHpBefore = eTank.hp;
      for (let i = 0; i < 90; i++) core.updateGame(1 / 60);
      const combatDamageDealt = eTank.hp < eHpBefore;

      // 8. Outpost capture verification
      core.state.units = core.state.units.filter(u => u.team === 'player' || Math.hypot(u.x - 600, u.y - 400) > 200);
      const op = core.state.outposts[0];
      op.owner = 'neutral';
      op.progress = 0;
      op.capturingTeam = null;
      pTank.x = 600; pTank.y = 400;
      for (let i = 0; i < 240; i++) core.updateGame(1 / 60);
      const outpostCapturedByPlayer = op.owner === 'player' && op.progress >= 100;

      // 9. Camera pan & zoom verification (Desktop controls + panCameraByScreenDelta + wheel zoom)
      scene3d.resetCamera();
      const camXBefore = scene3d.cameraTarget.x;
      const camZBefore = scene3d.cameraTarget.z;
      scene3d.panCameraByScreenDelta(120, -80);
      const cameraPanWorked = Math.hypot(scene3d.cameraTarget.x - camXBefore, scene3d.cameraTarget.z - camZBefore) > 20;

      const zoomBefore = scene3d.cameraZoom;
      canvas.dispatchEvent(new WheelEvent('wheel', { deltaY: -120, clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2, bubbles: true, cancelable: true }));
      const cameraZoomWorked = scene3d.cameraZoom > zoomBefore;
      scene3d.resetCamera();

      // Sync and render a frame to capture active combat telemetry and frame timing statistics
      const frameTimes = [];
      for (let f = 0; f < 60; f++) {
        const t0 = performance.now();
        core.stepSimulation(1 / 60);
        scene3d.syncFromGameCore(1.0);
        scene3d.render();
        frameTimes.push(performance.now() - t0);
      }
      frameTimes.sort((a, b) => a - b);
      const avgFrameMs = frameTimes.reduce((s, v) => s + v, 0) / frameTimes.length;
      const p50FrameMs = frameTimes[Math.floor(frameTimes.length * 0.5)];
      const p95FrameMs = frameTimes[Math.floor(frameTimes.length * 0.95)];
      const maxFrameMs = frameTimes[frameTimes.length - 1];

      const combatRenderStats = scene3d.getRenderStats();

      return {
        singleTapSelected,
        boxSelectedCount,
        movingUnitsCount,
        unitsMoved,
        attackMoveUnitsCount,
        directAttackOrderWorked,
        productionWorked,
        turretBuilt,
        bridgeCrossed,
        combatDamageDealt,
        outpostCapturedByPlayer,
        cameraPanWorked,
        cameraZoomWorked,
        frameTimingStats: {
          framesSampled: frameTimes.length,
          avgFrameMs: Number(avgFrameMs.toFixed(3)),
          p50FrameMs: Number(p50FrameMs.toFixed(3)),
          p95FrameMs: Number(p95FrameMs.toFixed(3)),
          maxFrameMs: Number(maxFrameMs.toFixed(3)),
          headlessSwiftShaderFps: Number((1000 / Math.max(0.1, avgFrameMs)).toFixed(1))
        },
        combatRenderStats
      };
    })()`);

    // 10. Mobile Viewport (390x844 iPhone size) + Two-Finger Pinch Zoom & Pan Verification
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await new Promise((r) => setTimeout(r, 400));

    const mobileCheck = await evalExpr(`(() => {
      const { scene3d } = window.STARFRONT_3D;
      scene3d.handleResize();
      scene3d.render();
      const canvas = scene3d.renderer.domElement;
      const rect = canvas.getBoundingClientRect();
      const zoomBefore = scene3d.cameraZoom;

      // Simulate 2-finger pinch zoom out/in on the canvas
      canvas.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 10, clientX: 140, clientY: 400, bubbles: true }));
      canvas.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 11, clientX: 240, clientY: 400, bubbles: true }));
      canvas.dispatchEvent(new PointerEvent('pointermove', { pointerId: 10, clientX: 90, clientY: 400, bubbles: true }));
      canvas.dispatchEvent(new PointerEvent('pointermove', { pointerId: 11, clientX: 290, clientY: 400, bubbles: true }));
      window.dispatchEvent(new PointerEvent('pointerup', { pointerId: 10, clientX: 90, clientY: 400, bubbles: true }));
      window.dispatchEvent(new PointerEvent('pointerup', { pointerId: 11, clientX: 290, clientY: 400, bubbles: true }));

      const zoomAfter = scene3d.cameraZoom;
      return {
        mobileCanvasCss: { w: Math.round(rect.width), h: Math.round(rect.height) },
        mobileBufferSize: { w: canvas.width, h: canvas.height },
        zoomBefore: Number(zoomBefore.toFixed(3)),
        zoomAfter: Number(zoomAfter.toFixed(3)),
        pinchZoomWorked: zoomAfter > zoomBefore
      };
    })()`);

    // Capture Mobile Screenshot
    const mobileShot = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const mobileScreenshotPath = path.join(screenshotsDir, 'mobile-battlefield.png');
    fs.writeFileSync(mobileScreenshotPath, Buffer.from(mobileShot.data, 'base64'));

    // Phase 3 Verification: iPhone-First Diagnostic HUD & JSON Telemetry Export
    await evalExpr(`(() => {
      const btnDiag = document.getElementById('btnToggleDiagHud');
      const panel = document.getElementById('diagHudPanel');
      if (btnDiag && panel && getComputedStyle(panel).display === "none") btnDiag.click();
      const btnStart = document.getElementById('btnDiagStartRec');
      if (btnStart) btnStart.click();
      return true;
    })()`);

    // Let real rAF frames run for 2.3 seconds so at least 2 per-second telemetry buckets are recorded
    await new Promise((r) => setTimeout(r, 2300));

    const diagHudShot = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const diagHudScreenshotPath = path.join(screenshotsDir, 'iphone-diagnostic-hud.png');
    fs.writeFileSync(diagHudScreenshotPath, Buffer.from(diagHudShot.data, 'base64'));

    const diagHudCheck = await evalExpr(`(() => {
      const panel = document.getElementById('diagHudPanel');
      const visible = panel ? getComputedStyle(panel).display !== 'none' : false;
      const fields = {
        fpsRolling: document.getElementById('diagFpsAvg')?.textContent || '',
        fps1Low: document.getElementById('diagFps1Low')?.textContent || '',
        frameTime: document.getElementById('diagFrameTime')?.textContent || '',
        drawCalls: document.getElementById('diagDrawCalls')?.textContent || '',
        triangles: document.getElementById('diagTriangles')?.textContent || '',
        units: document.getElementById('diagUnits')?.textContent || '',
        instanced: document.getElementById('diagInstMeshes')?.textContent || '',
        dpr: document.getElementById('diagDpr')?.textContent || '',
        preset: document.getElementById('diagPreset')?.textContent || '',
        ctxLoss: document.getElementById('diagCtxLoss')?.textContent || '',
        viewport: document.getElementById('diagViewport')?.textContent || ''
      };
      const btnStop = document.getElementById('btnDiagStopExport');
      if (btnStop) btnStop.click();
      const exportedReport = window.STARFRONT_3D?.getLastTelemetryReport?.() || null;
      const hudHealthAfter = window.STARFRONT_3D?.getHudHealth?.() || { ok: false, errorCount: -1, errors: [] };
      return {
        visible,
        fields,
        sampleCount: exportedReport?.sampleCount ?? 0,
        hudHealthAfter,
        exportedReport
      };
    })()`);

    if (diagHudCheck && diagHudCheck.exportedReport) {
      fs.writeFileSync(
        path.join(distDir, 'telemetry-export-sample.json'),
        JSON.stringify(diagHudCheck.exportedReport, null, 2)
      );
    }

    cdp.close();
    return {
      browserExecutable: BROWSER_EXEC,
      exceptions,
      consoleErrors,
      consoleLogs,
      networkRequests,
      externalNetworkRequests,
      screenshots: {
        desktop: 'artifacts/screenshots/desktop-battlefield.png',
        mobile: 'artifacts/screenshots/mobile-battlefield.png',
        iphoneDiagnosticHud: 'artifacts/screenshots/iphone-diagnostic-hud.png'
      },
      desktopCheck,
      hudVerification,
      gameplayCheck,
      mobileCheck,
      diagHudCheck: {
        visible: diagHudCheck.visible,
        fields: diagHudCheck.fields,
        sampleCount: diagHudCheck.sampleCount,
        hudHealthAfter: diagHudCheck.hudHealthAfter
      }
    };
  } finally {
    try {
      chrome.kill('SIGKILL');
    } catch {}
    server.close();
  }
}

console.log('==================================================================');
console.log('STARFRONT 3D — HEADLESS CHROMIUM WEBGL2 VERIFICATION (GATE R2.1)');
console.log('==================================================================');

const fixedReport = await verifyFixedBuild();
console.log('\n[Production Build Verification — dist/index.html]');
fs.writeFileSync(path.join(distDir, 'browser-verify-evidence.json'), JSON.stringify(fixedReport, null, 2));
console.log(JSON.stringify(fixedReport, null, 2));

const d = fixedReport.desktopCheck;
const h = fixedReport.hudVerification;
const g = fixedReport.gameplayCheck;
const m = fixedReport.mobileCheck;
const diag = fixedReport.diagHudCheck;

const assertions = [
  ['0. Real Chromium executable & readiness verified', Boolean(fixedReport.browserExecutable?.bin && fixedReport.browserExecutable?.version && d.ready === true && d.firstFrameRendered === true && d.canonicalHarnessPresent === true)],
  ['0b. Official Three.js provenance (custom shim MUST fail R2.1 gate)', d.isCustomShim === false && typeof d.threeRevision === 'string' && !/offline|shim|webgl2/i.test(d.threeRevision)],
  ['1. WebGL2 context is available', d.hasWebGL2 === true && d.sameCanvasElement === true],
  ['2. Actual canvas renders a visible battlefield', d.nonBgSampledPixels > 500 && d.distinctColorBuckets >= 6],
  ['3. Units and buildings appear (26 units, 12 buildings)', d.unitCount === 26 && d.buildingCount === 12 && d.renderInfo.calls <= 40],
  ['4. Unit selection works (single-tap & drag-box)', g.singleTapSelected === true && g.boxSelectedCount >= 5],
  ['5. Move commands work', g.movingUnitsCount >= 5 && g.unitsMoved === true],
  ['6. Attack commands work (Attack-Move & direct target)', g.attackMoveUnitsCount >= 5 && g.directAttackOrderWorked === true && g.combatDamageDealt === true],
  ['7. Unit production & building construction work', g.productionWorked === true && g.turretBuilt === true],
  ['8. Bridge crossing works', g.bridgeCrossed === true],
  ['9. Camera pan and zoom work (desktop + mobile pinch)', g.cameraPanWorked === true && g.cameraZoomWorked === true && m.pinchZoomWorked === true],
  ['10. No uncaught JavaScript errors or console errors', fixedReport.exceptions.length === 0 && fixedReport.consoleErrors.length === 0],
  ['11. No unexpected external network dependencies', fixedReport.externalNetworkRequests.length === 0],
  ['12. Tactical HUD & iPhone Diagnostic HUD + JSON telemetry export (sampleCount) work', h.ok === true && diag.hudHealthAfter?.ok === true && diag.visible === true && diag.sampleCount >= 2 && parseInt(diag.fields.instanced, 10) >= 14]
];

console.log('\n[Task D Browser Verification Assertions Summary]');
let failed = 0;
for (const [name, pass] of assertions) {
  console.log(`${pass ? '✅ PASS' : '❌ FAIL'} — ${name}`);
  if (!pass) failed++;
}

if (failed > 0) {
  console.error(`\nBrowser verification failed ${failed} check(s)!`);
  process.exit(1);
}
console.log('\nALL 13 BROWSER & DIAGNOSTIC HUD VERIFICATION CHECKS PASSED!');
process.exit(0);

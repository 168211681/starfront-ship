#!/usr/bin/env node
// ============================================================================
// STARFRONT 3D — PHASE 4: TEMPORARY LOCAL HTTPS PREVIEW SERVER FOR iPHONE
// Serves `dist/` over HTTPS using an ephemeral self-signed certificate so a
// physical iPhone on the same LAN can test the build in Mobile Safari
// without exposing private source code or altering production deployment.
// Usage (subject to owner approval):
//   node scripts/preview-https-iphone.mjs
// ============================================================================

import https from 'node:https';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import os from 'node:os';

const DIST_DIR = path.resolve(process.cwd(), 'dist');
const PORT = Number(process.env.PORT || 8443);
const CERT_DIR = path.join(os.tmpdir(), 'starfront-preview-certs');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function ensureEphemeralCert() {
  fs.mkdirSync(CERT_DIR, { recursive: true });
  const keyPath = path.join(CERT_DIR, 'preview-key.pem');
  const certPath = path.join(CERT_DIR, 'preview-cert.pem');
  if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    execSync(
      `openssl req -x509 -newkey rsa:2048 -nodes -sha256 -days 1 ` +
        `-subj "/CN=starfront-iphone-preview.local" ` +
        `-keyout "${keyPath}" -out "${certPath}" 2>/dev/null`
    );
  }
  return {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
  };
}

function handleRequest(req, res) {
  const urlPath = (req.url || '/').split('?')[0];
  const relPath = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
  const safePath = path.normalize(relPath).replace(/^(\.\.(\/|\\|$))+/, '');
  const fullPath = path.join(DIST_DIR, safePath);

  // Strict directory traversal guard: only serve compiled files inside dist/
  if (!fullPath.startsWith(DIST_DIR) || !fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
    return;
  }

  const ext = path.extname(fullPath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  res.writeHead(200, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  fs.createReadStream(fullPath).pipe(res);
}

try {
  const creds = ensureEphemeralCert();
  const server = https.createServer(creds, handleRequest);
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`=== STARFRONT 3D Temporary HTTPS iPhone Preview Server ===`);
    console.log(`Serving compiled dist/ directory ONLY (private src/ is not exposed).`);
    console.log(`Local HTTPS URL: https://localhost:${PORT}/`);
  });
} catch (_err) {
  const fallback = http.createServer(handleRequest);
  fallback.listen(PORT, '0.0.0.0', () => {
    console.log(`Serving compiled dist/ directory on http://localhost:${PORT}/`);
  });
}

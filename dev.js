#!/usr/bin/env node
// dev.js  —  node dev.js
//
// • Serves the site at http://localhost:3000
// • Watches blogs/*.md for changes and auto-runs build.js
// • Live-reloads the browser via Server-Sent Events (no npm needed)

'use strict';

const http  = require('http');
const fs    = require('fs');
const path  = require('path');
const { spawn } = require('child_process');

const PORT      = 3000;
const ROOT      = __dirname;
const BLOGS_DIR = path.join(ROOT, 'blogs');

// ─── SSE clients waiting for reload signal ───────────────────────────────────

const sseClients = new Set();

function notifyReload() {
  for (const res of sseClients) {
    try { res.write('data: reload\n\n'); } catch (_) {}
  }
}

// ─── Build runner ────────────────────────────────────────────────────────────

let building = false;

function runBuild() {
  if (building) return;
  building = true;
  console.log('\n[build] detected change — rebuilding...');

  const child = spawn(process.execPath, [path.join(ROOT, 'build.js')], {
    cwd: ROOT,
    stdio: 'inherit',
  });

  child.on('close', (code) => {
    building = false;
    if (code === 0) {
      console.log('[build] done — reloading browsers');
      notifyReload();
    } else {
      console.error(`[build] exited with code ${code}`);
    }
  });
}

// ─── Watcher ─────────────────────────────────────────────────────────────────

// Run once on start
runBuild();

fs.watch(BLOGS_DIR, (eventType, filename) => {
  if (filename && filename.endsWith('.md')) {
    runBuild();
  }
});

// ─── MIME types ──────────────────────────────────────────────────────────────

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.md':   'text/plain; charset=utf-8',
};

// Tiny script injected into every HTML page for live reload
const LIVE_RELOAD_SNIPPET = `
<script>
(function(){
  const es = new EventSource('/__livereload');
  es.onmessage = () => location.reload();
  es.onerror   = () => setTimeout(() => location.reload(), 2000);
})();
</script>`;

// ─── HTTP server ─────────────────────────────────────────────────────────────

const server = http.createServer((req, res) => {
  // SSE endpoint
  if (req.url === '/__livereload') {
    res.writeHead(200, {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
    });
    res.write(': connected\n\n');
    sseClients.add(res);
    req.on('close', () => sseClients.delete(res));
    return;
  }

  // Resolve file path — strip query string
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/' || urlPath === '') urlPath = '/index.html';

  const filePath = path.join(ROOT, urlPath);

  // Prevent path traversal outside ROOT
  if (!filePath.startsWith(ROOT + path.sep) && filePath !== ROOT) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found: ' + urlPath);
      return;
    }

    const ext      = path.extname(filePath).toLowerCase();
    const mimeType = MIME[ext] || 'application/octet-stream';

    // Inject live-reload snippet before </body> in HTML files
    let body = data;
    if (ext === '.html') {
      const html = data.toString('utf8');
      body = Buffer.from(
        html.includes('</body>')
          ? html.replace('</body>', LIVE_RELOAD_SNIPPET + '</body>')
          : html + LIVE_RELOAD_SNIPPET
      );
    }

    res.writeHead(200, { 'Content-Type': mimeType, 'Content-Length': body.length });
    res.end(body);
  });
});

server.listen(PORT, () => {
  console.log(`\n  Dev server running at  http://localhost:${PORT}\n`);
  console.log('  Watching blogs/*.md for changes...');
  console.log('  Ctrl+C to stop\n');
});

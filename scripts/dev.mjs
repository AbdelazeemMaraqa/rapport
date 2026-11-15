// Local development server with no dependencies: serves public/ and runs the api/ functions.
// Usage: npm run dev   (then open http://localhost:3000)
import http from 'node:http';
import { promises as fs, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);

// Load .env if present (KEY=value lines).
if (existsSync('.env')) {
  for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}
if (!process.env.ADMIN_PASSCODE) {
  process.env.ADMIN_PASSCODE = 'dev';
  console.log('ADMIN_PASSCODE not set: using "dev" for local development.');
}

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png', '.ico': 'image/x-icon' };
const PORT = Number(process.env.PORT) || 3000;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  try {
    if (url.pathname.startsWith('/api/')) {
      const file = path.join(root, url.pathname.replace(/\/+$/, '') + '.js');
      if (!file.startsWith(path.join(root, 'api')) || !existsSync(file)) {
        res.writeHead(404, { 'content-type': 'application/json' });
        return res.end(JSON.stringify({ error: 'not_found' }));
      }
      const mod = await import(pathToFileURL(file).href + `?t=${Date.now()}`);
      return await mod.default(req, res);
    }
    let file = path.join(root, 'public', decodeURIComponent(url.pathname));
    if (!file.startsWith(path.join(root, 'public'))) {
      res.writeHead(403);
      return res.end();
    }
    if (existsSync(file) && (await fs.stat(file)).isDirectory()) file = path.join(file, 'index.html');
    if (!existsSync(file)) {
      res.writeHead(404, { 'content-type': 'text/plain' });
      return res.end('Not found');
    }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(await fs.readFile(file));
  } catch (e) {
    console.error(e);
    if (!res.headersSent) res.writeHead(500, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'server_error', message: e.message }));
  }
});

server.listen(PORT, () => console.log(`Rapport running at http://localhost:${PORT}`));

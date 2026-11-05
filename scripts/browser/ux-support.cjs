const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const http = require('node:http');
const crypto = require('node:crypto');
const { createRequire } = require('node:module');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '../..');

/** Read-only TypeScript loader for simulator witnesses and component markup checks. */
function sourceLoader() {
  const ts = require('typescript');
  const cache = new Map();
  return function load(relative) {
    const requested = path.resolve(root, relative);
    const filename = [requested, requested + '.ts', requested + '.tsx', path.join(requested, 'index.ts')]
      .find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
    if (!filename) throw new Error(`Cannot resolve source module: ${relative}`);
    if (filename.endsWith('.css')) return {};
    if (cache.has(filename)) return cache.get(filename).exports;
    const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
      fileName: filename,
    }).outputText;
    const module = { exports: {} };
    cache.set(filename, module);
    const localRequire = createRequire(filename);
    const sourceRequire = name => name.startsWith('.') ? load(path.resolve(path.dirname(filename), name)) : localRequire(name);
    vm.runInThisContext(`(function(require,module,exports){${output}\n})`, { filename })(sourceRequire, module, module.exports);
    return module.exports;
  };
}

function fixtures() {
  const load = sourceLoader();
  const game = load('src/game/index.ts');
  const campaign = load('src/game/campaign.ts');
  const finale = load('src/game/finaleAdvice.ts');
  const routes = campaign.CAMPAIGN_MAPS.map(map => ({ map: map.id, title: map.title, commands: campaign.campaignSolution(map.id) }));
  for (const route of routes) {
    let state = campaign.createCampaignGame(route.map);
    for (const commands of route.commands) {
      for (const command of commands) {
        const next = game.applyCommand(state, command);
        assert.equal(next.error, undefined, `Map ${route.map}: illegal witness command`);
        state = next.state;
      }
      state = game.resolveTide(state).state;
    }
    assert.equal(state.status, 'won', `Map ${route.map}: witness no longer wins`);
  }
  const rescueRoute = campaign.campaignSolution(1);
  rescueRoute[2] = rescueRoute[2].filter(command => command.type !== 'nourish' || command.id !== 'bell');
  let rescueStart = campaign.createCampaignGame(1);
  for (const commands of rescueRoute.slice(0, 7)) {
    for (const command of commands) {
      const next = game.applyCommand(rescueStart, command);
      assert.equal(next.error, undefined);
      rescueStart = next.state;
    }
    rescueStart = game.resolveTide(rescueStart).state;
  }
  const rescue = finale.getFinaleAdvice(rescueStart).find(info => info.bellId === 'bell')?.rescue;
  assert.deepEqual(rescue, { type: 'nourish', id: 'bell' }, 'GB-01 must be integrated before running the rescue journey');
  assert.equal(game.forecastTide(rescueStart).state.status, 'lost');
  assert.equal(game.forecastTide(game.applyCommand(rescueStart, rescue).state).state.status, 'won');
  return { ...game, ...campaign, ...finale, routes, rescueRoute, rescueStart, rescue };
}

/** No install, CDP attachment or persistent profile; resolve local or cached Playwright only. */
function resolvePlaywright(explicit) {
  if (explicit) {
    const location = path.resolve(explicit);
    return { playwright: require(location), location };
  }
  try {
    const location = require.resolve('playwright');
    return { playwright: require(location), location };
  } catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND') throw error;
  }
  const cacheRoots = new Set([
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'npm-cache', '_npx'),
    path.join(os.homedir(), 'AppData', 'Local', 'npm-cache', '_npx'),
    path.join(os.homedir(), '.npm', '_npx'),
  ].filter(Boolean));
  const candidates = [];
  for (const cacheRoot of cacheRoots) {
    if (!fs.existsSync(cacheRoot)) continue;
    for (const entry of fs.readdirSync(cacheRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const location = path.join(cacheRoot, entry.name, 'node_modules', 'playwright');
      if (fs.existsSync(path.join(location, 'package.json'))) candidates.push(location);
    }
  }
  candidates.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs || a.localeCompare(b));
  for (const location of candidates) {
    const playwright = require(location);
    if (playwright.chromium?.launch) return { playwright, location };
  }
  throw new Error('No cached Playwright found. Supply --playwright=<existing module path>; this harness never installs dependencies.');
}

function fingerprint(directory) {
  const hash = crypto.createHash('sha256');
  function visit(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const filename = path.join(current, entry.name);
      if (entry.isDirectory()) visit(filename);
      else if (entry.isFile()) hash.update(path.relative(directory, filename)).update(fs.readFileSync(filename));
    }
  }
  visit(directory);
  return hash.digest('hex');
}

function newestFileTime(directory) {
  return Math.max(...fs.readdirSync(directory, { withFileTypes: true }).map(entry => {
    const filename = path.join(directory, entry.name);
    return entry.isDirectory() ? newestFileTime(filename) : fs.statSync(filename).mtimeMs;
  }));
}

/** Serve the existing dist build on a fresh loopback port, including its compiled Pages base. */
async function productionServer() {
  const dist = path.join(root, 'dist');
  const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
  const script = html.match(/<script\b[^>]*\bsrc="([^"]+)"/i)?.[1];
  if (!script || !script.includes('/assets/')) throw new Error('Expected a Vite production build. Ask the lead to build first.');
  const base = script.startsWith('/') ? script.slice(0, script.indexOf('/assets/') + 1) : '/';
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.glb': 'model/gltf-binary', '.wasm': 'application/wasm', '.ico': 'image/x-icon', '.mp3': 'audio/mpeg', '.wav': 'audio/wav' };
  const requests = [];
  const server = http.createServer((req, res) => {
    let filename;
    try {
      const url = new URL(req.url, 'http://127.0.0.1');
      const pathname = decodeURIComponent(url.pathname);
      if (!pathname.startsWith(base)) throw new Error('Wrong base path');
      const relative = pathname.slice(base.length) || 'index.html';
      filename = path.resolve(dist, relative);
      const boundary = path.relative(dist, filename);
      if (boundary.startsWith('..') || path.isAbsolute(boundary)) throw new Error('Outside dist');
      if (!fs.statSync(filename).isFile()) throw new Error('Not a file');
      res.writeHead(200, { 'Content-Type': types[path.extname(filename)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      requests.push({ path: pathname, status: 200 });
      fs.createReadStream(filename).pipe(res);
    } catch {
      requests.push({ path: req.url, status: 404 });
      res.writeHead(404); res.end('Not found');
    }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const origin = `http://127.0.0.1:${server.address().port}`;
  return { server, origin, url: origin + base, base, requests, close: () => new Promise(resolve => server.close(resolve)) };
}

module.exports = { root, sourceLoader, fixtures, resolvePlaywright, fingerprint, newestFileTime, productionServer };

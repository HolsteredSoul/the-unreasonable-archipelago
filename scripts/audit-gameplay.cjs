/* Read-only offline audit. Usage: node scripts/audit-gameplay.cjs [--search] [--map=1] [--procedural] [--options]
 * In-memory TypeScript loading avoids changing build outputs or package dependencies.
 * Searches are explicitly bounded; unresolved never means impossible or unfun.
 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const cache = new Map();
const sourceHashes = {};
function load(relative) {
  const filename = path.resolve(root, relative);
  if (cache.has(filename)) return cache.get(filename).exports;
  const source = fs.readFileSync(filename, 'utf8');
  sourceHashes[path.relative(root, filename).replaceAll('\\', '/')] = crypto.createHash('sha256').update(source).digest('hex');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  cache.set(filename, module);
  const relativeRequire = name => name.startsWith('.') ? load(path.resolve(path.dirname(filename), name + '.ts')) : require(name);
  vm.runInThisContext('(function(require,module,exports){' + output + '\n})', { filename })(relativeRequire, module, module.exports);
  return module.exports;
}
const strategies = load('src/game/strategyRoutes.ts');
const { CAMPAIGN_MAPS, campaignSolution, createCampaignGame } = load('src/game/campaign.ts');
const args = process.argv.slice(2);
const mapArg = args.find(a => a.startsWith('--map='));
if (args.some(a => !['--search', '--procedural', '--options', mapArg].includes(a))) throw Error('Use --search, --procedural, --options and/or --map=1..8.');
if (mapArg && !/^[1-8]$/.test(mapArg.slice(6))) throw Error('Choose --map=1..8.');
const selected = CAMPAIGN_MAPS.filter(m => !mapArg || m.id === Number(mapArg.slice(6)));
const summary = (map, route) => {
  if (!route) return { status: 'unresolved', reason: 'No verified fixture stored.' };
  const audit = strategies.auditStrategyRoute(map, route.commands);
  if (audit.state.status !== 'won') throw Error('Fixture did not win: ' + route.id);
  return { id: route.id, description: route.description, status: audit.state.status, ordinaryGrowth: audit.ordinaryGrowth,
    counts: audit.counts, minFood: audit.minFood, finalFood: audit.state.food, minTimber: audit.minTimber, finalTimber: audit.state.timber,
    integrity: audit.state.integrity, unusedActions: audit.unusedActions, idleTides: audit.tides.filter(t => !t.commands).map(t => t.tide) };
};

const game = load('src/game/index.ts');
const ordinaryGrowth = state => state.islands.filter(i => i.kind === 'ordinary').reduce((sum, i) => sum + i.growth, 0);
const mechanicalState = state => ({ ...state, islands: state.islands.map(({ name, ...island }) => island) });
const fingerprint = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
function treeFingerprint(relative) {
  const entries = [];
  const visit = directory => {
    for (const name of fs.readdirSync(directory).sort()) {
      const filename = path.join(directory, name);
      if (fs.statSync(filename).isDirectory()) visit(filename);
      else entries.push([path.relative(root, filename).replaceAll('\\', '/'), crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex')]);
    }
  };
  if (!fs.existsSync(path.join(root, relative))) return { present: false };
  visit(path.join(root, relative));
  return { present: true, files: entries.length, sha256: fingerprint(entries) };
}
const frozenInputs = args.includes('--procedural') || args.includes('--options')
  ? { src: treeFingerprint('src'), dist: treeFingerprint('dist') } : undefined;

/** Every trial uses the production API; verification adds independent invariant assertions. */
function replay(initial, commands, verify = false) {
  assert.equal(commands.length, 8);
  let state = initial;
  const counts = { nourish: 0, tow: 0, anchor: 0, build: 0, whaleTow: 0 };
  const builds = { garden: 0, grove: 0, breakwater: 0 };
  let minFood = state.food;
  let minTimber = state.timber;
  let spareActions = 0;
  let rationShortages = 0;
  const emptyTides = [];
  const growthOnEmptyTides = [];
  const growthTides = [];
  const anchors = [];
  for (let index = 0; index < commands.length; index++) {
    if (state.status !== 'playing') return { status: 'invalid-continuation', tide: index + 1 };
    for (const command of commands[index]) {
      const before = verify ? structuredClone(state) : undefined;
      const result = game.applyCommand(state, command);
      if (verify) assert.deepEqual(state, before, 'Command mutated its input');
      if (result.error) return { status: 'invalid-continuation', tide: index + 1, error: result.error };
      if (verify) assert.equal(result.state.actions, state.actions - 1);
      state = result.state;
      counts[command.type]++;
      if (command.type === 'build') builds[command.building]++;
      if (command.type === 'anchor') anchors.push({ tide: index + 1, id: command.id });
      minFood = Math.min(minFood, state.food);
      minTimber = Math.min(minTimber, state.timber);
    }
    const before = verify ? structuredClone(state) : undefined;
    const totalGrowth = state.islands.reduce((sum, i) => sum + i.growth, 0);
    spareActions += state.actions;
    const forecast = game.resolveTide(state);
    if (verify) {
      assert.deepEqual(forecast, game.forecastTide(state));
      assert.deepEqual(state, before, 'Tide mutated its input');
      assert.ok(forecast.state.islands.every(game.isInBounds));
      assert.equal(new Set(forecast.state.islands.map(i => `${i.q},${i.r}`)).size, state.islands.length);
      assert.ok(forecast.state.food >= 0 && forecast.state.timber >= 0);
    }
    // Forecast exposes actual production and rations; do not infer shortage from a zero balance.
    if (state.food + forecast.production.food < forecast.rations) rationShortages++;
    state = forecast.state;
    const grew = state.islands.reduce((sum, i) => sum + i.growth, 0) > totalGrowth;
    if (grew) growthTides.push(index + 1);
    if (!commands[index].length) {
      emptyTides.push(index + 1);
      if (grew) growthOnEmptyTides.push(index + 1);
    }
    minFood = Math.min(minFood, state.food);
    minTimber = Math.min(minTimber, state.timber);
  }
  return { status: state.status, state, metrics: { counts, builds, minFood, minTimber, finalFood: state.food, finalTimber: state.timber,
    finalIntegrity: state.integrity, ordinaryGrowth: ordinaryGrowth(state), spareActions, rationShortages, emptyTides, growthOnEmptyTides, growthTides, anchors } };
}

/** Fixed, deliberately modest local search: at most six single-Nourish insertions and 600 full replays. */
function ordinaryGrowthOpportunity(initial, witness) {
  const limits = { maxAdditions: 6, maxRouteReplays: 600 };
  let commands = structuredClone(witness);
  let accepted = replay(initial, commands);
  const additions = [];
  let trials = 0;
  let capped = false;
  const ids = initial.islands.filter(i => i.kind === 'ordinary').map(i => i.id);
  for (let round = 0; round < limits.maxAdditions && accepted.metrics.ordinaryGrowth < 6; round++) {
    let best;
    const seen = new Set();
    for (let tide = 0; tide < 8 && !capped; tide++) {
      if (commands[tide].length >= game.getActionBudget(initial)) continue;
      for (let at = 0; at <= commands[tide].length && !capped; at++) {
        for (const id of ids) {
          if (trials >= limits.maxRouteReplays) { capped = true; break; }
          const candidate = structuredClone(commands);
          candidate[tide].splice(at, 0, { type: 'nourish', id });
          const key = JSON.stringify(candidate);
          if (seen.has(key)) continue;
          seen.add(key);
          trials++;
          const audit = replay(initial, candidate);
          if (audit.status !== 'won' || audit.metrics.ordinaryGrowth <= accepted.metrics.ordinaryGrowth) continue;
          if (!best || audit.metrics.ordinaryGrowth > best.audit.metrics.ordinaryGrowth ||
              (audit.metrics.ordinaryGrowth === best.audit.metrics.ordinaryGrowth && audit.metrics.finalFood > best.audit.metrics.finalFood)) {
            best = { commands: candidate, audit, addition: { tide: tide + 1, index: at, command: { type: 'nourish', id } } };
          }
        }
      }
    }
    if (best) { commands = best.commands; accepted = best.audit; additions.push(best.addition); }
    if (!best || capped) break;
  }
  const verified = replay(initial, commands, true);
  const reconstructed = structuredClone(witness);
  for (const addition of additions) reconstructed[addition.tide - 1].splice(addition.index, 0, addition.command);
  assert.deepEqual(reconstructed, commands, 'Recorded insertion recipe differs from the verified route');
  assert.ok(trials <= limits.maxRouteReplays && additions.length <= limits.maxAdditions);
  assert.equal(verified.status, 'won');
  assert.deepEqual(verified.metrics, accepted.metrics);
  return { outcome: verified.metrics.ordinaryGrowth >= 6 ? 'six-growth-witness' : verified.metrics.ordinaryGrowth > 0 ? 'partial-growth-witness' : 'unresolved',
    reason: capped ? 'Replay cap reached; further opportunities remain unresolved.' : verified.metrics.ordinaryGrowth >= 6
      ? 'Six ordinary growth stages with legal extra nourishment; no other plans claimed inferior.'
      : 'Greedy insertion stopped; other nourishment schedules, builds, tows, or strategies remain unresolved.',
    limits, trials, additions, metrics: verified.metrics };
}

function proceduralAudit() {
  const { generateOpening } = load('src/game/generation.ts');
  // Fixed before evaluation. Never replace a difficult seed with a convenient one.
  const seeds = Array.from({ length: 32 }, (_, index) => `gameplay-panel-${String(index).padStart(2, '0')}`);
  const rows = seeds.map(seed => {
    const template = { ...game.createGame('first-light'), seed };
    const before = structuredClone(template);
    const engine = { applyCommand: game.applyCommand, resolveTide: game.resolveTide };
    const generated = generateOpening(template, engine);
    assert.deepEqual(template, before);
    assert.deepEqual(generateOpening(template, engine), generated);
    // New function identity creates an actually cold generator cache.
    assert.deepEqual(generateOpening(template, { applyCommand: game.applyCommand, resolveTide: state => game.resolveTide(state) }), generated);
    const initial = game.createGame(seed);
    assert.deepEqual(mechanicalState(initial), mechanicalState(generated.state), 'Public factory differs from the generated witness opening');
    const baseline = replay(initial, generated.solution, true);
    assert.equal(baseline.status, 'won');
    const bell = initial.islands.find(i => i.kind === 'bell');
    const buildings = { garden: 0, grove: 0, breakwater: 0, empty: 0 };
    initial.islands.filter(i => i.kind === 'ordinary').forEach(i => buildings[i.building ?? 'empty']++);
    return { seed, family: generated.family, currentRotation: initial.currentRotation ?? 0,
      bellDistance: Math.max(Math.abs(bell.q), Math.abs(bell.r), Math.abs(bell.q + bell.r)), buildings,
      attempts: Number.isInteger(generated.attempts) ? generated.attempts : null,
      fallback: generated.family === 'Familiar shores',
      openingHash: fingerprint(mechanicalState(initial)), witness: generated.solution, baseline: baseline.metrics,
      ordinaryOpportunity: ordinaryGrowthOpportunity(initial, generated.solution) };
  });
  const families = [...new Set(rows.map(row => row.family))].sort();
  const rotations = [...new Set(rows.map(row => row.currentRotation))].sort();
  const bellDistances = [...new Set(rows.map(row => row.bellDistance))].sort();
  const expectedFamilies = ['Garden chain', 'Timber flotilla', 'Sheltered inlet', 'Scattered orchards'];
  const range = values => {
    const observed = values.filter(value => typeof value === 'number' && Number.isFinite(value));
    return observed.length ? { min: Math.min(...observed), max: Math.max(...observed) } : null;
  };
  return { panel: 'gameplay-panel-00 through gameplay-panel-31; fixed 32 seeds, no adaptive replacement',
    coverage: { families, rotations, bellDistances, missingFamilies: expectedFamilies.filter(f => !families.includes(f)),
      missingRotations: [0, 1, 2, 3, 4, 5].filter(r => !rotations.includes(r)), missingBellDistances: [2, 3, 4].filter(r => !bellDistances.includes(r)) },
    metadata: { attempts: 'Direct GeneratedOpening.attempts values, not inferred from runtime duration.',
      fallback: 'True only for the exposed Familiar shores family; no inference about rejected candidates being unsolvable.',
      recipe: 'Replay witness from createGame(seed). To reproduce its growth route, clone witness and splice each ordinaryOpportunity.additions command at [tide-1], index, in listed order.',
      policyLimit: 'The production generator constructs an early-home/garden/late-anchor witness. Acceptance and this greedy insertion audit do not characterize the whole strategy space.' },
    totals: { seeds: rows.length, fallbacks: rows.filter(r => r.fallback).length, attempts: range(rows.map(r => r.attempts)),
      baselineMinFood: range(rows.map(r => r.baseline.minFood)), baselineFinalFood: range(rows.map(r => r.baseline.finalFood)),
      baselineOrdinaryGrowth: range(rows.map(r => r.baseline.ordinaryGrowth)),
      ordinaryGrowthFound: range(rows.map(r => r.ordinaryOpportunity.metrics.ordinaryGrowth)),
      sixGrowthWitnesses: rows.filter(r => r.ordinaryOpportunity.outcome === 'six-growth-witness').length,
      opportunityReplays: rows.reduce((sum, r) => sum + r.ordinaryOpportunity.trials, 0) }, rows };
}

function optionExamples() {
  const initial = createCampaignGame(1);
  const reference = campaignSolution(1);
  const whale = structuredClone(reference);
  const replace = whale[1].findIndex(c => c.type === 'tow' && c.id === 'bell');
  assert.notEqual(replace, -1);
  whale[1][replace] = { type: 'whaleTow', id: 'bell' };
  let state = initial;
  for (const command of reference[0]) {
    const applied = game.applyCommand(state, command); assert.equal(applied.error, undefined); state = applied.state;
  }
  state = game.resolveTide(state).state;
  for (const command of reference[1].slice(0, replace)) {
    const applied = game.applyCommand(state, command); assert.equal(applied.error, undefined); state = applied.state;
  }
  const ordinaryTow = game.applyCommand(state, reference[1][replace]);
  const whaleTow = game.applyCommand(state, whale[1][replace]);
  assert.equal(ordinaryTow.error, undefined); assert.equal(whaleTow.error, undefined);
  assert.deepEqual(ordinaryTow.state.islands, whaleTow.state.islands);
  assert.equal(ordinaryTow.state.actions, whaleTow.state.actions);
  assert.equal(whaleTow.state.food, ordinaryTow.state.food + 1);
  assert.equal(game.getWhaleEncounter(ordinaryTow.state).used, false);
  assert.equal(game.getWhaleEncounter(whaleTow.state).used, true);
  const referenceResult = replay(initial, reference, true);
  const whaleResult = replay(initial, whale, true);
  assert.equal(referenceResult.status, 'won'); assert.equal(whaleResult.status, 'won');
  assert.equal(whaleResult.metrics.finalFood, referenceResult.metrics.finalFood + 1);
  const drift = game.resolveTide(whaleTow.state);
  const returnBell = strategies.campaignLateRoute(1).commands;
  const support = structuredClone(returnBell);
  support[7] = [{ type: 'tow', id: 'garden-west', to: { q: -1, r: -1 } }, { type: 'tow', id: 'garden-west', to: { q: 0, r: -1 } }];
  const returned = replay(initial, returnBell, true);
  const supported = replay(initial, support, true);
  assert.equal(returned.status, 'won'); assert.equal(supported.status, 'won');
  assert.equal(returned.metrics.finalFood, supported.metrics.finalFood + 1);
  const bell = supported.state.islands.find(i => i.id === 'bell');
  const garden = supported.state.islands.find(i => i.id === 'garden-west');
  assert.deepEqual({ q: bell.q, r: bell.r }, { q: 0, r: -2 });
  assert.deepEqual({ q: garden.q, r: garden.r }, { q: 0, r: -1 });
  assert.equal(garden.building, 'garden');
  assert.ok(game.getConnectedIds(supported.state).includes('bell'));
  assert.ok(game.resolveTide(supported.state).shelteredIds.includes('bell'));
  return { scope: 'Executable First Light comparisons using existing commands; no runtime changes or claims of player preference.',
    whale: { reference: referenceResult.metrics, alternative: whaleResult.metrics, commands: whale,
      immediateCost: { actions: state.actions - whaleTow.state.actions, food: state.food - whaleTow.state.food, timber: state.timber - whaleTow.state.timber },
      nextDrift: drift.moves.find(move => move.id === 'bell') ?? null,
      tradeoff: 'Saves one food for the same immediate relocation and action cost, but uses the only whale favour on tide 2. Direction is fixed; the normal tow leaves that favour available. Normal drift still resolves.' },
    support: { bellReturn: returned.metrics, bridgeWindbreak: supported.metrics, commands: support,
      finalBell: { q: bell.q, r: bell.r }, finalGarden: { q: garden.q, r: garden.r, building: garden.building },
      tradeoff: 'Moving the garden twice costs two actions/two food instead of a one-action/one-food final bell tow. It keeps the bell offshore, with the garden providing the Heart link and windbreak while retaining its building; no extra reward or superiority is claimed.' } };
}
const maps = selected.map(map => {
  if (args.includes('--search')) {
    const medalAttempts = [strategies.searchMedalRoute(map.id)];
    // If nourishment-only extensions fail, try at most three initially empty
    // shores for one additional tide-2 garden; all costs/actions remain real.
    if (medalAttempts[0].status !== 'found') {
      const built = new Set(campaignSolution(map.id).flat().filter(c => c.type === 'build').map(c => c.id));
      const sites = createCampaignGame(map.id).islands.filter(i => i.kind === 'ordinary' && !i.building && !built.has(i.id)).slice(0, 3);
      for (const site of sites) {
        const attempt = strategies.searchMedalRoute(map.id, { maxExpansions: 12000, beamWidth: 48 }, { tide: 2, id: site.id });
        medalAttempts.push(attempt);
        if (attempt.status === 'found') break;
      }
    }
    const lateAttempts = [];
    // At most four 8,000-expansion searches per map: whole fleet, then the first bell.
    for (const [tides, ids] of [[[5, 7], undefined], [[7], undefined], [[5, 7], ['bell']], [[7], ['bell']]]) {
      const attempt = strategies.searchLateRoute(map.id, tides, { maxExpansions: 8000, beamWidth: 24 }, ids);
      lateAttempts.push(attempt);
      if (attempt.status === 'found') break;
    }
    return { map: map.id, medalAttempts, lateAttempts };
  }
  const medal = strategies.campaignMedalRoute(map.id);
  const late = strategies.campaignLateRoute(map.id);
  const result = { map: map.id, title: map.title,
    reference: summary(map.id, { id: 'reference', commands: campaignSolution(map.id) }),
    medal: summary(map.id, medal), lateAlternative: summary(map.id, late) };
  if (medal && result.medal.ordinaryGrowth < 6) throw Error('Medal fixture fell below six ordinary growth.');
  if (late) {
    result.lateDifference = strategies.lateStrategyDifference(map.id, late.commands);
    if (!result.lateDifference.material) throw Error('Late fixture is not materially different.');
  }
  return result;
});
const procedural = args.includes('--procedural') ? proceduralAudit() : undefined;
const options = args.includes('--procedural') || args.includes('--options') ? optionExamples() : undefined;
if (frozenInputs) assert.deepEqual({ src: treeFingerprint('src'), dist: treeFingerprint('dist') }, frozenInputs, 'Frozen src/dist changed during the audit');
process.stdout.write(JSON.stringify({ scope: 'Deterministic route evidence; not exhaustive, human validation, or a difficulty rating.',
  auditScriptSha256: crypto.createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'), sourceHashes, frozenInputs, maps, procedural, options }, null, 2) + '\n');

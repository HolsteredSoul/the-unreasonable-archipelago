/* Milestone 0 read-only simulation probe. Run: node docs/pillars/evidence/gameplay/route-audit.cjs
 * Loads existing TypeScript in memory; writes no source, build output, or saves.
 * Report output can be redirected to route-audit.json in this evidence directory.
 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const ts = require('typescript');
const root = path.resolve(__dirname, '../../../..');
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
const game = load('src/game/index.ts');
const campaign = load('src/game/campaign.ts');
const finale = load('src/game/finaleAdvice.ts');
const { applyCommand, resolveTide, forecastTide, getActionBudget, getWhaleEncounter, getVictoryConditions, isInBounds } = game;
function play(map, route, strict = false) {
  let state = campaign.createCampaignGame(map);
  const startSnapshot = JSON.stringify(state);
  const rows = [];
  const visited = [structuredClone(state)];
  const substitutions = [];
  for (let t = 0; t < route.length; t++) {
    if (state.status !== 'playing') return { status: state.status, stoppedAt: t + 1, rows, visited, state };
    const start = { food: state.food, timber: state.timber, actions: state.actions };
    for (const command of route[t]) {
      if (command.type === 'tow') {
        const offer = getWhaleEncounter(state)?.offers.find(offer => offer.id === command.id && offer.to.q === command.to.q && offer.to.r === command.to.r);
        if (offer) substitutions.push({ tide: t + 1, command, replacement: { type: 'whaleTow', id: command.id } });
      }
      const before = JSON.stringify(state);
      const result = applyCommand(state, command);
      assert.equal(JSON.stringify(state), before, 'command mutated input');
      if (result.error) {
        if (strict) throw new Error('map ' + map + ', tide ' + (t + 1) + ': ' + result.error);
        return { status: 'invalid-continuation', stoppedAt: t + 1, error: result.error, rows, visited, state };
      }
      state = result.state;
      visited.push(structuredClone(state));
    }
    const planned = { food: state.food, timber: state.timber, spareActions: state.actions };
    const before = JSON.stringify(state);
    const forecast = forecastTide(state);
    assert.deepEqual(forecast, resolveTide(state), 'forecast differs');
    assert.equal(JSON.stringify(state), before, 'forecast mutated input');
    state = forecast.state;
    assert.ok(state.islands.every(isInBounds));
    assert.equal(new Set(state.islands.map(i => i.q + ',' + i.r)).size, state.islands.length);
    visited.push(structuredClone(state));
    rows.push({ tide: t + 1, commands: route[t], start, planned, production: forecast.production,
      end: { food: state.food, timber: state.timber, integrity: state.integrity, status: state.status },
      bells: state.islands.filter(i => i.kind === 'bell').map(i => ({ id: i.id, q: i.q, r: i.r, growth: i.growth, stress: i.stress, nourished: i.nourished, sheltered: forecast.shelteredIds.includes(i.id), connected: forecast.connectedIds.includes(i.id) })) });
  }
  assert.equal(JSON.stringify(campaign.createCampaignGame(map)), startSnapshot, 'opening changed');
  return { status: state.status, state, rows, visited, substitutions };
}
const maps = campaign.CAMPAIGN_MAPS.map(map => {
  const route = campaign.campaignSolution(map.id);
  const baseline = play(map.id, route, true);
  assert.equal(baseline.status, 'won');
  assert.deepEqual(play(map.id, route, true).rows, baseline.rows, 'route nondeterministic');
  const counts = { nourish: 0, tow: 0, anchor: 0, build: 0, whaleTow: 0 };
  route.flat().forEach(c => counts[c.type]++);
  const omissions = [];
  route.forEach((commands, t) => commands.forEach((command, c) => {
    const variant = structuredClone(route);
    variant[t].splice(c, 1);
    const outcome = play(map.id, variant);
    omissions.push({ tide: t + 1, command, status: outcome.status, stoppedAt: outcome.stoppedAt,
      error: outcome.error, finalFood: outcome.state.food, finalTimber: outcome.state.timber,
      conditions: getVictoryConditions(outcome.state) });
  }));
  const missingLate = play(map.id, route.map((commands, index) => index >= 6 ? [] : commands));
  const substitutions = baseline.substitutions.map(s => {
    const variant = structuredClone(route);
    const index = variant[s.tide - 1].findIndex(c => JSON.stringify(c) === JSON.stringify(s.command));
    variant[s.tide - 1][index] = s.replacement;
    const outcome = play(map.id, variant, true);
    return { ...s, status: outcome.status, finalFood: outcome.state.food };
  });
  return { map: map.id, title: map.title, bells: map.bells, budgetPerTide: getActionBudget(campaign.createCampaignGame(map.id)),
    commands: route.flat().length, counts, idleTides: route.flatMap((c, i) => c.length ? [] : [i + 1]),
    spareActions: baseline.rows.reduce((sum, row) => sum + row.planned.spareActions, 0),
    minFood: Math.min(...baseline.visited.map(s => s.food)), minTimber: Math.min(...baseline.visited.map(s => s.timber)),
    finalFood: baseline.state.food, finalTimber: baseline.state.timber, finalIntegrity: baseline.state.integrity,
    ordinaryGrowth: baseline.state.islands.filter(i => i.kind === 'ordinary').reduce((sum, i) => sum + i.growth, 0),
    rows: baseline.rows, omissions, whaleSubstitutions: substitutions, omitTides7And8: { status: missingLate.status, conditions: getVictoryConditions(missingLate.state) } };
});
const rideRoute = campaign.campaignSolution(1);
rideRoute[4] = []; rideRoute[6] = [];
rideRoute[7] = [{ type: 'tow', id: 'garden-west', to: { q: -1, r: -1 } }, { type: 'tow', id: 'garden-west', to: { q: 0, r: -1 } }];
const ride = play(1, rideRoute, true);
assert.equal(ride.status, 'won');
const nourishRescueState = (() => {
  const route = campaign.campaignSolution(1); route[2] = [];
  let state = campaign.createCampaignGame(1);
  for (let t = 0; t < 7; t++) {
    for (const command of route[t]) {
      const result = applyCommand(state, command); assert.equal(result.error, undefined); state = result.state;
    }
    state = resolveTide(state).state;
  }
  return state;
})();
const nourishRescueResult = applyCommand(nourishRescueState, { type: 'nourish', id: 'bell' });
assert.equal(forecastTide(nourishRescueState).state.status, 'lost');
// The kickoff JSON records the old missing suggestion. After GB-01, any supplied
// rescue must be a legal whole-voyage win; the probe remains runnable after fixes.
for (const advice of finale.getFinaleAdvice(nourishRescueState)) {
  if (advice.rescue) {
    const result = applyCommand(nourishRescueState, advice.rescue);
    assert.equal(result.error, undefined);
    assert.equal(forecastTide(result.state).state.status, 'won');
  }
}
assert.equal(nourishRescueResult.error, undefined);
assert.equal(resolveTide(nourishRescueResult.state).state.status, 'won');
const recoveryGap = { provenance: 'Campaign map 1 witness with tide-3 Nourish omitted; ordinary commands through tides 1-7.',
  state: nourishRescueState, advice: finale.getFinaleAdvice(nourishRescueState),
  verifiedWinningAction: { type: 'nourish', id: 'bell' }, result: resolveTide(nourishRescueResult.state).state.status };
const report = { purpose: 'Bounded route diagnostics, not a solver, balance rating, human playtest, or full regression baseline.',
  date: '2026-11-05', node: process.version, sourceHashes, maps,
  firstLightRideAlternative: { route: rideRoute, status: ride.status, finalFood: ride.state.food, finalTimber: ride.state.timber, rows: ride.rows },
  nourishRescueGap: recoveryGap };
process.stdout.write(JSON.stringify(report, null, 2) + '\n');

// Bounded Milestone 0 evidence: execute authored witnesses, without test/build output.
// Run from repository root: node docs/pillars/evidence/world/audit-campaign.cjs
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = path.resolve(__dirname, '../../../..');
require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  module._compile(compiled.outputText, filename);
};
const game = require(path.join(root, 'src/game/index.ts'));
const campaign = require(path.join(root, 'src/game/campaign.ts'));
const achievements = require(path.join(root, 'src/ui/achievements.ts'));
const directions = ['E', 'NE', 'NW', 'W', 'SW', 'SE'];
const rows = campaign.CAMPAIGN_MAPS.map(map => {
  let state = campaign.createCampaignGame(map.id);
  const opening = structuredClone(state);
  const solution = campaign.campaignSolution(map.id);
  const initialSerialized = JSON.stringify(state);
  const actions = {};
  const tides = [];
  let minimumFood = state.food;
  let minimumTimber = state.timber;
  for (const [index, commands] of solution.entries()) {
    assert.equal(state.tide, index + 1);
    assert.equal(state.status, 'playing');
    for (const command of commands) {
      const result = game.applyCommand(state, command);
      assert.equal(result.error, undefined, `${map.id}/${index + 1}: ${JSON.stringify(command)}`);
      assert.equal(result.state.actions, state.actions - 1);
      state = result.state;
      actions[command.type] = (actions[command.type] || 0) + 1;
      minimumFood = Math.min(minimumFood, state.food);
      minimumTimber = Math.min(minimumTimber, state.timber);
    }
    const resolved = game.resolveTide(state);
    assert.deepEqual(game.forecastTide(state), resolved);
    state = resolved.state;
    minimumFood = Math.min(minimumFood, state.food);
    minimumTimber = Math.min(minimumTimber, state.timber);
    tides.push({ tide: index + 1, commands: commands.length, food: state.food,
      timber: state.timber, integrity: state.integrity,
      bellGrowth: state.islands.filter(island => island.kind === 'bell').map(island => island.growth) });
  }
  assert.equal(state.status, 'won');
  assert.equal(game.getVictoryConditions(state).ready, true);
  assert.equal(JSON.stringify(campaign.createCampaignGame(map.id)), initialSerialized);
  return {
    map: map.id, title: map.title, bells: map.bells, islands: map.islands,
    actionsPerTide: game.getActionBudget(opening),
    openingFood: opening.food, openingTimber: opening.timber,
    openingBuildings: Object.fromEntries(['garden', 'grove', 'breakwater'].map(building =>
      [building, opening.islands.filter(island => island.building === building).length])),
    currentRotation: opening.currentRotation,
    finalWindFrom: directions[(game.getWeather({ ...opening, tide: 8 }).direction + 3) % 6],
    witness: { actions, totalCommands: solution.flat().length,
      unusedActionCapacity: game.getActionBudget(opening) * 8 - solution.flat().length,
      noCommandTides: solution.flatMap((commands, i) => commands.length ? [] : [i + 1]),
      minimumFood, minimumTimber, finalFood: state.food, finalIntegrity: state.integrity,
      ordinaryGrowth: achievements.growthTotal(state),
      medal: achievements.recordVictory({}, state)[achievements.voyageRecordKey(state)],
      tides },
  };
});
const campaignKey = achievements.voyageRecordKey(campaign.createCampaignGame(3));
const freeKey = achievements.voyageRecordKey(game.createGame('campaign-map-3'));
assert.equal(campaignKey, freeKey);
const evidence = {
  auditDateLocal: '2026-11-05', timezone: 'Australia/Perth', sourceCommit: 'f14e9a2',
  scope: 'Eight authored witnesses only. Not the full test/build baseline or a browser/human playtest.',
  limitations: 'One conservative route per map; unused capacity is not proven usable for medals. No optimality or enjoyment claim.',
  medalNamespaceCollision: { campaignMap: 3, freeVoyageSeed: 'campaign-map-3', campaignKey, freeKey },
  rows,
};
fs.writeFileSync(path.join(__dirname, 'campaign-witness-audit.json'), JSON.stringify(evidence, null, 2) + '\n');
console.table(rows.map(row => ({ map: row.map, commands: row.witness.totalCommands,
  anchors: row.witness.actions.anchor || 0, idle: row.witness.noCommandTides.join(','),
  spare: row.witness.unusedActionCapacity, minFood: row.witness.minimumFood,
  growth: row.witness.ordinaryGrowth, windFrom: row.finalWindFrom })));
console.log('8 legal witnesses won; forecasts matched; fresh openings remained independent. Evidence saved.');
console.log(`Confirmed medal namespace collision: campaign map 3 and free seed campaign-map-3 both use ${campaignKey}.`);

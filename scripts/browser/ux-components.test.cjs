const test = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { sourceLoader } = require('./ux-support.cjs');
const load = sourceLoader();
const { SaveStatus } = load('src/ui/SaveStatus.tsx');
const { FinaleCheck } = load('src/ui/FinaleCheck.tsx');
const { createCampaignGame } = load('src/game/campaign.ts');
const { getFinaleAdvice } = load('src/game/finaleAdvice.ts');
const render = (component, props) => renderToStaticMarkup(React.createElement(component, props));

test('saving failure has actionable non-colour text and one initially empty polite live region', () => {
  const html = render(SaveStatus, { failed: true });
  assert.match(html, /role="note" aria-label="Saving unavailable"/);
  assert.match(html, /reloading may lose changes/);
  assert.doesNotMatch(html, /hidden=""/);
  assert.equal((html.match(/role="status"/g) || []).length, 1);
  assert.match(html, /aria-live="polite" aria-atomic="true" data-save-announcement="[^"]*"><\/span>/);
});

test('success hides the visual notice without removing the persistent announcer', () => {
  const html = render(SaveStatus, { failed: false });
  assert.match(html, /hidden=""/);
  assert.match(html, /data-save-announcement/);
});

test('inline dialog copies do not create duplicate announcements', () => {
  const html = render(SaveStatus, { failed: true, variant: 'inline', announce: false });
  assert.match(html, /save-status--inline/);
  assert.doesNotMatch(html, /role="status"/);
  assert.doesNotMatch(html, /hidden=""/);
  const primary = render(SaveStatus, { failed: true, visible: false });
  assert.match(primary, /hidden=""/);
  assert.match(primary, /data-save-announcement/);
});

test('each modern bell condition carries an explicit result independent of icons', () => {
  const state = createCampaignGame(1);
  const advice = getFinaleAdvice(state);
  const html = render(FinaleCheck, { state, advice, warning: false, onPlan() {} });
  const rows = html.match(/<li\b[\s\S]*?<\/li>/g);
  assert.equal(rows.length, 4);
  const expected = [advice[0].grown, advice[0].connected, advice[0].sheltered, advice[0].rested];
  rows.forEach((row, index) => {
    assert.match(row, expected[index] ? />Met: <\/strong>/ : />Not met: <\/strong>/);
    assert.match(row, /aria-hidden="true"/);
  });
});

test('legacy checks retain two-condition semantics and rescue copy allows non-moving actions', () => {
  const state = { ...createCampaignGame(1), voyageRules: undefined, campaignMap: undefined };
  const advice = getFinaleAdvice(state);
  advice[0].rescue = { type: 'nourish', id: 'bell' };
  const html = render(FinaleCheck, { state, advice, warning: false, onPlan() {} });
  assert.equal((html.match(/<li\b/g) || []).length, 2);
  assert.match(html, /Show this action/);
  assert.doesNotMatch(html, /Sheltered from this wind|must stay below 3/);
});

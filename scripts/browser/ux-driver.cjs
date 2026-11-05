const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const SAVE_KEY = 'unreasonable-archipelago.session.v1';
const escapeRegex = value => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

class VoyageDriver {
  constructor(page, model, url, viewport, directory) {
    Object.assign(this, { page, model, url, viewport, directory });
    this.state = null;
    this.steps = [];
    this.forecastCaptures = new Set();
    this.denseCaptures = new Set();
    this.queuedCaptures = new Set();
  }

  async readSave() {
    return this.page.evaluate(key => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
  }

  async stable() {
    await this.page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  }

  async guard(label) {
    assert.equal(new URL(this.page.url()).origin, new URL(this.url).origin, `${label}: unexpected navigation`);
    const actual = await this.page.evaluate(() => ({ width: innerWidth, height: innerHeight }));
    assert.deepEqual(actual, this.viewport, `${label}: viewport changed unexpectedly`);
    if (this.state) assert.deepEqual((await this.readSave()).state, this.state, `${label}: unexpected state change`);
  }

  record(label) {
    this.steps.push({ label, tide: this.state?.tide, map: this.state?.campaignMap, status: this.state?.status, at: new Date().toISOString() });
    fs.writeFileSync(path.join(this.directory, 'steps.json'), JSON.stringify(this.steps, null, 2));
  }

  async waitState(expected) {
    await this.page.waitForFunction(({ key, expected }) => {
      try { return JSON.stringify(JSON.parse(localStorage.getItem(key))?.state) === expected; } catch { return false; }
    }, { key: SAVE_KEY, expected: JSON.stringify(expected) });
    assert.deepEqual((await this.readSave()).state, expected);
    this.state = expected;
    await this.guard('state committed');
  }

  async capture(name, { expectFeedback } = {}) {
    await this.guard(name);
    await this.stable();
    // Measure transient feedback while it is present. Never dismiss or hide it to make a capture pass.
    const feedbackLayout = await this.page.evaluate(() => {
      const rectangles = selector => [...document.querySelectorAll(selector)].flatMap(node => {
        const style = getComputedStyle(node);
        const rect = node.getBoundingClientRect();
        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0
          || rect.width <= 0 || rect.height <= 0) return [];
        return [{ selector: node.className, text: node.textContent.trim(),
          left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom }];
      });
      const feedback = rectangles('.resource-callout, .toast');
      const controls = rectangles('.action-dock, .forecast-resources, .bell-outlook, .advance-button, .island-label.is-selected');
      const overlaps = [];
      for (const floating of feedback) for (const control of controls) {
        const width = Math.min(floating.right, control.right) - Math.max(floating.left, control.left);
        const height = Math.min(floating.bottom, control.bottom) - Math.max(floating.top, control.top);
        // Ignore subpixel edge contact; genuine visible intersections must fail.
        if (width > 0.5 && height > 0.5) overlaps.push({ feedback: floating.selector, control: control.selector, width, height });
      }
      return { feedback, controls, overlaps };
    });
    fs.writeFileSync(path.join(this.directory, name + '.layout.json'), JSON.stringify(feedbackLayout, null, 2));
    await this.page.screenshot({ path: path.join(this.directory, name + '.png'), fullPage: false });
    const tree = await this.page.locator('body').ariaSnapshot();
    fs.writeFileSync(path.join(this.directory, name + '.yml'), tree);
    const overflow = await this.page.evaluate(() => ({ width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight }));
    assert.deepEqual(overflow, this.viewport, `${name}: document overflows viewport`);
    if (expectFeedback) assert.ok(feedbackLayout.feedback.some(item => String(item.selector).split(' ').includes(expectFeedback)), `${name}: expected visible ${expectFeedback}`);
    assert.deepEqual(feedbackLayout.overlaps, [], `${name}: visible feedback overlaps controls or the selected island label`);
  }

  async start() {
    await this.page.goto(this.url, { waitUntil: 'networkidle' });
    await this.page.getByRole('button', { name: 'Begin the campaign', exact: true }).waitFor();
    await this.capture('splash');
    // Initial focus and keyboard start are part of the production contract.
    assert.equal(await this.page.getByRole('button', { name: 'Begin the campaign', exact: true }).evaluate(node => node === document.activeElement), true);
    await this.page.keyboard.press('Enter');
    await this.waitState(this.model.createCampaignGame(1));
    await this.page.getByRole('dialog').waitFor({ state: 'hidden' });
    this.record('begin First Light via Enter');
  }

  async select(id) {
    const selected = this.page.locator(`.island-label[data-island="${id}"]`);
    if (await selected.getAttribute('aria-pressed') === 'true') return;
    const island = this.state.islands.find(item => item.id === id);
    assert.ok(island, `Unknown island ${id}`);
    if (!await this.page.locator('.island-list').isVisible()) {
      const chip = this.page.locator('[data-panel="islands"]');
      if (await chip.isVisible()) await chip.click();
      else await this.page.locator('.island-browser-toggle').click();
    }
    await this.page.locator('.island-list button').filter({ hasText: island.name }).click();
    await this.page.waitForFunction(id => document.querySelector(`.island-label[data-island="${id}"]`)?.getAttribute('aria-pressed') === 'true', id);
    await this.guard('select island without spending');
  }

  async command(command, { keyboard = false, select = true } = {}) {
    await this.guard(`before ${command.type}`);
    const applied = this.model.applyCommand(this.state, command);
    assert.equal(applied.error, undefined, `Illegal scripted ${command.type}`);
    if (select) await this.select(command.id);
    const names = { tow: 'Tow island', build: 'Build structure', anchor: 'Anchor island', nourish: 'Nourish island', whaleTow: 'Whale Tow' };
    const button = this.page.getByRole('button', { name: names[command.type], exact: true });
    if (keyboard) { await button.focus(); await this.page.keyboard.press('Enter'); }
    else await button.click();
    if (command.type === 'tow') {
      await this.page.locator('.tow-directions button').filter({ has: this.page.locator('span', { hasText: new RegExp(`^${command.to.q}, ${command.to.r}$`) }) }).click();
    }
    if (command.type === 'build') {
      if (!this.buildPreviewCaptured || this.state.islands.length >= 13) {
        await this.stable();
        await this.capture(`map-${this.state.campaignMap}-tide-${this.state.tide}-unspent-build-preview`);
        this.buildPreviewCaptured = true;
      }
      const label = { garden: 'Tide garden', grove: 'Driftwood grove', breakwater: 'Breakwater' }[command.building];
      await this.page.locator('.build-menu button').filter({ has: this.page.locator('strong', { hasText: new RegExp('^' + escapeRegex(label)) }) }).click();
    }
    await this.waitState(applied.state);
    if (command.type === 'nourish' && !this.queuedCaptures.has(this.state.campaignMap)) {
      await this.stable();
      await this.capture(`map-${this.state.campaignMap}-queued-growth`, { expectFeedback: 'resource-callout' });
      this.queuedCaptures.add(this.state.campaignMap);
    }
    this.record(`${keyboard ? 'keyboard ' : ''}${JSON.stringify(command)}`);
  }

  async undo(expected) {
    await this.page.keyboard.press('Control+z');
    await this.waitState(expected);
    this.record('undo');
  }

  async reload() {
    const expected = await this.readSave();
    await this.page.reload({ waitUntil: 'networkidle' });
    assert.deepEqual(await this.readSave(), expected, 'Reload changed saved session');
    await this.page.locator('.campaign-intro').getByRole('button', { name: this.state.status === 'playing' ? /^Continue (map|voyage)/ : 'View voyage outcome' }).click();
    await this.guard('continue after reload');
    this.record('reload and continue');
  }

  async advance({ acceptLoss = false, keyboard = false, watch = false } = {}) {
    await this.guard('before advancing');
    const expected = this.model.resolveTide(this.state).state;
    if (keyboard) {
      await this.page.getByRole('region', { name: 'Island actions', exact: true }).focus();
      await this.page.keyboard.down('Control');
      await this.page.keyboard.down('Enter');
      await this.page.keyboard.down('Enter'); // repeat=true while held: must not commit twice.
      await this.page.keyboard.up('Enter');
      await this.page.keyboard.up('Control');
    } else await this.page.locator('.advance-button').click();
    if (expected.status === 'lost' && this.state.tide === this.state.maxTides) {
      const warning = this.page.getByRole('dialog', { name: 'Final tide warning', exact: true });
      await warning.waitFor();
      await this.guard('final warning does not commit');
      assert.ok(acceptLoss, 'Witness unexpectedly reached losing final forecast');
      await warning.getByRole('button', { name: /Advance anyway/ }).click();
    }
    const skip = this.page.getByRole('button', { name: 'Skip tide animation', exact: true });
    if (!watch) { await skip.waitFor(); await skip.click(); }
    await this.waitState(expected);
    await this.page.locator('.is-advancing').waitFor({ state: 'detached' });
    if (expected.status !== 'playing') {
      await this.page.getByRole('dialog', { name: expected.status === 'won' ? 'Voyage complete: victory' : 'Voyage complete: defeat', exact: true }).waitFor();
    }
    await this.stable();
    await this.guard('single tide resolved');
    assert.equal((await this.readSave()).undo.length, 0);
    this.record(`advance ${keyboard ? 'Ctrl+Enter with key repeat' : watch ? 'natural animation' : 'with Skip'}`);
  }

  async route(commands, { through = 8 } = {}) {
    for (let index = 0; index < through; index++) {
      await this.forecastEvidence();
      for (const command of commands[index]) await this.command(command);
      await this.advance({ keyboard: index === 0, watch: index === 0 });
      const map = this.state.campaignMap;
      if (this.state.status === 'playing' && this.state.islands.length >= 13 && !this.denseCaptures.has(map)
        && this.state.islands.filter(island => island.kind === 'bell').every(island => island.growth === 3)) {
        await this.select('bell');
        await this.capture(`map-${map}-dense-grown3-fleet`);
        this.denseCaptures.add(map);
      }
    }
  }

  async forecastEvidence() {
    const forecast = this.model.forecastTide(this.state);
    if (!forecast.weather.storm) return;
    const ordered = [...this.state.islands].sort((a, b) => Number(b.kind === 'bell') - Number(a.kind === 'bell'));
    const targets = [
      ['sheltered', ordered.find(island => forecast.shelteredIds.includes(island.id))],
      ['exposed', ordered.find(island => !forecast.shelteredIds.includes(island.id))],
    ];
    for (const [condition, island] of targets) {
      const key = `${this.state.campaignMap}-${condition}`;
      if (!island || this.forecastCaptures.has(key)) continue;
      await this.select(island.id);
      const preview = this.page.getByRole('button', { name: 'Toggle tide preview', exact: true });
      const wasPreviewing = await preview.getAttribute('aria-pressed') === 'true';
      if (!wasPreviewing) await preview.click();
      await this.stable();
      await this.capture(`map-${this.state.campaignMap}-forecast-${condition}-${island.kind}`);
      if (!wasPreviewing) await preview.click();
      this.forecastCaptures.add(key);
    }
  }

  async nextMap(map) {
    await this.page.getByRole('button', { name: new RegExp(`^Sail to map ${map}\\b`) }).click();
    await this.waitState(this.model.createCampaignGame(map));
    await this.stable();
    await this.capture(`map-${map}-opening-palette`);
    this.record(`start map ${map}`);
  }
}

module.exports = { VoyageDriver, SAVE_KEY };

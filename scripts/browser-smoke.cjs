#!/usr/bin/env node
/* Production acceptance harness. Authoring does not imply a browser pass.
 * Run --check without launching a browser; run the full harness only after lead integration/build.
 * Uses real controls for every game action. localStorage is read for assertions, never seeded.
 */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { root, fixtures, resolvePlaywright, fingerprint, newestFileTime, productionServer } = require('./browser/ux-support.cjs');
const { VoyageDriver } = require('./browser/ux-driver.cjs');

const args = process.argv.slice(2);
const value = name => args.find(arg => arg.startsWith(name + '='))?.slice(name.length + 1);
const allowed = new Set(['--check', '--all-maps', '--quick', '--scaling', '--dense', '--help']);
for (const arg of args) {
  if (!allowed.has(arg) && !/^--(?:playwright|browser)=.+/.test(arg)) throw new Error(`Unknown argument ${arg}`);
}
if (args.includes('--help')) {
  console.log('node scripts/browser-smoke.cjs [--check] [--all-maps|--quick|--scaling|--dense] [--browser=chrome|msedge|chromium] [--playwright=existing-module-path]');
  console.log('--check validates local witnesses and module availability without serving, launching or writing evidence.');
  process.exit(0);
}

async function focusedControls(driver) {
  const { page } = driver;
  const initial = structuredClone(driver.state);
  await driver.command({ type: 'nourish', id: 'bell' }, { keyboard: true });
  // Consumed actions may disable their original button. Plain Enter must never become Advance.
  await page.keyboard.press('Enter');
  await driver.stable();
  assert.equal(await page.locator('main').evaluate(node => node.classList.contains('is-advancing')), false);
  assert.equal(await page.getByRole('region', { name: 'Island actions', exact: true }).evaluate(node => node === document.activeElement), true, 'Disabled-action focus must land on stable Island actions');
  await driver.guard('second plain Enter after Nourish');
  const afterAction = await driver.readSave();
  assert.equal(afterAction.undo.length, 1);
  await driver.reload();
  assert.deepEqual(await driver.readSave(), afterAction);
  await driver.undo(initial);
  await driver.command({ type: 'nourish', id: 'bell' });
  await page.getByRole('button', { name: 'Open campaign chart', exact: true }).click();
  await page.locator('.campaign-map.current').click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  await driver.guard('current map card continues without resetting');
  await driver.undo(initial);

  const settings = page.getByRole('button', { name: 'Settings and voyage seed', exact: true });
  await settings.click();
  const dialog = page.getByRole('dialog', { name: 'Settings', exact: true });
  const first = dialog.getByRole('button', { name: 'Close dialog', exact: true });
  assert.equal(await first.evaluate(node => node === document.activeElement), true);
  await page.keyboard.press('Shift+Tab');
  assert.equal(await dialog.evaluate(node => node.contains(document.activeElement)), true);
  await page.keyboard.press('Tab');
  assert.equal(await first.evaluate(node => node === document.activeElement), true);
  const previewBefore = await page.getByRole('button', { name: 'Toggle tide preview', exact: true }).getAttribute('aria-pressed');
  const seed = dialog.locator('#voyage-seed');
  await seed.focus(); await page.keyboard.press('p'); await page.keyboard.press('Enter');
  await driver.guard('typing shortcuts in seed field does not act');
  assert.equal(await page.getByRole('button', { name: 'Toggle tide preview', exact: true }).getAttribute('aria-pressed'), previewBefore);
  await seed.fill(driver.state.seed);
  await page.keyboard.press('Escape');
  assert.equal(await settings.evaluate(node => node === document.activeElement), true);
  await page.keyboard.press('p');
  assert.equal(await page.getByRole('button', { name: 'Toggle tide preview', exact: true }).getAttribute('aria-pressed'), previewBefore === 'true' ? 'false' : 'true');
  await page.keyboard.press('p');
  await driver.select('north');
  await page.getByRole('button', { name: 'Build structure', exact: true }).click();
  await driver.stable();
  await driver.capture('unspent-breakwater-preview');
  await page.getByRole('button', { name: 'Close building choices', exact: true }).click();
  await driver.select('bell');
  await driver.capture('opening-controls');
  driver.record('keyboard, modal focus, current-map resume, undo and reload');
}

async function boundedControlsJourney(driver) {
  await driver.start();
  await focusedControls(driver);
  const { page } = driver;
  await page.getByRole('button', { name: 'Settings and voyage seed', exact: true }).click();
  const settings = page.getByRole('dialog', { name: 'Settings', exact: true });
  for (const [label, expected] of [['Sound', false], ['Reduced motion', true], ['Low graphics quality', true]]) {
    const control = settings.getByRole('switch', { name: label, exact: true });
    if ((await control.getAttribute('aria-checked') === 'true') !== expected) await control.click();
    assert.equal(await control.getAttribute('aria-checked'), String(expected));
  }
  const volume = settings.getByRole('slider', { name: 'Music volume', exact: true });
  await volume.focus(); await page.keyboard.press('Home');
  await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight');
  assert.equal((await driver.readSave()).settings.musicVolume, 0.1);
  await driver.capture('settings-muted-reduced-low');
  await page.keyboard.press('Escape');
  const saved = await driver.readSave();
  assert.equal(saved.settings.sound, false);
  assert.equal(saved.settings.reducedMotion, true);
  assert.equal(saved.settings.quality, 'low');
  await driver.reload();
  assert.deepEqual((await driver.readSave()).settings, saved.settings);
  await driver.advance({ keyboard: true, watch: true });
  await driver.forecastEvidence();
  await driver.capture('bounded-first-tide');
  driver.record('bounded controls: mute, volume, reduced motion, low graphics, reload and one tide');
}

async function replacementCancellation(driver) {
  const { page, model } = driver;
  const initial = structuredClone(driver.state);
  await driver.command(model.campaignSolution(2)[0][0]);
  const before = await driver.readSave();
  await page.getByRole('button', { name: 'Open campaign chart', exact: true }).click();
  await page.locator('.campaign-map').nth(0).click();
  const confirmation = page.getByRole('dialog', { name: /replace|new voyage|restart/i });
  await confirmation.waitFor();
  assert.match(await confirmation.innerText(), /First Light/);
  assert.deepEqual(await driver.readSave(), before, 'Opening replacement confirmation spent or reset progress');
  await driver.capture('replace-active-voyage');
  await page.keyboard.press('Escape');
  assert.deepEqual(await driver.readSave(), before, 'Cancelling replacement changed session');
  const chart = page.getByRole('dialog', { name: 'The Unreasonable Archipelago campaign', exact: true });
  await chart.waitFor();
  assert.equal(await chart.evaluate(node => node.contains(document.activeElement)), true, 'Cancel must return focus into the chart');
  await chart.locator('.campaign-intro').getByRole('button', { name: /^Continue map 2/ }).click();
  await driver.guard('replacement cancelled');
  await driver.undo(initial);
  driver.record('other-map replacement requires confirmation; cancellation preserves exact save');
}

async function campaignJourney(driver, allMaps) {
  await driver.start();
  await focusedControls(driver);
  await driver.route(driver.model.campaignSolution(1));
  assert.equal((await driver.readSave()).campaignCompleted, 1);
  await driver.capture('first-light-victory');
  await driver.reload();
  await driver.nextMap(2);
  await replacementCancellation(driver);
  if (!allMaps) return;
  for (let map = 2; map <= 8; map++) {
    await driver.route(driver.model.campaignSolution(map));
    assert.equal((await driver.readSave()).campaignCompleted, map);
    await driver.capture(`map-${map}-victory`);
    await driver.reload();
    if (map < 8) await driver.nextMap(map + 1);
  }
}

async function denseJourney(driver) {
  // Fresh campaign progress earned entirely through the UI; no save import or unlocked-map injection.
  await driver.start();
  for (let map = 1; map <= 8; map++) {
    await driver.route(driver.model.campaignSolution(map));
    assert.equal((await driver.readSave()).campaignCompleted, map);
    if (map < 8) await driver.nextMap(map + 1);
  }
  assert.ok(driver.denseCaptures.has(8), 'Map 8 must provide a fresh fully grown dense-fleet capture');
  driver.record('fresh map 8 dense evidence earned through all eight campaign maps');
}

async function savingJourney(driver) {
  await driver.start();
  const { page } = driver;
  assert.equal(await page.locator('[data-save-announcement]').count(), 1, 'Mount exactly one persistent announcing SaveStatus');
  assert.equal(await page.locator('[data-save-status]:visible').count(), 0);
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    const fault = { blocked: true, attempts: 0, messages: [], last: '', original };
    window.__uxSaveFault = fault;
    Storage.prototype.setItem = function (...args) {
      fault.attempts++;
      if (fault.blocked) throw new DOMException('Isolated smoke test: blocked storage', 'QuotaExceededError');
      return original.apply(this, args);
    };
    fault.observer = new MutationObserver(() => {
      const text = document.querySelector('[data-save-announcement]')?.textContent || '';
      if (text !== fault.last) { if (text) fault.messages.push(text); fault.last = text; }
    });
    fault.observer.observe(document.body, { childList: true, characterData: true, subtree: true });
  });
  try {
    await page.getByRole('button', { name: 'Mute sound', exact: true }).click();
    await page.locator('[data-save-status]:visible').waitFor();
    await page.waitForFunction(() => window.__uxSaveFault.messages.length === 1);
    assert.match(await page.locator('[data-save-status]:visible').innerText(), /reloading may lose changes/i);
    await driver.capture('saving-failed-planning');
    await page.getByRole('button', { name: 'Settings and voyage seed', exact: true }).click();
    const settings = page.getByRole('dialog', { name: 'Settings', exact: true });
    await settings.locator('[data-save-status]:visible').waitFor();
    assert.equal(await page.locator('[data-save-status]:visible').count(), 1);
    await settings.getByRole('switch', { name: 'Sound', exact: true }).click();
    await driver.stable();
    assert.equal(await page.evaluate(() => window.__uxSaveFault.messages.length), 1, 'Repeated failure or opening a dialog reannounced the warning');
    await driver.capture('saving-failed-modal');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Settings and voyage seed', exact: true }).click();
    await driver.stable();
    assert.equal(await page.evaluate(() => window.__uxSaveFault.messages.length), 1, 'Dialog reopening duplicated announcement');

    await page.evaluate(() => { window.__uxSaveFault.blocked = false; });
    await settings.getByRole('switch', { name: 'Sound', exact: true }).click();
    await page.locator('[data-save-status]:visible').waitFor({ state: 'hidden' });
    await page.waitForFunction(() => document.querySelector('[data-save-announcement]')?.textContent === '');
    await page.evaluate(() => { window.__uxSaveFault.blocked = true; });
    await settings.getByRole('switch', { name: 'Sound', exact: true }).click();
    await page.waitForFunction(() => window.__uxSaveFault.messages.length === 2);
    await page.evaluate(() => { window.__uxSaveFault.blocked = false; });
    await settings.getByRole('switch', { name: 'Sound', exact: true }).click();
    await page.locator('[data-save-status]:visible').waitFor({ state: 'hidden' });
    assert.ok(await page.evaluate(() => window.__uxSaveFault.attempts >= 5));
    await page.keyboard.press('Escape');
  } finally {
    await page.evaluate(() => {
      const fault = window.__uxSaveFault;
      if (fault) { Storage.prototype.setItem = fault.original; fault.observer.disconnect(); delete window.__uxSaveFault; }
    }).catch(() => {});
  }
  const expected = await driver.readSave();
  await driver.reload();
  assert.deepEqual(await driver.readSave(), expected);
  await driver.capture('saving-recovered');
  driver.record('blocked saving, modal copy, once per failure episode, actual write recovery and reload');
}

async function rescueJourney(driver) {
  await driver.start();
  const { page, model } = driver;
  // Exercise the product settings via controls; do not inject preferences into a save.
  await page.getByRole('button', { name: 'Settings and voyage seed', exact: true }).click();
  const settings = page.getByRole('dialog', { name: 'Settings', exact: true });
  await settings.getByRole('switch', { name: 'Low graphics quality', exact: true }).click();
  await settings.getByRole('switch', { name: 'Sound', exact: true }).click();
  await page.keyboard.press('Escape');
  await driver.route(model.rescueRoute, { through: 7 });
  assert.deepEqual(driver.state, model.rescueStart);
  const checkpoint = structuredClone(driver.state);
  await driver.capture('unsafe-final-planning', { expectFeedback: 'toast' });
  await page.locator('.advance-button').click();
  const warning = page.getByRole('dialog', { name: 'Final tide warning', exact: true });
  await warning.waitFor();
  await driver.guard('unsafe final advance is a non-mutating warning');
  assert.match(await warning.innerText(), /Not met: Grown to 3\/3/);
  await driver.capture('final-nourish-warning');
  await warning.getByRole('button', { name: 'Show this action', exact: true }).click();
  await driver.guard('viewing Nourish rescue spends nothing');
  await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === 'Nourish island');
  assert.equal(await page.getByRole('button', { name: 'Nourish island', exact: true }).evaluate(node => node === document.activeElement), true);
  await driver.command(model.rescue, { keyboard: true, select: false });
  await driver.capture('final-nourish-feedback', { expectFeedback: 'resource-callout' });
  await driver.undo(checkpoint);
  await driver.reload();
  await driver.advance({ acceptLoss: true });
  const defeat = await driver.readSave();
  assert.deepEqual(defeat.finaleCheckpoint, checkpoint);
  await driver.capture('first-light-defeat');
  await driver.reload();
  await page.getByRole('button', { name: 'Replan the final tide', exact: true }).click();
  await driver.waitState(checkpoint);
  const checks = page.getByRole('dialog', { name: 'Bell safety check', exact: true });
  await checks.getByRole('button', { name: 'Show this action', exact: true }).click();
  await driver.guard('replanned rescue suggestion spends nothing');
  await driver.command(model.rescue, { keyboard: true, select: false });
  await driver.advance();
  assert.equal((await driver.readSave()).finaleCheckpoint, undefined);
  assert.equal((await driver.readSave()).campaignCompleted, 1);
  await driver.capture('nourish-rescue-victory');
  driver.record('real loss, reload, exact checkpoint, Nourish/undo/reload and final rescue win');
}

async function main() {
  const sourceHash = fingerprint(path.join(root, 'src'));
  const model = fixtures();
  const resolved = resolvePlaywright(value('--playwright') || process.env.PLAYWRIGHT_MODULE_PATH);
  const browserName = value('--browser') || 'chrome';
  assert.ok(['chrome', 'msedge', 'chromium'].includes(browserName), 'Unsupported --browser');
  assert.ok(['--all-maps', '--quick', '--scaling', '--dense'].filter(mode => args.includes(mode)).length <= 1, 'Choose only one run mode');
  if (args.includes('--check')) {
    assert.equal(fingerprint(path.join(root, 'src')), sourceHash, 'Source changed during preflight');
    console.log(JSON.stringify({ status: 'preflight passed; browser NOT run', witnesses: model.routes.length, rescue: model.rescue, playwright: resolved.location, sourceHash }, null, 2));
    return;
  }
  assert.ok(fs.statSync(path.join(root, 'dist', 'index.html')).mtimeMs >= newestFileTime(path.join(root, 'src')), 'Production build is older than source. Ask the lead to finish integration and build first.');
  const distHash = fingerprint(path.join(root, 'dist'));
  const name = new Date().toISOString().replaceAll(':', '-') + '-' + crypto.randomUUID().slice(0, 8);
  const output = path.join(root, 'output', 'playwright', 'programme-' + name);
  fs.mkdirSync(output, { recursive: true });
  const report = { status: 'running', startedAt: new Date().toISOString(), sourceHash, distHash, playwright: resolved.location, allMaps: args.includes('--all-maps'), mode: args.includes('--dense') ? 'fresh-dense-fleet' : args.includes('--scaling') ? 'display-scaling-emulation' : args.includes('--quick') ? 'bounded-smoke' : 'production-journeys', scenarios: [] };
  const saveReport = () => fs.writeFileSync(path.join(output, 'summary.json'), JSON.stringify(report, null, 2));
  let service, browser;
  try {
    service = await productionServer();
    Object.assign(report, { url: service.url, base: service.base });
    browser = await resolved.playwright.chromium.launch({ headless: true, ...(browserName === 'chromium' ? {} : { channel: browserName }) });
    report.browser = browser.version();
    const displays = args.includes('--dense') ? [{ width: 1366, height: 768 }] : [{ width: 1366, height: 768 }, { width: 1920, height: 1080 }];
    const scales = args.includes('--scaling') ? [1.25, 1.5] : [1];
    const cases = displays.flatMap(display => scales.map(scale => ({ display, scale, viewport: { width: Math.round(display.width / scale), height: Math.round(display.height / scale) } })));
    const scenarios = args.includes('--dense') ? ['dense'] : args.includes('--scaling') ? ['controls'] : args.includes('--quick') ? ['controls', 'saving'] : ['campaign', 'saving', 'rescue'];
    for (const { viewport, display, scale } of cases) {
      for (const scenario of scenarios) {
        const directory = path.join(output, `${display.width}x${display.height}-${Math.round(scale * 100)}pct-${scenario}`);
        fs.mkdirSync(directory);
        const context = await browser.newContext({ viewport, screen: viewport, deviceScaleFactor: scale, reducedMotion: scenario === 'rescue' ? 'reduce' : 'no-preference', serviceWorkers: 'block' });
        const errors = [], warnings = [];
        const record = { scenario, viewport, display, scale, status: 'running', errors, warnings, evidence: path.relative(root, directory) };
        report.scenarios.push(record); saveReport();
        await context.route('**/*', route => {
          const url = route.request().url();
          if (/^https?:/.test(url) && new URL(url).origin !== service.origin) {
            errors.push('Unexpected external request: ' + url); return route.abort();
          }
          return route.continue();
        });
        const page = await context.newPage();
        page.setDefaultTimeout(15000);
        page.on('pageerror', error => errors.push('Page error: ' + error.message));
        page.on('console', message => {
          if (message.type() === 'error') errors.push('Console: ' + message.text());
          if (message.type() === 'warning') warnings.push(message.text());
        });
        page.on('response', response => { if (response.status() >= 400) errors.push(`HTTP ${response.status()}: ${response.url()}`); });
        page.on('requestfailed', request => { if (request.failure()?.errorText !== 'net::ERR_ABORTED') errors.push(`Request failed: ${request.url()} ${request.failure()?.errorText}`); });
        const driver = new VoyageDriver(page, model, service.url, viewport, directory);
        try {
          if (scenario === 'campaign') await campaignJourney(driver, report.allMaps);
          if (scenario === 'dense') await denseJourney(driver);
          if (scenario === 'saving') await savingJourney(driver);
          if (scenario === 'rescue') await rescueJourney(driver);
          if (scenario === 'controls') await boundedControlsJourney(driver);
          assert.deepEqual(errors, [], 'Unexpected runtime/network errors');
          assert.equal(fingerprint(path.join(root, 'src')), sourceHash, 'Source changed during run; evidence invalid');
          assert.equal(fingerprint(path.join(root, 'dist')), distHash, 'Production build changed during run; evidence invalid');
          record.status = 'passed';
        } catch (error) {
          record.status = 'failed'; record.failure = error.stack;
          await page.screenshot({ path: path.join(directory, 'failure.png') }).catch(() => {});
          fs.writeFileSync(path.join(directory, 'failure.yml'), await page.locator('body').ariaSnapshot().catch(() => 'Page unavailable'));
          throw error;
        } finally { await context.close(); saveReport(); }
        console.log(`PASS ${display.width}x${display.height} ${Math.round(scale * 100)}% ${scenario}`);
      }
    }
    assert.ok(!service.requests.some(request => request.status >= 400), 'Production server saw missing assets');
    report.status = 'passed';
  } catch (error) {
    report.status = 'failed'; report.failure = error.stack; process.exitCode = 1;
    console.error(error.stack);
  } finally {
    const cleanupFailed = error => { report.status = 'failed'; report.cleanupFailure = error.stack; process.exitCode = 1; };
    if (browser) await browser.close().catch(cleanupFailed);
    if (service) { report.requests = service.requests; await service.close().catch(cleanupFailed); }
    report.finishedAt = new Date().toISOString(); saveReport();
    console.log(`Evidence: ${output}`);
  }
}

main().catch(error => { console.error(error.stack); process.exitCode = 1; });

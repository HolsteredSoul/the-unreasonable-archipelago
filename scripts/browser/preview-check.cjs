// Bounded delivery-preview check. It never starts or stops the server it visits.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { root, resolvePlaywright } = require('./ux-support.cjs');

async function main() {
  const url = new URL(process.argv[2]);
  assert.equal(url.hostname, '127.0.0.1', 'This check is restricted to the requested loopback delivery preview');
  const directory = path.join(root, 'output', 'playwright', 'programme-preview-' + new Date().toISOString().replaceAll(':', '-'));
  fs.mkdirSync(directory, { recursive: true });
  const report = { url: url.href, startedAt: new Date().toISOString(), status: 'running', errors: [], warnings: [], assets: [], serverLifecycle: 'external delivery preview; neither started nor stopped' };
  let browser, page;
  try {
    browser = await resolvePlaywright().playwright.chromium.launch({ headless: true, channel: 'chrome' });
    report.browser = browser.version();
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, serviceWorkers: 'block' });
    await context.route('**/*', route => {
      const request = route.request().url();
      if (/^https?:/.test(request) && new URL(request).origin !== url.origin) {
        report.errors.push('Unexpected external request: ' + request); return route.abort();
      }
      return route.continue();
    });
    page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.on('pageerror', error => report.errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') report.errors.push(message.text());
      if (message.type() === 'warning') report.warnings.push(message.text());
    });
    page.on('response', response => {
      report.assets.push({ url: response.url(), status: response.status() });
      if (response.status() >= 400) report.errors.push('HTTP ' + response.status() + ': ' + response.url());
    });
    page.on('requestfailed', request => report.errors.push('Request failed: ' + request.url() + ' ' + request.failure()?.errorText));
    const response = await page.goto(url.href, { waitUntil: 'networkidle' });
    assert.equal(response.status(), 200);
    await page.getByRole('button', { name: 'Begin the campaign', exact: true }).waitFor();
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.equal(new URL(page.url()).origin, url.origin);
    assert.ok(await page.locator('canvas').count(), 'Expected rendered world canvas behind campaign screen');
    assert.ok(report.assets.some(asset => /\.js(?:\?|$)/.test(asset.url) && asset.status === 200));
    assert.ok(report.assets.some(asset => /\.css(?:\?|$)/.test(asset.url) && asset.status === 200));
    assert.ok(report.assets.some(asset => /\.glb(?:\?|$)/.test(asset.url) && asset.status === 200));
    assert.deepEqual(report.errors, []);
    await page.screenshot({ path: path.join(directory, 'campaign-screen.png') });
    fs.writeFileSync(path.join(directory, 'campaign-screen.yml'), await page.locator('body').ariaSnapshot());
    report.status = 'passed';
  } catch (error) {
    report.status = 'failed'; report.failure = error.stack; process.exitCode = 1;
    if (page) await page.screenshot({ path: path.join(directory, 'failure.png') }).catch(() => {});
  } finally {
    if (browser) await browser.close().catch(error => { report.status = 'failed'; report.cleanupFailure = error.stack; process.exitCode = 1; });
    report.finishedAt = new Date().toISOString();
    fs.writeFileSync(path.join(directory, 'summary.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ status: report.status, evidence: directory, browser: report.browser, errors: report.errors, failure: report.failure }, null, 2));
  }
}
main().catch(error => { console.error(error.stack); process.exitCode = 1; });

const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const base = process.env.UI_BASE_URL || 'http://127.0.0.1:4175';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw Error('Local fixtures only');
(async () => {
 const browser = await chromium.launch({ channel: 'msedge', headless: true });
 try {
  const page = await browser.newPage(); let probes = 0;
  await page.addInitScript(() => {
   window.__streams = []; window.__delays = [];
   const schedule = window.setTimeout;
   window.setTimeout = (fn, delay, ...args) => { window.__delays.push(delay); return schedule(fn, delay, ...args); };
   window.EventSource = class extends EventTarget {
    constructor() { super(); this.closed = false; window.__streams.push(this); setTimeout(() => this.onerror?.(), 10); }
    close() { this.closed = true; }
   };
  });
  await page.route('**/api/**', async route => {
   const path = new URL(route.request().url()).pathname;
   if (path.endsWith('/events')) { probes++; return route.fulfill({ status: 404, json: { error: 'Not Found' } }); }
   return route.fulfill({ json: path.endsWith('/auth/me') ? { id: 'test', fullName: 'Test Admin', roles: ['ADMIN'], permissions: [] } : {} });
  });
  await page.goto(base + '/app');
  await page.getByText('Live updates are unavailable from the server.', { exact: false }).waitFor();
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await page.waitForTimeout(500);
  assert.equal(probes, 1);
  assert.equal(await page.evaluate(() => window.__streams.length), 1);
  assert.equal(await page.evaluate(() => window.__streams.filter(s => !s.closed).length), 0);
  assert.ok(await page.evaluate(() => window.__delays.some(delay => delay > 290000 && delay <= 300000)));
  assert.equal(await page.evaluate(() => performance.getEntriesByType('navigation').length), 1);
  console.log('404 availability notice, five-minute retry cooldown, no focus retry storm or page reload: passed');
 } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });

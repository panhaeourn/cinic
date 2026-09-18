const fs = require('node:fs');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const base = process.env.UI_BASE_URL || 'http://127.0.0.1:4175';
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const requests = [];
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/api/**', async route => {
      const url = new URL(route.request().url());
      requests.push(url.pathname + url.search);
      let data = { content: [], totalElements: 0 };
      if (url.pathname.endsWith('/auth/me')) data = { id: 'test', fullName: 'Performance Test', email: 'test@example.invalid', roles: ['ADMIN'], permissions: ['QUEUE_MANAGE'] };
      else if (url.pathname.endsWith('/settings/brand')) data = {};
      else if (url.pathname.endsWith('/queue')) {
        const search = url.searchParams.get('search') || 'initial';
        if (search === 'slow') await new Promise(resolve => setTimeout(resolve, 650));
        data = { content: [{ id: search, queueNumber: 1, queueCode: 'Q001', patientName: search, patientCode: 'TEST', status: 'WAITING', checkedInAt: '2026-09-19T01:00:00Z' }], totalElements: 1 };
      }
      else if (url.pathname.endsWith('/patients/cursor')) data = { items: [], nextCursor: null, hasMore: false };
      await route.fulfill({ json: data }).catch(() => {});
    });
    await page.goto(base + '/app/queue');
    const input = page.getByPlaceholder('Search queue, patient, or staff...');
    await input.waitFor();
    await page.locator('.queue-row').waitFor();
    await page.waitForTimeout(100);
    requests.length = 0;
    await input.pressSequentially('abcdef', { delay: 20 });
    await page.waitForTimeout(400);
    assert.equal(await input.inputValue(), 'abcdef');
    const searchRequests = requests.filter(r => r.startsWith('/api/queue?'));
    assert.equal(searchRequests.length, 1, JSON.stringify(requests));
    assert.equal(requests.filter(r => /\/api\/(patients|staff|appointments)\?/.test(r)).length, 0);
    await input.fill('slow');
    await page.waitForTimeout(220);
    await input.fill('fast');
    await page.waitForTimeout(900);
    assert.equal(await page.locator('.queue-row strong').innerText(), 'fast');
    // Cold route loading must never replace the navigation shell.
    await page.route('**/assets/PatientsPage-*.js', async route => {
      await new Promise(resolve => setTimeout(resolve, 700));
      await route.continue();
    });
    await page.locator('a[href="/app/patients"]').evaluate(link => link.click());
    await page.waitForTimeout(200);
    assert.equal(await page.locator('.topbar').isVisible(), true);
    await page.getByRole('heading', { name: 'Patients', exact: true }).waitFor();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base + '/app/queue');
    await page.locator('.queue-row').waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, 'Mobile viewport overflows horizontally');
    fs.mkdirSync('tmp/ui-performance', { recursive: true });
    await page.screenshot({ path: 'tmp/ui-performance/queue-mobile.png', fullPage: true });
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ rapidSixCharacterSearchRequests: searchRequests.length, supportingListRefetches: 0, staleResponseIgnored: true, navigationVisibleDuringColdLoad: true, runtimeErrors: errors }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });

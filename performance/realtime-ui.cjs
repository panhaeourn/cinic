const assert = require('node:assert/strict');
const { chromium, webkit } = require('playwright');
const base = process.env.UI_BASE_URL || 'http://127.0.0.1:4175';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw Error('Local synthetic fixtures only');
const pageOf = content => ({ content, totalElements: content.length, totalPages: 1, number: 0 });
const user = { id: 'test-admin', fullName: 'Sample Administrator', roles: ['ADMIN'], permissions: ['PATIENT_CREATE', 'PATIENT_VIEW', 'APPOINTMENT_CREATE', 'QUEUE_MANAGE', 'VITALS_CREATE', 'ENCOUNTER_CREATE'], email: 'sample@example.invalid' };
const report = { range: { from: '2026-09-01', to: '2026-09-19' }, revenue: { invoiceTotal: 0, unpaidBalance: 0, grossReceived: 0, refundedAmount: 0, netReceived: 0, dailyRevenue: [] }, patients: { totalPatients: 1, newPatients: 1, portalLinkedPatients: 0 }, appointments: { totalAppointments: 0, byStatus: [] }, doctorConsultations: [], inventory: { medicines: 0, lowStock: 0, expiringSoon: 0, inventoryTransactions: 0 }, payments: { grossReceived: 0, refundedAmount: 0, netReceived: 0, paymentCount: 0, byMethod: [], byCashier: [] } };
(async () => {
 for (const mobile of [false, true]) {
  const browser = await (mobile ? webkit : chromium).launch(mobile ? { headless: true } : { channel: 'msedge', headless: true });
  try {
   const page = await browser.newPage({ viewport: { width: mobile ? 390 : 1440, height: 1000 }, isMobile: mobile, hasTouch: mobile });
   page.setDefaultTimeout(10000);
   const errors = [], counts = {};
   page.on('pageerror', error => errors.push(error.message));
   await page.addInitScript(() => {
    window.__streams = [];
    window.EventSource = class extends EventTarget {
     constructor(url, options) { super(); this.url = url; this.options = options; this.closed = false; window.__streams.push(this); }
     close() { this.closed = true; }
    };
    window.__emit = (topics, type = 'changed') => window.__streams.filter(s => !s.closed).forEach(s => s.dispatchEvent(new MessageEvent(type, { data: JSON.stringify(topics) })));
   });
   let name = 'Initial Patient';
   let clinicName = 'Sample Clinic';
   await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname.replace('/api/', ''); counts[path] = (counts[path] || 0) + 1;
    const patient = { id: 'p1', patientCode: 'P2026001', fullName: name, firstName: 'Initial', lastName: 'Patient', khmerName: 'សុខ ស្រីនាង', gender: 'FEMALE', dateOfBirth: '1995-01-01', phone: '012345678', address: 'Sample', createdAt: '2026-01-01T00:00:00Z' };
    let data = pageOf([]);
    if (path === 'auth/me') data = user;
    else if (path === 'settings/brand') data = { clinicName, currency: 'USD' };
    else if (path === 'patients/cursor') data = { items: [patient], hasMore: false, nextCursor: null };
    else if (path === 'patients/p1') data = patient;
    else if (path === 'patients') data = pageOf([patient]);
    else if (path === 'reports/summary') data = report;
    else if (path === 'payments/summary') data = { grossAmount: 0, refundedAmount: 0, netAmount: 0, paymentCount: 0 };
    else if (path.startsWith('departments') || path === 'access-control/roles') data = [];
    else if (path === 'settings') data = { clinicName, logoUrl: '', address: '', phone: '', email: '', currency: 'USD', invoicePrefix: 'INV', googleClientId: '', googleRedirectUri: '', bakongAccountId: '', bakongMerchantName: '', bakongMerchantCity: '', bakongAccountInformation: '', bakongCurrency: 'USD', notificationsEnabled: true, emailNotifications: false, smsNotifications: false, updatedAt: '2026-09-01T00:00:00Z' };
    if (path === 'patients/cursor' && counts[path] === 1) await new Promise(resolve => setTimeout(resolve, 700));
    await route.fulfill({ json: data });
   });
   await page.goto(base + '/app');
   await page.locator('.nav-list').waitFor();
   const navigate = async route => {
    await page.locator('a[href="/app/' + route + '"]').first().evaluate(a => a.click());
    await page.waitForTimeout(350);
   };
   const screens = [ ['patients', 'patients', 'patients/cursor'], ['staff', 'staff', 'staff'], ['appointments', 'appointments', 'appointments'], ['queue', 'queue', 'queue'], ['vitals', 'vitals', 'vitals'], ['encounters', 'encounters', 'encounters'], ['billing', 'invoices', 'invoices'], ['payments', 'payments', 'payments'], ['reports', 'reports', 'reports/summary'], ['departments', 'departments', 'departments/manage'], ['access-control', 'access-control', 'access-control/users'], ['audit-logs', 'audit-logs', 'audit-logs'], ['settings', 'settings', 'settings'] ];
   for (const [route, topic, endpoint] of screens) {
    await navigate(route);
    assert.ok(counts[endpoint] > 0, route + ' initial load');
    const before = counts[endpoint];
    if (route === 'patients') name = 'Updated During Load';
    await page.evaluate(topic => { for (let i = 0; i < 20; i++) window.__emit([topic]); }, topic);
    await page.waitForTimeout(route === 'patients' ? 1500 : 650);
    assert.equal(counts[endpoint], before + 1, route + ' burst must coalesce');
    if (route === 'patients') assert.ok((await page.locator('button.patient-table-row').first().innerText()).includes('Updated During Load'));
    const cached = counts[endpoint];
    const other = route === 'patients' ? 'reports' : 'patients';
    await navigate(other); await navigate(route);
    assert.equal(counts[endpoint], cached, route + ' should reuse fresh cache');
   }
   await navigate('patients');
   await page.locator('button.patient-table-row').first().click();
   const field = page.getByLabel('Khmer name', { exact: false });
   await page.waitForFunction(() => document.querySelector('input[lang="km"]')?.value === 'សុខ ស្រីនាង');
   await field.fill('Unsaved draft');
   name = 'Updated Remotely';
   await page.evaluate(() => window.__emit(['patients']));
   await page.getByRole('heading', { name: 'Updated Remotely' }).waitFor();
   assert.equal(await field.inputValue(), 'Unsaved draft');
   const beforeUnrelated = counts['patients/cursor'];
   await page.evaluate(() => window.__emit(['payments'])); await page.waitForTimeout(350);
   assert.equal(counts['patients/cursor'], beforeUnrelated);
   await navigate('settings');
   const clinicField = page.getByLabel('Clinic name', { exact: true });
   await clinicField.fill('My unsaved clinic'); clinicName = 'Remote Clinic';
   await page.evaluate(() => window.__emit(['settings'])); await page.waitForTimeout(350);
   assert.equal(await clinicField.inputValue(), 'My unsaved clinic');
   await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
   });
   assert.equal(await page.evaluate(() => window.__streams.filter(s => !s.closed).length), 0);
   await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    document.dispatchEvent(new Event('visibilitychange'));
   });
   const streamCount = await page.evaluate(() => window.__streams.length);
   await page.evaluate(() => window.__streams.find(s => !s.closed).onerror());
   await page.waitForFunction(count => window.__streams.length > count, streamCount);
   const beforeSync = counts.settings;
   await page.evaluate(() => window.__emit(['*'], 'sync')); await page.waitForTimeout(350);
   assert.equal(counts.settings, beforeSync + 1);
   assert.equal(await page.evaluate(() => window.__streams.filter(s => !s.closed).length), 1);
   assert.equal(await page.evaluate(() => performance.getEntriesByType('navigation').length), 1);
   assert.deepEqual(errors, []);
   console.log(JSON.stringify({ mobile, screens: screens.length, burstCoalescing: 'passed', cachedNavigation: 'passed', dirtyDrafts: 'preserved', reconnectSync: 'passed', pageReloads: 0 }));
  } finally { await browser.close(); }
 }
})().catch(error => { console.error(error); process.exit(1); });

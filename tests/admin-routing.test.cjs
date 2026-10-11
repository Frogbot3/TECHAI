const test = require('node:test');
const assert = require('node:assert/strict');
const loader = require('./load-ts.cjs');
const { adminTab, safeAdminReturn } = loader()('src/lib/admin-navigation.ts');
function routesFor(session) {
  const load = loader({
    '@/lib/auth': { ADMIN_SESSION_COOKIE: 'techai_admin_session', getSessionFromCookie: async name => { assert.equal(name, 'techai_admin_session'); return session; } },
    'next/navigation': { redirect: location => { throw Object.assign(new Error('Redirect'), { location }); } },
    './DashboardClient': () => null,
  });
  return { landing: load('src/app/admin/page.tsx').default, dashboard: load('src/app/admin/dashboard/page.tsx').default };
}
const props = values => ({ searchParams: Promise.resolve(values || {}) });
test('admin defaults to Orders and preserves explicit module/order links through authentication', async () => {
  assert.equal(adminTab(null), 'ORDERS'); assert.equal(adminTab('bad'), 'ORDERS'); assert.equal(adminTab('analytics'), 'ANALYTICS');
  const query = { tab: 'orders', order: 'ORDER-123', paymentStatus: 'Paid' };
  const target = '/admin/dashboard?' + new URLSearchParams(query);
  for (const session of [null, { role: 'customer' }]) {
    await assert.rejects(routesFor(session).landing(props()), { location: '/admin/login?next=%2Fadmin%2Fdashboard' });
    await assert.rejects(routesFor(session).dashboard(props(query)), { location: '/admin/login?next=' + encodeURIComponent(target) });
  }
  await assert.rejects(routesFor({ role: 'admin' }).landing(props(query)), { location: target });
  assert((await routesFor({ role: 'admin' }).dashboard(props(query))).type);
});
test('login return targets reject external, malformed and unrelated paths', () => {
  for (const target of ['https://evil.test/admin/dashboard', '//evil.test', '/admin/login', '/api/admin/orders', '/admin/dashboard/other', '/admin/dashboard\\evil', '/admin/dashboard\n']) assert.equal(safeAdminReturn(target), '/admin/dashboard');
  assert.equal(safeAdminReturn('/admin/dashboard?tab=analytics'), '/admin/dashboard?tab=analytics');
  assert.equal(safeAdminReturn('/admin/dashboard?order=ORDER-123'), '/admin/dashboard?order=ORDER-123');
});

const test = require('node:test');
const assert = require('node:assert/strict');
const loader = require('./load-ts.cjs');

function routesFor(session) {
  const load = loader({
    '@/lib/auth': {
      ADMIN_SESSION_COOKIE: 'techai_admin_session',
      getSessionFromCookie: async name => {
        assert.equal(name, 'techai_admin_session');
        return session;
      },
    },
    'next/navigation': {
      redirect: location => { throw Object.assign(new Error('Redirect'), { location }); },
    },
  });
  return {
    landing: load('src/app/admin/page.tsx').default,
    dashboard: load('src/app/admin/dashboard/layout.tsx').default,
  };
}

test('/admin redirects guests and customer sessions to the existing admin login', async () => {
  for (const session of [null, { role: 'customer', id: 'customer' }]) {
    await assert.rejects(routesFor(session).landing(), { location: '/admin/login' });
  }
});

test('/admin redirects a verified admin to the existing dashboard', async () => {
  await assert.rejects(routesFor({ role: 'admin', id: 'admin' }).landing(), { location: '/admin/dashboard' });
});

test('dashboard server guard redirects non-admins before rendering its children', async () => {
  for (const session of [null, { role: 'customer', id: 'customer' }]) {
    await assert.rejects(routesFor(session).dashboard({ children: 'private dashboard' }), { location: '/admin/login' });
  }
  const children = { existingDashboard: true };
  assert.equal(await routesFor({ role: 'admin', id: 'admin' }).dashboard({ children }), children);
});

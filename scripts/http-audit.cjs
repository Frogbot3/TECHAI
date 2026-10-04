require('@next/env').loadEnvConfig(process.cwd());
const jwt = require('jsonwebtoken');
const assert = require('node:assert/strict');
(async () => {
  const base = process.env.AUDIT_BASE_URL || 'http://localhost:3100';
  for (const path of ['/api/customers', '/api/admin/stats', '/api/admin/refunds', '/api/orders']) {
    const response = await fetch(base + path);
    console.log('HTTP access result', path, response.status, response.headers.get('content-type'));
    assert.ok([401, 403].includes(response.status));
    console.log('Unauthenticated', path, response.status);
  }
  const token = jwt.sign({ id: '000000000000000000000001', role: 'customer', email: '', phone: '', name: 'Audit' }, process.env.JWT_SECRET, { expiresIn: '1m' });
  for (const path of ['/api/products', '/api/orders?limit=50', '/api/hero-campaigns']) {
    const start = Date.now();
    const response = await fetch(base + path, { headers: { Cookie: `techai_customer_session=${token}` } });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.isFallback, undefined);
    if (body.campaigns) for (const campaign of body.campaigns) {
      assert.equal(campaign.price, campaign.product.price);
      assert.equal(campaign.subtitle, campaign.product.description);
    }
    console.log('Authenticated/read check', path, { status: response.status, ms: Date.now() - start, count: body.count ?? body.campaigns?.length });
  }
  const adminToken = jwt.sign({ id: 'admin', role: 'admin', email: '', phone: '', name: 'Audit' }, process.env.JWT_SECRET, { expiresIn: '1m' });
  const start = Date.now();
  const adminResponse = await fetch(base + '/api/orders?limit=50', { headers: { Cookie: `techai_admin_session=${adminToken}` } });
  const adminBody = await adminResponse.json();
  console.log('Admin orders read', { status: adminResponse.status, ms: Date.now() - start, count: adminBody.count });
  assert.equal(adminResponse.status, 200);
  const snapshot = adminBody.orders?.[0]?.items?.[0]?.product?.image;
  if (snapshot?.startsWith('/api/orders/')) {
    const denied = await fetch(base + snapshot, { redirect: 'manual' });
    assert.equal(denied.status, 401);
    const image = await fetch(base + snapshot, { headers: { Cookie: `techai_admin_session=${adminToken}` }, redirect: 'manual' });
    assert.ok(image.status === 200 || [302, 307].includes(image.status));
    console.log('Private snapshot image', { unauthorized: denied.status, authorized: image.status });
  }
})().catch(error => { console.error({ failed: error.name, message: error.message }); process.exitCode = 1; });

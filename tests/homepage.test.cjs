const test = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-ts.cjs')();
const { homepageCollections, countdown, heroHeadline } = load('src/lib/homepage.ts');
const { checkPincode, storefrontConfig } = load('src/lib/storefront-config.ts');

test('home collections are disjoint, including duplicate catalogue records and a small catalogue', () => {
  const products = Array.from({ length: 25 }, (_, i) => ({ id: String(i), discountPercent: 45, stock: 4, isBestSeller: true, rating: 4.8 }));
  for (const catalogue of [[...products, products[0]], products.slice(0, 3), []]) {
    const sections = homepageCollections(catalogue);
    const ids = Object.values(sections).flat().map(p => p.id);
    assert.equal(new Set(ids).size, ids.length);
    assert.ok(Object.values(sections).every(section => section.length <= 6));
  }
  assert.equal(homepageCollections(products, [{ productId: '24' }]).flashDeals[0].id, '24');
});

test('countdown uses a fixed deadline, survives reloads, and never restarts after expiry', () => {
  const end = '2026-10-10T12:00:00+05:30';
  const now = Date.parse(end) - 3661000;
  assert.equal(countdown(end, now).label, '01:01:01');
  assert.deepEqual(countdown(end, now), countdown(end, now));
  assert.equal(countdown(end, now + 1000).label, '01:01:00');
  assert.deepEqual(countdown(end, Date.parse(end) + 100000), { expired: true, label: '00:00:00' });
  assert.equal(countdown('', now), null);
});

test('hero headlines stay complete and within six words', () => {
  for (const title of ['Great sound, anywhere', 'Deck AI Low-Profile Mechanical Keyboard and Precision Wireless Mouse...', '']) {
    const headline = heroHeadline(title, 'TECH AI Labs', 'Computers & Gaming');
    assert.ok(headline.split(/\s+/).length <= 6);
    assert.ok(!headline.includes('...'));
  }
});

test('pincode checker distinguishes invalid, unknown, served and unserved pincodes', () => {
  assert.equal(checkPincode('012345'), 'invalid');
  assert.equal(checkPincode('123'), 'invalid');
  assert.equal(checkPincode('560001'), 'unknown');
  storefrontConfig.delivery.coverageConfigured = true;
  storefrontConfig.delivery.serviceablePincodes = ['560001'];
  assert.equal(checkPincode('560001'), 'available');
  assert.equal(checkPincode('110001'), 'unavailable');
  storefrontConfig.delivery.coverageConfigured = false;
  storefrontConfig.delivery.serviceablePincodes = [];
});

test('catalogue image endpoint rejects invalid fields and serves only raster image bytes', async () => {
  const image = 'data:image/png;base64,aGVsbG8=';
  const loader = require('./load-ts.cjs')({
    '@/lib/mongodb': { connectToDatabase: async () => {} },
    '@/models/Product': { __esModule: true, default: { findOne: () => { const query = { select: () => query, read: () => query, maxTimeMS: () => query, lean: async () => ({ productId: 'test', image, normalizedImage: image }) }; return query; } } },
  });
  const route = loader('src/app/api/products/[id]/image/route.ts');
  const context = { params: Promise.resolve({ id: 'test' }) };
  assert.equal((await route.GET(new Request('http://local/image?field=__proto__'), context)).status, 400);
  const response = await route.GET(new Request('http://local/image?field=normalizedImage'), context);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Content-Type'), 'image/png');
  assert.equal(await response.text(), 'hello');
});

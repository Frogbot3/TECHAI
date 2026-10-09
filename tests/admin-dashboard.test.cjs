const test = require('node:test');
const assert = require('node:assert/strict');
const loader = require('./load-ts.cjs');
const { toAdminProduct, resolveProductImageReferences } = loader()('src/lib/admin-product-images.ts');

test('compact product images preserve original bytes when edited or reordered', () => {
  const original = { productId: 'product one', image: 'data:image/png;base64,YQ==', originalImage: 'data:image/png;base64,Yg==', normalizedImage: 'data:image/png;base64,Yw==', images: ['data:image/png;base64,YQ==', 'https://example.test/second.png'], stock: 9 };
  const compact = toAdminProduct({ ...original, image: '__techai_image_reference__:image', originalImage: '__techai_image_reference__:originalImage', normalizedImage: '__techai_image_reference__:normalizedImage', images: ['__techai_image_reference__:0', original.images[1]], updatedAt: new Date() });
  assert.ok(!JSON.stringify(compact).includes('data:image/'));
  const resolved = resolveProductImageReferences({ image: compact.images[1], images: [compact.images[1], compact.images[0]], originalImage: compact.originalImage, normalizedImage: compact.normalizedImage, stock: 12 }, original);
  assert.deepEqual(resolved.images, [original.images[1], original.images[0]]);
  assert.equal(resolved.originalImage, original.originalImage);
  assert.equal(resolved.normalizedImage, original.normalizedImage);
  assert.equal(resolved.stock, 12);
  assert.throws(() => resolveProductImageReferences({ image: '/api/products/other/image?field=image' }, original), /belong/);
  assert.throws(() => resolveProductImageReferences({ image: '/api/products/product%20one/image?field=99' }, original), /unavailable/);
});

test('dashboard shares concurrent reads, retains totals, and never serves its cache without admin auth', async () => {
  delete global.techAiAdminDashboardCache;
  delete global.techAiAdminDashboardInFlight;
  let session = { role: 'admin' }, connections = 0, fail = false;
  const query = value => { const q = { select: () => q, sort: () => q, limit: () => q, read: () => q, maxTimeMS: () => q, option: () => q, lean: () => q, then: (resolve, reject) => (fail ? Promise.reject(new Error('database offline')) : Promise.resolve(value)).then(resolve, reject) }; return q; };
  const load = loader({
    '@/lib/auth': { getSessionFromCookie: async () => session },
    '@/lib/mongodb': { connectToDatabase: async () => { connections++; await new Promise(resolve => setTimeout(resolve, 5)); } },
    '@/models/Order': { find: () => query([{ orderId: 'order1', finalAmount: 75, items: [{ productId: 'p1', price: 75 }] }]), aggregate: () => query([{ totalRevenue: 750, count: 10 }]) },
    '@/models/Product': { aggregate: pipeline => query(pipeline[0].$group ? [{ count: 20, lowStockCount: 2 }] : [{ productId: 'p1', price: 75 }]) },
    '@/models/User': { find: () => query([]), countDocuments: () => query(4) },
  });
  const { GET } = load('src/app/api/admin/stats/route.ts');
  try {
    const responses = await Promise.all([GET(), GET()]);
    assert.equal(connections, 1);
    const data = await responses[0].json();
    assert.equal(data.stats.totalRevenue, 750);
    assert.equal(data.stats.totalOrdersCount, 10);
    assert.match(data.orders[0].items[0].product.image, /^\/api\/orders\//);
    session = null;
    assert.equal((await GET()).status, 403);
    session = { role: 'admin' }; fail = true;
    global.techAiAdminDashboardCache.expiresAt = 0;
    const stale = await (await GET()).json();
    assert.equal(stale.isStale, true);
    assert.equal(stale.stats.totalRevenue, 750);
    delete global.techAiAdminDashboardCache;
    const unavailable = await GET();
    assert.equal(unavailable.status, 503);
    assert.equal((await unavailable.json()).stats, undefined);
  } finally {
    delete global.techAiAdminDashboardCache;
    delete global.techAiAdminDashboardInFlight;
  }
});

test('image endpoint returns the requested gallery slot with a bounded projection', async () => {
  let projection;
  const q = { select: value => { projection = value; return q; }, read: () => q, maxTimeMS: () => q, lean: async () => ({ productId: 'p1', images: ['data:image/png;base64,c2Vjb25k'] }) };
  const { GET } = loader({ '@/lib/mongodb': { connectToDatabase: async () => {} }, '@/models/Product': { findOne: () => q } })('src/app/api/products/[id]/image/route.ts');
  const response = await GET(new Request('http://local/image?field=1'), { params: Promise.resolve({ id: 'p1' }) });
  assert.equal(await response.text(), 'second');
  assert.deepEqual(projection, { productId: 1, images: { $slice: [1, 1] } });
});

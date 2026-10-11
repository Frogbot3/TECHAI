const test = require('node:test');
const assert = require('node:assert/strict');
const loader = require('./load-ts.cjs');
const { adminOrderQuery, adminOrdersPipeline } = loader()('src/lib/admin-orders.ts');
test('admin order filters escape search, combine filters and use inclusive IST dates', () => {
  const params = new URLSearchParams({ q: 'QA.*', status: 'Shipped', paymentStatus: 'Paid', paymentMethod: 'UPI', from: '2026-10-01', to: '2026-10-10', page: '2', limit: '10' });
  const query = adminOrderQuery(params);
  assert.equal(query.base.$or[0].orderId.$regex, 'QA\\.\\*');
  assert.equal(query.base.paymentStatus, 'Paid'); assert.equal(query.base.paymentMethod, 'UPI');
  assert.equal(query.base.createdAt.$gte.toISOString(), '2026-09-30T18:30:00.000Z');
  assert.equal(query.base.createdAt.$lte.toISOString(), '2026-10-10T18:29:59.999Z');
  const { pipeline } = adminOrdersPipeline(params); const facets = pipeline[2].$facet;
  assert.equal(pipeline[0].$match.status, undefined); // Summary spans statuses within other selected filters.
  assert.deepEqual(facets.orders[0], { $match: { status: 'Shipped' } });
  assert.deepEqual(facets.orders[1], { $sort: { createdAt: -1, _id: -1 } });
  assert.equal(facets.orders[2].$skip, 10); assert.equal(facets.orders[3].$limit, 10);
  assert.deepEqual(pipeline[1].$project, { 'items.image': 0, 'items.normalizedImage': 0 });
  assert.equal(facets.summary.length, 1); assert.equal(facets.summary[0].$group._id, '$status');
});
test('invalid order filters fail instead of silently producing empty results', () => {
  for (const params of [{ status: 'Cancelled' }, { paymentStatus: 'anything' }, { from: '2026-99-99' }, { from: '2026-02-30' }, { from: '2026-10-10', to: '2026-10-01' }]) assert.throws(() => adminOrderQuery(new URLSearchParams(params)));
  assert.equal(adminOrderQuery(new URLSearchParams('limit=999&page=NaN')).limit, 100);
  assert.equal(adminOrderQuery(new URLSearchParams('page=NaN')).page, 1);
});
test('export cutoff excludes new arrivals without widening the selected date range', () => {
  const query = adminOrderQuery(new URLSearchParams({ asOf: '2026-10-10T12:00:00Z' }));
  assert.equal(query.base.createdAt.$lte.toISOString(), '2026-10-10T12:00:00.000Z');
  const earlier = adminOrderQuery(new URLSearchParams({ to: '2026-10-01', asOf: '2026-10-10T12:00:00Z' }));
  assert.equal(earlier.base.createdAt.$lte.toISOString(), '2026-10-01T18:29:59.999Z');
  assert.throws(() => adminOrderQuery(new URLSearchParams({ asOf: 'invalid' })));
});
test('order list returns dataset-wide counts, historical items, and truthful errors', async () => {
  let fail = false, session = { role: 'admin' };
  const { GET } = loader({
    '@/lib/auth': { getSessionFromCookie: async () => session }, '@/lib/mongodb': { connectToDatabase: async () => {} },
    '@/models/Order': { aggregate: () => ({ read() { return this; }, option: async () => { if (fail) throw new Error('Offline'); return [{ orders: [{ orderId: 'o1', items: [{ productId: 'p1', title: 'Original title', price: 150, quantity: 2, selectedColor: 'Blue' }] }], total: [{ count: 350 }], summary: [{ _id: 'Placed', count: 300 }, { _id: 'Delivered', count: 50 }] }]; } }) },
  })('src/app/api/admin/orders/route.ts');
  const response = await GET(new Request('http://local/api/admin/orders?page=2&limit=20')); const data = await response.json();
  assert.equal(data.total, 350); assert.equal(data.pages, 18); assert.equal(data.summary.Placed, 300); assert.equal(data.orders.length, 1);
  assert.equal(data.orders[0].items[0].product.price, 150); assert.equal(data.orders[0].items[0].selectedColor, 'Blue');
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  fail = true; const failed = await GET(new Request('http://local/api/admin/orders')); assert.equal(failed.status, 503); assert.equal((await failed.json()).summary, undefined);
  session = null; assert.equal((await GET(new Request('http://local/api/admin/orders'))).status, 403);
});
test('opening an order is read-only and uses its exact saved snapshot, not the catalog', async () => {
  const lookups = [];
  const chain = value => { const q = { select: () => q, read: () => q, maxTimeMS: () => q, sort: () => q, limit: () => q, lean: async () => value }; return q; };
  const { GET } = loader({
    '@/lib/auth': { getSessionFromCookie: async () => ({ role: 'admin' }) }, '@/lib/mongodb': { connectToDatabase: async () => {} },
    '@/models/Order': { findOne: filter => { lookups.push(filter); return chain({ orderId: 'order-1', items: [{ productId: 'p1', title: 'Purchased product', price: 123, quantity: 2 }], totalAmount: 246, discountAmount: 20, discountCode: 'SAVE', shippingFee: 0, finalAmount: 226, paymentStatus: 'Pending', status: 'Placed' }); } },
    '@/models/Refund': { find: filter => { assert.deepEqual(filter, { orderId: 'order-1' }); return chain([]); } },
    '@/models/Product': { find: () => { throw new Error('Must never read the catalog'); } },
  })('src/app/api/admin/orders/[id]/route.ts');
  const response = await GET(new Request('http://local/order'), { params: Promise.resolve({ id: 'order-1' }) });
  const data = await response.json(); assert.deepEqual(lookups, [{ orderId: 'order-1' }]); assert.equal(data.order.items[0].product.price, 123); assert.equal(data.order.finalAmount, 226); assert.equal(data.order.paymentStatus, 'Pending'); assert.equal(data.order.status, 'Placed');
});

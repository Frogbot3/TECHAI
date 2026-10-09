const test = require('node:test');
const assert = require('node:assert/strict');
const loader = require('./load-ts.cjs');
const { validateCoupon, calculateCouponDiscount, couponStatus, legacyCoupon } = loader()('src/lib/coupons.ts');
const offer = { ...legacyCoupon, code: 'SAVE20', value: 20 };
const request = (body, method = 'POST') => new Request('http://local/api', { method, body: JSON.stringify(body) });
const query = value => { const q = { select: () => q, sort: () => q, skip: () => q, limit: () => q, maxTimeMS: () => q, lean: async () => value }; return q; };

test('coupon amounts enforce minimum, cap, subtotal and inclusive expiry boundaries', () => {
  assert.equal(calculateCouponDiscount({ ...offer, maximumDiscount: 150 }, 1000), 150);
  assert.equal(calculateCouponDiscount({ ...offer, type: 'fixed', value: 2000 }, 1000), 1000);
  assert.throws(() => calculateCouponDiscount({ ...offer, minimumSpend: 1500 }, 1000), /Minimum spend/);
  assert.throws(() => calculateCouponDiscount({ ...offer, published: false }, 1000), /not currently active/);
  const scheduled = { ...offer, startsAt: '2026-10-10T00:00:00Z', endsAt: '2026-10-11T00:00:00Z' };
  assert.equal(couponStatus(scheduled, Date.parse('2026-10-09T23:59:59Z')), 'Scheduled');
  assert.equal(couponStatus(scheduled, Date.parse(scheduled.startsAt)), 'Active');
  assert.equal(couponStatus(scheduled, Date.parse(scheduled.endsAt)), 'Expired');
  assert.throws(() => calculateCouponDiscount(offer, Infinity), /Add items/);
});

test('coupon validation normalizes codes and rejects malformed or unsafe discounts', () => {
  assert.equal(validateCoupon({ ...offer, code: ' save20 ' }).code, 'SAVE20');
  for (const change of [{ value: 101 }, { value: -2 }, { value: Infinity }, { code: { $ne: '' } }, { published: 'false' }, { startsAt: 'wrong' }, { startsAt: '2026-11-01', endsAt: '2026-10-01' }]) assert.throws(() => validateCoupon({ ...offer, ...change }));
});

test('saved welcome coupon overrides legacy fallback including paused and expired states', async () => {
  let record = null;
  const { resolveCouponDiscount } = loader({ '@/models/Coupon': { findOne: () => query(record) } })('src/lib/server-coupons.ts');
  assert.equal((await resolveCouponDiscount('techai10', 1000)).discount, 100);
  record = { ...legacyCoupon, published: false };
  await assert.rejects(() => resolveCouponDiscount('TECHAI10', 1000), /not currently active/);
  record = { ...legacyCoupon, value: 5 };
  assert.equal((await resolveCouponDiscount('TECHAI10', 1000)).discount, 50);
  record = null;
  await assert.rejects(() => resolveCouponDiscount('OTHER', 1000), /not found/);
});

test('admin coupon saves validate before writes, normalize records and preserve welcome overrides', async () => {
  const writes = [];
  const routes = loader({
    '@/lib/auth': { getSessionFromCookie: async () => ({ role: 'admin' }) },
    '@/lib/mongodb': { connectToDatabase: async () => {} },
    '@/models/Coupon': { create: async data => { writes.push(data); return data; }, findOneAndUpdate: async (filter, update, options) => { writes.push({ filter, update, options }); return update.$set; } },
  })('src/app/api/admin/coupons/route.ts');
  assert.equal((await routes.POST(request({ ...offer, value: 500 }))).status, 400);
  assert.equal(writes.length, 0);
  assert.equal((await routes.POST(request(offer))).status, 200);
  assert.equal(writes[0].code, 'SAVE20');
  assert.equal((await routes.PATCH(request({ ...legacyCoupon, published: false }, 'PATCH'))).status, 200);
  assert.equal(writes[1].options.upsert, true);
  assert.equal(writes[1].update.$set.published, false);
});

test('order creation uses trusted prices and rejects inactive coupons before stock writes', async () => {
  let coupon = { ...offer, value: 20 }, stockWrites = 0, saved;
  const product = { productId: 'p1', title: 'Headphones', price: 1000, stock: 10, image: '/test.png' };
  const { POST } = loader({
    '@/lib/auth': { getSessionFromCookie: async () => ({ role: 'customer', id: 'customer1' }) },
    '@/lib/mongodb': { connectToDatabase: async () => {} },
    '@/models/Coupon': { findOne: () => query(coupon) },
    '@/models/Product': { findOne: async () => product, findOneAndUpdate: async () => { stockWrites++; return product; } },
    '@/models/User': { findOneAndUpdate: async () => null },
    '@/models/Order': { create: async data => { saved = data; return data; } },
  })('src/app/api/orders/route.ts');
  const body = { items: [{ product: { id: 'p1', price: 1 }, quantity: 2 }], shippingAddress: { fullName: 'QA', street: 'Test', city: 'Test', state: 'Test', pincode: '560001' }, discountCode: 'SAVE20', discountAmount: 1999, paymentMethod: 'COD' };
  assert.equal((await POST(request(body))).status, 200);
  assert.equal(saved.discountAmount, 400);
  assert.equal(saved.finalAmount, 1600);
  assert.equal(saved.discountCode, 'SAVE20');
  assert.equal(stockWrites, 1);
  coupon = { ...coupon, published: false };
  assert.equal((await POST(request(body))).status, 400);
  assert.equal(stockWrites, 1);
});

test('customer detail filters by account identity, bounds pages and excludes credential fields', async () => {
  const id = '507f1f77bcf86cd799439011'; let projection, filter, aggregateFilter, skipped, limited;
  const customerQ = query({ _id: id, name: 'QA', role: 'customer', emailOtpHash: 'not-exposed', firebaseUid: 'private', addresses: [] });
  customerQ.select = fields => { projection = fields; return customerQ; };
  const orderQ = query([{ orderId: 'one', finalAmount: 100, items: [] }]);
  orderQ.skip = v => { skipped = v; return orderQ; }; orderQ.limit = v => { limited = v; return orderQ; };
  const { GET } = loader({
    '@/lib/auth': { getSessionFromCookie: async () => ({ role: 'admin' }) },
    '@/lib/mongodb': { connectToDatabase: async () => {} },
    '@/models/User': { findOne: () => customerQ },
    '@/models/Order': { find: f => { filter = f; return orderQ; }, aggregate: pipeline => { aggregateFilter = pipeline[0].$match; return { option: async () => [{ totalOrders: 101, paidAmount: 500, refundedAmount: 100, deliveredOrders: 2 }] }; } },
  })('src/app/api/admin/customers/[id]/route.ts');
  const res = await GET(new Request('http://local/api?page=2&limit=999&phone=shared'), { params: Promise.resolve({ id }) });
  assert.equal(res.status, 200); const data = await res.json();
  assert.deepEqual(filter, { customerId: id }); assert.deepEqual(aggregateFilter, filter);
  assert.equal(limited, 50); assert.equal(skipped, 50); assert.equal(data.pages, 3);
  assert(!projection.includes('Otp')); assert(!JSON.stringify(data).includes('not-exposed')); assert(!JSON.stringify(data).includes('private'));
  assert.equal(res.headers.get('Cache-Control'), 'no-store');
});

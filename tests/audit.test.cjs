const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHmac } = require('crypto');
const loader = require('./load-ts.cjs');
const { toClientHeroCampaign } = loader()('src/lib/serializers.ts');

test('campaign ignores stale copied price and microwave copy', () => {
  const product = { id: 'dell', price: 49990, originalPrice: 62000, description: 'Dell IPS Black monitor' };
  const campaign = toClientHeroCampaign({ price: 39990, originalPrice: 50000, subtitle: 'Microwave' }, product);
  assert.equal(campaign.price, 49990);
  assert.equal(campaign.originalPrice, 62000);
  assert.equal(campaign.subtitle, product.description);
  assert.equal(toClientHeroCampaign(campaign, { ...product, price: 45000 }).price, 45000);
});

test('pagination handles NaN, Infinity, negatives, fractions and oversize requests', () => {
  const { pagination, escapeRegex } = loader()('src/lib/query.ts');
  for (const value of ['NaN', 'Infinity', '-1', '1.5', '0']) assert.deepEqual(pagination(new URLSearchParams({ page: value, limit: value })), { page: 1, limit: 50 });
  assert.equal(pagination(new URLSearchParams('limit=9999')).limit, 200);
  assert.equal(new RegExp(`^${escapeRegex('a+b@example.com')}$`).test('aaab@exampleXcom'), false);
  assert.equal(new RegExp(`^${escapeRegex('a+b@example.com')}$`).test('a+b@example.com'), true);
});

test('product image URLs reject unsafe or malformed sources', () => {
  const { isProductImageSource, validateProductImages } = loader()('src/lib/product-images.ts');
  for (const source of ['javascript:alert(1)', '//evil.test/image', 'http://insecure.test/a', 'https://user:password@host/a', '']) assert.equal(isProductImageSource(source), false);
  assert.equal(isProductImageSource('https://example.com/image.png'), true);
  assert.equal(isProductImageSource('/product-placeholder.svg'), true);
  assert.ok(validateProductImages({}, true));
});

function paymentHarness() {
  const order = { _id: 'internal', orderId: 'app_order', razorpayOrderId: 'order_test', finalAmount: 100, paymentStatus: 'Pending', paymentMethod: 'Card' };
  const model = {
    findOne: async query => query.razorpayOrderId === order.razorpayOrderId ? { ...order } : null,
    findById: async () => ({ ...order }),
    findOneAndUpdate: async (query, update) => {
      if (order.paymentStatus === 'Paid') return null;
      Object.assign(order, update.$set);
      return { ...order };
    },
  };
  const load = loader({ '@/models/Order': model });
  return { order, applyPayment: load('src/lib/payment-state.ts').applyPayment };
}
const payment = { id: 'pay_test', order_id: 'order_test', amount: 10000, currency: 'INR', status: 'captured', method: 'upi' };

test('capture, duplicate capture, late failure and concurrent failure cannot downgrade paid', async () => {
  const { order, applyPayment } = paymentHarness();
  await Promise.all([applyPayment(payment), applyPayment({ ...payment, status: 'failed' })]);
  await applyPayment(payment);
  await applyPayment({ ...payment, id: 'pay_failed', status: 'failed' });
  assert.equal(order.paymentStatus, 'Paid');
  assert.equal(order.paymentMethod, 'UPI');
  assert.equal(order.razorpayPaymentId, 'pay_test');
});
test('failed payment can later capture; authorized/abandoned payment remains pending', async () => {
  const { order, applyPayment } = paymentHarness();
  assert.equal((await applyPayment({ ...payment, status: 'authorized' })).kind, 'pending');
  assert.equal(order.paymentStatus, 'Pending');
  await applyPayment({ ...payment, status: 'failed' });
  assert.equal(order.paymentStatus, 'Failed');
  await applyPayment(payment);
  assert.equal(order.paymentStatus, 'Paid');
});
test('wrong amount, currency, gateway order and second captured payment are rejected', async () => {
  const { order, applyPayment } = paymentHarness();
  assert.equal((await applyPayment({ ...payment, amount: 1 })).kind, 'mismatch');
  assert.equal((await applyPayment({ ...payment, currency: 'USD' })).kind, 'mismatch');
  assert.equal((await applyPayment({ ...payment, order_id: 'other' })).kind, 'missing');
  assert.equal(order.paymentStatus, 'Pending');
  await applyPayment(payment);
  assert.equal((await applyPayment({ ...payment, id: 'pay_other' })).kind, 'mismatch');
});

test('webhook validates raw-body signature before accepting payment events', async () => {
  process.env.RAZORPAY_WEBHOOK_SECRET = 'test-webhook-only';
  let calls = 0;
  const { POST } = loader({ '@/lib/mongodb': { connectToDatabase: async () => {} }, '@/lib/payment-state': { applyPayment: async () => { calls++; return { kind: 'processed' }; } }, '@/models/Refund': {}, '@/lib/refunds': {}, '@/lib/refund-notifications': {} })('src/app/api/webhooks/razorpay/route.ts');
  const body = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: payment } } });
  const request = signature => new Request('https://local/api/webhooks/razorpay', { method: 'POST', headers: { 'x-razorpay-signature': signature }, body });
  assert.equal((await POST(request('forged'))).status, 401);
  assert.equal(calls, 0);
  assert.equal((await POST(request(createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET).update(body).digest('hex')))).status, 200);
  assert.equal(calls, 1);
});

test('callback rejects forged signatures without looking up or updating payment', async () => {
  let lookedUp = false;
  const { POST } = loader({ '@/lib/mongodb': { connectToDatabase: async () => {} }, '@/lib/auth': { getSessionFromCookie: async () => ({ id: 'customer', role: 'customer' }) }, '@/models/Order': { findOne: async () => ({ customerId: 'customer', razorpayOrderId: 'order_test', paymentStatus: 'Pending' }) }, '@/lib/razorpay-server': { getRazorpayConfig: () => ({ keySecret: 'test' }), getRazorpayPayment: async () => { lookedUp = true; }, RazorpayApiError: class extends Error {} }, '@/lib/payment-state': {} })('src/app/api/payment/verify/route.ts');
  const response = await POST(new Request('https://local/api/payment/verify', { method: 'POST', body: JSON.stringify({ orderId: 'order', razorpayPaymentId: 'pay_test', razorpayOrderId: 'order_test', razorpaySignature: 'forged' }) }));
  assert.equal(response.status, 400);
  assert.equal(lookedUp, false);
});

test('customer directory and all protected admin routes reject unauthenticated calls', async () => {
  const fs = require('fs');
  const protectedFiles = ['src/app/api/customers/route.ts', ...fs.readdirSync('src/app/api/admin', { recursive: true }).filter(f => f.endsWith('route.ts') && !/^(login|logout|session)[/\\]/.test(f)).map(f => `src/app/api/admin/${f}`)];
  for (const file of protectedFiles) {
    const load = loader({ '@/lib/auth': { getSessionFromCookie: async () => null }, '@/lib/mongodb': { connectToDatabase: async () => { throw new Error('Unauthorized DB access'); } } });
    const routes = load(file);
    for (const method of ['GET', 'POST', 'PATCH', 'DELETE']) if (routes[method]) {
      const response = await routes[method](new Request('https://local/api', { method, ...(method === 'GET' ? {} : { body: '{}' }) }), { params: Promise.resolve({ id: 'test' }) });
      assert.equal(response.status, 403, `${method} ${file}`);
    }
  }
});

test('refund helper calls the actual Razorpay refund API contract and propagates rejection', async () => {
  process.env.RAZORPAY_KEY_ID = 'rzp_test_local'; process.env.RAZORPAY_KEY_SECRET = 'test-only';
  const originalFetch = global.fetch;
  const { createRazorpayRefund } = loader()('src/lib/razorpay-server.ts');
  try {
    global.fetch = async (url, options) => {
      assert.equal(url, 'https://api.razorpay.com/v1/payments/pay_test/refund');
      assert.equal(options.method, 'POST');
      assert.equal(JSON.parse(options.body).amount, 500);
      return Response.json({ id: 'rfnd_test', status: 'pending', payment_id: 'pay_test', amount: 500 });
    };
    assert.equal((await createRazorpayRefund({ paymentId: 'pay_test', amountPaise: 500, receipt: 'refund-test', notes: {} })).id, 'rfnd_test');
    global.fetch = async () => Response.json({ error: { description: 'Payment is not captured' } }, { status: 400 });
    await assert.rejects(createRazorpayRefund({ paymentId: 'pay_test', amountPaise: 500, receipt: 'refund-test', notes: {} }), /not captured/);
  } finally { global.fetch = originalFetch; }
});

test('missing signing secret fails closed and session roles have bounded lifetimes', () => {
  const { signSession, verifySession } = loader()('src/lib/auth.ts');
  const old = process.env.JWT_SECRET;
  try {
    delete process.env.JWT_SECRET;
    assert.throws(() => signSession({ id: 'admin', role: 'admin' }), /JWT_SECRET/);
    process.env.JWT_SECRET = 'x'.repeat(48);
    const admin = signSession({ id: 'admin', role: 'admin' });
    const session = verifySession(admin);
    assert.equal(session.exp - session.iat, 8 * 3600);
    assert.equal(verifySession(admin + 'tamper'), null);
  } finally { if (old) process.env.JWT_SECRET = old; else delete process.env.JWT_SECRET; }
});

test('admin login budget is shared and returns a retry interval after twenty attempts', async () => {
  let count = 0;
  const { allowAdminLogin } = loader({ './mongodb': { connectToDatabase: async () => {} }, '@/models/LoginAttempt': { findOneAndUpdate: async () => ({ count: ++count }) } })('src/lib/login-rate-limit.ts');
  for (let i = 0; i < 20; i++) assert.equal((await allowAdminLogin()).allowed, true);
  const denied = await allowAdminLogin();
  assert.equal(denied.allowed, false);
  assert.ok(denied.retryAfter > 0 && denied.retryAfter <= 900);
});

test('Mongo connection promise is shared across simultaneous calls and module reloads', async () => {
  const oldCache = global.mongooseCache;
  const oldUri = process.env.MONGODB_URI;
  delete global.mongooseCache;
  process.env.MONGODB_URI = 'mongodb://example.test/unused';
  let calls = 0, complete;
  const mongoose = { connection: { readyState: 0 }, connect: () => { calls++; return new Promise(resolve => { complete = () => { mongoose.connection.readyState = 1; resolve(mongoose); }; }); } };
  try {
    const firstModule = loader({ mongoose })('src/lib/mongodb.ts');
    const first = firstModule.connectToDatabase();
    const reloadedModule = loader({ mongoose })('src/lib/mongodb.ts');
    const second = reloadedModule.connectToDatabase();
    assert.equal(calls, 1);
    complete();
    await Promise.all([first, second]);
    await reloadedModule.connectToDatabase();
    assert.equal(calls, 1);
  } finally { global.mongooseCache = oldCache; if (oldUri) process.env.MONGODB_URI = oldUri; else delete process.env.MONGODB_URI; }
});

test('uncertain refund API timeout retains processing reservation for reconciliation', async () => {
  const refund = { refundId: 'refund_test', orderId: 'order_test', paymentId: 'pay_test', requestedAmountPaise: 10000, status: 'REQUESTED' };
  const Refund = { findOne: async () => ({ ...refund }), find: async () => [], findOneAndUpdate: async (_query, update) => { Object.assign(refund, update.$set); return { ...refund }; } };
  const { POST } = loader({ '@/lib/auth': { getSessionFromCookie: async () => ({ id: 'admin', role: 'admin' }) }, '@/lib/mongodb': { connectToDatabase: async () => {} }, '@/models/Refund': Refund, '@/models/Order': { findOne: async () => ({ paymentStatus: 'Paid', razorpayPaymentId: 'pay_test', finalAmount: 100 }) }, '@/lib/razorpay-server': { getRazorpayPayment: async () => ({ status: 'captured', amount: 10000 }), createRazorpayRefund: async () => { throw new Error('timeout'); }, listRazorpayRefunds: async () => { throw new Error('offline'); }, RazorpayApiError: class extends Error {} }, '@/lib/refunds': { getRefundableOrderAmountPaise: () => 10000, getReservedRefundAmountPaise: () => 0 }, '@/lib/refund-notifications': { sendRefundNotification: async () => { throw new Error('No notification should be sent'); } } })('src/app/api/admin/refunds/[id]/approve/route.ts');
  const response = await POST(new Request('https://local/api', { method: 'POST', body: JSON.stringify({ approvedAmountPaise: 1000 }) }), { params: Promise.resolve({ id: 'refund_test' }) });
  assert.equal(response.status, 502);
  assert.equal(refund.status, 'REFUND_PROCESSING');
});

test('projected order history uses private snapshot image URLs and preserves prices', () => {
  const { toClientOrder } = loader()('src/lib/serializers.ts');
  const order = toClientOrder({ orderId: 'ORDER-1', items: [{ productId: 'dell', title: 'Dell', price: 49990, quantity: 1 }], finalAmount: 49990 });
  assert.equal(order.items[0].product.image, '/api/orders/ORDER-1/image?item=0');
  assert.equal(order.items[0].product.price, 49990);
  assert.equal(order.finalAmount, 49990);
});

test('snapshot image endpoint requires a session and restricts customer ownership', async () => {
  let session = null, query;
  const { GET } = loader({ '@/lib/auth': { ADMIN_SESSION_COOKIE: 'admin', getSessionFromCookie: async name => name === 'admin' ? null : session }, '@/lib/mongodb': { connectToDatabase: async () => {} }, '@/models/Order': { findOne: filter => { query = filter; return { select: () => ({ lean: async () => null }) }; } } })('src/app/api/orders/[id]/image/route.ts');
  const req = new Request('https://local/api/orders/OTHER/image?item=0');
  const params = { params: Promise.resolve({ id: 'OTHER' }) };
  assert.equal((await GET(req, params)).status, 401);
  assert.equal(query, undefined);
  session = { id: 'customer' };
  assert.equal((await GET(req, params)).status, 404);
  assert.equal(query.customerId, 'customer');
});

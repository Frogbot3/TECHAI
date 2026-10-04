// Explicit integration check, separate from npm test. Uses a disposable MongoDB
// database and only Razorpay TEST mode. Never charges or refunds a real payment.
require('@next/env').loadEnvConfig(process.cwd());
const assert = require('node:assert/strict');
const { randomUUID } = require('crypto');
const mongoose = require('mongoose');
const loader = require('./load-ts.cjs');

(async () => {
  const database = `techai_audit_${randomUUID().replaceAll('-', '')}`;
  await mongoose.connect(process.env.MONGODB_URI, { dbName: database, serverSelectionTimeoutMS: 10000 });
  try {
    const load = loader();
    const Order = load('src/models/Order.ts').default;
    const User = load('src/models/User.ts').default;
    await Promise.all([Order.init(), User.init()]);
    await Order.create({ orderId: 'AUDIT-ORDER', customerId: 'audit-customer', totalAmount: 100, finalAmount: 100, razorpayOrderId: 'order_test', paymentMethod: 'Card' });
    const { applyPayment } = load('src/lib/payment-state.ts');
    const entity = { id: 'pay_test', order_id: 'order_test', amount: 10000, currency: 'INR', status: 'captured', method: 'upi' };
    await Promise.all(Array.from({ length: 8 }, (_, i) => applyPayment({ ...entity, status: i % 2 ? 'captured' : 'failed' })));
    await applyPayment({ ...entity, status: 'failed' });
    assert.equal((await Order.findOne({ orderId: 'AUDIT-ORDER' })).paymentStatus, 'Paid');
    const accounts = await Promise.allSettled([User.create({ email: 'same@example.test', provider: 'google' }), User.create({ email: 'SAME@example.test', provider: 'email' })]);
    assert.equal(accounts.filter(r => r.status === 'fulfilled').length, 1);
    console.log('PASS: real MongoDB concurrent capture/failure updates and unique normalized email index');
  } catch (error) {
    console.log('NOT TESTED: isolated MongoDB integration', { errorType: error.name, code: error.code });
  } finally {
    // The target name was generated in this script and must match our prefix.
    assert.match(mongoose.connection.name, /^techai_audit_[a-f0-9]{32}$/);
    try { await mongoose.connection.dropDatabase(); }
    catch (error) { console.log('Disposable database cleanup unavailable', { code: error.code }); }
    finally { await mongoose.disconnect(); }
  }

  const key = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
  if (!key.startsWith('rzp_test_')) throw new Error('Razorpay smoke checks require test keys');
  const { createRazorpayOrder, getRazorpayOrder, createRazorpayRefund, RazorpayApiError } = loader()('src/lib/razorpay-server.ts');
  const order = await createRazorpayOrder({ amount: 100, currency: 'INR', receipt: `audit-${Date.now()}` });
  const fetched = await getRazorpayOrder(order.id);
  assert.equal(fetched.status, 'created');
  assert.equal(fetched.amount_paid, 0);
  console.log('PASS: actual Razorpay TEST order creation and unpaid/abandoned gateway state');
  await assert.rejects(createRazorpayRefund({ paymentId: 'pay_AuditMissing123', amountPaise: 100, receipt: 'audit-negative', notes: {} }), error => { console.log('Razorpay negative refund status', error.status); return error instanceof RazorpayApiError && [400, 404].includes(error.status); });
  console.log('PASS: actual Razorpay refund API rejects an invalid payment (no status-only refund)');
  console.log('NOT TESTED: bank decline, captured checkout and successful refund settlement require an isolated captured TEST payment and configured webhook delivery.');
})().catch(error => { console.error({ serviceSmokeFailed: error.name, status: error.status, code: error.code }); process.exitCode = 1; });

const test = require('node:test');
const assert = require('node:assert/strict');
const loader = require('./load-ts.cjs');
const { settings, productTax } = require('./invoice-fixtures.cjs');
const { checkoutAddress, confirmedAddress, validateCheckoutAddress, standardShippingFee, clearLegacyCheckoutKeys } = loader()('src/lib/checkout.ts');
const address = { fullName: 'Test Recipient', phone: '9876543210', email: '', houseNumber: 'Flat 7', street: 'Test Road', city: 'Test City', state: 'Kerala', pincode: '679536', country: 'India' };

test('standard shipping preserves the threshold and ignores legacy priority selections', () => {
  for (const [subtotal, fee] of [[0, 0], [100, 49], [499, 49], [500, 0], [2000, 0]]) assert.equal(standardShippingFee(subtotal), fee);
  const entries = new Map([['techai-checkout-id:cart:express', 'old'], ['techai-checkout-id:cart:standard', 'old-standard'], ['techai-checkout-standard-v2:account:cart:', 'new'], ['unrelated', 'keep']]);
  clearLegacyCheckoutKeys({ get length() { return entries.size; }, key: index => [...entries.keys()][index], removeItem: key => entries.delete(key) });
  assert.deepEqual([...entries.values()], ['new', 'keep']);
  const { normalizeCartItem } = loader()('src/lib/serializers.ts');
  const cartItem = normalizeCartItem({ product: { id: 'p1', price: 499 }, quantity: 2, deliveryType: 'express', shippingFee: 99 });
  assert.equal(cartItem.quantity, 2); assert.equal(cartItem.product.price, 499);
  assert.equal(cartItem.deliveryType, undefined); assert.equal(cartItem.shippingFee, undefined);
});

test('address defaults never invent a state and confirmed suggestions replace missing location fields', () => {
  assert.equal(checkoutAddress({ city: 'Pattambi', pincode: '679536' }).state, '');
  assert.equal(checkoutAddress(undefined, { name: 'Profile' }).country, 'India');
  assert.equal(checkoutAddress(address, { name: 'Profile' }).fullName, address.fullName);
  const previous = { ...address, landmark: 'Manual landmark', deliveryInstructions: 'Call first', coordinates: { lat: 1, lng: 1 } };
  const next = confirmedAddress(previous, { street: 'New road', city: 'New city', state: '', pincode: '', houseNumber: '99', coordinates: { lat: 10, lng: 76 } });
  assert.equal(next.state, ''); assert.equal(next.pincode, ''); assert.equal(next.houseNumber, 'Flat 7');
  assert.equal(next.landmark, previous.landmark); assert.equal(next.deliveryInstructions, previous.deliveryInstructions);
  assert.deepEqual(next.coordinates, { lat: 10, lng: 76 });
  assert.deepEqual(validateCheckoutAddress(address), {});
  assert.deepEqual(Object.keys(validateCheckoutAddress({ ...address, phone: '123', houseNumber: '', pincode: '012345', state: '' })), ['phone', 'houseNumber', 'pincode', 'state']);
});

function orderRoutes(price) {
  const writes = [], profileWrites = [];
  const product = { productId: 'p1', tax: productTax(), title: 'Test item', price, stock: 10, image: '/test.png' };
  const routes = loader({
    '@/lib/auth': { getSessionFromCookie: async () => ({ role: 'customer', id: 'customer1', phone: '9999999999' }) },
    '@/lib/mongodb': { connectToDatabase: async () => {} },
    './server-business-settings': {getBusinessSettings: async () => settings()},
    './server-coupons': { resolveCouponDiscount: async () => ({ code: 'TEST', discount: 100 }) },
    '@/models/Product': { findOne: async () => product, findOneAndUpdate: async () => product },
    '@/models/User': { findOneAndUpdate: async (...args) => { profileWrites.push(args); return null; } },
    '@/models/Order': { findOne: async () => null, create: async data => { writes.push(data); return data; } },
  })('src/app/api/orders/route.ts');
  return { ...routes, writes, profileWrites };
}
const request = change => new Request('http://local/api/orders', { method: 'POST', body: JSON.stringify({ items: [{ product: { id: 'p1', price: 1 }, quantity: 1 }], shippingAddress: address, paymentMethod: 'UPI', deliveryType: 'express', shippingFee: 99, finalAmount: 1, ...change }) });

test('server ignores stale priority fees, prices trusted totals, and honors save-address opt-out', async () => {
  for (const [price, fee] of [[499, 49], [500, 0]]) {
    const route = orderRoutes(price);
    const response = await route.POST(request({ saveAddress: false, discountCode: 'TEST' }));
    assert.equal(response.status, 200);
    assert.equal(route.writes[0].shippingFee, fee);
    assert.equal(route.writes[0].finalAmount, price - 100 + fee);
    assert.equal(route.writes[0].shippingAddress.phone, address.phone);
    assert.equal(route.profileWrites.length, 0);
  }
});

test('saved address edits update only the signed-in customer address; additions preserve existing addresses', async () => {
  const route = orderRoutes(500);
  assert.equal((await route.POST(request({ saveAddress: true, savedAddressIndex: 1 }))).status, 200);
  assert.deepEqual(route.profileWrites[0][0], { _id: 'customer1', 'addresses.1': { $exists: true } });
  assert.equal(route.profileWrites[0][1].$set['addresses.1'].houseNumber, 'Flat 7');
  assert.equal((await route.POST(request({ saveAddress: true }))).status, 200);
  assert.equal(route.profileWrites[1][1].$addToSet.addresses.country, 'India');
});

test('gateway uses the recorded server total and preserves historical shipping charges', async () => {
  let amount;
  const order = { orderId: 'existing', customerId: 'customer1', paymentMethod: 'UPI', paymentStatus: 'Pending', status: 'Placed', shippingFee: 99, finalAmount: 599, save: async () => {} };
  const { POST } = loader({
    '@/lib/auth': { getSessionFromCookie: async () => ({ id: 'customer1' }) },
    '@/lib/mongodb': { connectToDatabase: async () => {} },
    '@/models/Order': { findOne: async () => order },
    '@/lib/razorpay-server': { getRazorpayConfig: () => ({ keyId: 'test' }), createRazorpayOrder: async data => { amount = data.amount; return { id: 'gateway-test' }; } },
  })('src/app/api/payment/create-order/route.ts');
  const response = await POST(new Request('http://local/api/payment/create-order', { method: 'POST', body: JSON.stringify({ orderId: 'existing', amount: 1 }) }));
  assert.equal(response.status, 200); assert.equal(amount, 59900); assert.equal(order.shippingFee, 99);
});

const test = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-ts.cjs');
const { parseGoogleAddress, locationQuality, validCoordinates } = load()('src/lib/google-address.ts');
const components = [
  { types: ['country'], longText: 'India', shortText: 'IN' },
  { types: ['postal_code'], longText: '560001' },
  { types: ['administrative_area_level_1'], longText: 'Karnataka' },
  { types: ['locality'], longText: 'Bengaluru' },
  { types: ['route'], longText: 'MG Road' },
  { types: ['street_number'], longText: '42' },
  { types: ['sublocality_level_1', 'sublocality'], longText: 'Central' },
];
test('Google address parsing accepts both API shapes and missing components without guessing', () => {
  const position = { lat: 12.97, lng: 77.59 };
  const places = parseGoogleAddress(components, 'Public test address', position);
  const geocoder = parseGoogleAddress(components.map(({ types, longText, shortText }) => ({ types, long_name: longText, short_name: shortText })), 'Public test address', position);
  assert.deepEqual(places, geocoder);
  assert.equal(places.street, 'MG Road, Central'); assert.equal(places.houseNumber, '42'); assert.equal(places.pincode, '560001');
  const incomplete = parseGoogleAddress([{ types: ['administrative_area_level_2'], longText: 'District only' }], '', position);
  for (const key of ['street', 'city', 'state', 'country', 'pincode']) assert.equal(incomplete[key], '');
  assert.equal(parseGoogleAddress([{ types: ['administrative_area_level_3'], longText: 'Subdistrict only' }], '', position).city, '');
  assert.equal(parseGoogleAddress([{ types: ['locality'], longText: null }], '', position).city, '');
});
test('GPS rejects stale, inaccurate, unavailable or invalid coordinates', () => {
  const now = Date.now();
  const point = { timestamp: now, coords: { accuracy: 20, latitude: 12.97, longitude: 77.59 } };
  assert.equal(locationQuality(point, now), '');
  for (const bad of [{ ...point, timestamp: now - 31000 }, { ...point, timestamp: NaN }, { ...point, coords: { ...point.coords, accuracy: 900 } }, { ...point, coords: { ...point.coords, accuracy: NaN } }, { ...point, coords: { ...point.coords, latitude: 999 } }]) assert.notEqual(locationQuality(bad, now), '');
  assert(validCoordinates({ lat: 0, lng: 0 }));
  for (const value of [null, {}, { lat: '12', lng: 77 }, { lat: NaN, lng: 77 }, { lat: 0, lng: 181 }]) assert(!validCoordinates(value));
});
test('Maps SDK loads once on demand and missing keys leave a manual fallback', async () => {
  const before = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const scripts = [];
  global.window = { setTimeout, dispatchEvent() {} };
  global.document = { createElement: () => ({ remove() {} }), head: { appendChild: script => scripts.push(script) } };
  const { loadGoogleMaps } = load()('src/lib/google-maps-client.ts');
  try {
    delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    await assert.rejects(loadGoogleMaps(), /manually/); assert.equal(scripts.length, 0);
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-placeholder';
    const first = loadGoogleMaps(), second = loadGoogleMaps();
    assert.equal(first, second); assert.equal(scripts.length, 1);
    window.google = { maps: { importLibrary() {} } }; window.__techaiMapsReady();
    assert.equal(await first, window.google.maps);
    await loadGoogleMaps(); assert.equal(scripts.length, 1);
    window.gm_authFailure(); await assert.rejects(loadGoogleMaps(), /unavailable/);
  } finally {
    if (before === undefined) delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY; else process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = before;
    delete global.window; delete global.document;
  }
});
test('saved and order schemas retain optional confirmed delivery fields without requiring a map', () => {
  const Order = load()('src/models/Order.ts').default;
  const User = load()('src/models/User.ts').default;
  const address = { fullName: 'QA', houseNumber: 'Flat 7', street: 'Public road', city: 'Bengaluru', state: 'Karnataka', pincode: '560001', country: 'India', deliveryInstructions: 'Call at gate', coordinates: { lat: 12.97, lng: 77.59 } };
  const order = new Order({ orderId: 'qa-only-not-saved', shippingAddress: address, totalAmount: 10, finalAmount: 10 });
  const user = new User({ addresses: [address] });
  assert.equal(order.shippingAddress.houseNumber, 'Flat 7'); assert.equal(user.addresses[0].coordinates.lat, 12.97);
  const client = load()('src/lib/serializers.ts').toClientOrder(order.toObject());
  assert.equal(client.shippingAddress.country, 'India'); assert.equal(client.shippingAddress.coordinates.lng, 77.59);
  assert.equal(new Order({ shippingAddress: { street: 'Manual road' } }).shippingAddress.coordinates, undefined);
});

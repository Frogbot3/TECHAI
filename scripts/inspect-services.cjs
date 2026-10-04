require('@next/env').loadEnvConfig(process.cwd());
const { MongoClient } = require('mongodb');
(async () => {
  const key = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
  console.log({ mongoConfigured: !!process.env.MONGODB_URI, jwtConfigured: !!process.env.JWT_SECRET, razorpayMode: key.startsWith('rzp_test_') ? 'test' : key.startsWith('rzp_live_') ? 'live' : 'unconfigured', webhookConfigured: !!process.env.RAZORPAY_WEBHOOK_SECRET });
  if (!process.env.MONGODB_URI) return;
  const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000, connectTimeoutMS: 8000 });
  try {
    const start = Date.now();
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME || 'techai');
    console.log({ connectionMs: Date.now() - start });
    console.log('Order indexes', (await db.collection('orders').indexes()).map(i => i.key));
    console.log('Campaigns', await db.collection('herocampaigns').find({}, { projection: { _id: 0, productId: 1, subtitle: 1, price: 1 } }).limit(20).toArray());
    const duplicates = await db.collection('users').aggregate([{ $match: { email: { $nin: ['', null] } } }, { $group: { _id: { $toLower: '$email' }, count: { $sum: 1 } } }, { $match: { count: { $gt: 1 } } }, { $count: 'duplicateEmailGroups' }]).toArray();
    console.log('Duplicate email summary', duplicates);
    console.log('Unique identity indexes', (await db.collection('users').indexes()).filter(index => index.unique).map(index => index.name));
    const phoneGroups = await db.collection('users').aggregate([{ $match: { phone: { $gt: '' } } }, { $group: { _id: '$phone', count: { $sum: 1 }, providers: { $addToSet: '$provider' } } }, { $match: { count: { $gt: 1 } } }]).toArray();
    console.log('Duplicate stored phone groups', phoneGroups.map(group => ({ count: group.count, providers: group.providers, placeholder: /^(google:|email:)/.test(group._id) })));
    const named = await db.collection('users').find({ name: /^jiyad/i }).toArray();
    console.log('Jiyad accounts', named.map((u, index) => ({ account: index + 1, provider: u.provider, hasEmail: !!u.email, hasPhone: !!u.phone && !u.phone.startsWith('google:'), hasFirebaseUid: !!u.firebaseUid, hasLoggedIn: !!u.lastLoginAt })));
    console.log('Jiyad shared identifiers', named.flatMap((a, i) => named.slice(i + 1).map(b => ({ email: !!a.email && a.email.trim().toLowerCase() === (b.email || '').trim().toLowerCase(), phone: !!a.phone && a.phone.replace(/\D/g, '').slice(-10) === (b.phone || '').replace(/\D/g, '').slice(-10) }))));
    const plan = await db.collection('orders').find({ customerId: String(named[0]?._id || '') }).sort({ createdAt: -1 }).limit(51).explain('executionStats');
    console.log('Order query stats', { executionTimeMillis: plan.executionStats.executionTimeMillis, totalKeysExamined: plan.executionStats.totalKeysExamined, totalDocsExamined: plan.executionStats.totalDocsExamined });
    console.log('Product document sizes', await db.collection('products').aggregate([{ $project: { _id: 0, productId: 1, bytes: { $bsonSize: '$$ROOT' }, imageBytes: { $strLenBytes: { $ifNull: ['$image', ''] } }, normalizedBytes: { $strLenBytes: { $ifNull: ['$normalizedImage', ''] } }, galleryBytes: { $sum: { $map: { input: { $ifNull: ['$images', []] }, as: 'image', in: { $strLenBytes: '$$image' } } } } } }, { $sort: { bytes: -1 } }, { $limit: 6 }]).toArray());
  } catch (error) { console.log({ databaseCheck: 'failed', errorType: error.name, code: error.code }); }
  finally { await client.close(); }
})();

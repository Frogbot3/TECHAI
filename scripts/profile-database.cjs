require('@next/env').loadEnvConfig(process.cwd());
const mongoose = require('mongoose');
(async () => {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB_NAME || 'techai', serverSelectionTimeoutMS: 10000, timeoutMS: 15000, maxPoolSize: 10 });
  try {
    const db = mongoose.connection.db;
    console.log('Driver versions', { mongoose: mongoose.version, driver: require('mongoose/node_modules/mongodb/package.json').version });
    for (const preference of ['primary', 'secondaryPreferred']) {
      for (const operation of ['exists', 'count', 'light-list']) {
        const start = Date.now();
        try {
          const options = { readPreference: preference, maxTimeMS: 3000 };
          if (operation === 'exists') await db.collection('products').findOne({}, { ...options, projection: { _id: 1 } });
          if (operation === 'count') await db.collection('products').countDocuments({}, options);
          if (operation === 'light-list') await db.collection('products').find({}, { ...options, projection: { normalizedImage: 0, originalImage: 0, images: 0 } }).sort({ createdAt: -1 }).limit(100).toArray();
          console.log({ preference, operation, ms: Date.now() - start, success: true });
        } catch (error) { console.log({ preference, operation, ms: Date.now() - start, error: error.name, code: error.code }); }
      }
    }
  } finally { await mongoose.disconnect(); }
})().catch(error => console.log({ error: error.name, code: error.code }));

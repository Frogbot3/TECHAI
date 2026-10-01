/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const { EJSON, MongoClient } = require("mongodb");

const projectRoot = path.resolve(__dirname, "..");
const envPath = path.join(projectRoot, ".env.local");

function loadEnvFile() {
  if (!fs.existsSync(envPath)) return {};
  return Object.fromEntries(
    fs.readFileSync(envPath, "utf8")
      .split(/\r?\n/)
      .filter((line) => line && !line.trim().startsWith("#"))
      .map((line) => {
        const separator = line.indexOf("=");
        return separator === -1 ? [line.trim(), ""] : [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
      })
  );
}

const fileEnv = loadEnvFile();
const sourceUri = process.env.MONGODB_URI || fileEnv.MONGODB_URI;
const sourceDbName = process.env.MONGODB_SOURCE_DB || fileEnv.MONGODB_SOURCE_DB || databaseFromUri(sourceUri) || "test";
const targetDbName = process.env.MONGODB_TARGET_DB || fileEnv.MONGODB_TARGET_DB || "techai";

function databaseFromUri(uri) {
  if (!uri) return "";
  const match = uri.match(/^mongodb(?:\+srv)?:\/\/[^/]+\/([^?]*)/i);
  return match?.[1] ? decodeURIComponent(match[1]) : "";
}

function assertConfigured() {
  if (!sourceUri) throw new Error("MONGODB_URI is not configured.");
  if (sourceDbName === targetDbName) throw new Error(`Source and target databases are both '${sourceDbName}'. Aborting.`);
}

function safeDateStamp() {
  return new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
}

async function collectionNames(db) {
  const collections = await db.listCollections({}, { nameOnly: true }).toArray();
  return collections.map((collection) => collection.name).filter((name) => !name.startsWith("system."));
}

async function counts(db, names) {
  const result = {};
  for (const name of names) result[name] = await db.collection(name).countDocuments();
  return result;
}

async function indexes(db, names) {
  const result = {};
  for (const name of names) result[name] = await db.collection(name).listIndexes().toArray();
  return result;
}

async function relationshipAudit(db) {
  const productIds = new Set(await db.collection("products").find({}, { projection: { productId: 1 } }).toArray().then((rows) => rows.map((row) => row.productId).filter(Boolean)));
  const orderIds = new Set(await db.collection("orders").find({}, { projection: { orderId: 1 } }).toArray().then((rows) => rows.map((row) => row.orderId).filter(Boolean)));
  const orphanOrderProducts = new Set();
  for await (const order of db.collection("orders").find({}, { projection: { items: 1 } })) {
    for (const item of order.items || []) if (item.productId && !productIds.has(item.productId)) orphanOrderProducts.add(item.productId);
  }
  const orphanRefundOrders = new Set();
  for await (const refund of db.collection("refunds").find({}, { projection: { orderId: 1 } })) {
    if (refund.orderId && !orderIds.has(refund.orderId)) orphanRefundOrders.add(refund.orderId);
  }
  const orphanCampaignProducts = new Set();
  for await (const campaign of db.collection("herocampaigns").find({}, { projection: { productId: 1 } })) {
    if (campaign.productId && !productIds.has(campaign.productId)) orphanCampaignProducts.add(campaign.productId);
  }
  return {
    orphanOrderProducts: [...orphanOrderProducts],
    orphanRefundOrders: [...orphanRefundOrders],
    orphanCampaignProducts: [...orphanCampaignProducts],
  };
}

async function audit(db, label) {
  const names = await collectionNames(db);
  return { database: label, collections: await counts(db, names), indexes: await indexes(db, names), relationships: await relationshipAudit(db) };
}

function cloneableIndex(index) {
  const options = { name: index.name };
  for (const key of ["unique", "sparse", "expireAfterSeconds", "partialFilterExpression", "collation", "weights", "default_language", "language_override", "hidden"]) {
    if (index[key] !== undefined) options[key] = index[key];
  }
  return { key: index.key, options };
}

async function backupCollection(source, backup, name) {
  const sourceCollection = source.collection(name);
  const backupCollection = backup.collection(name);
  const documents = [];
  for await (const document of sourceCollection.find({})) {
    documents.push(document);
    if (documents.length >= 500) {
      await backupCollection.insertMany(documents, { ordered: false });
      documents.length = 0;
    }
  }
  if (documents.length) await backupCollection.insertMany(documents, { ordered: false });
}

async function ensureIndexes(source, target, name) {
  const sourceIndexes = await source.collection(name).listIndexes().toArray();
  const targetIndexes = await target.collection(name).listIndexes().toArray();
  const targetNames = new Set(targetIndexes.map((index) => index.name));
  for (const sourceIndex of sourceIndexes.filter((index) => index.name !== "_id_")) {
    if (!targetNames.has(sourceIndex.name)) {
      const clone = cloneableIndex(sourceIndex);
      await target.collection(name).createIndex(clone.key, clone.options);
    }
  }
}

async function copyCollection(source, target, name) {
  const sourceCollection = source.collection(name);
  const targetCollection = target.collection(name);
  const conflicts = [];
  for await (const document of sourceCollection.find({})) {
    const existing = await targetCollection.findOne({ _id: document._id });
    if (existing && EJSON.stringify(existing) !== EJSON.stringify(document)) {
      conflicts.push(String(document._id));
      if (conflicts.length >= 10) break;
    }
  }
  if (conflicts.length) throw new Error(`Target collection '${name}' has conflicting _id values: ${conflicts.join(", ")}`);

  const pending = [];
  for await (const document of sourceCollection.find({})) {
    pending.push({ updateOne: { filter: { _id: document._id }, update: { $setOnInsert: document }, upsert: true } });
    if (pending.length >= 500) {
      await targetCollection.bulkWrite(pending, { ordered: true });
      pending.length = 0;
    }
  }
  if (pending.length) await targetCollection.bulkWrite(pending, { ordered: true });
}

async function migrate(source, target, client) {
  const names = await collectionNames(source);
  const backupName = `${sourceDbName}_backup_${safeDateStamp()}`;
  const backup = client.db(backupName);
  const backupCollections = await collectionNames(backup);
  if (backupCollections.length) throw new Error(`Backup database '${backupName}' already contains collections.`);

  for (const name of names) await backupCollection(source, backup, name);
  for (const name of names) {
    await copyCollection(source, target, name);
    await ensureIndexes(source, target, name);
  }

  const sourceCounts = await counts(source, names);
  const targetCounts = await counts(target, names);
  for (const name of names) if (targetCounts[name] < sourceCounts[name]) throw new Error(`Verification failed for '${name}': target has fewer documents.`);
  return { backupDatabase: backupName, sourceCounts, targetCounts, relationships: await relationshipAudit(target) };
}

async function main() {
  assertConfigured();
  const execute = process.argv.includes("--execute");
  const client = new MongoClient(sourceUri, { maxPoolSize: 10, serverSelectionTimeoutMS: 15000 });
  await client.connect();
  try {
    const source = client.db(sourceDbName);
    const target = client.db(targetDbName);
    const before = await audit(source, sourceDbName);
    console.log(JSON.stringify({ mode: execute ? "execute" : "audit", before }, null, 2));
    if (!execute) return;
    const migration = await migrate(source, target, client);
    const after = await audit(target, targetDbName);
    console.log(JSON.stringify({ migration, after }, null, 2));
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

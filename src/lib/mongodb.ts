import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "techai";

if (!MONGODB_URI) {
  console.warn("⚠️ MONGODB_URI environment variable is not defined. Falling back to local MongoDB.");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };
global.mongooseCache = cached;

export async function connectToDatabase() {
  if (!MONGODB_URI) {
    throw new Error("Database is not configured. Set MONGODB_URI in the deployment environment.");
  }
  // A cached Mongoose instance is not necessarily connected. Reusing one after
  // Atlas/network disconnects is what previously left requests waiting on a
  // dead topology.
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }
  if (mongoose.connection.readyState !== 2) {
    cached.conn = null;
    cached.promise = null;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      dbName: MONGODB_DB_NAME,
      maxPoolSize: 5,
      maxConnecting: 1,
      minPoolSize: 0,
      maxIdleTimeMS: 10000,
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
      socketTimeoutMS: 10000,
      waitQueueTimeoutMS: 3000,
      heartbeatFrequencyMS: 10000,
      timeoutMS: 5000,
      retryReads: true,
      retryWrites: true,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
      console.log("✅ MongoDB Connected Successfully to TECH AI Database");
      console.log(`MongoDB database selected: ${MONGODB_DB_NAME}`);
      return m;
    }).catch((err) => {
      console.warn("⚠️ MongoDB connection error:", err.message);
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

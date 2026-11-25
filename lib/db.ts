import mongoose from 'mongoose';

const DB_USERNAME = process.env.DB_USERNAME || '';
const DB_PASS = process.env.DB_PASS || '';
const DB_NAME = process.env.DB_NAME || 'bhabhikichai';
const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };
if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const candidateUris: string[] = [];

    if (MONGODB_URI) {
      candidateUris.push(MONGODB_URI);
    }

    if (DB_USERNAME && DB_PASS) {
      candidateUris.push(
        `mongodb://${encodeURIComponent(DB_USERNAME)}:${encodeURIComponent(DB_PASS)}@127.0.0.1:27017/${DB_NAME}?authSource=admin`
      );
      candidateUris.push(
        `mongodb://${encodeURIComponent(DB_USERNAME)}:${encodeURIComponent(DB_PASS)}@127.0.0.1:27017/${DB_NAME}`
      );
    }

    // Local standard fallback without auth
    candidateUris.push(`mongodb://127.0.0.1:27017/${DB_NAME}`);

    cached.promise = (async () => {
      let lastErr: unknown = null;
      for (const uri of candidateUris) {
        try {
          const conn = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 3000,
            bufferCommands: false,
          });
          return conn;
        } catch (err) {
          lastErr = err;
        }
      }
      throw lastErr || new Error('Failed to connect to MongoDB');
    })();
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
}

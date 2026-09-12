import mongoose from 'mongoose';
import { Resolver } from 'dns';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cloudmar';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

/**
 * Resolves mongodb+srv:// URIs to direct seed-list URIs using Google/Cloudflare DNS.
 * Solves Windows & local ISP DNS SRV lookup restrictions (querySrv ECONNREFUSED).
 */
async function resolveMongoUri(uri: string): Promise<string> {
  if (!uri.startsWith('mongodb+srv://')) {
    return uri;
  }

  try {
    const resolver = new Resolver();
    resolver.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

    const fakeUrl = new URL(uri.replace('mongodb+srv://', 'http://'));
    const user = fakeUrl.username;
    const pass = fakeUrl.password;
    const host = fakeUrl.hostname;
    const db = fakeUrl.pathname.replace('/', '') || 'cloudmar';

    const addrs = await new Promise<{ name: string; port: number }[]>((resolve, reject) => {
      resolver.resolveSrv(`_mongodb._tcp.${host}`, (err, addresses) => {
        if (err) return reject(err);
        resolve(addresses);
      });
    });

    if (!addrs || addrs.length === 0) {
      return uri;
    }

    const hostList = addrs.map((a) => `${a.name}:${a.port}`).join(',');
    const userAuth = user && pass ? `${encodeURIComponent(user)}:${encodeURIComponent(pass)}@` : '';
    
    // Construct robust direct seed list URI
    const directUri = `mongodb://${userAuth}${hostList}/${db}?ssl=true&authSource=admin&retryWrites=true&w=majority`;
    return directUri;
  } catch (err) {
    console.warn('DNS SRV pre-resolution notice, using original URI:', err);
    return uri;
  }
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (!cached) {
    cached = global.mongooseCache = { conn: null, promise: null };
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      connectTimeoutMS: 15000,
    };

    cached.promise = (async () => {
      const targetUri = await resolveMongoUri(MONGODB_URI);
      const instance = await mongoose.connect(targetUri, opts);
      console.log('Connected to MongoDB Atlas successfully');
      return instance;
    })();
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

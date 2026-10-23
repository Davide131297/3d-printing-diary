import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI_STRING;

if (!uri) {
  console.warn("WARNUNG: MONGODB_URI_STRING ist nicht gesetzt!");
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (!uri) {
  // Fallback for build time if env is missing
  clientPromise = Promise.reject(new Error("MONGODB_URI_STRING is missing"));
} else if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export async function getDb(dbName = "3d_printing_diary"): Promise<Db> {
  const c = await clientPromise;
  return c.db(dbName);
}

export default clientPromise;

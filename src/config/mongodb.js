import { env } from '~/config/environment';
import { MongoClient, ServerApiVersion } from 'mongodb';

let databaseInstance = null;

const client = new MongoClient(env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  } }
);

export const connectBb = async () => {
  await client.connect();
  databaseInstance = client.db(env.DATABASE_NAME);
};

export const getBd = () => {
  if (!databaseInstance) throw new Error('Hãy kết nối đến DB');
  return databaseInstance;
};

export const closeDb = async () => {
  await client.close();
  return client;
};
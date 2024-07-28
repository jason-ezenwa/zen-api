import { createClient } from 'redis';
// get env variables from .env file
import 'dotenv/config';

async function connectToRedis() {
  const createClientOptions = {
    password: process.env.REDIS_PASSWORD || '',
    socket: {
      host: process.env.REDIS_HOST || '',
      port: (parseInt(process.env.REDIS_PORT!)) || 6173
    }
  };

  const redisClient = await createClient(createClientOptions)
    .on('error', (err: Error) => console.log('Redis Client Error', err))
    .connect();

  return redisClient;
}

const redisClient = connectToRedis();


export default redisClient;
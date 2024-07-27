import { createClient } from 'redis';
// get env variables from .env file
import 'dotenv/config';

async function connectToRedis() {
  const redisClient = await createClient({
    password: process.env.REDIS_PASSWORD || '',
    socket: {
      host: process.env.REDIS_HOST || '',
      port: (parseInt(process.env.REDIS_PORT!)) || 6173
    }
  })
    .on('error', (err: Error) => console.log('Redis Client Error', err))
    .connect();

  return redisClient;
}

const redisClient = connectToRedis();


export default redisClient;
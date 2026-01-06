if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
const redis = require('redis');
const redisHost = process.env.REDIS_HOST;
const redisPort = Number(process.env.REDIS_PORT);

const client = redis.createClient({
    url: `redis://${redisHost}:${redisPort}`
 });
client.on('error', (err) => console.log(err));

async function connectRedis() {
    try{
        await client.connect();
        console.log("Connected to redis");
        return client;
    } catch (error) {
        console.log(error)
        process.exit(1)
    }
}


module.exports = connectRedis;
const Redis = require('ioredis')

let redisClient

function getRedis() {
  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    })
    redisClient.on('error', (err) => {
      console.error('[Redis] Connection error:', err.message)
    })
    redisClient.on('connect', () => {
      console.log('[Redis] Connected')
    })
  }
  return redisClient
}

module.exports = { getRedis }

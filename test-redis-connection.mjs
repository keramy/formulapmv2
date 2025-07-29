import Redis from 'ioredis'

const redis = new Redis({
  host: 'localhost',
  port: 6379,
  keyPrefix: 'formulapm:',
  maxRetriesPerRequest: 3
})

async function testRedis() {
  try {
    console.log('🔍 Testing Redis connection...')
    
    // Test basic connection
    const pong = await redis.ping()
    console.log('✅ Redis ping response:', pong)
    
    // Test set/get
    await redis.set('test:connection', 'working', 'EX', 10)
    const value = await redis.get('test:connection')
    console.log('✅ Redis set/get test:', value)
    
    // Test cache operations
    await redis.setex('test:cache', 60, JSON.stringify({ message: 'Cache working!' }))
    const cached = await redis.get('test:cache')
    console.log('✅ Redis cache test:', JSON.parse(cached))
    
    // Clean up
    await redis.del('test:connection', 'test:cache')
    
    console.log('🎉 Redis is working perfectly!')
    
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message)
  } finally {
    redis.disconnect()
  }
}

testRedis()
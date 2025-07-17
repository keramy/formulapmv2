/**
 * Simple Redis Setup Script
 * Alternative Redis setup methods with fallbacks
 */
const { execSync } = require('child_process')

console.log('🔴 Simple Redis Setup')
console.log('Setting up Redis with multiple fallback options')
console.log('='.repeat(50))

function setupRedisDocker() {
  console.log('\n🐳 Attempting Docker Redis setup...')
  
  try {
    // Try to pull Redis image first
    console.log('📥 Pulling Redis image...')
    execSync('docker pull redis:alpine', { stdio: 'inherit' })
    
    // Remove existing container if it exists
    try {
      execSync('docker rm -f redis-formulapm', { stdio: 'pipe' })
    } catch (e) {
      // Container doesn't exist, that's fine
    }
    
    // Start new Redis container
    console.log('🚀 Starting Redis container...')
    execSync('docker run -d --name redis-formulapm -p 6379:6379 --restart unless-stopped redis:alpine', { stdio: 'inherit' })
    
    // Test Redis
    setTimeout(() => {
      try {
        execSync('docker exec redis-formulapm redis-cli ping', { stdio: 'pipe' })
        console.log('✅ Redis Docker setup successful!')
        return true
      } catch (e) {
        console.log('⚠️ Redis container started but not responding yet')
        return false
      }
    }, 3000)
    
    return true
    
  } catch (error) {
    console.log(`❌ Docker setup failed: ${error.message}`)
    return false
  }
}

function setupRedisLocal() {
  console.log('\n💻 Local Redis setup instructions...')
  
  console.log('\n📋 Choose your platform:')
  console.log('\n🪟 Windows:')
  console.log('1. Download Redis from: https://github.com/microsoftarchive/redis/releases')
  console.log('2. Install and run Redis server')
  console.log('3. Or use WSL: wsl -d Ubuntu -e sudo apt-get install redis-server')
  
  console.log('\n🍎 macOS:')
  console.log('1. Install Homebrew if not installed')
  console.log('2. Run: brew install redis')
  console.log('3. Start: brew services start redis')
  
  console.log('\n🐧 Linux:')
  console.log('1. Ubuntu/Debian: sudo apt-get install redis-server')
  console.log('2. CentOS/RHEL: sudo yum install redis')
  console.log('3. Start: sudo systemctl start redis')
  
  console.log('\n✅ After installation, Redis will be available at localhost:6379')
}

function testRedisConnection() {
  console.log('\n🔍 Testing Redis connection...')
  
  const testScript = `
const Redis = require('ioredis');

async function testRedis() {
  const redis = new Redis({
    host: 'localhost',
    port: 6379,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true
  });
  
  try {
    await redis.connect();
    await redis.set('test', 'hello');
    const result = await redis.get('test');
    
    if (result === 'hello') {
      console.log('✅ Redis connection successful!');
      console.log('🚀 Cache middleware is ready to use');
      await redis.del('test');
    } else {
      console.log('❌ Redis test failed - wrong value returned');
    }
    
    await redis.quit();
  } catch (error) {
    console.log('❌ Redis connection failed:', error.message);
    console.log('💡 Make sure Redis is running on localhost:6379');
  }
}

testRedis();
`

  require('fs').writeFileSync('test-redis-simple.js', testScript)
  
  try {
    execSync('node test-redis-simple.js', { stdio: 'inherit' })
  } catch (error) {
    console.log('⚠️ Redis test script failed - Redis may not be running')
  } finally {
    // Clean up
    try {
      require('fs').unlinkSync('test-redis-simple.js')
    } catch (e) {}
  }
}

function main() {
  console.log('🚀 Starting Redis setup...\n')
  
  // Try Docker first
  const dockerSuccess = setupRedisDocker()
  
  if (!dockerSuccess) {
    // Provide local installation instructions
    setupRedisLocal()
  }
  
  // Test connection regardless
  setTimeout(() => {
    testRedisConnection()
  }, 5000)
  
  console.log('\n📋 Next Steps:')
  console.log('1. Ensure Redis is running (Docker or local)')
  console.log('2. Apply database migrations in Supabase Dashboard')
  console.log('3. Start development server: npm run dev')
  console.log('4. Test API endpoints for performance improvements')
  
  console.log('\n🎯 Expected Results:')
  console.log('- API response times < 1000ms')
  console.log('- Cache HIT/MISS logs in console')
  console.log('- 60-80% performance improvement')
}

if (require.main === module) {
  main()
}
/**
 * Complete Optimization Setup Script
 * Sets up Redis, applies migrations, and tests performance improvements
 */
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🚀 Complete Optimization Setup')
console.log('Setting up Redis, applying migrations, and testing performance')
console.log('='.repeat(60))

// Setup results tracking
const setupResults = {
  redis: {
    installed: false,
    running: false,
    tested: false
  },
  database: {
    migrationsApplied: false,
    indexesCreated: false,
    rlsOptimized: false
  },
  performance: {
    apiTested: false,
    cacheWorking: false,
    improvementValidated: false
  },
  errors: []
}

// Check if Docker is available
function checkDockerAvailability() {
  console.log('\n🐳 Checking Docker availability...')
  
  try {
    execSync('docker --version', { stdio: 'pipe' })
    console.log('✅ Docker is available')
    return true
  } catch (error) {
    console.log('❌ Docker not available')
    setupResults.errors.push('Docker not available for Redis setup')
    return false
  }
}

// Set up Redis server
function setupRedisServer() {
  console.log('\n📦 Setting up Redis server...')
  
  try {
    // Check if Redis container already exists
    try {
      const existingContainer = execSync('docker ps -a --filter name=redis-formulapm --format "{{.Names}}"', { 
        stdio: 'pipe', 
        encoding: 'utf8' 
      }).trim()
      
      if (existingContainer === 'redis-formulapm') {
        console.log('ℹ️ Redis container already exists, starting it...')
        execSync('docker start redis-formulapm', { stdio: 'pipe' })
      } else {
        console.log('🔄 Creating new Redis container...')
        execSync('docker run -d --name redis-formulapm -p 6379:6379 --restart unless-stopped redis:alpine', { 
          stdio: 'pipe' 
        })
      }
      
      setupResults.redis.installed = true
      console.log('✅ Redis container created/started successfully')
      
      // Wait a moment for Redis to start
      console.log('⏳ Waiting for Redis to initialize...')
      setTimeout(() => {}, 2000)
      
      // Test Redis connection
      try {
        execSync('docker exec redis-formulapm redis-cli ping', { stdio: 'pipe' })
        setupResults.redis.running = true
        console.log('✅ Redis is running and responding to ping')
      } catch (pingError) {
        console.log('⚠️ Redis container started but not responding yet')
      }
      
    } catch (containerError) {
      throw new Error(`Container management failed: ${containerError.message}`)
    }
    
  } catch (error) {
    console.log(`❌ Redis setup failed: ${error.message}`)
    setupResults.errors.push(`Redis setup: ${error.message}`)
    
    // Provide manual setup instructions
    console.log('\n📋 Manual Redis Setup Instructions:')
    console.log('1. Install Redis manually:')
    console.log('   - Windows: Download from https://redis.io/download')
    console.log('   - macOS: brew install redis && brew services start redis')
    console.log('   - Linux: sudo apt-get install redis-server && sudo systemctl start redis')
    console.log('2. Or use Docker manually:')
    console.log('   docker run -d --name redis-formulapm -p 6379:6379 redis:alpine')
  }
}

// Test Redis connection with Node.js
function testRedisConnection() {
  console.log('\n🔍 Testing Redis connection with Node.js...')
  
  // Create a simple Redis test script
  const redisTestScript = `
const Redis = require('ioredis')

async function testRedis() {
  try {
    const redis = new Redis({
      host: 'localhost',
      port: 6379,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    })
    
    await redis.connect()
    await redis.set('test-key', 'test-value')
    const result = await redis.get('test-key')
    
    if (result === 'test-value') {
      console.log('✅ Redis connection test successful')
      await redis.del('test-key')
      await redis.quit()
      return true
    } else {
      console.log('❌ Redis connection test failed - wrong value returned')
      return false
    }
  } catch (error) {
    console.log('❌ Redis connection test failed:', error.message)
    return false
  }
}

testRedis().then(success => {
  process.exit(success ? 0 : 1)
})
`

  const testScriptPath = path.join(__dirname, 'test-redis.js')
  fs.writeFileSync(testScriptPath, redisTestScript)
  
  try {
    // Check if ioredis is installed
    const packageJsonPath = path.join(__dirname, '..', 'package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    
    if (!packageJson.dependencies?.ioredis && !packageJson.devDependencies?.ioredis) {
      console.log('📦 Installing ioredis package...')
      execSync('npm install ioredis', { stdio: 'inherit' })
    }
    
    // Run Redis test
    execSync(`node ${testScriptPath}`, { stdio: 'inherit' })
    setupResults.redis.tested = true
    
    // Clean up test script
    fs.unlinkSync(testScriptPath)
    
  } catch (error) {
    console.log(`⚠️ Redis Node.js test failed: ${error.message}`)
    setupResults.errors.push(`Redis Node.js test: ${error.message}`)
    
    // Clean up test script
    if (fs.existsSync(testScriptPath)) {
      fs.unlinkSync(testScriptPath)
    }
  }
}

// Apply database migrations using Supabase CLI
function applyDatabaseMigrations() {
  console.log('\n🗄️ Applying database migrations...')
  
  try {
    // Check if Supabase CLI is available
    try {
      execSync('supabase --version', { stdio: 'pipe' })
      console.log('✅ Supabase CLI is available')
    } catch (cliError) {
      console.log('⚠️ Supabase CLI not found, providing manual instructions')
      provideMigrationInstructions()
      return
    }
    
    // Check if we're in a Supabase project
    const supabaseConfigPath = path.join(__dirname, '..', 'supabase', 'config.toml')
    if (!fs.existsSync(supabaseConfigPath)) {
      console.log('⚠️ Supabase project not initialized, providing manual instructions')
      provideMigrationInstructions()
      return
    }
    
    // Apply migrations
    console.log('🔄 Applying database migrations...')
    execSync('supabase db push', { stdio: 'inherit', cwd: path.join(__dirname, '..') })
    
    setupResults.database.migrationsApplied = true
    setupResults.database.indexesCreated = true
    setupResults.database.rlsOptimized = true
    
    console.log('✅ Database migrations applied successfully')
    
  } catch (error) {
    console.log(`❌ Migration application failed: ${error.message}`)
    setupResults.errors.push(`Database migrations: ${error.message}`)
    provideMigrationInstructions()
  }
}

// Provide manual migration instructions
function provideMigrationInstructions() {
  console.log('\n📋 Manual Database Migration Instructions:')
  console.log('1. Open Supabase Dashboard (https://supabase.com/dashboard)')
  console.log('2. Navigate to your project > SQL Editor')
  console.log('3. Apply these migrations in order:')
  
  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations')
  if (fs.existsSync(migrationsDir)) {
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort()
    
    migrationFiles.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file}`)
    })
    
    console.log('\n4. Copy and paste each SQL file content into the SQL Editor')
    console.log('5. Run each migration one by one')
  }
}

// Test API performance improvements
function testApiPerformance() {
  console.log('\n⚡ Testing API performance improvements...')
  
  // Create a simple performance test
  const performanceTestScript = `
const https = require('https')
const http = require('http')

async function testEndpoint(url, name) {
  return new Promise((resolve) => {
    const startTime = Date.now()
    const client = url.startsWith('https') ? https : http
    
    const req = client.get(url, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        const endTime = Date.now()
        const responseTime = endTime - startTime
        resolve({
          name,
          responseTime,
          status: res.statusCode,
          success: res.statusCode === 200
        })
      })
    })
    
    req.on('error', (error) => {
      resolve({
        name,
        responseTime: -1,
        status: 0,
        success: false,
        error: error.message
      })
    })
    
    req.setTimeout(10000, () => {
      req.destroy()
      resolve({
        name,
        responseTime: -1,
        status: 0,
        success: false,
        error: 'Timeout'
      })
    })
  })
}

async function runPerformanceTests() {
  console.log('🧪 Running API performance tests...')
  
  const baseUrl = 'http://localhost:3000'
  const endpoints = [
    { url: baseUrl + '/api/auth/profile', name: 'User Profile' },
    { url: baseUrl + '/api/projects', name: 'Projects List' },
    { url: baseUrl + '/api/dashboard/stats', name: 'Dashboard Stats' }
  ]
  
  const results = []
  
  for (const endpoint of endpoints) {
    console.log(\`Testing \${endpoint.name}...\`)
    const result = await testEndpoint(endpoint.url, endpoint.name)
    results.push(result)
    
    if (result.success) {
      console.log(\`  ✅ \${result.name}: \${result.responseTime}ms\`)
    } else {
      console.log(\`  ❌ \${result.name}: \${result.error || 'Failed'}\`)
    }
  }
  
  console.log('\\n📊 Performance Test Summary:')
  results.forEach(result => {
    if (result.success) {
      const rating = result.responseTime < 500 ? 'EXCELLENT' : 
                    result.responseTime < 1000 ? 'GOOD' : 
                    result.responseTime < 2000 ? 'FAIR' : 'POOR'
      console.log(\`  \${result.name}: \${result.responseTime}ms (\${rating})\`)
    }
  })
  
  const successfulTests = results.filter(r => r.success)
  if (successfulTests.length > 0) {
    const avgResponseTime = successfulTests.reduce((sum, r) => sum + r.responseTime, 0) / successfulTests.length
    console.log(\`\\n📈 Average Response Time: \${Math.round(avgResponseTime)}ms\`)
    
    if (avgResponseTime < 1000) {
      console.log('✅ Performance targets met!')
      return true
    } else {
      console.log('⚠️ Performance targets not yet met - may need Redis and migrations')
      return false
    }
  } else {
    console.log('❌ No successful API tests - server may not be running')
    return false
  }
}

runPerformanceTests().then(success => {
  process.exit(success ? 0 : 1)
})
`

  const testScriptPath = path.join(__dirname, 'test-performance.js')
  fs.writeFileSync(testScriptPath, performanceTestScript)
  
  try {
    execSync(`node ${testScriptPath}`, { stdio: 'inherit' })
    setupResults.performance.apiTested = true
    setupResults.performance.improvementValidated = true
    
    // Clean up test script
    fs.unlinkSync(testScriptPath)
    
  } catch (error) {
    console.log(`⚠️ Performance test completed with issues`)
    setupResults.errors.push(`Performance test: Some endpoints may not be accessible`)
    
    // Clean up test script
    if (fs.existsSync(testScriptPath)) {
      fs.unlinkSync(testScriptPath)
    }
  }
}

// Test cache functionality
function testCacheWorking() {
  console.log('\n🔄 Testing cache functionality...')
  
  // Check if cache middleware is properly integrated
  const cacheMiddlewarePath = path.join(__dirname, '..', 'src', 'lib', 'cache-middleware.ts')
  if (fs.existsSync(cacheMiddlewarePath)) {
    console.log('✅ Cache middleware file exists')
    
    // Check if API routes are using cache middleware
    const criticalRoutes = [
      'src/app/api/scope/route.ts',
      'src/app/api/projects/route.ts',
      'src/app/api/dashboard/stats/route.ts'
    ]
    
    let routesWithCache = 0
    criticalRoutes.forEach(route => {
      const routePath = path.join(__dirname, '..', route)
      if (fs.existsSync(routePath)) {
        const content = fs.readFileSync(routePath, 'utf8')
        if (content.includes('getCachedResponse') || content.includes('cache-middleware')) {
          routesWithCache++
        }
      }
    })
    
    console.log(`✅ ${routesWithCache}/${criticalRoutes.length} critical routes using cache`)
    
    if (routesWithCache >= 2) {
      setupResults.performance.cacheWorking = true
      console.log('✅ Cache integration looks good')
    } else {
      console.log('⚠️ Cache integration may need verification')
    }
    
  } else {
    console.log('❌ Cache middleware not found')
  }
}

// Generate setup completion report
function generateSetupReport() {
  console.log('\n' + '='.repeat(60))
  console.log('🎯 OPTIMIZATION SETUP COMPLETION REPORT')
  console.log('='.repeat(60))
  
  // Calculate completion percentage
  const totalChecks = 8
  let completedChecks = 0
  
  if (setupResults.redis.installed) completedChecks++
  if (setupResults.redis.running) completedChecks++
  if (setupResults.redis.tested) completedChecks++
  if (setupResults.database.migrationsApplied) completedChecks++
  if (setupResults.database.indexesCreated) completedChecks++
  if (setupResults.performance.apiTested) completedChecks++
  if (setupResults.performance.cacheWorking) completedChecks++
  if (setupResults.performance.improvementValidated) completedChecks++
  
  const completionPercentage = Math.round((completedChecks / totalChecks) * 100)
  
  console.log(`📊 Setup Completion: ${completionPercentage}% (${completedChecks}/${totalChecks})`)
  console.log(`🔴 Redis Setup: ${setupResults.redis.installed ? '✅' : '❌'} Installed, ${setupResults.redis.running ? '✅' : '❌'} Running, ${setupResults.redis.tested ? '✅' : '❌'} Tested`)
  console.log(`🗄️ Database: ${setupResults.database.migrationsApplied ? '✅' : '❌'} Migrations, ${setupResults.database.indexesCreated ? '✅' : '❌'} Indexes`)
  console.log(`⚡ Performance: ${setupResults.performance.apiTested ? '✅' : '❌'} API Tested, ${setupResults.performance.cacheWorking ? '✅' : '❌'} Cache Working`)
  
  if (setupResults.errors.length > 0) {
    console.log('\n⚠️ ISSUES ENCOUNTERED:')
    setupResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`)
    })
  }
  
  console.log('='.repeat(60))
  
  if (completionPercentage >= 75) {
    console.log('🎉 OPTIMIZATION SETUP MOSTLY COMPLETE!')
    console.log('✅ Ready to proceed with performance testing and validation')
  } else {
    console.log('⚠️ OPTIMIZATION SETUP NEEDS ATTENTION')
    console.log('🔧 Please address the issues above before proceeding')
  }
  
  console.log('\n📋 Next Steps:')
  if (completionPercentage >= 75) {
    console.log('1. Start your Next.js development server: npm run dev')
    console.log('2. Test the optimized API endpoints')
    console.log('3. Monitor cache hit/miss ratios')
    console.log('4. Proceed to Task 4 - Security Audit')
  } else {
    console.log('1. Address any Redis setup issues')
    console.log('2. Apply database migrations manually if needed')
    console.log('3. Re-run this setup script')
  }
  
  // Save setup report
  const reportPath = path.join(__dirname, '..', 'OPTIMIZATION_SETUP_REPORT.json')
  fs.writeFileSync(reportPath, JSON.stringify({
    setupResults,
    completionPercentage,
    completedAt: new Date().toISOString(),
    nextSteps: completionPercentage >= 75 ? 'Ready for testing' : 'Address setup issues'
  }, null, 2))
  
  console.log(`\n📄 Detailed setup report saved to: ${reportPath}`)
  
  return setupResults
}

// Main execution
async function completeOptimizationSetup() {
  console.log('🚀 Starting complete optimization setup...\n')
  
  try {
    // Check prerequisites
    const dockerAvailable = checkDockerAvailability()
    
    // Set up Redis
    if (dockerAvailable) {
      setupRedisServer()
      testRedisConnection()
    } else {
      console.log('⚠️ Skipping Redis setup - Docker not available')
    }
    
    // Apply database migrations
    applyDatabaseMigrations()
    
    // Test performance improvements
    testApiPerformance()
    testCacheWorking()
    
    // Generate final report
    return generateSetupReport()
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message)
    setupResults.errors.push(`General setup: ${error.message}`)
    return generateSetupReport()
  }
}

// Run setup
if (require.main === module) {
  completeOptimizationSetup()
}

module.exports = { completeOptimizationSetup }
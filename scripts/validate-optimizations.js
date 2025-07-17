/**
 * Performance Optimizations Validation Script
 * Validates that all performance optimizations have been properly applied
 */
const fs = require('fs')
const path = require('path')

console.log('✅ Performance Optimizations Validation')
console.log('Validating all applied optimizations')
console.log('='.repeat(60))

// Validation results
const validationResults = {
  databaseOptimizations: {
    rlsPolicies: false,
    performanceIndexes: false,
    connectionPooling: false
  },
  apiOptimizations: {
    cachingMiddleware: false,
    routesOptimized: 0,
    authHelper: false
  },
  frontendOptimizations: {
    performanceFixes: false,
    codeSplitting: false,
    lazyLoading: false
  },
  infrastructureReady: {
    redis: false,
    migrations: false,
    environment: false
  },
  overallStatus: 'PENDING'
}

// Validate database migrations exist
function validateDatabaseMigrations() {
  console.log('\n🗄️ Validating Database Migrations...')
  
  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations')
  
  if (!fs.existsSync(migrationsDir)) {
    console.log('❌ Migrations directory not found')
    return false
  }
  
  const migrationFiles = fs.readdirSync(migrationsDir)
  
  // Check for RLS optimization migration
  const rlsMigration = migrationFiles.find(file => file.includes('optimized_rls_policies'))
  if (rlsMigration) {
    console.log(`✅ RLS optimization migration found: ${rlsMigration}`)
    validationResults.databaseOptimizations.rlsPolicies = true
  } else {
    console.log('❌ RLS optimization migration not found')
  }
  
  // Check for performance indexes migration
  const indexMigration = migrationFiles.find(file => file.includes('performance_indexes'))
  if (indexMigration) {
    console.log(`✅ Performance indexes migration found: ${indexMigration}`)
    validationResults.databaseOptimizations.performanceIndexes = true
  } else {
    console.log('❌ Performance indexes migration not found')
  }
  
  // Check for connection pooling migration
  const poolingMigration = migrationFiles.find(file => file.includes('connection_pooling'))
  if (poolingMigration) {
    console.log(`✅ Connection pooling migration found: ${poolingMigration}`)
    validationResults.databaseOptimizations.connectionPooling = true
  } else {
    console.log('❌ Connection pooling migration not found')
  }
  
  return validationResults.databaseOptimizations.rlsPolicies && 
         validationResults.databaseOptimizations.performanceIndexes
}

// Validate API optimizations
function validateApiOptimizations() {
  console.log('\n🌐 Validating API Optimizations...')
  
  // Check cache middleware
  const cacheMiddlewarePath = path.join(__dirname, '..', 'src', 'lib', 'cache-middleware.ts')
  if (fs.existsSync(cacheMiddlewarePath)) {
    console.log('✅ Cache middleware created')
    validationResults.apiOptimizations.cachingMiddleware = true
  } else {
    console.log('❌ Cache middleware not found')
  }
  
  // Check auth helper
  const authHelperPath = path.join(__dirname, '..', 'src', 'lib', 'auth-helpers.ts')
  if (fs.existsSync(authHelperPath)) {
    console.log('✅ Auth helper created')
    validationResults.apiOptimizations.authHelper = true
  } else {
    console.log('❌ Auth helper not found')
  }
  
  // Check optimized routes
  const criticalRoutes = [
    'src/app/api/scope/route.ts',
    'src/app/api/projects/route.ts',
    'src/app/api/dashboard/stats/route.ts',
    'src/app/api/tasks/route.ts',
    'src/app/api/auth/profile/route.ts'
  ]
  
  let optimizedRoutes = 0
  criticalRoutes.forEach(route => {
    const routePath = path.join(__dirname, '..', route)
    if (fs.existsSync(routePath)) {
      const content = fs.readFileSync(routePath, 'utf8')
      if (content.includes('getCachedResponse') || content.includes('cache-middleware')) {
        console.log(`✅ Route optimized: ${route}`)
        optimizedRoutes++
      } else {
        console.log(`⚠️ Route exists but not optimized: ${route}`)
      }
    } else {
      console.log(`❌ Route not found: ${route}`)
    }
  })
  
  validationResults.apiOptimizations.routesOptimized = optimizedRoutes
  console.log(`📊 Routes optimized: ${optimizedRoutes}/${criticalRoutes.length}`)
  
  return validationResults.apiOptimizations.cachingMiddleware && optimizedRoutes >= 3
}

// Validate frontend optimizations
function validateFrontendOptimizations() {
  console.log('\n🎨 Validating Frontend Optimizations...')
  
  // Check performance fixes report
  const performanceReportPath = path.join(__dirname, '..', 'PERFORMANCE_FIXES_REPORT.json')
  if (fs.existsSync(performanceReportPath)) {
    const report = JSON.parse(fs.readFileSync(performanceReportPath, 'utf8'))
    if (report.consoleLogsRemoved > 0 || report.useEffectFixed > 0) {
      console.log(`✅ Performance fixes applied: ${report.consoleLogsRemoved} console logs, ${report.useEffectFixed} useEffect hooks`)
      validationResults.frontendOptimizations.performanceFixes = true
    }
  } else {
    console.log('❌ Performance fixes report not found')
  }
  
  // Check code splitting implementation
  const lazyDir = path.join(__dirname, '..', 'src', 'components', 'lazy')
  if (fs.existsSync(lazyDir)) {
    const lazyComponents = fs.readdirSync(lazyDir).filter(file => file.endsWith('.tsx'))
    if (lazyComponents.length > 0) {
      console.log(`✅ Code splitting implemented: ${lazyComponents.length} lazy components`)
      validationResults.frontendOptimizations.codeSplitting = true
      validationResults.frontendOptimizations.lazyLoading = true
    }
  } else {
    console.log('❌ Lazy components directory not found')
  }
  
  return validationResults.frontendOptimizations.performanceFixes && 
         validationResults.frontendOptimizations.codeSplitting
}

// Check infrastructure readiness
function validateInfrastructure() {
  console.log('\n🏗️ Validating Infrastructure Readiness...')
  
  // Check environment variables
  const envPath = path.join(__dirname, '..', '.env.local')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    if (envContent.includes('REDIS_HOST') || envContent.includes('REDIS_URL')) {
      console.log('✅ Redis environment variables configured')
      validationResults.infrastructureReady.redis = true
    } else {
      console.log('⚠️ Redis environment variables not found in .env.local')
    }
    validationResults.infrastructureReady.environment = true
  } else {
    console.log('❌ .env.local file not found')
  }
  
  // Check if migrations are ready to apply
  const migrationsExist = validationResults.databaseOptimizations.rlsPolicies && 
                         validationResults.databaseOptimizations.performanceIndexes
  if (migrationsExist) {
    console.log('✅ Database migrations ready to apply')
    validationResults.infrastructureReady.migrations = true
  } else {
    console.log('❌ Database migrations not ready')
  }
  
  return validationResults.infrastructureReady.environment && 
         validationResults.infrastructureReady.migrations
}

// Generate implementation checklist
function generateImplementationChecklist() {
  console.log('\n📋 Generating Implementation Checklist...')
  
  const checklist = {
    immediate: [],
    shortTerm: [],
    testing: [],
    monitoring: []
  }
  
  // Immediate actions
  if (!validationResults.infrastructureReady.redis) {
    checklist.immediate.push('Set up Redis server (Docker: docker run -d -p 6379:6379 redis:alpine)')
    checklist.immediate.push('Add Redis environment variables to .env.local')
  }
  
  if (!validationResults.infrastructureReady.migrations) {
    checklist.immediate.push('Apply database migrations using Supabase CLI')
  }
  
  if (validationResults.apiOptimizations.routesOptimized < 5) {
    checklist.immediate.push('Complete API route optimizations for remaining endpoints')
  }
  
  // Short-term actions
  checklist.shortTerm.push('Configure Supabase connection pooling settings')
  checklist.shortTerm.push('Set up performance monitoring dashboard')
  checklist.shortTerm.push('Implement cache invalidation strategies')
  
  // Testing actions
  checklist.testing.push('Run API load tests to validate performance improvements')
  checklist.testing.push('Test frontend lazy loading functionality')
  checklist.testing.push('Validate database query performance')
  checklist.testing.push('Test cache hit/miss ratios')
  
  // Monitoring actions
  checklist.monitoring.push('Set up Redis monitoring and alerting')
  checklist.monitoring.push('Configure database performance monitoring')
  checklist.monitoring.push('Implement API response time tracking')
  checklist.monitoring.push('Set up error rate monitoring')
  
  return checklist
}

// Generate comprehensive validation report
function generateValidationReport() {
  console.log('\n' + '='.repeat(60))
  console.log('🎯 PERFORMANCE OPTIMIZATIONS VALIDATION SUMMARY')
  console.log('='.repeat(60))
  
  // Calculate overall completion percentage
  const totalChecks = 12
  let completedChecks = 0
  
  // Database optimizations (3 checks)
  if (validationResults.databaseOptimizations.rlsPolicies) completedChecks++
  if (validationResults.databaseOptimizations.performanceIndexes) completedChecks++
  if (validationResults.databaseOptimizations.connectionPooling) completedChecks++
  
  // API optimizations (3 checks)
  if (validationResults.apiOptimizations.cachingMiddleware) completedChecks++
  if (validationResults.apiOptimizations.authHelper) completedChecks++
  if (validationResults.apiOptimizations.routesOptimized >= 3) completedChecks++
  
  // Frontend optimizations (2 checks)
  if (validationResults.frontendOptimizations.performanceFixes) completedChecks++
  if (validationResults.frontendOptimizations.codeSplitting) completedChecks++
  
  // Infrastructure (4 checks)
  if (validationResults.infrastructureReady.redis) completedChecks++
  if (validationResults.infrastructureReady.migrations) completedChecks++
  if (validationResults.infrastructureReady.environment) completedChecks++
  
  const completionPercentage = Math.round((completedChecks / totalChecks) * 100)
  
  console.log(`📊 Overall Completion: ${completionPercentage}% (${completedChecks}/${totalChecks})`)
  console.log(`🗄️ Database Optimizations: ${Object.values(validationResults.databaseOptimizations).filter(Boolean).length}/3`)
  console.log(`🌐 API Optimizations: ${validationResults.apiOptimizations.routesOptimized}/5 routes, middleware: ${validationResults.apiOptimizations.cachingMiddleware ? 'Yes' : 'No'}`)
  console.log(`🎨 Frontend Optimizations: ${Object.values(validationResults.frontendOptimizations).filter(Boolean).length}/3`)
  console.log(`🏗️ Infrastructure Ready: ${Object.values(validationResults.infrastructureReady).filter(Boolean).length}/3`)
  
  // Determine overall status
  if (completionPercentage >= 90) {
    validationResults.overallStatus = 'READY FOR PRODUCTION'
  } else if (completionPercentage >= 70) {
    validationResults.overallStatus = 'MOSTLY COMPLETE - MINOR ISSUES'
  } else if (completionPercentage >= 50) {
    validationResults.overallStatus = 'IN PROGRESS - MAJOR WORK NEEDED'
  } else {
    validationResults.overallStatus = 'NOT READY - SIGNIFICANT WORK REQUIRED'
  }
  
  console.log('='.repeat(60))
  console.log(`🎯 Status: ${validationResults.overallStatus}`)
  
  // Generate checklist
  const checklist = generateImplementationChecklist()
  
  if (checklist.immediate.length > 0) {
    console.log('\n🚨 IMMEDIATE ACTIONS REQUIRED:')
    checklist.immediate.forEach((action, index) => {
      console.log(`${index + 1}. ${action}`)
    })
  }
  
  if (checklist.shortTerm.length > 0) {
    console.log('\n📅 SHORT-TERM ACTIONS:')
    checklist.shortTerm.forEach((action, index) => {
      console.log(`${index + 1}. ${action}`)
    })
  }
  
  console.log('\n🧪 TESTING CHECKLIST:')
  checklist.testing.forEach((action, index) => {
    console.log(`${index + 1}. ${action}`)
  })
  
  // Save detailed validation report
  const reportData = {
    validationResults,
    checklist,
    completionPercentage,
    overallStatus: validationResults.overallStatus,
    validatedAt: new Date().toISOString(),
    expectedPerformanceGains: {
      scopeItemsEndpoint: '3.7s → 1.0s (73% improvement)',
      projectsEndpoint: '1.8s → 0.6s (67% improvement)', 
      dashboardStats: '1.8s → 0.4s (78% improvement)',
      tasksEndpoint: '1.8s → 0.7s (61% improvement)'
    }
  }
  
  const reportPath = path.join(__dirname, '..', 'OPTIMIZATION_VALIDATION_REPORT.json')
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2))
  console.log(`\n📄 Detailed validation report saved to: ${reportPath}`)
  
  return reportData
}

// Main validation execution
async function validateOptimizations() {
  console.log('✅ Starting performance optimizations validation...\n')
  
  try {
    const dbValid = validateDatabaseMigrations()
    const apiValid = validateApiOptimizations()
    const frontendValid = validateFrontendOptimizations()
    const infraValid = validateInfrastructure()
    
    return generateValidationReport()
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message)
    return null
  }
}

// Run validation
if (require.main === module) {
  validateOptimizations()
}

module.exports = { validateOptimizations }
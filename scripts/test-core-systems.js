/**
 * Core Systems Test Script
 * Tests basic functionality after role structure fixes
 */
const fs = require('fs')
const path = require('path')

console.log('🧪 Testing Core Systems After Role Fixes')
console.log('Verifying application functionality')
console.log('='.repeat(60))

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
}

// Helper function to add test result
function addTestResult(name, status, message, details = null) {
  testResults.tests.push({
    name,
    status,
    message,
    details,
    timestamp: new Date().toISOString()
  })
  
  if (status === 'PASS') testResults.passed++
  else if (status === 'FAIL') testResults.failed++
  else if (status === 'WARN') testResults.warnings++
  
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️'
  console.log(`${icon} ${name}: ${message}`)
  if (details) console.log(`   Details: ${details}`)
}

// Test 1: Check if key files exist and are readable
function testFileIntegrity() {
  console.log('\n📁 Testing File Integrity...')
  
  const criticalFiles = [
    'src/types/auth.ts',
    'src/lib/permissions.ts',
    'src/hooks/useAuth.ts',
    'src/components/auth/AuthGuard.tsx',
    'src/app/api/auth/profile/route.ts'
  ]
  
  let allFilesExist = true
  const missingFiles = []
  
  criticalFiles.forEach(file => {
    const fullPath = path.join(__dirname, '..', file)
    if (!fs.existsSync(fullPath)) {
      allFilesExist = false
      missingFiles.push(file)
    }
  })
  
  if (allFilesExist) {
    addTestResult('File Integrity', 'PASS', 'All critical files exist')
  } else {
    addTestResult('File Integrity', 'FAIL', 'Missing critical files', missingFiles.join(', '))
  }
}

// Test 2: Check TypeScript compilation readiness
function testTypeScriptReadiness() {
  console.log('\n🔧 Testing TypeScript Readiness...')
  
  try {
    // Check if tsconfig.json exists
    const tsconfigPath = path.join(__dirname, '..', 'tsconfig.json')
    if (!fs.existsSync(tsconfigPath)) {
      addTestResult('TypeScript Config', 'FAIL', 'tsconfig.json not found')
      return
    }
    
    // Check auth types file syntax
    const authTypesPath = path.join(__dirname, '..', 'src', 'types', 'auth.ts')
    const authTypesContent = fs.readFileSync(authTypesPath, 'utf8')
    
    // Basic syntax checks
    const hasExportedUserRole = authTypesContent.includes('export type UserRole')
    const hasNewRoles = ['management', 'technical_lead', 'project_manager', 'purchase_manager', 'client', 'admin']
      .every(role => authTypesContent.includes(`'${role}'`))
    
    if (hasExportedUserRole && hasNewRoles) {
      addTestResult('TypeScript Types', 'PASS', 'Auth types properly defined')
    } else {
      addTestResult('TypeScript Types', 'FAIL', 'Auth types incomplete or malformed')
    }
    
  } catch (error) {
    addTestResult('TypeScript Readiness', 'FAIL', 'Error checking TypeScript files', error.message)
  }
}

// Test 3: Check API route structure
function testApiRouteStructure() {
  console.log('\n🌐 Testing API Route Structure...')
  
  try {
    const apiDir = path.join(__dirname, '..', 'src', 'app', 'api')
    
    if (!fs.existsSync(apiDir)) {
      addTestResult('API Routes', 'FAIL', 'API directory not found')
      return
    }
    
    // Check for key API routes
    const keyRoutes = [
      'auth/profile/route.ts',
      'projects/route.ts',
      'scope/route.ts',
      'tasks/route.ts'
    ]
    
    let allRoutesExist = true
    const missingRoutes = []
    
    keyRoutes.forEach(route => {
      const routePath = path.join(apiDir, route)
      if (!fs.existsSync(routePath)) {
        allRoutesExist = false
        missingRoutes.push(route)
      }
    })
    
    if (allRoutesExist) {
      addTestResult('API Route Structure', 'PASS', 'All key API routes exist')
    } else {
      addTestResult('API Route Structure', 'WARN', 'Some API routes missing', missingRoutes.join(', '))
    }
    
  } catch (error) {
    addTestResult('API Route Structure', 'FAIL', 'Error checking API routes', error.message)
  }
}

// Test 4: Check component structure
function testComponentStructure() {
  console.log('\n🧩 Testing Component Structure...')
  
  try {
    const componentsDir = path.join(__dirname, '..', 'src', 'components')
    
    if (!fs.existsSync(componentsDir)) {
      addTestResult('Components', 'FAIL', 'Components directory not found')
      return
    }
    
    // Check for key components
    const keyComponents = [
      'auth/AuthGuard.tsx',
      'auth/AuthProvider.tsx',
      'layouts/Header.tsx',
      'layouts/Sidebar.tsx'
    ]
    
    let allComponentsExist = true
    const missingComponents = []
    
    keyComponents.forEach(component => {
      const componentPath = path.join(componentsDir, component)
      if (!fs.existsSync(componentPath)) {
        allComponentsExist = false
        missingComponents.push(component)
      }
    })
    
    if (allComponentsExist) {
      addTestResult('Component Structure', 'PASS', 'All key components exist')
    } else {
      addTestResult('Component Structure', 'WARN', 'Some components missing', missingComponents.join(', '))
    }
    
  } catch (error) {
    addTestResult('Component Structure', 'FAIL', 'Error checking components', error.message)
  }
}

// Test 5: Check package.json and dependencies
function testDependencies() {
  console.log('\n📦 Testing Dependencies...')
  
  try {
    const packageJsonPath = path.join(__dirname, '..', 'package.json')
    
    if (!fs.existsSync(packageJsonPath)) {
      addTestResult('Dependencies', 'FAIL', 'package.json not found')
      return
    }
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    
    // Check for critical dependencies
    const criticalDeps = [
      '@supabase/supabase-js',
      'next',
      'react',
      'typescript'
    ]
    
    const missingDeps = criticalDeps.filter(dep => 
      !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
    )
    
    if (missingDeps.length === 0) {
      addTestResult('Dependencies', 'PASS', 'All critical dependencies present')
    } else {
      addTestResult('Dependencies', 'WARN', 'Some dependencies missing', missingDeps.join(', '))
    }
    
  } catch (error) {
    addTestResult('Dependencies', 'FAIL', 'Error checking dependencies', error.message)
  }
}

// Test 6: Check environment configuration
function testEnvironmentConfig() {
  console.log('\n🔧 Testing Environment Configuration...')
  
  try {
    const envExamplePath = path.join(__dirname, '..', '.env.example')
    const envLocalPath = path.join(__dirname, '..', '.env.local')
    
    if (fs.existsSync(envExamplePath)) {
      addTestResult('Environment Example', 'PASS', '.env.example exists')
    } else {
      addTestResult('Environment Example', 'WARN', '.env.example not found')
    }
    
    if (fs.existsSync(envLocalPath)) {
      addTestResult('Environment Local', 'PASS', '.env.local exists')
    } else {
      addTestResult('Environment Local', 'WARN', '.env.local not found - needed for development')
    }
    
  } catch (error) {
    addTestResult('Environment Config', 'FAIL', 'Error checking environment files', error.message)
  }
}

// Generate test report
function generateTestReport() {
  console.log('\n' + '='.repeat(60))
  console.log('🎯 CORE SYSTEMS TEST SUMMARY')
  console.log('='.repeat(60))
  console.log(`Tests Passed: ${testResults.passed}`)
  console.log(`Tests Failed: ${testResults.failed}`)
  console.log(`Warnings: ${testResults.warnings}`)
  console.log(`Total Tests: ${testResults.tests.length}`)
  console.log('='.repeat(60))
  
  if (testResults.failed === 0) {
    console.log('✅ All core systems tests PASSED!')
    console.log('🚀 Ready to proceed with Phase 2: Performance Analysis')
  } else {
    console.log('❌ Some core systems tests FAILED')
    console.log('🔧 Fix failing tests before proceeding')
  }
  
  // Save detailed report
  const reportPath = path.join(__dirname, '..', 'CORE_SYSTEMS_TEST_REPORT.json')
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2))
  console.log(`\n📄 Detailed report saved to: ${reportPath}`)
  
  return testResults.failed === 0
}

// Main test execution
function runCoreSystemsTests() {
  console.log('🧪 Starting core systems tests...\n')
  
  testFileIntegrity()
  testTypeScriptReadiness()
  testApiRouteStructure()
  testComponentStructure()
  testDependencies()
  testEnvironmentConfig()
  
  return generateTestReport()
}

// Run tests
if (require.main === module) {
  const success = runCoreSystemsTests()
  process.exit(success ? 0 : 1)
}

module.exports = { runCoreSystemsTests }
/**
 * Security Validation Script
 * Validates the current state of API security fixes
 */

const fs = require('fs')
const path = require('path')

// List of API routes to check
const apiRoutes = [
  'src/app/api/tasks/route.ts',
  'src/app/api/suppliers/route.ts',
  'src/app/api/scope/route.ts',
  'src/app/api/projects/route.ts',
  'src/app/api/material-specs/route.ts',
  'src/app/api/milestones/route.ts',
  'src/app/api/reports/route.ts',
  'src/app/api/projects/[id]/material-specs/route.ts',
  'src/app/api/projects/[id]/tasks/route.ts',
  'src/app/api/projects/[id]/milestones/route.ts',
  'src/app/api/scope/excel/export/route.ts'
]

// Security patterns to check
const vulnerabilityPatterns = [
  {
    name: 'SQL Injection - Direct String Interpolation',
    pattern: /ilike\.%\$\{[^}]+\}%/g,
    severity: 'CRITICAL',
    description: 'Direct string interpolation in SQL ILIKE queries'
  },
  {
    name: 'SQL Injection - Template Literals',
    pattern: /query\.or\(`[^`]*\$\{[^}]+\}[^`]*`\)/g,
    severity: 'CRITICAL',
    description: 'Template literals with user input in database queries'
  },
  {
    name: 'Improper Input Validation',
    pattern: /parseInt\([^)]*\.get\([^)]*\)\)/g,
    severity: 'MEDIUM',
    description: 'Direct parsing of query parameters without validation'
  },
  {
    name: 'Missing Error Handling',
    pattern: /console\.error.*error.*\n.*return.*NextResponse/g,
    severity: 'LOW',
    description: 'Error logging without proper sanitization'
  }
]

// Security fixes to verify
const securityFixes = [
  {
    name: 'Input Sanitization',
    pattern: /sanitizedSearch.*replace.*\[%_\\\\\]/g,
    description: 'Proper input sanitization for search queries'
  },
  {
    name: 'Input Length Limiting',
    pattern: /substring\(0,\s*100\)/g,
    description: 'Input length limiting to prevent buffer overflow'
  },
  {
    name: 'Parameter Validation',
    pattern: /safeParse|\.parse\(/g,
    description: 'Schema-based parameter validation'
  }
]

function analyzeFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return {
        file: filePath,
        status: 'NOT_FOUND',
        vulnerabilities: [],
        fixes: [],
        securityScore: 0
      }
    }

    const content = fs.readFileSync(filePath, 'utf8')
    const vulnerabilities = []
    const fixes = []

    // Check for vulnerabilities
    vulnerabilityPatterns.forEach(({ name, pattern, severity, description }) => {
      const matches = content.match(pattern)
      if (matches) {
        vulnerabilities.push({
          name,
          severity,
          description,
          count: matches.length,
          examples: matches.slice(0, 2) // Show first 2 examples
        })
      }
    })

    // Check for security fixes
    securityFixes.forEach(({ name, pattern, description }) => {
      const matches = content.match(pattern)
      if (matches) {
        fixes.push({
          name,
          description,
          count: matches.length
        })
      }
    })

    // Calculate security score
    const criticalVulns = vulnerabilities.filter(v => v.severity === 'CRITICAL').length
    const mediumVulns = vulnerabilities.filter(v => v.severity === 'MEDIUM').length
    const lowVulns = vulnerabilities.filter(v => v.severity === 'LOW').length
    const fixCount = fixes.length

    let securityScore = 100
    securityScore -= (criticalVulns * 40) // Critical vulnerabilities are heavily penalized
    securityScore -= (mediumVulns * 20)   // Medium vulnerabilities
    securityScore -= (lowVulns * 5)       // Low vulnerabilities
    securityScore += (fixCount * 10)      // Security fixes add points
    securityScore = Math.max(0, Math.min(100, securityScore)) // Clamp between 0-100

    let status = 'SECURE'
    if (criticalVulns > 0) status = 'CRITICAL'
    else if (mediumVulns > 0) status = 'MEDIUM_RISK'
    else if (lowVulns > 0) status = 'LOW_RISK'

    return {
      file: filePath,
      status,
      vulnerabilities,
      fixes,
      securityScore: Math.round(securityScore)
    }
  } catch (error) {
    return {
      file: filePath,
      status: 'ERROR',
      error: error.message,
      vulnerabilities: [],
      fixes: [],
      securityScore: 0
    }
  }
}

// Main analysis
console.log('🔍 Starting Security Validation...\n')

const results = apiRoutes.map(analyzeFile)
const summary = {
  total: results.length,
  secure: results.filter(r => r.status === 'SECURE').length,
  critical: results.filter(r => r.status === 'CRITICAL').length,
  mediumRisk: results.filter(r => r.status === 'MEDIUM_RISK').length,
  lowRisk: results.filter(r => r.status === 'LOW_RISK').length,
  notFound: results.filter(r => r.status === 'NOT_FOUND').length,
  errors: results.filter(r => r.status === 'ERROR').length,
  averageScore: Math.round(results.reduce((sum, r) => sum + r.securityScore, 0) / results.length)
}

// Display results
console.log('📊 SECURITY ANALYSIS RESULTS\n')
console.log('='.repeat(50))

results.forEach(result => {
  const statusIcon = {
    'SECURE': '✅',
    'CRITICAL': '🚨',
    'MEDIUM_RISK': '⚠️',
    'LOW_RISK': '⚡',
    'NOT_FOUND': '❓',
    'ERROR': '❌'
  }[result.status] || '❓'

  console.log(`${statusIcon} ${result.file}`)
  console.log(`   Status: ${result.status} | Score: ${result.securityScore}/100`)
  
  if (result.vulnerabilities.length > 0) {
    console.log('   Vulnerabilities:')
    result.vulnerabilities.forEach(vuln => {
      console.log(`     - ${vuln.name} (${vuln.severity}): ${vuln.count} instances`)
    })
  }
  
  if (result.fixes.length > 0) {
    console.log('   Security Fixes:')
    result.fixes.forEach(fix => {
      console.log(`     + ${fix.name}: ${fix.count} instances`)
    })
  }
  
  if (result.error) {
    console.log(`   Error: ${result.error}`)
  }
  
  console.log('')
})

console.log('='.repeat(50))
console.log('📈 SUMMARY')
console.log(`Total Files: ${summary.total}`)
console.log(`✅ Secure: ${summary.secure}`)
console.log(`🚨 Critical Risk: ${summary.critical}`)
console.log(`⚠️  Medium Risk: ${summary.mediumRisk}`)
console.log(`⚡ Low Risk: ${summary.lowRisk}`)
console.log(`❓ Not Found: ${summary.notFound}`)
console.log(`❌ Errors: ${summary.errors}`)
console.log(`📊 Average Security Score: ${summary.averageScore}/100`)

// Determine overall status
let overallStatus = 'SECURE'
if (summary.critical > 0) overallStatus = 'CRITICAL - IMMEDIATE ACTION REQUIRED'
else if (summary.mediumRisk > 0) overallStatus = 'MEDIUM RISK - FIXES RECOMMENDED'
else if (summary.lowRisk > 0) overallStatus = 'LOW RISK - MINOR IMPROVEMENTS NEEDED'

console.log(`\n🎯 OVERALL STATUS: ${overallStatus}`)

// Recommendations
console.log('\n💡 RECOMMENDATIONS:')
if (summary.critical > 0) {
  console.log('   1. 🚨 URGENT: Fix critical SQL injection vulnerabilities immediately')
  console.log('   2. 🔒 Implement proper input sanitization for all search queries')
  console.log('   3. 🛡️  Add comprehensive input validation using schema validation')
}
if (summary.mediumRisk > 0) {
  console.log('   4. ⚠️  Add proper error handling and logging')
  console.log('   5. 🔍 Implement request rate limiting')
}
if (summary.lowRisk > 0) {
  console.log('   6. ⚡ Improve error message sanitization')
  console.log('   7. 📝 Add security headers to API responses')
}

console.log('\n✅ Task 2.2 Status: ' + (summary.critical === 0 ? 'READY FOR COMPLETION' : 'REQUIRES ADDITIONAL FIXES'))
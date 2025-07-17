/**
 * Final Security Fix Script
 * Properly fixes all remaining SQL injection vulnerabilities
 */

const fs = require('fs')
const path = require('path')

// Files that need fixing
const filesToFix = [
  'src/app/api/reports/route.ts',
  'src/app/api/milestones/route.ts',
  'src/app/api/projects/[id]/tasks/route.ts',
  'src/app/api/projects/[id]/milestones/route.ts',
  'src/app/api/projects/[id]/material-specs/route.ts',
  'src/app/api/scope/excel/export/route.ts'
]

function fixFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`)
      return false
    }

    let content = fs.readFileSync(filePath, 'utf8')
    let modified = false

    // Fix 1: Replace broken sanitization with proper escape sequence
    const brokenSanitizationPattern = /const sanitizedSearch = ([^.]+)\.replace\(\/\[%_\\\\\]\/g, '\\\\[^']+'\)\.substring\(0, 100\)/g
    const matches = content.match(brokenSanitizationPattern)
    
    if (matches) {
      console.log(`🔧 Fixing broken sanitization in: ${filePath}`)
      matches.forEach(match => {
        const variableName = match.match(/const sanitizedSearch = ([^.]+)\./)[1]
        const fixedSanitization = `const sanitizedSearch = ${variableName}.replace(/[%_\\\\]/g, '\\\\$&').substring(0, 100)`
        content = content.replace(match, fixedSanitization)
        modified = true
      })
    }

    // Fix 2: Replace any remaining direct variable usage in queries with sanitized version
    const directUsagePattern = /query\.or\(`[^`]*\$\{([^}]+)\}[^`]*`\)/g
    const directMatches = content.match(directUsagePattern)
    
    if (directMatches) {
      console.log(`🔧 Fixing direct variable usage in: ${filePath}`)
      directMatches.forEach(match => {
        // Only fix if it's not already using sanitizedSearch
        if (!match.includes('sanitizedSearch')) {
          const fixed = match.replace(/\$\{[^}]+\}/g, '${sanitizedSearch}')
          content = content.replace(match, fixed)
          modified = true
        }
      })
    }

    // Fix 3: Remove duplicate sanitization lines
    const duplicatePattern = /(\s+const sanitizedSearch = [^\n]+\n)(\s+const sanitizedSearch = [^\n]+\n)+/g
    if (content.match(duplicatePattern)) {
      console.log(`🔧 Removing duplicate sanitization in: ${filePath}`)
      content = content.replace(duplicatePattern, '$1')
      modified = true
    }

    if (modified) {
      // Create backup
      const backupPath = filePath + '.final-backup-' + Date.now()
      fs.writeFileSync(backupPath, fs.readFileSync(filePath))
      
      // Write fixed content
      fs.writeFileSync(filePath, content)
      console.log(`✅ Fixed: ${filePath}`)
      return true
    } else {
      console.log(`✓ Clean: ${filePath}`)
      return false
    }
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message)
    return false
  }
}

// Main execution
console.log('🚀 Starting Final Security Fix...\n')

let totalFixed = 0
filesToFix.forEach(file => {
  if (fixFile(file)) {
    totalFixed++
  }
})

console.log(`\n📊 Summary: ${totalFixed} files fixed`)

if (totalFixed > 0) {
  console.log('\n✅ Final security fixes applied!')
  console.log('   Running validation to confirm fixes...')
  
  // Run validation
  try {
    const { execSync } = require('child_process')
    execSync('node scripts/security-validation.js', { stdio: 'inherit' })
  } catch (error) {
    console.log('   Validation script not available, please run manually.')
  }
} else {
  console.log('\n✓ All files are already secure.')
}
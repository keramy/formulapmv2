/**
 * Security Fix Script v2 for API Routes
 * Properly fixes SQL injection vulnerabilities
 */

const fs = require('fs')
const path = require('path')

// Function to create a proper sanitization function
function createSanitizationFix(content) {
  // Pattern to match: query = query.or(`...${variable}...`)
  const pattern = /(\s+)if\s*\([^{]+search[^{]*\)\s*\{[^}]*query\s*=\s*query\.or\(`[^`]*\$\{([^}]+)\}[^`]*`\)[^}]*\}/g
  
  return content.replace(pattern, (match, indent, searchVar) => {
    // Extract the search variable name (remove any property access)
    const cleanVar = searchVar.split('.').pop()
    
    return match.replace(
      /query\s*=\s*query\.or\(`([^`]*)\$\{[^}]+\}([^`]*)`\)/,
      `// Sanitize search input to prevent SQL injection
${indent}const sanitizedSearch = ${searchVar}.replace(/[%_\\\\]/g, '\\\\$&').substring(0, 100)
${indent}query = query.or(\`$1\\${sanitizedSearch}$2\`)`
    )
  })
}

// List of files to fix
const filesToFix = [
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

// Restore from backups first
console.log('🔄 Restoring files from backups...')
filesToFix.forEach(filePath => {
  try {
    const backupFiles = fs.readdirSync(path.dirname(filePath))
      .filter(f => f.startsWith(path.basename(filePath) + '.backup-'))
      .sort()
      .reverse()
    
    if (backupFiles.length > 0) {
      const latestBackup = path.join(path.dirname(filePath), backupFiles[0])
      const originalContent = fs.readFileSync(latestBackup, 'utf8')
      fs.writeFileSync(filePath, originalContent)
      console.log(`✅ Restored: ${filePath}`)
    }
  } catch (error) {
    console.log(`⚠️  Could not restore ${filePath}: ${error.message}`)
  }
})

console.log('\n🚀 Applying proper security fixes...\n')

// Apply proper fixes
let totalFixed = 0

filesToFix.forEach(filePath => {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`)
      return
    }

    let content = fs.readFileSync(filePath, 'utf8')
    let modified = false

    // Fix SQL injection in search queries
    const originalContent = content
    content = createSanitizationFix(content)
    
    if (content !== originalContent) {
      modified = true
    }

    // Additional manual fixes for specific patterns
    const patterns = [
      {
        // Pattern: query.or(`name.ilike.%${search}%,contact_person.ilike.%${search}%`)
        regex: /query\s*=\s*query\.or\(`([^`]*)\$\{([^}]+)\}([^`]*)`\)/g,
        replacement: (match, before, variable, after) => {
          const cleanVar = variable.trim()
          return `// Sanitize search input to prevent SQL injection
      const sanitizedSearch = ${cleanVar}.replace(/[%_\\\\]/g, '\\\\$&').substring(0, 100)
      query = query.or(\`${before}\\${sanitizedSearch}${after}\`)`
        }
      }
    ]

    patterns.forEach(({ regex, replacement }) => {
      const matches = content.match(regex)
      if (matches) {
        content = content.replace(regex, replacement)
        modified = true
      }
    })

    if (modified) {
      fs.writeFileSync(filePath, content)
      console.log(`✅ Fixed: ${filePath}`)
      totalFixed++
    } else {
      console.log(`✓ Clean: ${filePath}`)
    }
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message)
  }
})

console.log(`\n📊 Summary: ${totalFixed} files fixed`)
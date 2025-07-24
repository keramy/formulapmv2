/**
 * Comprehensive Role Structure Fix Script
 * Updates all API routes and components to use the new 5-role structure
 */
const fs = require('fs')
const path = require('path')

console.log('🔧 Comprehensive Role Structure Fix')
console.log('Updating all API routes and components')
console.log('='.repeat(60))

// Role mapping for fixes
const ROLE_MAPPINGS = {
  // Management consolidation
  'company_owner': 'management',
  'general_manager': 'management', 
  'deputy_general_manager': 'management',
  // Technical lead
  'technical_director': 'technical_lead',
  // Project manager consolidation
  'architect': 'project_manager',
  'technical_engineer': 'project_manager',
  'field_worker': 'project_manager',
  // Purchase manager consolidation
  'purchase_director': 'purchase_manager',
  'purchase_specialist': 'purchase_manager',
  // Client remains the same
  'client': 'client',
  // Admin remains the same
  'admin': 'admin'
}

// Common role arrays to replace
const COMMON_ARRAYS = {
  // Management roles
  "['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin']": "['management', 'admin']",
  "['company_owner', 'general_manager', 'deputy_general_manager', 'admin']": "['management', 'admin']",
  "['company_owner', 'admin']": "['management', 'admin']",
  // Project roles
  "['project_manager', 'architect', 'technical_engineer', 'field_worker']": "['project_manager']",
  // Purchase roles
  "['purchase_director', 'purchase_specialist']": "['purchase_manager']"
}

// Update a single file with role mappings
function updateFileRoles(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return { updated: false, reason: 'File not found' }
    }

    let content = fs.readFileSync(filePath, 'utf8')
    let hasChanges = false

    // Replace old role references with new ones
    Object.entries(ROLE_MAPPINGS).forEach(([oldRole, newRole]) => {
      const oldRolePattern1 = new RegExp(`'${oldRole}'`, 'g')
      const oldRolePattern2 = new RegExp(`"${oldRole}"`, 'g')
      
      if (content.includes(`'${oldRole}'`) || content.includes(`"${oldRole}"`)) {
        content = content.replace(oldRolePattern1, `'${newRole}'`)
        content = content.replace(oldRolePattern2, `"${newRole}"`)
        hasChanges = true
      }
    })

    // Replace common role arrays
    Object.entries(COMMON_ARRAYS).forEach(([oldArray, newArray]) => {
      if (content.includes(oldArray)) {
        content = content.replace(new RegExp(oldArray.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newArray)
        hasChanges = true
      }
    })

    if (hasChanges) {
      // Create backup
      const backupPath = filePath + '.backup'
      fs.writeFileSync(backupPath, fs.readFileSync(filePath))
      
      // Write updated content
      fs.writeFileSync(filePath, content)
      return { updated: true, reason: 'Role references updated' }
    }

    return { updated: false, reason: 'No role references found' }
  } catch (error) {
    return { updated: false, reason: `Error: ${error.message}` }
  }
}

// Process all files in a directory recursively
function processDirectory(dir, filePattern, processFunction) {
  const results = {
    processed: 0,
    updated: 0,
    errors: 0
  }

  try {
    const items = fs.readdirSync(dir)
    
    for (const item of items) {
      const fullPath = path.join(dir, item)
      
      try {
        const stat = fs.statSync(fullPath)
        
        if (stat.isDirectory()) {
          // Recursively process subdirectories
          const subResults = processDirectory(fullPath, filePattern, processFunction)
          results.processed += subResults.processed
          results.updated += subResults.updated
          results.errors += subResults.errors
        } else if (filePattern.test(item)) {
          // Process matching files
          results.processed++
          console.log(`Processing: ${fullPath}`)
          
          const result = processFunction(fullPath)
          if (result.updated) {
            console.log(`  ✅ Updated: ${result.reason}`)
            results.updated++
          } else if (result.reason === 'No role references found') {
            console.log(`  ℹ️  Skipped: ${result.reason}`)
          } else {
            console.log(`  ⚠️  ${result.reason}`)
            results.errors++
          }
        }
      } catch (error) {
        // Skip permission errors
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${dir}: ${error.message}`)
  }

  return results
}

// Main execution
function fixAllRoleReferences() {
  console.log('🔧 Starting comprehensive role structure fix...\n')

  // Fix API routes
  console.log('📂 Fixing API routes...')
  const apiDir = path.join(__dirname, '..', 'src', 'app', 'api')
  const apiResults = processDirectory(apiDir, /\.tsx?$/, updateFileRoles)

  // Fix components
  console.log('\n📂 Fixing components...')
  const componentsDir = path.join(__dirname, '..', 'src', 'components')
  const componentResults = processDirectory(componentsDir, /\.tsx?$/, updateFileRoles)

  // Fix hooks and utilities
  console.log('\n📂 Fixing hooks and utilities...')
  const hooksDir = path.join(__dirname, '..', 'src', 'hooks')
  const libDir = path.join(__dirname, '..', 'src', 'lib')
  
  const hooksResults = fs.existsSync(hooksDir) 
    ? processDirectory(hooksDir, /\.tsx?$/, updateFileRoles) 
    : { processed: 0, updated: 0, errors: 0 }
  
  const libResults = fs.existsSync(libDir)
    ? processDirectory(libDir, /\.tsx?$/, updateFileRoles)
    : { processed: 0, updated: 0, errors: 0 }

  // Generate summary
  console.log('\n' + '='.repeat(60))
  console.log('🎯 ROLE STRUCTURE FIX SUMMARY')
  console.log('='.repeat(60))
  console.log(`API Routes: ${apiResults.updated}/${apiResults.processed} updated`)
  console.log(`Components: ${componentResults.updated}/${componentResults.processed} updated`)
  console.log(`Hooks & Lib: ${hooksResults.updated + libResults.updated}/${hooksResults.processed + libResults.processed} updated`)
  console.log(`Total Files Updated: ${apiResults.updated + componentResults.updated + hooksResults.updated + libResults.updated}`)
  console.log(`Errors: ${apiResults.errors + componentResults.errors + hooksResults.errors + libResults.errors}`)
  console.log('='.repeat(60))

  if (apiResults.errors + componentResults.errors + hooksResults.errors + libResults.errors > 0) {
    console.log('⚠️  Some files had errors - check logs for details')
  } else {
    console.log('✅ All files processed successfully!')
  }

  console.log('\n📋 Next Steps:')
  console.log('1. Run tests to verify application functionality')
  console.log('2. Check for any remaining role references')
  console.log('3. Proceed to Phase 2: Performance Analysis')

  return {
    totalProcessed: apiResults.processed + componentResults.processed + hooksResults.processed + libResults.processed,
    totalUpdated: apiResults.updated + componentResults.updated + hooksResults.updated + libResults.updated,
    totalErrors: apiResults.errors + componentResults.errors + hooksResults.errors + libResults.errors
  }
}

// Run the fixes
if (require.main === module) {
  fixAllRoleReferences()
}

module.exports = { fixAllRoleReferences, ROLE_MAPPINGS }
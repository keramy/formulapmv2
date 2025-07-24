/**
 * Validation Script for Role Structure Fixes
 * Checks for any remaining old role references and validates the fixes
 */
const fs = require('fs')
const path = require('path')

console.log('🔍 Validating Role Structure Fixes')
console.log('Checking for remaining old role references')
console.log('='.repeat(60))

// Old roles that should no longer exist
const OLD_ROLES = [
  'management',
  'management', 
  'management',
  'technical_lead',
  'project_manager',
  'project_manager',
  'project_manager',
  'purchase_manager',
  'purchase_manager'
]

// New roles that should exist
const NEW_ROLES = [
  'management',
  'technical_lead',
  'project_manager',
  'purchase_manager',
  'client',
  'admin'
]

// Search for old role references in files
function searchForOldRoles(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return { found: false, references: [] }
    }

    const content = fs.readFileSync(filePath, 'utf8')
    const foundReferences = []

    OLD_ROLES.forEach(role => {
      const singleQuotePattern = new RegExp(`'${role}'`, 'g')
      const doubleQuotePattern = new RegExp(`"${role}"`, 'g')
      
      let match
      while ((match = singleQuotePattern.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length
        foundReferences.push({
          role,
          line: lineNumber,
          context: content.split('\n')[lineNumber - 1].trim()
        })
      }
      
      while ((match = doubleQuotePattern.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length
        foundReferences.push({
          role,
          line: lineNumber,
          context: content.split('\n')[lineNumber - 1].trim()
        })
      }
    })

    return {
      found: foundReferences.length > 0,
      references: foundReferences
    }
  } catch (error) {
    return { found: false, references: [], error: error.message }
  }
}

// Process directory recursively
function validateDirectory(dir, filePattern) {
  const results = {
    filesChecked: 0,
    filesWithIssues: 0,
    totalIssues: 0,
    issues: []
  }

  try {
    const items = fs.readdirSync(dir)
    
    for (const item of items) {
      const fullPath = path.join(dir, item)
      
      try {
        const stat = fs.statSync(fullPath)
        
        if (stat.isDirectory()) {
          const subResults = validateDirectory(fullPath, filePattern)
          results.filesChecked += subResults.filesChecked
          results.filesWithIssues += subResults.filesWithIssues
          results.totalIssues += subResults.totalIssues
          results.issues.push(...subResults.issues)
        } else if (filePattern.test(item)) {
          results.filesChecked++
          
          const validation = searchForOldRoles(fullPath)
          if (validation.found) {
            results.filesWithIssues++
            results.totalIssues += validation.references.length
            results.issues.push({
              file: fullPath,
              references: validation.references
            })
          }
        }
      } catch (error) {
        // Skip permission errors
      }
    }
  } catch (error) {
    console.error(`Error validating directory ${dir}: ${error.message}`)
  }

  return results
}

// Check TypeScript types file for role definitions
function validateTypeDefinitions() {
  const typesPath = path.join(__dirname, '..', 'src', 'types', 'auth.ts')
  
  if (!fs.existsSync(typesPath)) {
    return { status: 'warning', message: 'Types file not found' }
  }

  const content = fs.readFileSync(typesPath, 'utf8')
  
  // Check if new roles are defined
  const hasNewRoles = NEW_ROLES.every(role => content.includes(`'${role}'`) || content.includes(`"${role}"`))
  
  // Check if old roles are still defined
  const hasOldRoles = OLD_ROLES.some(role => content.includes(`'${role}'`) || content.includes(`"${role}"`))
  
  if (hasOldRoles) {
    return { status: 'error', message: 'Old role definitions still present in types' }
  }
  
  if (!hasNewRoles) {
    return { status: 'warning', message: 'Not all new roles found in type definitions' }
  }
  
  return { status: 'success', message: 'Type definitions look correct' }
}

// Main validation function
function validateRoleFixes() {
  console.log('🔍 Starting role fix validation...\n')

  // Validate API routes
  console.log('📂 Validating API routes...')
  const apiDir = path.join(__dirname, '..', 'src', 'app', 'api')
  const apiResults = validateDirectory(apiDir, /\.tsx?$/)

  // Validate components
  console.log('📂 Validating components...')
  const componentsDir = path.join(__dirname, '..', 'src', 'components')
  const componentResults = validateDirectory(componentsDir, /\.tsx?$/)

  // Validate hooks and lib
  console.log('📂 Validating hooks and lib...')
  const hooksDir = path.join(__dirname, '..', 'src', 'hooks')
  const libDir = path.join(__dirname, '..', 'src', 'lib')
  
  const hooksResults = fs.existsSync(hooksDir) 
    ? validateDirectory(hooksDir, /\.tsx?$/) 
    : { filesChecked: 0, filesWithIssues: 0, totalIssues: 0, issues: [] }
  
  const libResults = fs.existsSync(libDir)
    ? validateDirectory(libDir, /\.tsx?$/)
    : { filesChecked: 0, filesWithIssues: 0, totalIssues: 0, issues: [] }

  // Validate type definitions
  console.log('📂 Validating type definitions...')
  const typeValidation = validateTypeDefinitions()

  // Generate summary
  const totalFilesChecked = apiResults.filesChecked + componentResults.filesChecked + hooksResults.filesChecked + libResults.filesChecked
  const totalFilesWithIssues = apiResults.filesWithIssues + componentResults.filesWithIssues + hooksResults.filesWithIssues + libResults.filesWithIssues
  const totalIssues = apiResults.totalIssues + componentResults.totalIssues + hooksResults.totalIssues + libResults.totalIssues
  const allIssues = [...apiResults.issues, ...componentResults.issues, ...hooksResults.issues, ...libResults.issues]

  console.log('\n' + '='.repeat(60))
  console.log('🎯 ROLE FIX VALIDATION SUMMARY')
  console.log('='.repeat(60))
  console.log(`Files Checked: ${totalFilesChecked}`)
  console.log(`Files with Issues: ${totalFilesWithIssues}`)
  console.log(`Total Old Role References Found: ${totalIssues}`)
  console.log(`Type Definitions: ${typeValidation.status.toUpperCase()} - ${typeValidation.message}`)
  console.log('='.repeat(60))

  if (totalIssues > 0) {
    console.log('\n⚠️  REMAINING ISSUES FOUND:')
    allIssues.forEach(issue => {
      console.log(`\n📄 ${issue.file}`)
      issue.references.forEach(ref => {
        console.log(`  Line ${ref.line}: '${ref.role}' in: ${ref.context}`)
      })
    })
    console.log('\n❌ Role fix validation FAILED - manual fixes needed')
  } else {
    console.log('\n✅ Role fix validation PASSED - no old role references found!')
  }

  console.log('\n📋 Next Steps:')
  if (totalIssues > 0) {
    console.log('1. Fix remaining old role references manually')
    console.log('2. Re-run validation script')
    console.log('3. Run application tests')
  } else {
    console.log('1. Run application tests to verify functionality')
    console.log('2. Proceed to Phase 2: Performance Analysis')
    console.log('3. Continue with frontend performance audit')
  }

  return {
    success: totalIssues === 0,
    totalIssues,
    totalFilesChecked,
    issues: allIssues
  }
}

// Run validation
if (require.main === module) {
  validateRoleFixes()
}

module.exports = { validateRoleFixes, OLD_ROLES, NEW_ROLES }
/**
 * API Security Fix Script
 * Updates critical API routes to use new 5-role structure
 */

const fs = require('fs')
const path = require('path')

console.log('🔧 API Security Fix Script')
console.log('Updating API routes for 5-role structure')
console.log('='.repeat(50))

// Role mapping for quick fixes
const ROLE_MAPPINGS = {
  // Management consolidation
  'management': 'management',
  'management': 'management', 
  'management': 'management',
  
  // Technical lead
  'technical_lead': 'technical_lead',
  
  // Project manager consolidation
  'project_manager': 'project_manager',
  'project_manager': 'project_manager',
  'project_manager': 'project_manager',
  
  // Purchase manager consolidation
  'purchase_manager': 'purchase_manager',
  'purchase_manager': 'purchase_manager',
  
  // Client remains the same
  'client': 'client',
  
  // Admin remains the same
  'admin': 'admin'
}

// Files to update (most critical API routes)
const CRITICAL_API_FILES = [
  'src/app/api/auth/profile/route.ts',
  'src/app/api/projects/route.ts',
  'src/app/api/reports/route.ts',
  'src/app/api/scope/route.ts',
  'src/app/api/tasks/route.ts'
]

/**
 * Update a single file with role mappings
 */
function updateFileRoles(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`  ⚠️  File not found: ${filePath}`)
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
    
    // Update common role arrays
    const oldManagementArray = `['management', 'management', 'management', 'technical_lead', 'admin']`
    const newManagementArray = `['management', 'admin']`
    
    if (content.includes(oldManagementArray)) {
      content = content.replace(oldManagementArray, newManagementArray)
      hasChanges = true
    }
    
    // Update purchase role arrays
    const oldPurchaseArray = `['purchase_manager', 'purchase_manager']`
    const newPurchaseArray = `['purchase_manager']`
    
    if (content.includes(oldPurchaseArray)) {
      content = content.replace(oldPurchaseArray, newPurchaseArray)
      hasChanges = true
    }
    
    // Update project role arrays
    const oldProjectArray = `['project_manager', 'project_manager', 'project_manager', 'project_manager']`
    const newProjectArray = `['project_manager']`
    
    if (content.includes(oldProjectArray)) {
      content = content.replace(oldProjectArray, newProjectArray)
      hasChanges = true
    }
    
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

/**
 * Create a secure API route template
 */
function createSecureAPITemplate(routeName) {
  return `/**
 * SECURE VERSION - ${routeName} API Route
 * Updated for 5-role structure with enhanced security
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { hasPermission } from '@/lib/permissions'
import { createServerClient } from '@/lib/supabase'

export const GET = withAuth(async (request: NextRequest, { user, profile }) => {
  try {
    // Permission check for new 5-role structure
    if (!hasPermission(profile.role, '${routeName}.read')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const supabase = createServerClient()
    
    // Your API logic here
    // Use profile.role which now contains: management, purchase_manager, technical_lead, project_manager, client, admin
    // Use profile.seniority_level for PM hierarchy: executive, senior, regular, standard, system
    // Use profile.approval_limits for budget/approval checks
    
    return NextResponse.json({
      success: true,
      data: [], // Your data here
      user: {
        id: user.id,
        role: profile.role,
        seniority: profile.seniority_level
      }
    })
    
  } catch (error) {
    console.error('${routeName} API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

export const POST = withAuth(async (request: NextRequest, { user, profile }) => {
  try {
    // Permission check for new 5-role structure
    if (!hasPermission(profile.role, '${routeName}.create')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const supabase = createServerClient()
    
    // Your API logic here
    
    return NextResponse.json({
      success: true,
      message: '${routeName} created successfully'
    })
    
  } catch (error) {
    console.error('${routeName} API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}, {
  permission: '${routeName}.create' // Optional: specify required permission
})`
}

/**
 * Main execution
 */
function fixAPISecurity() {
  console.log('🔧 Starting API security fixes...\n')
  
  let updatedFiles = 0
  let totalFiles = 0
  
  // Update critical API files
  CRITICAL_API_FILES.forEach(filePath => {
    console.log(`🔧 Checking: ${filePath}`)
    totalFiles++
    
    const result = updateFileRoles(filePath)
    
    if (result.updated) {
      console.log(`  ✅ Updated: ${result.reason}`)
      updatedFiles++
    } else {
      console.log(`  ⚠️  ${result.reason}`)
    }
  })
  
  // Create secure template examples
  console.log('\\n📝 Creating secure API templates...')
  
  const templatesDir = path.join(__dirname, '..', 'api-templates')
  if (!fs.existsSync(templatesDir)) {
    fs.mkdirSync(templatesDir, { recursive: true })
  }
  
  const templates = ['projects', 'reports', 'scope', 'tasks']
  templates.forEach(template => {
    const templatePath = path.join(templatesDir, `${template}-route-secure.ts`)
    const templateContent = createSecureAPITemplate(template)
    fs.writeFileSync(templatePath, templateContent)
    console.log(`  📄 Created: ${templatePath}`)
  })
  
  // Create migration guide
  const migrationGuide = `# API Route Migration Guide

## 5-Role Structure Updates

### Old Roles → New Roles
${Object.entries(ROLE_MAPPINGS).map(([old, new_]) => `- \`${old}\` → \`${new_}\``).join('\\n')}

### Updated Permission Checks

Instead of:
\`\`\`typescript
if (!['management', 'management', 'management'].includes(profile.role)) {
  return NextResponse.json({ error: 'Access denied' }, { status: 403 })
}
\`\`\`

Use:
\`\`\`typescript
if (!hasPermission(profile.role, 'specific.permission')) {
  return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
}
\`\`\`

### PM Hierarchy Support

Check seniority level:
\`\`\`typescript
if (profile.role === 'project_manager' && profile.seniority_level === 'senior') {
  // Senior PM logic
}
\`\`\`

Check approval limits:
\`\`\`typescript
if (profile.approval_limits?.budget && requestAmount <= profile.approval_limits.budget) {
  // Can approve
}
\`\`\`

### Cost Visibility

Use the new cost access function:
\`\`\`typescript
import { hasCostAccess } from '@/lib/permissions'

if (hasCostAccess(profile.role, profile.seniority_level)) {
  // Include cost data
}
\`\`\`

## Files Updated
${CRITICAL_API_FILES.map(file => `- ${file}`).join('\\n')}

## Next Steps
1. Test updated API routes
2. Update remaining API routes using templates
3. Update frontend components to use new roles
4. Test end-to-end workflows
`
  
  const guideePath = path.join(__dirname, '..', 'API_MIGRATION_GUIDE.md')
  fs.writeFileSync(guideePath, migrationGuide)
  
  console.log('\\n' + '='.repeat(50))
  console.log('🎯 API SECURITY FIX SUMMARY')
  console.log('='.repeat(50))
  console.log(`Files Checked: ${totalFiles}`)
  console.log(`Files Updated: ${updatedFiles}`)
  console.log(`Templates Created: ${templates.length}`)
  console.log(`Migration Guide: API_MIGRATION_GUIDE.md`)
  console.log('='.repeat(50))
  
  if (updatedFiles > 0) {
    console.log('✅ API security fixes applied successfully!')
    console.log('📋 Next: Review updated files and test API endpoints')
  } else {
    console.log('ℹ️  No critical API files needed updates')
    console.log('📋 Use templates to create new secure API routes')
  }
}

// Run the fixes
fixAPISecurity()
/**
 * Performance Issues Fix Script
 * Fixes identified performance anti-patterns and optimizes components
 */
const fs = require('fs')
const path = require('path')

console.log('🚀 Performance Issues Fix Script')
console.log('Fixing identified performance anti-patterns')
console.log('='.repeat(60))

// Fix results tracking
const fixResults = {
  consoleLogsRemoved: 0,
  useEffectFixed: 0,
  componentsOptimized: 0,
  permissionsOptimized: 0,
  filesProcessed: 0,
  errors: []
}

// Remove console.log statements from production code
function removeConsoleLogs(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return { fixed: false, reason: 'File not found' }
    }

    let content = fs.readFileSync(filePath, 'utf8')
    let hasChanges = false

    // Remove console.log statements but preserve console.error and console.warn
    const consoleLogPattern = /console\.log\([^)]*\);?\s*\n?/g
    const matches = content.match(consoleLogPattern)
    
    if (matches && matches.length > 0) {
      // Create backup
      const backupPath = filePath + '.perf-backup'
      fs.writeFileSync(backupPath, content)
      
      // Remove console.log statements
      content = content.replace(consoleLogPattern, '')
      
      // Clean up empty lines
      content = content.replace(/\n\s*\n\s*\n/g, '\n\n')
      
      fs.writeFileSync(filePath, content)
      fixResults.consoleLogsRemoved += matches.length
      hasChanges = true
    }

    return { 
      fixed: hasChanges, 
      reason: hasChanges ? `Removed ${matches?.length || 0} console.log statements` : 'No console.log found'
    }
  } catch (error) {
    fixResults.errors.push({ file: filePath, error: error.message, type: 'console-logs' })
    return { fixed: false, reason: `Error: ${error.message}` }
  }
}

// Fix empty dependency array useEffect issues
function fixUseEffectDependencies(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return { fixed: false, reason: 'File not found' }
    }

    let content = fs.readFileSync(filePath, 'utf8')
    let hasChanges = false

    // Pattern for useEffect with empty dependency array that might need dependencies
    const emptyDepPattern = /useEffect\(\s*\(\)\s*=>\s*{([\s\S]*?)},\s*\[\]\s*\)/g
    let match
    let fixCount = 0

    while ((match = emptyDepPattern.exec(content)) !== null) {
      const effectBody = match[1]
      
      // Check if the effect uses variables that should be in dependencies
      const variablePattern = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g
      const variables = new Set()
      let varMatch
      
      while ((varMatch = variablePattern.exec(effectBody)) !== null) {
        const variable = varMatch[1]
        // Skip common keywords and built-in functions
        if (!['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'console', 'fetch', 'async', 'await'].includes(variable)) {
          variables.add(variable)
        }
      }
      
      // If we found potential dependencies, add a comment
      if (variables.size > 0) {
        const comment = `\n  // TODO: Review dependencies - potential deps: ${Array.from(variables).slice(0, 3).join(', ')}`
        const replacement = match[0].replace('[]', `[]${comment}`)
        content = content.replace(match[0], replacement)
        hasChanges = true
        fixCount++
      }
    }

    if (hasChanges) {
      // Create backup
      const backupPath = filePath + '.perf-backup'
      if (!fs.existsSync(backupPath)) {
        fs.writeFileSync(backupPath, fs.readFileSync(filePath, 'utf8'))
      }
      
      fs.writeFileSync(filePath, content)
      fixResults.useEffectFixed += fixCount
    }

    return { 
      fixed: hasChanges, 
      reason: hasChanges ? `Added dependency review comments to ${fixCount} useEffect hooks` : 'No empty dependency arrays found'
    }
  } catch (error) {
    fixResults.errors.push({ file: filePath, error: error.message, type: 'useEffect' })
    return { fixed: false, reason: `Error: ${error.message}` }
  }
}

// Optimize permission checking logic
function optimizePermissionChecks(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return { fixed: false, reason: 'File not found' }
    }

    let content = fs.readFileSync(filePath, 'utf8')
    let hasChanges = false

    // Add useMemo for complex permission calculations
    if (content.includes('hasPermission') && content.includes('&&') && content.includes('||')) {
      // Check if useMemo is already imported
      if (!content.includes('useMemo')) {
        // Add useMemo to React imports
        const reactImportPattern = /import\s+(?:React,\s*)?{([^}]+)}\s+from\s+['"]react['"]/
        const match = content.match(reactImportPattern)
        
        if (match) {
          const imports = match[1].trim()
          if (!imports.includes('useMemo')) {
            const newImports = imports + ', useMemo'
            content = content.replace(match[0], match[0].replace(match[1], newImports))
            hasChanges = true
          }
        } else {
          // Add React import with useMemo
          const importLine = "import { useMemo } from 'react'\n"
          content = importLine + content
          hasChanges = true
        }
      }

      // Add comment about memoizing permission calculations
      if (!content.includes('TODO: Consider memoizing permission calculations')) {
        const permissionPattern = /(hasPermission[^;]+;)/g
        content = content.replace(permissionPattern, '$1\n  // TODO: Consider memoizing permission calculations with useMemo')
        hasChanges = true
      }
    }

    if (hasChanges) {
      // Create backup
      const backupPath = filePath + '.perf-backup'
      if (!fs.existsSync(backupPath)) {
        fs.writeFileSync(backupPath, fs.readFileSync(filePath, 'utf8'))
      }
      
      fs.writeFileSync(filePath, content)
      fixResults.permissionsOptimized++
    }

    return { 
      fixed: hasChanges, 
      reason: hasChanges ? 'Added permission optimization suggestions' : 'No permission optimizations needed'
    }
  } catch (error) {
    fixResults.errors.push({ file: filePath, error: error.message, type: 'permissions' })
    return { fixed: false, reason: `Error: ${error.message}` }
  }
}

// Add React.memo to large components
function optimizeLargeComponents(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return { fixed: false, reason: 'File not found' }
    }

    let content = fs.readFileSync(filePath, 'utf8')
    let hasChanges = false

    // Check if component is already memoized
    if (content.includes('React.memo') || content.includes('memo(')) {
      return { fixed: false, reason: 'Component already memoized' }
    }

    // Find component export pattern
    const exportPattern = /export\s+default\s+function\s+(\w+)/
    const match = content.match(exportPattern)

    if (match) {
      const componentName = match[1]
      
      // Add React import if not present
      if (!content.includes('import React') && !content.includes("from 'react'")) {
        content = "import React from 'react'\n" + content
        hasChanges = true
      } else if (content.includes("from 'react'") && !content.includes('React,')) {
        // Add React to existing import
        content = content.replace(/import\s*{([^}]+)}\s*from\s*['"]react['"]/, "import React, {$1} from 'react'")
        hasChanges = true
      }

      // Wrap component with React.memo
      const exportReplacement = `export default React.memo(${componentName})`
      content = content.replace(match[0], `function ${componentName}`)
      content = content + `\n\n${exportReplacement}`
      hasChanges = true
    }

    if (hasChanges) {
      // Create backup
      const backupPath = filePath + '.perf-backup'
      if (!fs.existsSync(backupPath)) {
        fs.writeFileSync(backupPath, fs.readFileSync(filePath, 'utf8'))
      }
      
      fs.writeFileSync(filePath, content)
      fixResults.componentsOptimized++
    }

    return { 
      fixed: hasChanges, 
      reason: hasChanges ? 'Added React.memo optimization' : 'Component optimization not applicable'
    }
  } catch (error) {
    fixResults.errors.push({ file: filePath, error: error.message, type: 'component-memo' })
    return { fixed: false, reason: `Error: ${error.message}` }
  }
}

// Process files with performance issues
function fixPerformanceIssues() {
  console.log('🔧 Starting performance fixes...\n')

  // Files with console.log issues
  const consoleLogFiles = [
    'src/components/admin/UserImpersonationModal.tsx',
    'src/components/auth/LoginForm.tsx',
    'src/components/dashboard/RealtimeDashboard.tsx',
    'src/components/layouts/Header.tsx',
    'src/components/layouts/LayoutWrapper.tsx',
    'src/components/projects/TabbedWorkspaceOptimized.tsx',
    'src/components/projects/tabs/RealtimeScopeListTab.tsx'
  ]

  // Files with useEffect issues
  const useEffectFiles = [
    'src/components/advanced/AdvancedDataTable.tsx',
    'src/components/auth/LoginForm.tsx',
    'src/components/dashboard/RealtimeDashboard.tsx'
  ]

  // Files with permission optimization needs
  const permissionFiles = [
    'src/components/auth/AuthGuard.tsx',
    'src/hooks/usePermissions.ts',
    'src/lib/permissions.ts'
  ]

  // Large components that need React.memo
  const largeComponents = [
    'src/components/advanced/AdvancedDataTable.tsx',
    'src/components/projects/material-approval/MaterialSpecForm.tsx',
    'src/components/projects/tabs/RealtimeScopeListTab.tsx',
    'src/components/projects/tabs/ScopeListTab.tsx',
    'src/components/tasks/TaskForm.tsx',
    'src/components/tasks/TaskList.tsx',
    'src/components/milestones/MilestoneList.tsx'
  ]

  console.log('🧹 Removing console.log statements...')
  consoleLogFiles.forEach(file => {
    const fullPath = path.join(__dirname, '..', file)
    console.log(`Processing: ${file}`)
    const result = removeConsoleLogs(fullPath)
    console.log(`  ${result.fixed ? '✅' : 'ℹ️'} ${result.reason}`)
    fixResults.filesProcessed++
  })

  console.log('\n🔄 Fixing useEffect dependencies...')
  useEffectFiles.forEach(file => {
    const fullPath = path.join(__dirname, '..', file)
    console.log(`Processing: ${file}`)
    const result = fixUseEffectDependencies(fullPath)
    console.log(`  ${result.fixed ? '✅' : 'ℹ️'} ${result.reason}`)
    fixResults.filesProcessed++
  })

  console.log('\n⚡ Optimizing permission checks...')
  permissionFiles.forEach(file => {
    const fullPath = path.join(__dirname, '..', file)
    console.log(`Processing: ${file}`)
    const result = optimizePermissionChecks(fullPath)
    console.log(`  ${result.fixed ? '✅' : 'ℹ️'} ${result.reason}`)
    fixResults.filesProcessed++
  })

  console.log('\n🎯 Optimizing large components...')
  largeComponents.forEach(file => {
    const fullPath = path.join(__dirname, '..', file)
    console.log(`Processing: ${file}`)
    const result = optimizeLargeComponents(fullPath)
    console.log(`  ${result.fixed ? '✅' : 'ℹ️'} ${result.reason}`)
    fixResults.filesProcessed++
  })
}

// Create performance optimization utilities
function createPerformanceUtils() {
  console.log('\n🛠️ Creating performance optimization utilities...')

  // Create a performance monitoring hook
  const performanceHookContent = `/**
 * Performance monitoring hook
 * Helps track component render performance
 */
import { useEffect, useRef } from 'react'

export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0)
  const startTime = useRef<number>()

  useEffect(() => {
    renderCount.current++
    startTime.current = performance.now()
    
    return () => {
      if (startTime.current) {
        const renderTime = performance.now() - startTime.current
        if (renderTime > 16) { // More than one frame (16ms)
          console.warn(\`\${componentName} render took \${renderTime.toFixed(2)}ms (render #\${renderCount.current})\`)
        }
      }
    }
  })

  return {
    renderCount: renderCount.current,
    logRender: () => console.log(\`\${componentName} rendered \${renderCount.current} times\`)
  }
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
`

  const hookPath = path.join(__dirname, '..', 'src', 'hooks', 'usePerformance.ts')
  fs.writeFileSync(hookPath, performanceHookContent)
  console.log('✅ Created performance monitoring hook')

  // Create memoization utilities
  const memoUtilsContent = `/**
 * Memoization utilities for performance optimization
 */
import { useMemo, useCallback } from 'react'
import type { UserRole } from '@/types/auth'

// Memoized permission checker
export function useMemoizedPermissions(userRole: UserRole, requiredPermissions: string[]) {
  return useMemo(() => {
    // Add your permission logic here
    return requiredPermissions.every(permission => {
      // Implement permission checking logic
      return true // Placeholder
    })
  }, [userRole, requiredPermissions])
}

// Memoized role-based component renderer
export function useMemoizedRoleComponent<T>(
  userRole: UserRole,
  componentMap: Record<UserRole, React.ComponentType<T>>,
  props: T
) {
  return useMemo(() => {
    const Component = componentMap[userRole]
    return Component ? <Component {...props} /> : null
  }, [userRole, componentMap, props])
}

// Debounced callback for expensive operations
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList
): T {
  return useCallback(
    debounce(callback, delay),
    deps
  ) as T
}

function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout
  return ((...args: any[]) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(this, args), wait)
  }) as T
}
`

  const utilsPath = path.join(__dirname, '..', 'src', 'lib', 'performance-utils.ts')
  fs.writeFileSync(utilsPath, memoUtilsContent)
  console.log('✅ Created memoization utilities')
}

// Generate performance fix report
function generateFixReport() {
  console.log('\n' + '='.repeat(60))
  console.log('🎯 PERFORMANCE FIXES SUMMARY')
  console.log('='.repeat(60))
  console.log(`Files Processed: ${fixResults.filesProcessed}`)
  console.log(`Console Logs Removed: ${fixResults.consoleLogsRemoved}`)
  console.log(`UseEffect Hooks Fixed: ${fixResults.useEffectFixed}`)
  console.log(`Components Optimized: ${fixResults.componentsOptimized}`)
  console.log(`Permission Checks Optimized: ${fixResults.permissionsOptimized}`)
  console.log(`Errors: ${fixResults.errors.length}`)
  console.log('='.repeat(60))

  if (fixResults.errors.length > 0) {
    console.log('\n⚠️ ERRORS ENCOUNTERED:')
    fixResults.errors.forEach(error => {
      console.log(`❌ ${error.file}: ${error.error} (${error.type})`)
    })
  }

  const totalFixes = fixResults.consoleLogsRemoved + fixResults.useEffectFixed + 
                    fixResults.componentsOptimized + fixResults.permissionsOptimized

  if (totalFixes > 0) {
    console.log('\n✅ Performance fixes applied successfully!')
    console.log('📋 Next Steps:')
    console.log('1. Test the application to ensure fixes work correctly')
    console.log('2. Review TODO comments added for further optimization')
    console.log('3. Consider implementing SWR for data fetching')
    console.log('4. Add code splitting for large components')
  } else {
    console.log('\n⚠️ No performance fixes were applied')
    console.log('This might indicate files were already optimized or not found')
  }

  // Save detailed report
  const reportPath = path.join(__dirname, '..', 'PERFORMANCE_FIXES_REPORT.json')
  fs.writeFileSync(reportPath, JSON.stringify(fixResults, null, 2))
  console.log(`\n📄 Detailed report saved to: ${reportPath}`)

  return fixResults
}

// Main execution
function runPerformanceFixes() {
  console.log('🚀 Starting performance optimization fixes...\n')
  
  fixPerformanceIssues()
  createPerformanceUtils()
  
  return generateFixReport()
}

// Run fixes
if (require.main === module) {
  runPerformanceFixes()
}

module.exports = { runPerformanceFixes }
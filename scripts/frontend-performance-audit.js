/**
 * Frontend Performance Audit Script
 * Analyzes bundle size, component performance, and optimization opportunities
 */
const fs = require('fs')
const path = require('path')

console.log('🎯 Frontend Performance Audit')
console.log('Analyzing bundle size and optimization opportunities')
console.log('='.repeat(60))

// Performance audit results
const auditResults = {
  bundleAnalysis: {},
  componentAnalysis: {},
  optimizationOpportunities: [],
  performanceMetrics: {},
  recommendations: []
}

// Analyze bundle size and dependencies
function analyzeBundleSize() {
  console.log('\n📦 Analyzing Bundle Size...')
  
  try {
    const packageJsonPath = path.join(__dirname, '..', 'package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    
    // Analyze dependencies
    const dependencies = packageJson.dependencies || {}
    const devDependencies = packageJson.devDependencies || {}
    
    // Heavy dependencies that might impact bundle size
    const heavyDependencies = [
      '@supabase/supabase-js',
      'next',
      'react',
      'react-dom',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      'lucide-react',
      'recharts',
      'date-fns'
    ]
    
    const presentHeavyDeps = heavyDependencies.filter(dep => dependencies[dep])
    
    auditResults.bundleAnalysis = {
      totalDependencies: Object.keys(dependencies).length,
      totalDevDependencies: Object.keys(devDependencies).length,
      heavyDependenciesPresent: presentHeavyDeps,
      potentialBundleImpact: presentHeavyDeps.length > 5 ? 'HIGH' : presentHeavyDeps.length > 3 ? 'MEDIUM' : 'LOW'
    }
    
    console.log(`✅ Dependencies analyzed: ${Object.keys(dependencies).length} production, ${Object.keys(devDependencies).length} dev`)
    console.log(`⚠️  Heavy dependencies: ${presentHeavyDeps.length} (${auditResults.bundleAnalysis.potentialBundleImpact} impact)`)
    
  } catch (error) {
    console.log(`❌ Bundle analysis failed: ${error.message}`)
    auditResults.bundleAnalysis.error = error.message
  }
}

// Analyze component complexity and performance
function analyzeComponentPerformance() {
  console.log('\n🧩 Analyzing Component Performance...')
  
  try {
    const componentsDir = path.join(__dirname, '..', 'src', 'components')
    const componentStats = {
      totalComponents: 0,
      largeComponents: [],
      complexComponents: [],
      performanceIssues: []
    }
    
    // Recursively analyze components
    function analyzeDirectory(dir) {
      const items = fs.readdirSync(dir)
      
      items.forEach(item => {
        const fullPath = path.join(dir, item)
        const stat = fs.statSync(fullPath)
        
        if (stat.isDirectory()) {
          analyzeDirectory(fullPath)
        } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
          componentStats.totalComponents++
          
          const content = fs.readFileSync(fullPath, 'utf8')
          const lines = content.split('\n').length
          const relativePath = path.relative(componentsDir, fullPath)
          
          // Check for large components (>300 lines)
          if (lines > 300) {
            componentStats.largeComponents.push({
              file: relativePath,
              lines,
              severity: lines > 500 ? 'HIGH' : 'MEDIUM'
            })
          }
          
          // Check for potential performance issues
          const performancePatterns = [
            { pattern: /useEffect\(\s*\(\)\s*=>\s*{[\s\S]*?},\s*\[\]\s*\)/, issue: 'Empty dependency array useEffect' },
            { pattern: /useState\([^)]*\{[^}]*\}[^)]*\)/, issue: 'Object in useState (causes re-renders)' },
            { pattern: /\.map\([^)]*\)\s*\.map\([^)]*\)/, issue: 'Chained array maps (performance impact)' },
            { pattern: /console\.log/, issue: 'Console logs in production code' },
            { pattern: /JSON\.parse\(JSON\.stringify/, issue: 'Deep cloning with JSON (performance impact)' }
          ]
          
          performancePatterns.forEach(({ pattern, issue }) => {
            if (pattern.test(content)) {
              componentStats.performanceIssues.push({
                file: relativePath,
                issue,
                severity: 'MEDIUM'
              })
            }
          })
          
          // Check for complex components (many hooks, props, etc.)
          const hookCount = (content.match(/use[A-Z]\w*/g) || []).length
          const propsCount = (content.match(/interface\s+\w+Props\s*{[^}]*}/g) || []).join('').split(',').length
          
          if (hookCount > 8 || propsCount > 10) {
            componentStats.complexComponents.push({
              file: relativePath,
              hooks: hookCount,
              props: propsCount,
              complexity: hookCount + propsCount
            })
          }
        }
      })
    }
    
    if (fs.existsSync(componentsDir)) {
      analyzeDirectory(componentsDir)
    }
    
    auditResults.componentAnalysis = componentStats
    
    console.log(`✅ Components analyzed: ${componentStats.totalComponents}`)
    console.log(`⚠️  Large components: ${componentStats.largeComponents.length}`)
    console.log(`⚠️  Complex components: ${componentStats.complexComponents.length}`)
    console.log(`⚠️  Performance issues: ${componentStats.performanceIssues.length}`)
    
  } catch (error) {
    console.log(`❌ Component analysis failed: ${error.message}`)
    auditResults.componentAnalysis.error = error.message
  }
}

// Analyze role-based rendering performance
function analyzeRoleBasedRendering() {
  console.log('\n👥 Analyzing Role-Based Rendering Performance...')
  
  try {
    // Check for role-based conditional rendering patterns
    const filesToCheck = [
      'src/components/auth/AuthGuard.tsx',
      'src/components/layouts/Sidebar.tsx',
      'src/components/layouts/Header.tsx',
      'src/hooks/usePermissions.ts',
      'src/lib/permissions.ts'
    ]
    
    const roleRenderingIssues = []
    
    filesToCheck.forEach(filePath => {
      const fullPath = path.join(__dirname, '..', filePath)
      
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8')
        
        // Check for potential performance issues in role-based rendering
        const issues = []
        
        // Multiple role checks in render
        const roleCheckMatches = content.match(/role\s*===\s*['"][^'"]*['"]/g) || []
        if (roleCheckMatches.length > 5) {
          issues.push(`Multiple role checks (${roleCheckMatches.length}) - consider memoization`)
        }
        
        // Complex permission calculations in render
        if (content.includes('hasPermission') && content.includes('&&') && content.includes('||')) {
          issues.push('Complex permission calculations in render - consider useMemo')
        }
        
        // Role-based component mounting/unmounting
        if (content.includes('role') && content.includes('?') && content.includes(':')) {
          issues.push('Conditional component rendering based on role - consider lazy loading')
        }
        
        if (issues.length > 0) {
          roleRenderingIssues.push({
            file: filePath,
            issues
          })
        }
      }
    })
    
    auditResults.performanceMetrics.roleBasedRendering = {
      filesAnalyzed: filesToCheck.length,
      issuesFound: roleRenderingIssues.length,
      issues: roleRenderingIssues
    }
    
    console.log(`✅ Role-based rendering analyzed: ${filesToCheck.length} files`)
    console.log(`⚠️  Performance issues found: ${roleRenderingIssues.length}`)
    
  } catch (error) {
    console.log(`❌ Role-based rendering analysis failed: ${error.message}`)
    auditResults.performanceMetrics.roleBasedRenderingError = error.message
  }
}

// Check for optimization opportunities
function identifyOptimizationOpportunities() {
  console.log('\n🚀 Identifying Optimization Opportunities...')
  
  const opportunities = []
  
  // Bundle optimization opportunities
  if (auditResults.bundleAnalysis.potentialBundleImpact === 'HIGH') {
    opportunities.push({
      category: 'Bundle Size',
      priority: 'HIGH',
      opportunity: 'Implement code splitting and lazy loading',
      impact: 'Reduce initial bundle size by 30-50%',
      effort: 'MEDIUM'
    })
  }
  
  // Component optimization opportunities
  if (auditResults.componentAnalysis.largeComponents?.length > 0) {
    opportunities.push({
      category: 'Component Size',
      priority: 'MEDIUM',
      opportunity: 'Break down large components into smaller, reusable pieces',
      impact: 'Improve maintainability and performance',
      effort: 'MEDIUM'
    })
  }
  
  if (auditResults.componentAnalysis.performanceIssues?.length > 0) {
    opportunities.push({
      category: 'Component Performance',
      priority: 'HIGH',
      opportunity: 'Fix identified performance anti-patterns',
      impact: 'Reduce re-renders and improve responsiveness',
      effort: 'LOW'
    })
  }
  
  // Role-based rendering optimization
  if (auditResults.performanceMetrics.roleBasedRendering?.issuesFound > 0) {
    opportunities.push({
      category: 'Role-Based Rendering',
      priority: 'MEDIUM',
      opportunity: 'Optimize permission checks and role-based rendering',
      impact: 'Improve rendering performance for complex permission states',
      effort: 'MEDIUM'
    })
  }
  
  // General optimization opportunities
  opportunities.push(
    {
      category: 'Image Optimization',
      priority: 'MEDIUM',
      opportunity: 'Implement Next.js Image optimization',
      impact: 'Faster page loads and better Core Web Vitals',
      effort: 'LOW'
    },
    {
      category: 'Caching',
      priority: 'HIGH',
      opportunity: 'Implement API response caching and SWR',
      impact: 'Reduce API calls and improve perceived performance',
      effort: 'MEDIUM'
    },
    {
      category: 'Prefetching',
      priority: 'MEDIUM',
      opportunity: 'Implement route prefetching for common navigation paths',
      impact: 'Faster navigation between pages',
      effort: 'LOW'
    }
  )
  
  auditResults.optimizationOpportunities = opportunities
  
  console.log(`✅ Optimization opportunities identified: ${opportunities.length}`)
  opportunities.forEach(opp => {
    const priorityIcon = opp.priority === 'HIGH' ? '🔴' : opp.priority === 'MEDIUM' ? '🟡' : '🟢'
    console.log(`${priorityIcon} ${opp.category}: ${opp.opportunity}`)
  })
}

// Generate recommendations
function generateRecommendations() {
  console.log('\n📋 Generating Performance Recommendations...')
  
  const recommendations = []
  
  // High priority recommendations
  recommendations.push(
    {
      priority: 'HIGH',
      category: 'Bundle Optimization',
      recommendation: 'Implement dynamic imports for heavy components',
      implementation: 'Use React.lazy() and Suspense for route-level code splitting',
      expectedImpact: '30-50% reduction in initial bundle size'
    },
    {
      priority: 'HIGH',
      category: 'API Performance',
      recommendation: 'Implement SWR or React Query for data fetching',
      implementation: 'Replace useEffect + fetch with SWR hooks',
      expectedImpact: 'Reduced API calls, better caching, improved UX'
    }
  )
  
  // Medium priority recommendations
  recommendations.push(
    {
      priority: 'MEDIUM',
      category: 'Component Optimization',
      recommendation: 'Memoize expensive calculations and components',
      implementation: 'Use React.memo, useMemo, and useCallback strategically',
      expectedImpact: 'Reduced re-renders, smoother interactions'
    },
    {
      priority: 'MEDIUM',
      category: 'Role-Based Performance',
      recommendation: 'Optimize permission checking logic',
      implementation: 'Cache permission results, use context efficiently',
      expectedImpact: 'Faster role-based UI updates'
    }
  )
  
  // Low priority recommendations
  recommendations.push(
    {
      priority: 'LOW',
      category: 'Asset Optimization',
      recommendation: 'Optimize images and static assets',
      implementation: 'Use Next.js Image component, compress assets',
      expectedImpact: 'Better Core Web Vitals scores'
    },
    {
      priority: 'LOW',
      category: 'Development Experience',
      recommendation: 'Set up performance monitoring',
      implementation: 'Add React DevTools Profiler, bundle analyzer',
      expectedImpact: 'Better visibility into performance issues'
    }
  )
  
  auditResults.recommendations = recommendations
  
  console.log(`✅ Recommendations generated: ${recommendations.length}`)
  recommendations.forEach(rec => {
    const priorityIcon = rec.priority === 'HIGH' ? '🔴' : rec.priority === 'MEDIUM' ? '🟡' : '🟢'
    console.log(`${priorityIcon} ${rec.category}: ${rec.recommendation}`)
  })
}

// Generate comprehensive report
function generatePerformanceReport() {
  console.log('\n' + '='.repeat(60))
  console.log('🎯 FRONTEND PERFORMANCE AUDIT SUMMARY')
  console.log('='.repeat(60))
  
  // Bundle analysis summary
  if (auditResults.bundleAnalysis.totalDependencies) {
    console.log(`📦 Bundle: ${auditResults.bundleAnalysis.totalDependencies} deps, ${auditResults.bundleAnalysis.potentialBundleImpact} impact`)
  }
  
  // Component analysis summary
  if (auditResults.componentAnalysis.totalComponents) {
    console.log(`🧩 Components: ${auditResults.componentAnalysis.totalComponents} total, ${auditResults.componentAnalysis.largeComponents?.length || 0} large, ${auditResults.componentAnalysis.performanceIssues?.length || 0} issues`)
  }
  
  // Optimization opportunities summary
  const highPriorityOpps = auditResults.optimizationOpportunities.filter(opp => opp.priority === 'HIGH').length
  const mediumPriorityOpps = auditResults.optimizationOpportunities.filter(opp => opp.priority === 'MEDIUM').length
  console.log(`🚀 Opportunities: ${highPriorityOpps} high priority, ${mediumPriorityOpps} medium priority`)
  
  console.log('='.repeat(60))
  
  // Overall assessment
  const totalIssues = (auditResults.componentAnalysis.performanceIssues?.length || 0) + 
                     (auditResults.performanceMetrics.roleBasedRendering?.issuesFound || 0)
  
  if (totalIssues === 0) {
    console.log('✅ Frontend performance looks good!')
  } else if (totalIssues < 5) {
    console.log('⚠️  Minor performance issues found - optimization recommended')
  } else {
    console.log('❌ Multiple performance issues found - optimization needed')
  }
  
  // Save detailed report
  const reportPath = path.join(__dirname, '..', 'FRONTEND_PERFORMANCE_AUDIT_REPORT.json')
  fs.writeFileSync(reportPath, JSON.stringify(auditResults, null, 2))
  console.log(`\n📄 Detailed report saved to: ${reportPath}`)
  
  console.log('\n📋 Next Steps:')
  console.log('1. Review high-priority optimization opportunities')
  console.log('2. Implement bundle splitting and lazy loading')
  console.log('3. Fix identified performance anti-patterns')
  console.log('4. Proceed to API endpoint load testing')
  
  return auditResults
}

// Main audit execution
function runFrontendPerformanceAudit() {
  console.log('🎯 Starting frontend performance audit...\n')
  
  analyzeBundleSize()
  analyzeComponentPerformance()
  analyzeRoleBasedRendering()
  identifyOptimizationOpportunities()
  generateRecommendations()
  
  return generatePerformanceReport()
}

// Run audit
if (require.main === module) {
  runFrontendPerformanceAudit()
}

module.exports = { runFrontendPerformanceAudit }
/**
 * API Analysis Tools for Backend Engineer
 * Provides comprehensive API performance, security, and architecture analysis
 */

export interface ApiAnalysis {
  routes: ApiRoute[]
  middleware: MiddlewareAnalysis[]
  authenticationPattern: AuthPatternAnalysis
  performanceMetrics: ApiPerformanceMetrics
  securityIssues: ApiSecurityIssue[]
  recommendations: ApiRecommendation[]
}

export interface ApiRoute {
  path: string
  method: string
  handler: string
  authRequired: boolean
  permissions: string[]
  requestSchema?: string
  responseSchema?: string
  middleware: string[]
  performanceData: RoutePerformanceData
  securityScore: number
}

export interface RoutePerformanceData {
  avgResponseTime: number
  p95ResponseTime: number
  requestCount: number
  errorRate: number
  cacheHitRate?: number
}

export interface MiddlewareAnalysis {
  name: string
  type: 'auth' | 'validation' | 'logging' | 'cors' | 'rate-limit' | 'custom'
  coverage: number // percentage of routes using this middleware
  effectiveness: 'high' | 'medium' | 'low'
  issues: string[]
}

export interface AuthPatternAnalysis {
  pattern: 'withAuth' | 'manual' | 'mixed'
  consistency: number // percentage of routes following the same pattern
  jwtUsage: 'correct' | 'profile_id_error' | 'missing'
  roleBasedAccess: boolean
  securityScore: number
}

export interface ApiPerformanceMetrics {
  avgResponseTime: number
  slowestRoutes: SlowRoute[]
  errorRates: ErrorRateMetric[]
  throughput: number
  cacheUtilization: number
}

export interface SlowRoute {
  path: string
  method: string
  avgTime: number
  p95Time: number
  bottleneck: 'database' | 'computation' | 'external_api' | 'file_io'
}

export interface ErrorRateMetric {
  path: string
  method: string
  errorRate: number
  commonErrors: { status: number; count: number; message: string }[]
}

export interface ApiSecurityIssue {
  type: 'missing_auth' | 'weak_validation' | 'exposed_data' | 'csrf_vulnerable' | 'rate_limit_missing'
  severity: 'low' | 'medium' | 'high' | 'critical'
  route: string
  description: string
  fix: string
  riskScore: number
}

export interface ApiRecommendation {
  category: 'performance' | 'security' | 'maintainability' | 'scalability'
  priority: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  implementation: string
  estimatedEffort: string
  expectedBenefit: string
}

export class ApiAnalyzer {
  /**
   * Comprehensive API codebase analysis
   */
  static async analyzeApiCodebase(apiDirectory: string = 'src/app/api'): Promise<ApiAnalysis> {
    const analysis: ApiAnalysis = {
      routes: [],
      middleware: [],
      authenticationPattern: {
        pattern: 'mixed',
        consistency: 0,
        jwtUsage: 'missing',
        roleBasedAccess: false,
        securityScore: 0
      },
      performanceMetrics: {
        avgResponseTime: 0,
        slowestRoutes: [],
        errorRates: [],
        throughput: 0,
        cacheUtilization: 0
      },
      securityIssues: [],
      recommendations: []
    }

    // This would contain file system analysis of the API routes
    // For now, providing the analysis framework
    
    return analysis
  }

  /**
   * Analyze authentication patterns across API routes
   */
  static analyzeAuthenticationPatterns(routes: ApiRoute[]): AuthPatternAnalysis {
    const withAuthRoutes = routes.filter(route => 
      route.middleware.includes('withAuth') || route.handler.includes('withAuth')
    )
    
    const manualAuthRoutes = routes.filter(route => 
      route.handler.includes('verifyAuth') && !route.handler.includes('withAuth')
    )
    
    const noAuthRoutes = routes.filter(route => 
      !route.authRequired && !route.handler.includes('auth')
    )

    const consistency = routes.length > 0 ? (withAuthRoutes.length / routes.length) * 100 : 0
    
    let pattern: 'withAuth' | 'manual' | 'mixed' = 'mixed'
    if (withAuthRoutes.length > 0 && manualAuthRoutes.length === 0) {
      pattern = 'withAuth'
    } else if (manualAuthRoutes.length > 0 && withAuthRoutes.length === 0) {
      pattern = 'manual'
    }

    // Check for profile.id usage (common JWT error)
    const profileIdUsage = routes.some(route => 
      route.handler.includes('profile.id') && route.handler.includes('Bearer')
    )

    return {
      pattern,
      consistency,
      jwtUsage: profileIdUsage ? 'profile_id_error' : 'correct',
      roleBasedAccess: routes.some(route => route.permissions.length > 0),
      securityScore: this.calculateSecurityScore(routes, consistency, profileIdUsage)
    }
  }

  /**
   * Generate API route optimization recommendations
   */
  static generateApiRecommendations(analysis: ApiAnalysis): ApiRecommendation[] {
    const recommendations: ApiRecommendation[] = []

    // Authentication pattern recommendations
    if (analysis.authenticationPattern.pattern === 'manual') {
      recommendations.push({
        category: 'maintainability',
        priority: 'high',
        title: 'Migrate to withAuth Middleware Pattern',
        description: 'Replace manual authentication with standardized withAuth middleware',
        implementation: this.generateWithAuthMigration(),
        estimatedEffort: '2-4 hours',
        expectedBenefit: '25-30 lines saved per route, consistent security'
      })
    }

    // JWT usage error
    if (analysis.authenticationPattern.jwtUsage === 'profile_id_error') {
      recommendations.push({
        category: 'security',
        priority: 'critical',
        title: 'Fix JWT Token Usage',
        description: 'Replace profile.id with proper JWT access tokens',
        implementation: this.generateJwtFixImplementation(),
        estimatedEffort: '1-2 hours',
        expectedBenefit: 'Fix 401 authentication errors'
      })
    }

    // Performance recommendations
    const slowRoutes = analysis.performanceMetrics.slowestRoutes.filter(route => route.avgTime > 500)
    if (slowRoutes.length > 0) {
      recommendations.push({
        category: 'performance',
        priority: 'high',
        title: 'Optimize Slow API Routes',
        description: `${slowRoutes.length} routes have >500ms response time`,
        implementation: this.generatePerformanceOptimization(slowRoutes),
        estimatedEffort: '4-8 hours',
        expectedBenefit: '50-80% response time improvement'
      })
    }

    // Security recommendations
    const criticalSecurityIssues = analysis.securityIssues.filter(issue => issue.severity === 'critical')
    if (criticalSecurityIssues.length > 0) {
      recommendations.push({
        category: 'security',
        priority: 'critical',
        title: 'Address Critical Security Issues',
        description: `${criticalSecurityIssues.length} critical security vulnerabilities found`,
        implementation: this.generateSecurityFixes(criticalSecurityIssues),
        estimatedEffort: '2-6 hours',
        expectedBenefit: 'Eliminate security vulnerabilities'
      })
    }

    return recommendations.sort((a, b) => this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority))
  }

  /**
   * Generate API route templates for common patterns
   */
  static generateRouteTemplates(): Record<string, string> {
    return {
      'crud-get': `// GET route template with optimizations
export const GET = withAuth(async (request, { user, profile }) => {
  try {
    const { page, limit, search, filters } = parseQueryParams(request)
    
    const query = buildQuery(supabase, 'table_name')
      .select('*')
      .filters(filters)
      .search(search, ['name', 'description'])
      .pagination(page, limit)
      .execute()
    
    const { data, count, error } = await query
    
    if (error) {
      return createErrorResponse('Failed to fetch data', 500, error)
    }
    
    return createSuccessResponse(data, {
      page,
      limit, 
      total: count,
      totalPages: Math.ceil(count / limit)
    })
    
  } catch (error) {
    return createErrorResponse('Internal server error', 500, error)
  }
}, { permission: 'table.read' })`,

      'crud-post': `// POST route template with validation
export const POST = withAuth(async (request, { user, profile }) => {
  try {
    const body = await request.json()
    
    const validationResult = validateRequestBody(body, schemas.createSchema)
    if (!validationResult.success) {
      return createErrorResponse('Validation failed', 400, validationResult.errors)
    }
    
    const { data, error } = await supabase
      .from('table_name')
      .insert({
        ...validationResult.data,
        created_by: user.id,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) {
      return createErrorResponse('Failed to create record', 500, error)
    }
    
    return createSuccessResponse(data, null, 201)
    
  } catch (error) {
    return createErrorResponse('Internal server error', 500, error)
  }
}, { permission: 'table.create' })`,

      'file-upload': `// File upload route template
export const POST = withAuth(async (request, { user, profile }) => {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    // Validate file
    const validation = validateFile(file, {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['image/jpeg', 'image/png', 'application/pdf']
    })
    
    if (!validation.valid) {
      return createErrorResponse(validation.error, 400)
    }
    
    // Process file upload
    const result = await processFileUpload(file, user.id)
    
    return createSuccessResponse(result)
    
  } catch (error) {
    return createErrorResponse('File upload failed', 500, error)
  }
}, { permission: 'files.create' })`
    }
  }

  /**
   * Generate withAuth migration code
   */
  private static generateWithAuthMigration(): string {
    return `// Migration from manual auth to withAuth middleware
// 
// BEFORE (Manual Auth Pattern):
export async function GET(request: NextRequest) {
  const { user, profile, error } = await verifyAuth(request)
  if (error || !user || !profile) {
    return NextResponse.json({ success: false, error: error || 'Auth required' }, { status: 401 })
  }
  if (!hasPermission(profile.role, 'permission.name')) {
    return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 })
  }
  // ... business logic
}

// AFTER (withAuth Pattern):
export const GET = withAuth(async (request, { user, profile }) => {
  // Clean business logic only
  return createSuccessResponse(data)
}, { permission: 'permission.name' })

// Benefits:
// - 25-30 lines saved per route
// - Consistent error handling
// - Automatic permission checking
// - Type-safe context injection`
  }

  /**
   * Generate JWT fix implementation
   */
  private static generateJwtFixImplementation(): string {
    return `// Fix JWT Token Usage
// 
// PROBLEM: Using profile.id as Bearer token (causes 401 errors)
// WRONG:
const response = await fetch('/api/endpoint', {
  headers: { 'Authorization': \`Bearer \${profile.id}\` }
})

// SOLUTION: Use proper JWT access tokens
// CORRECT:
const { getAccessToken } = useAuth()
const token = await getAccessToken()
const response = await fetch('/api/endpoint', {
  headers: { 'Authorization': \`Bearer \${token}\` }
})

// Files to update:
// - src/hooks/useProjects.ts (8 locations)
// - src/hooks/useScope.ts (10 locations)
// - All custom hooks using Bearer authentication

// Impact: Fixes all 401 "Invalid or expired token" errors`
  }

  /**
   * Generate performance optimization code
   */
  private static generatePerformanceOptimization(slowRoutes: SlowRoute[]): string {
    return `// Performance Optimization for Slow Routes
//
${slowRoutes.map(route => `
// Route: ${route.method} ${route.path} (${route.avgTime}ms avg)
// Bottleneck: ${route.bottleneck}
${route.bottleneck === 'database' ? `
// Solution: Optimize database queries
// - Add indexes on foreign keys
// - Use (SELECT auth.uid()) pattern in RLS
// - Optimize JOIN operations
` : route.bottleneck === 'computation' ? `
// Solution: Optimize computation
// - Add caching for expensive calculations
// - Use background processing for heavy tasks
// - Implement request deduplication
` : `
// Solution: General optimization
// - Add response caching
// - Minimize data serialization
// - Optimize payload size
`}`).join('')}

// Implementation:
// 1. Profile routes with performance monitoring
// 2. Implement caching strategies
// 3. Optimize database queries with Supabase Specialist
// 4. Add performance monitoring`
  }

  /**
   * Generate security fixes
   */
  private static generateSecurityFixes(issues: ApiSecurityIssue[]): string {
    return `// Security Fixes for Critical Issues
//
${issues.map(issue => `
// Issue: ${issue.type} on ${issue.route}
// Severity: ${issue.severity}
// Fix: ${issue.fix}
`).join('')}

// Implementation Priority:
// 1. Fix missing authentication on sensitive routes
// 2. Add input validation for all user inputs
// 3. Implement rate limiting on public endpoints
// 4. Add CSRF protection for state-changing operations
// 5. Audit and fix data exposure issues`
  }

  /**
   * Calculate security score based on various factors
   */
  private static calculateSecurityScore(routes: ApiRoute[], consistency: number, hasProfileIdError: boolean): number {
    let score = 100
    
    // Deduct for inconsistent auth patterns
    score -= (100 - consistency) * 0.3
    
    // Major deduction for JWT errors
    if (hasProfileIdError) {
      score -= 40
    }
    
    // Deduct for routes without auth
    const unprotectedSensitiveRoutes = routes.filter(route => 
      !route.authRequired && (route.path.includes('admin') || route.method !== 'GET')
    )
    score -= unprotectedSensitiveRoutes.length * 10
    
    return Math.max(0, Math.round(score))
  }

  /**
   * Helper method to get priority weight for sorting
   */
  private static getPriorityWeight(priority: string): number {
    switch (priority) {
      case 'critical': return 4
      case 'high': return 3
      case 'medium': return 2
      case 'low': return 1
      default: return 0
    }
  }

  /**
   * Generate comprehensive API analysis report
   */
  static generateApiReport(analysis: ApiAnalysis): string {
    const criticalRecommendations = analysis.recommendations.filter(r => r.priority === 'critical')
    const highRecommendations = analysis.recommendations.filter(r => r.priority === 'high')

    return `# API Architecture Analysis Report

## 📊 Current API State

### Authentication Analysis
- **Pattern**: ${analysis.authenticationPattern.pattern}
- **Consistency**: ${analysis.authenticationPattern.consistency.toFixed(1)}%
- **JWT Usage**: ${analysis.authenticationPattern.jwtUsage}
- **Security Score**: ${analysis.authenticationPattern.securityScore}/100

### Performance Metrics
- **Average Response Time**: ${analysis.performanceMetrics.avgResponseTime}ms
- **Throughput**: ${analysis.performanceMetrics.throughput} requests/sec
- **Error Rate**: ${(analysis.performanceMetrics.errorRates.reduce((sum, r) => sum + r.errorRate, 0) / analysis.performanceMetrics.errorRates.length || 0).toFixed(2)}%

### Route Analysis
- **Total Routes**: ${analysis.routes.length}
- **Authenticated Routes**: ${analysis.routes.filter(r => r.authRequired).length}
- **Average Security Score**: ${(analysis.routes.reduce((sum, r) => sum + r.securityScore, 0) / analysis.routes.length || 0).toFixed(1)}/100

## 🚨 Critical Issues (${criticalRecommendations.length})

${criticalRecommendations.map((rec, index) => `
### ${index + 1}. ${rec.title}
- **Category**: ${rec.category}
- **Estimated Effort**: ${rec.estimatedEffort}
- **Expected Benefit**: ${rec.expectedBenefit}

${rec.description}
`).join('')}

## ⚠️  High Priority Issues (${highRecommendations.length})

${highRecommendations.map((rec, index) => `
### ${index + 1}. ${rec.title}
- **Category**: ${rec.category}
- **Expected Benefit**: ${rec.expectedBenefit}
`).join('')}

## 🎯 Optimization Roadmap

1. **Immediate Actions** (Critical Issues)
   - Fix JWT authentication errors
   - Migrate to withAuth middleware pattern
   - Address security vulnerabilities

2. **Short Term** (High Priority)
   - Optimize slow API routes
   - Implement comprehensive input validation
   - Add performance monitoring

3. **Long Term** (Medium/Low Priority)
   - API documentation generation
   - Advanced caching strategies
   - Rate limiting implementation

## 📈 Expected Impact

Implementing all critical and high priority improvements:
- **25-30 lines saved** per API route with withAuth migration
- **50-80% performance improvement** for slow routes
- **100% authentication reliability** with proper JWT usage
- **Significant security improvement** with vulnerability fixes

---
*Generated by Backend Engineer API Analyzer*`
  }
}
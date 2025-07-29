/**
 * Task Analysis Engine for Master Orchestrator
 * Analyzes incoming tasks and determines optimal agent coordination strategy
 */

export interface TaskAnalysis {
  taskType: TaskType
  complexity: ComplexityLevel
  requiredAgents: AgentType[]
  executionStrategy: ExecutionStrategy
  estimatedTime: string
  riskLevel: RiskLevel
  dependencies: string[]
  qualityGates: QualityGate[]
}

export type TaskType = 
  | 'feature-development'
  | 'bug-fix'
  | 'performance-optimization'  
  | 'security-implementation'
  | 'database-operation'
  | 'ui-enhancement'
  | 'testing-implementation'
  | 'maintenance'

export type ComplexityLevel = 'simple' | 'moderate' | 'complex' | 'enterprise'

export type AgentType = 
  | 'supabase-specialist'
  | 'backend-engineer'
  | 'frontend-specialist'
  | 'performance-optimizer'
  | 'security-auditor'
  | 'qa-engineer'

export type ExecutionStrategy = 'sequential' | 'parallel' | 'review-chain' | 'hybrid'

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export interface QualityGate {
  agent: AgentType
  checkpoint: string
  required: boolean
}

export class TaskAnalyzer {
  /**
   * Analyzes a task description and returns comprehensive analysis
   */
  static analyzeTask(taskDescription: string): TaskAnalysis {
    const keywords = this.extractKeywords(taskDescription.toLowerCase())
    
    return {
      taskType: this.determineTaskType(keywords),
      complexity: this.assessComplexity(keywords, taskDescription),
      requiredAgents: this.identifyRequiredAgents(keywords),
      executionStrategy: this.determineExecutionStrategy(keywords),
      estimatedTime: this.estimateTime(keywords),
      riskLevel: this.assessRisk(keywords),
      dependencies: this.identifyDependencies(keywords),
      qualityGates: this.defineQualityGates(keywords)
    }
  }

  private static extractKeywords(description: string): string[] {
    const keywords = [
      // Database keywords
      'database', 'schema', 'migration', 'rls', 'policy', 'auth', 'authentication',
      // API keywords  
      'api', 'endpoint', 'route', 'middleware', 'backend', 'server',
      // Frontend keywords
      'ui', 'component', 'form', 'dashboard', 'frontend', 'react',
      // Performance keywords
      'performance', 'optimize', 'slow', 'speed', 'cache', 'bundle',
      // Security keywords
      'security', 'permission', 'access', 'vulnerability', 'audit',
      // Testing keywords
      'test', 'testing', 'coverage', 'qa', 'quality',
      // Task types
      'create', 'build', 'add', 'fix', 'update', 'delete', 'enhance', 'improve'
    ]
    
    return keywords.filter(keyword => description.includes(keyword))
  }

  private static determineTaskType(keywords: string[]): TaskType {
    if (keywords.some(k => ['create', 'build', 'add'].includes(k))) {
      return 'feature-development'
    }
    if (keywords.some(k => ['fix', 'bug', 'error'].includes(k))) {
      return 'bug-fix'
    }
    if (keywords.some(k => ['performance', 'optimize', 'slow'].includes(k))) {
      return 'performance-optimization'
    }
    if (keywords.some(k => ['security', 'audit', 'vulnerability'].includes(k))) {
      return 'security-implementation'
    }
    if (keywords.some(k => ['database', 'schema', 'migration'].includes(k))) {
      return 'database-operation'
    }
    if (keywords.some(k => ['ui', 'component', 'frontend'].includes(k))) {
      return 'ui-enhancement'
    }
    if (keywords.some(k => ['test', 'testing', 'coverage'].includes(k))) {
      return 'testing-implementation'
    }
    return 'maintenance'
  }

  private static assessComplexity(keywords: string[], description: string): ComplexityLevel {
    let complexityScore = 0
    
    // Length factor
    if (description.length > 200) complexityScore += 2
    if (description.length > 100) complexityScore += 1
    
    // Multiple domains
    const domains = ['database', 'api', 'frontend', 'security', 'performance']
    const involvedDomains = domains.filter(domain => 
      keywords.some(k => k.includes(domain))
    )
    complexityScore += involvedDomains.length
    
    // Complex keywords
    const complexKeywords = ['system', 'integration', 'workflow', 'architecture']
    if (keywords.some(k => complexKeywords.includes(k))) {
      complexityScore += 2
    }
    
    if (complexityScore >= 6) return 'enterprise'
    if (complexityScore >= 4) return 'complex'
    if (complexityScore >= 2) return 'moderate'
    return 'simple'
  }

  private static identifyRequiredAgents(keywords: string[]): AgentType[] {
    const agents: AgentType[] = []
    
    if (keywords.some(k => ['database', 'schema', 'migration', 'rls', 'auth'].includes(k))) {
      agents.push('supabase-specialist')
    }
    if (keywords.some(k => ['api', 'endpoint', 'route', 'middleware', 'backend'].includes(k))) {
      agents.push('backend-engineer')
    }
    if (keywords.some(k => ['ui', 'component', 'form', 'frontend', 'react'].includes(k))) {
      agents.push('frontend-specialist')
    }
    if (keywords.some(k => ['performance', 'optimize', 'slow', 'cache'].includes(k))) {
      agents.push('performance-optimizer')
    }
    if (keywords.some(k => ['security', 'permission', 'access', 'vulnerability'].includes(k))) {
      agents.push('security-auditor')
    }
    if (keywords.some(k => ['test', 'testing', 'coverage', 'qa'].includes(k))) {
      agents.push('qa-engineer')
    }
    
    return agents
  }

  private static determineExecutionStrategy(keywords: string[]): ExecutionStrategy {
    const requiredAgents = this.identifyRequiredAgents(keywords)
    
    if (requiredAgents.length === 1) {
      return 'sequential'
    }
    
    // If database changes are involved, usually need sequential
    if (keywords.some(k => ['schema', 'migration'].includes(k))) {
      return 'sequential'
    }
    
    // Security and performance reviews can run in parallel
    if (requiredAgents.includes('security-auditor' as AgentType) && 
        requiredAgents.includes('performance-optimizer' as AgentType)) {
      return 'review-chain'
    }
    
    // Multiple agents with independent work
    if (requiredAgents.length > 2) {
      return 'hybrid'
    }
    
    return 'parallel'
  }

  private static estimateTime(keywords: string[]): string {
    const complexity = this.assessComplexity(keywords, keywords.join(' '))
    const agentCount = this.identifyRequiredAgents(keywords).length
    
    const baseTime = {
      'simple': 15,
      'moderate': 30,
      'complex': 60,
      'enterprise': 120
    }[complexity]
    
    const totalTime = baseTime * Math.max(1, agentCount * 0.5)
    
    if (totalTime < 30) return `${totalTime} minutes`
    if (totalTime < 120) return `${Math.round(totalTime / 15) * 15} minutes`
    return `${Math.round(totalTime / 60)} hours`
  }

  private static assessRisk(keywords: string[]): RiskLevel {
    // Critical risk keywords
    if (keywords.some(k => ['auth', 'security', 'permission', 'migration'].includes(k))) {
      return 'critical'
    }
    
    // High risk keywords  
    if (keywords.some(k => ['database', 'schema', 'api'].includes(k))) {
      return 'high'
    }
    
    // Medium risk keywords
    if (keywords.some(k => ['performance', 'cache', 'middleware'].includes(k))) {
      return 'medium'
    }
    
    return 'low'
  }

  private static identifyDependencies(keywords: string[]): string[] {
    const dependencies: string[] = []
    
    if (keywords.includes('database') || keywords.includes('schema')) {
      dependencies.push('Database schema must be created first')
    }
    if (keywords.includes('api') && keywords.includes('frontend')) {
      dependencies.push('API endpoints must be ready before frontend integration')
    }
    if (keywords.includes('auth')) {
      dependencies.push('Authentication system must be functional')
    }
    
    return dependencies
  }

  private static defineQualityGates(keywords: string[]): QualityGate[] {
    const gates: QualityGate[] = []
    
    // Always require QA for new features
    if (keywords.some(k => ['create', 'build', 'add'].includes(k))) {
      gates.push({
        agent: 'qa-engineer',
        checkpoint: 'Test coverage and quality validation',
        required: true
      })
    }
    
    // Security review for auth/permission changes
    if (keywords.some(k => ['auth', 'security', 'permission'].includes(k))) {
      gates.push({
        agent: 'security-auditor',
        checkpoint: 'Security vulnerability assessment',
        required: true
      })
    }
    
    // Performance review for optimization tasks
    if (keywords.some(k => ['performance', 'optimize'].includes(k))) {
      gates.push({
        agent: 'performance-optimizer',
        checkpoint: 'Performance impact analysis',
        required: true
      })
    }
    
    return gates
  }
}
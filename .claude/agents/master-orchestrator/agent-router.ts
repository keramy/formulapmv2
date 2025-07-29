/**
 * Agent Router for Master Orchestrator
 * Handles routing tasks to appropriate specialist agents and coordinating workflows
 */

import { TaskAnalysis, AgentType, ExecutionStrategy } from './task-analyzer'

export interface AgentCapability {
  agent: AgentType
  specializations: string[]
  tools: string[]
  estimatedResponseTime: string
  currentLoad: 'low' | 'medium' | 'high'
}

export interface WorkflowStep {
  stepNumber: number
  agent: AgentType
  task: string
  dependencies: number[]
  estimatedTime: string
  status: 'pending' | 'in-progress' | 'completed' | 'blocked'
}

export interface OrchestrationPlan {
  taskId: string
  analysis: TaskAnalysis
  workflow: WorkflowStep[]
  totalEstimatedTime: string
  criticalPath: number[]
  qualityCheckpoints: number[]
}

export class AgentRouter {
  private static agentCapabilities: Record<AgentType, AgentCapability> = {
    'supabase-specialist': {
      agent: 'supabase-specialist',
      specializations: [
        'PostgreSQL database operations',
        'Row Level Security (RLS) policies', 
        'Database performance optimization',
        'Authentication and user management',
        'Database migrations and schema changes',
        'Real-time subscriptions and triggers'
      ],
      tools: ['Read', 'Write', 'MultiEdit', 'Bash', 'Grep', 'Glob', 'TodoWrite'],
      estimatedResponseTime: '15-30 minutes',
      currentLoad: 'low'
    },
    
    'backend-engineer': {
      agent: 'backend-engineer', 
      specializations: [
        'Next.js API route development',
        'Business logic implementation',
        'Authentication middleware',
        'Data validation and transformation',
        'Error handling and logging',
        'Third-party API integrations'
      ],
      tools: ['Read', 'Write', 'MultiEdit', 'Bash', 'Grep', 'Glob', 'TodoWrite'],
      estimatedResponseTime: '20-45 minutes',
      currentLoad: 'low'
    },
    
    'frontend-specialist': {
      agent: 'frontend-specialist',
      specializations: [
        'React component development',
        'UI/UX implementation', 
        'Responsive design',
        'State management',
        'Form creation and validation',
        'Data visualization'
      ],
      tools: ['Read', 'Write', 'MultiEdit', 'Bash', 'Grep', 'Glob', 'TodoWrite'],
      estimatedResponseTime: '25-50 minutes',
      currentLoad: 'low'
    },
    
    'performance-optimizer': {
      agent: 'performance-optimizer',
      specializations: [
        'Bundle size analysis and optimization',
        'Database query performance tuning',
        'Caching strategy implementation', 
        'Loading time optimization',
        'Memory usage optimization',
        'Performance monitoring setup'
      ],
      tools: ['Read', 'Write', 'MultiEdit', 'Bash', 'Grep', 'Glob', 'TodoWrite'],
      estimatedResponseTime: '30-60 minutes',
      currentLoad: 'low'
    },
    
    'security-auditor': {
      agent: 'security-auditor',
      specializations: [
        'Security vulnerability assessment',
        'Access control validation',
        'Data protection compliance',
        'Authentication security review',
        'API security testing',
        'Privacy impact analysis'
      ],
      tools: ['Read', 'Write', 'MultiEdit', 'Bash', 'Grep', 'Glob', 'TodoWrite'],
      estimatedResponseTime: '20-40 minutes', 
      currentLoad: 'low'
    },
    
    'qa-engineer': {
      agent: 'qa-engineer',
      specializations: [
        'Test strategy development',
        'Automated test creation',
        'Coverage analysis and improvement',
        'Bug detection and reporting',
        'Regression testing',
        'Quality assurance validation'
      ],
      tools: ['Read', 'Write', 'MultiEdit', 'Bash', 'Grep', 'Glob', 'TodoWrite'],
      estimatedResponseTime: '20-35 minutes',
      currentLoad: 'low'
    }
  }

  /**
   * Creates an orchestration plan based on task analysis
   */
  static createOrchestrationPlan(taskDescription: string, analysis: TaskAnalysis): OrchestrationPlan {
    const taskId = this.generateTaskId()
    const workflow = this.buildWorkflow(analysis)
    const criticalPath = this.identifyCriticalPath(workflow)
    const qualityCheckpoints = this.identifyQualityCheckpoints(workflow, analysis)
    
    return {
      taskId,
      analysis,
      workflow,
      totalEstimatedTime: this.calculateTotalTime(workflow),
      criticalPath,
      qualityCheckpoints
    }
  }

  /**
   * Routes a task to the most appropriate agent
   */
  static routeToAgent(agent: AgentType, task: string, context?: any): string {
    const capability = this.agentCapabilities[agent]
    
    return `Task routed to ${agent}:
    
**Specializations**: ${capability.specializations.join(', ')}
**Estimated Response Time**: ${capability.estimatedResponseTime}
**Current Load**: ${capability.currentLoad}

**Task**: ${task}

**Context**: ${context ? JSON.stringify(context, null, 2) : 'None provided'}

Please proceed with your specialized analysis and implementation.`
  }

  /**
   * Builds workflow steps based on execution strategy
   */
  private static buildWorkflow(analysis: TaskAnalysis): WorkflowStep[] {
    const steps: WorkflowStep[] = []
    
    switch (analysis.executionStrategy) {
      case 'sequential':
        return this.buildSequentialWorkflow(analysis.requiredAgents)
      case 'parallel':
        return this.buildParallelWorkflow(analysis.requiredAgents)
      case 'review-chain':
        return this.buildReviewChainWorkflow(analysis.requiredAgents)
      case 'hybrid':
        return this.buildHybridWorkflow(analysis.requiredAgents, analysis.taskType)
      default:
        return this.buildSequentialWorkflow(analysis.requiredAgents)
    }
  }

  private static buildSequentialWorkflow(agents: AgentType[]): WorkflowStep[] {
    const steps: WorkflowStep[] = []
    
    // Order agents logically for sequential execution
    const orderedAgents = this.orderAgentsForSequential(agents)
    
    orderedAgents.forEach((agent, index) => {
      steps.push({
        stepNumber: index + 1,
        agent,
        task: this.getAgentDefaultTask(agent),
        dependencies: index > 0 ? [index] : [],
        estimatedTime: this.getAgentEstimatedTime(agent),
        status: 'pending'
      })
    })
    
    return steps
  }

  private static buildParallelWorkflow(agents: AgentType[]): WorkflowStep[] {
    const steps: WorkflowStep[] = []
    
    agents.forEach((agent, index) => {
      steps.push({
        stepNumber: index + 1,
        agent,
        task: this.getAgentDefaultTask(agent),
        dependencies: [], // No dependencies in parallel execution
        estimatedTime: this.getAgentEstimatedTime(agent),
        status: 'pending'
      })
    })
    
    return steps
  }

  private static buildReviewChainWorkflow(agents: AgentType[]): WorkflowStep[] {
    const steps: WorkflowStep[] = []
    
    // Implementation agents first (parallel)
    const implementationAgents = agents.filter(a => 
      !['security-auditor', 'performance-optimizer', 'qa-engineer'].includes(a)
    )
    
    // Review agents second (sequential)
    const reviewAgents = agents.filter(a => 
      ['security-auditor', 'performance-optimizer', 'qa-engineer'].includes(a)
    )
    
    // Add implementation steps
    implementationAgents.forEach((agent, index) => {
      steps.push({
        stepNumber: index + 1,
        agent,
        task: this.getAgentDefaultTask(agent),
        dependencies: [],
        estimatedTime: this.getAgentEstimatedTime(agent),
        status: 'pending'
      })
    })
    
    // Add review steps
    reviewAgents.forEach((agent, index) => {
      steps.push({
        stepNumber: implementationAgents.length + index + 1,
        agent,
        task: this.getAgentDefaultTask(agent),
        dependencies: Array.from({length: implementationAgents.length}, (_, i) => i + 1),
        estimatedTime: this.getAgentEstimatedTime(agent),
        status: 'pending'
      })
    })
    
    return steps
  }

  private static buildHybridWorkflow(agents: AgentType[], taskType: string): WorkflowStep[] {
    // Hybrid combines sequential for dependencies and parallel for independent work
    if (taskType === 'feature-development') {
      return this.buildFeatureDevelopmentWorkflow(agents)
    }
    
    // Default to review chain for other complex tasks
    return this.buildReviewChainWorkflow(agents)
  }

  private static buildFeatureDevelopmentWorkflow(agents: AgentType[]): WorkflowStep[] {
    const steps: WorkflowStep[] = []
    let stepNumber = 1
    
    // Phase 1: Database setup (if needed)
    if (agents.includes('supabase-specialist')) {
      steps.push({
        stepNumber: stepNumber++,
        agent: 'supabase-specialist',
        task: 'Database schema and RLS policy setup',
        dependencies: [],
        estimatedTime: '20-30 minutes',
        status: 'pending'
      })
    }
    
    // Phase 2: Parallel backend and frontend development
    const backendStep = stepNumber
    if (agents.includes('backend-engineer')) {
      steps.push({
        stepNumber: stepNumber++,
        agent: 'backend-engineer', 
        task: 'API endpoint development',
        dependencies: agents.includes('supabase-specialist') ? [1] : [],
        estimatedTime: '25-40 minutes',
        status: 'pending'
      })
    }
    
    if (agents.includes('frontend-specialist')) {
      steps.push({
        stepNumber: stepNumber++,
        agent: 'frontend-specialist',
        task: 'UI component development',
        dependencies: [],
        estimatedTime: '30-45 minutes', 
        status: 'pending'
      })
    }
    
    // Phase 3: Quality and optimization (parallel)
    const qualitySteps = []
    if (agents.includes('security-auditor')) {
      qualitySteps.push(backendStep)
      steps.push({
        stepNumber: stepNumber++,
        agent: 'security-auditor',
        task: 'Security audit and validation',
        dependencies: [backendStep],
        estimatedTime: '15-25 minutes',
        status: 'pending'
      })
    }
    
    if (agents.includes('performance-optimizer')) {
      steps.push({
        stepNumber: stepNumber++,
        agent: 'performance-optimizer',
        task: 'Performance optimization',
        dependencies: qualitySteps,
        estimatedTime: '20-35 minutes',
        status: 'pending'
      })
    }
    
    if (agents.includes('qa-engineer')) {
      steps.push({
        stepNumber: stepNumber++,
        agent: 'qa-engineer',
        task: 'Test creation and validation',
        dependencies: qualitySteps,
        estimatedTime: '25-40 minutes',
        status: 'pending'
      })
    }
    
    return steps
  }

  private static orderAgentsForSequential(agents: AgentType[]): AgentType[] {
    const priority = [
      'supabase-specialist',    // Database first
      'backend-engineer',       // API second  
      'frontend-specialist',    // UI third
      'security-auditor',       // Security review
      'performance-optimizer',  // Performance review
      'qa-engineer'            // Testing last
    ]
    
    return agents.sort((a, b) => {
      const aIndex = priority.indexOf(a)
      const bIndex = priority.indexOf(b)
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex)
    })
  }

  private static getAgentDefaultTask(agent: AgentType): string {
    const tasks = {
      'supabase-specialist': 'Database operation and optimization',
      'backend-engineer': 'API development and business logic',
      'frontend-specialist': 'UI component development',
      'performance-optimizer': 'Performance analysis and optimization',
      'security-auditor': 'Security audit and validation', 
      'qa-engineer': 'Test creation and quality assurance'
    }
    
    return tasks[agent]
  }

  private static getAgentEstimatedTime(agent: AgentType): string {
    return this.agentCapabilities[agent].estimatedResponseTime
  }

  private static identifyCriticalPath(workflow: WorkflowStep[]): number[] {
    // Simple critical path: longest dependency chain
    const visited = new Set<number>()
    const criticalPath: number[] = []
    
    const findLongestPath = (stepNumber: number, path: number[]): number[] => {
      if (visited.has(stepNumber)) return path
      visited.add(stepNumber)
      
      const step = workflow.find(s => s.stepNumber === stepNumber)
      if (!step) return path
      
      const currentPath = [...path, stepNumber]
      
      if (step.dependencies.length === 0) {
        return currentPath
      }
      
      let longestPath = currentPath
      for (const dep of step.dependencies) {
        const depPath = findLongestPath(dep, currentPath)
        if (depPath.length > longestPath.length) {
          longestPath = depPath
        }
      }
      
      return longestPath
    }
    
    // Find the longest path from any starting point
    workflow.forEach(step => {
      if (!visited.has(step.stepNumber)) {
        const path = findLongestPath(step.stepNumber, [])
        if (path.length > criticalPath.length) {
          criticalPath.splice(0, criticalPath.length, ...path)
        }
      }
    })
    
    return criticalPath
  }

  private static identifyQualityCheckpoints(workflow: WorkflowStep[], analysis: TaskAnalysis): number[] {
    const checkpoints: number[] = []
    
    workflow.forEach(step => {
      if (['security-auditor', 'performance-optimizer', 'qa-engineer'].includes(step.agent)) {
        checkpoints.push(step.stepNumber)
      }
    })
    
    return checkpoints
  }

  private static calculateTotalTime(workflow: WorkflowStep[]): string {
    // Calculate based on critical path and parallel execution
    let maxTime = 0
    
    workflow.forEach(step => {
      const timeMatch = step.estimatedTime.match(/(\d+)-(\d+)/)
      if (timeMatch) {
        const avgTime = (parseInt(timeMatch[1]) + parseInt(timeMatch[2])) / 2
        maxTime = Math.max(maxTime, avgTime)
      }
    })
    
    return `${Math.round(maxTime)} minutes`
  }

  private static generateTaskId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}
/**
 * Workflow Manager for Master Orchestrator
 * Manages execution of orchestration plans and coordinates agent activities
 */

import { OrchestrationPlan, WorkflowStep } from './agent-router'
import { TaskAnalysis } from './task-analyzer'

export interface WorkflowExecution {
  planId: string
  startTime: Date
  currentStep: number
  completedSteps: number[]
  blockedSteps: number[]
  errors: WorkflowError[]
  status: WorkflowStatus
  results: StepResult[]
}

export interface WorkflowError {
  stepNumber: number
  agent: string
  errorMessage: string
  timestamp: Date
  severity: 'warning' | 'error' | 'critical'
}

export interface StepResult {
  stepNumber: number
  agent: string
  output: string
  completedAt: Date
  duration: string
  success: boolean
}

export type WorkflowStatus = 
  | 'planning'
  | 'executing' 
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled'

export class WorkflowManager {
  private static activeExecutions = new Map<string, WorkflowExecution>()
  
  /**
   * Starts execution of an orchestration plan
   */
  static async executeOrchestrationPlan(plan: OrchestrationPlan): Promise<string> {
    const execution: WorkflowExecution = {
      planId: plan.taskId,
      startTime: new Date(),
      currentStep: 1,
      completedSteps: [],
      blockedSteps: [],
      errors: [],
      status: 'executing',
      results: []
    }
    
    this.activeExecutions.set(plan.taskId, execution)
    
    try {
      await this.processWorkflowSteps(plan, execution)
      execution.status = 'completed'
    } catch (error) {
      execution.status = 'failed'
      execution.errors.push({
        stepNumber: execution.currentStep,
        agent: 'workflow-manager',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        severity: 'critical'
      })
    }
    
    return this.generateExecutionSummary(execution, plan)
  }

  /**
   * Gets the status of a workflow execution
   */
  static getExecutionStatus(planId: string): WorkflowExecution | null {
    return this.activeExecutions.get(planId) || null
  }

  /**
   * Lists all active executions
   */
  static getActiveExecutions(): WorkflowExecution[] {
    return Array.from(this.activeExecutions.values())
  }

  /**
   * Cancels a workflow execution
   */
  static cancelExecution(planId: string): boolean {
    const execution = this.activeExecutions.get(planId)
    if (execution && execution.status === 'executing') {
      execution.status = 'cancelled'
      return true
    }
    return false
  }

  /**
   * Processes workflow steps according to their dependencies and strategy
   */
  private static async processWorkflowSteps(
    plan: OrchestrationPlan, 
    execution: WorkflowExecution
  ): Promise<void> {
    const { workflow } = plan
    
    switch (plan.analysis.executionStrategy) {
      case 'sequential':
        await this.executeSequentially(workflow, execution)
        break
      case 'parallel':
        await this.executeInParallel(workflow, execution)
        break
      case 'review-chain':
        await this.executeReviewChain(workflow, execution)
        break
      case 'hybrid':
        await this.executeHybrid(workflow, execution)
        break
    }
  }

  private static async executeSequentially(
    workflow: WorkflowStep[], 
    execution: WorkflowExecution
  ): Promise<void> {
    for (const step of workflow) {
      if (execution.status !== 'executing') break
      
      execution.currentStep = step.stepNumber
      
      try {
        const result = await this.executeStep(step, execution)
        execution.results.push(result)
        execution.completedSteps.push(step.stepNumber)
      } catch (error) {
        this.handleStepError(step, error, execution)
        throw error
      }
    }
  }

  private static async executeInParallel(
    workflow: WorkflowStep[], 
    execution: WorkflowExecution
  ): Promise<void> {
    const promises = workflow.map(step => 
      this.executeStep(step, execution)
        .then(result => {
          execution.results.push(result)
          execution.completedSteps.push(step.stepNumber)
          return result
        })
        .catch(error => {
          this.handleStepError(step, error, execution)
          throw error
        })
    )
    
    await Promise.all(promises)
  }

  private static async executeReviewChain(
    workflow: WorkflowStep[], 
    execution: WorkflowExecution
  ): Promise<void> {
    // Group steps by dependency level
    const stepGroups = this.groupStepsByDependencyLevel(workflow)
    
    for (const group of stepGroups) {
      if (execution.status !== 'executing') break
      
      // Execute each group in parallel
      const promises = group.map(step => 
        this.executeStep(step, execution)
          .then(result => {
            execution.results.push(result)
            execution.completedSteps.push(step.stepNumber)
            return result
          })
          .catch(error => {
            this.handleStepError(step, error, execution)
            throw error
          })
      )
      
      await Promise.all(promises)
    }
  }

  private static async executeHybrid(
    workflow: WorkflowStep[], 
    execution: WorkflowExecution
  ): Promise<void> {
    // Hybrid execution: combination of sequential and parallel based on dependencies
    const stepGroups = this.groupStepsByDependencyLevel(workflow)
    
    for (const group of stepGroups) {
      if (execution.status !== 'executing') break
      
      // Check if steps in this group can run in parallel
      const canRunInParallel = group.every(step => 
        step.dependencies.every(dep => execution.completedSteps.includes(dep))
      )
      
      if (canRunInParallel && group.length > 1) {
        // Execute in parallel
        const promises = group.map(step => this.executeStep(step, execution))
        const results = await Promise.all(promises)
        
        results.forEach((result, index) => {
          execution.results.push(result)
          execution.completedSteps.push(group[index].stepNumber)
        })
      } else {
        // Execute sequentially
        for (const step of group) {
          const result = await this.executeStep(step, execution)
          execution.results.push(result)
          execution.completedSteps.push(step.stepNumber)
        }
      }
    }
  }

  /**
   * Executes a single workflow step
   */
  private static async executeStep(
    step: WorkflowStep, 
    execution: WorkflowExecution
  ): Promise<StepResult> {
    const startTime = new Date()
    
    // Check dependencies
    const dependenciesMet = step.dependencies.every(dep => 
      execution.completedSteps.includes(dep)
    )
    
    if (!dependenciesMet) {
      execution.blockedSteps.push(step.stepNumber)
      throw new Error(`Step ${step.stepNumber} dependencies not met`)
    }
    
    // Simulate agent execution (in real implementation, this would call the actual agent)
    const output = await this.callAgent(step.agent, step.task, execution)
    
    const endTime = new Date()
    const duration = `${Math.round((endTime.getTime() - startTime.getTime()) / 1000)}s`
    
    return {
      stepNumber: step.stepNumber,
      agent: step.agent,
      output,
      completedAt: endTime,
      duration,
      success: true
    }
  }

  /**
   * Calls a specific agent to execute a task
   */
  private static async callAgent(
    agentType: string, 
    task: string, 
    execution: WorkflowExecution
  ): Promise<string> {
    // In real implementation, this would use the Task tool to call the appropriate subagent
    // For now, we simulate the agent response
    
    const agentResponses = {
      'supabase-specialist': `Database operation completed successfully for: ${task}`,
      'backend-engineer': `API endpoint implemented successfully for: ${task}`, 
      'frontend-specialist': `UI component created successfully for: ${task}`,
      'performance-optimizer': `Performance optimization completed for: ${task}`,
      'security-auditor': `Security audit passed for: ${task}`,
      'qa-engineer': `Tests created and validation completed for: ${task}`
    }
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return agentResponses[agentType as keyof typeof agentResponses] || 
           `Task completed by ${agentType}: ${task}`
  }

  /**
   * Handles errors that occur during step execution
   */
  private static handleStepError(
    step: WorkflowStep, 
    error: any, 
    execution: WorkflowExecution
  ): void {
    execution.errors.push({
      stepNumber: step.stepNumber,
      agent: step.agent,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date(),
      severity: 'error'
    })
  }

  /**
   * Groups workflow steps by their dependency level for parallel execution
   */
  private static groupStepsByDependencyLevel(workflow: WorkflowStep[]): WorkflowStep[][] {
    const groups: WorkflowStep[][] = []
    const processed = new Set<number>()
    
    let currentLevel = 0
    while (processed.size < workflow.length) {
      const currentGroup = workflow.filter(step => 
        !processed.has(step.stepNumber) &&
        step.dependencies.every(dep => processed.has(dep))
      )
      
      if (currentGroup.length === 0) {
        // Circular dependency or other issue
        break
      }
      
      groups.push(currentGroup)
      currentGroup.forEach(step => processed.add(step.stepNumber))
      currentLevel++
    }
    
    return groups
  }

  /**
   * Generates a comprehensive execution summary
   */
  private static generateExecutionSummary(
    execution: WorkflowExecution, 
    plan: OrchestrationPlan
  ): string {
    const duration = new Date().getTime() - execution.startTime.getTime()
    const durationStr = `${Math.round(duration / 1000)}s`
    
    const summary = `
# Orchestration Execution Summary

## Task Details
- **Task ID**: ${plan.taskId}
- **Task Type**: ${plan.analysis.taskType}
- **Complexity**: ${plan.analysis.complexity}
- **Risk Level**: ${plan.analysis.riskLevel}

## Execution Results
- **Status**: ${execution.status}
- **Duration**: ${durationStr}
- **Steps Completed**: ${execution.completedSteps.length}/${plan.workflow.length}
- **Errors**: ${execution.errors.length}

## Agent Participation
${plan.analysis.requiredAgents.map(agent => {
  const result = execution.results.find(r => r.agent === agent)
  return `- **${agent}**: ${result ? '✅ Completed' : '❌ Not completed'}`
}).join('\n')}

## Step Results
${execution.results.map(result => 
  `### Step ${result.stepNumber} (${result.agent})
- **Duration**: ${result.duration}
- **Status**: ${result.success ? '✅ Success' : '❌ Failed'}
- **Output**: ${result.output}
`).join('\n')}

${execution.errors.length > 0 ? `## Errors
${execution.errors.map(error => 
  `- **Step ${error.stepNumber}** (${error.agent}): ${error.errorMessage}`
).join('\n')}` : '## ✅ No Errors'}

## Quality Gates
${plan.qualityCheckpoints.length > 0 ? 
  plan.qualityCheckpoints.map(checkpoint => {
    const completed = execution.completedSteps.includes(checkpoint)
    return `- Quality checkpoint ${checkpoint}: ${completed ? '✅ Passed' : '⏳ Pending'}`
  }).join('\n') : 
  'No quality gates defined'
}

## Next Steps
${execution.status === 'completed' ? 
  '✅ All tasks completed successfully. Ready for deployment.' :
  execution.status === 'failed' ?
  '❌ Execution failed. Review errors and retry.' :
  '⏳ Execution in progress...'
}
`
    
    return summary
  }
}
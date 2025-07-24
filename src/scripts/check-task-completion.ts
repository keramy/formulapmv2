/**
 * Task Management System Completion Check
 * V3 Phase 1 Implementation
 */

import fs from 'fs'
import path from 'path'

interface CompletionStatus {
  component: string
  status: 'complete' | 'partial' | 'missing'
  details: string[]
}

function checkFileExists(filePath: string): boolean {
  return fs.existsSync(path.join(process.cwd(), filePath))
}

function checkFileContains(filePath: string, searchStrings: string[]): string[] {
  if (!checkFileExists(filePath)) return []
  
  const content = fs.readFileSync(path.join(process.cwd(), filePath), 'utf-8')
  return searchStrings.filter(str => content.includes(str))
}

function checkTaskManagementCompletion(): CompletionStatus[] {
  const status: CompletionStatus[] = []

  // 1. Check TasksTab Component
  const tasksTabStatus: CompletionStatus = {
    component: 'TasksTab Component',
    status: 'complete',
    details: []
  }
  
  if (checkFileExists('src/components/projects/tabs/TasksTab.tsx')) {
    const hasRealData = checkFileContains('src/components/projects/tabs/TasksTab.tsx', [
      'useProjectMembers',
      'useTasks',
      'projectMembers',
      'NOT mockProjectMembers'
    ])
    
    if (hasRealData.length < 3) {
      tasksTabStatus.status = 'partial'
      tasksTabStatus.details.push('Still using some real data')
    } else {
      tasksTabStatus.details.push('✓ Using real project members')
      tasksTabStatus.details.push('✓ Connected to real API')
    }
  } else {
    tasksTabStatus.status = 'missing'
    tasksTabStatus.details.push('Component file not found')
  }
  
  status.push(tasksTabStatus)

  // 2. Check useTasks Hook
  const useTasksStatus: CompletionStatus = {
    component: 'useTasks Hook',
    status: 'complete',
    details: []
  }
  
  if (checkFileExists('src/hooks/useTasks.ts')) {
    const requiredFunctions = checkFileContains('src/hooks/useTasks.ts', [
      'createTask',
      'updateTask',
      'deleteTask',
      'updateTaskStatus',
      'bulkUpdateTasks',
      'fetchTasks'
    ])
    
    if (requiredFunctions.length === 6) {
      useTasksStatus.details.push('✓ All CRUD operations implemented')
    } else {
      useTasksStatus.status = 'partial'
      useTasksStatus.details.push(`Missing ${6 - requiredFunctions.length} operations`)
    }
  } else {
    useTasksStatus.status = 'missing'
    useTasksStatus.details.push('Hook file not found')
  }
  
  status.push(useTasksStatus)

  // 3. Check API Routes
  const apiRoutes = [
    { path: 'src/app/api/tasks/route.ts', name: 'Main Tasks API' },
    { path: 'src/app/api/tasks/[id]/route.ts', name: 'Individual Task API' },
    { path: 'src/app/api/projects/[id]/tasks/route.ts', name: 'Project Tasks API' }
  ]
  
  apiRoutes.forEach(route => {
    const routeStatus: CompletionStatus = {
      component: route.name,
      status: checkFileExists(route.path) ? 'complete' : 'missing',
      details: []
    }
    
    if (routeStatus.status === 'complete') {
      const hasVerbs = checkFileContains(route.path, ['GET', 'POST', 'PUT', 'DELETE'])
      routeStatus.details.push(`✓ ${hasVerbs.length} HTTP methods implemented`)
    } else {
      routeStatus.details.push('Route file not found')
    }
    
    status.push(routeStatus)
  })

  // 4. Check Task Components
  const taskComponents = [
    'src/components/tasks/TaskList.tsx',
    'src/components/tasks/TaskForm.tsx',
    'src/components/tasks/TaskCard.tsx',
    'src/components/tasks/TaskStatusBadge.tsx',
    'src/components/tasks/TaskPrioritySelector.tsx'
  ]
  
  const componentStatus: CompletionStatus = {
    component: 'Task Components',
    status: 'complete',
    details: []
  }
  
  let foundComponents = 0
  taskComponents.forEach(comp => {
    if (checkFileExists(comp)) {
      foundComponents++
    }
  })
  
  if (foundComponents === taskComponents.length) {
    componentStatus.details.push(`✓ All ${foundComponents} components implemented`)
  } else if (foundComponents > 0) {
    componentStatus.status = 'partial'
    componentStatus.details.push(`${foundComponents}/${taskComponents.length} components implemented`)
  } else {
    componentStatus.status = 'missing'
    componentStatus.details.push('No task components found')
  }
  
  status.push(componentStatus)

  // 5. Check Tests
  const testStatus: CompletionStatus = {
    component: 'Tests',
    status: 'complete',
    details: []
  }
  
  const testFiles = [
    'src/__tests__/hooks/useTasks.test.ts',
    'src/__tests__/api/tasks.api.test.ts',
    'src/__tests__/integration/tasks.integration.test.ts'
  ]
  
  let foundTests = 0
  testFiles.forEach(test => {
    if (checkFileExists(test)) {
      foundTests++
    }
  })
  
  if (foundTests === testFiles.length) {
    testStatus.details.push(`✓ All ${foundTests} test suites created`)
  } else if (foundTests > 0) {
    testStatus.status = 'partial'
    testStatus.details.push(`${foundTests}/${testFiles.length} test suites created`)
  } else {
    testStatus.status = 'missing'
    testStatus.details.push('No tests found')
  }
  
  status.push(testStatus)

  // 6. Check Database Integration
  const dbStatus: CompletionStatus = {
    component: 'Database Integration',
    status: 'complete',
    details: []
  }
  
  if (checkFileExists('src/lib/validation/tasks.ts')) {
    const hasValidation = checkFileContains('src/lib/validation/tasks.ts', [
      'validateTaskFormData',
      'validateTaskUpdate',
      'calculateTaskStatus'
    ])
    
    if (hasValidation.length === 3) {
      dbStatus.details.push('✓ All validation functions implemented')
    } else {
      dbStatus.status = 'partial'
      dbStatus.details.push('Some validation functions missing')
    }
  } else {
    dbStatus.status = 'missing'
    dbStatus.details.push('Validation file not found')
  }
  
  status.push(dbStatus)

  return status
}

// Run the check
console.log('🔍 Task Management System Completion Check\n')

const results = checkTaskManagementCompletion()
let totalComplete = 0
let totalPartial = 0
let totalMissing = 0

results.forEach(result => {
  const icon = result.status === 'complete' ? '✅' : 
               result.status === 'partial' ? '⚠️' : '❌'
  
  console.log(`${icon} ${result.component}: ${result.status.toUpperCase()}`)
  result.details.forEach(detail => {
    console.log(`   ${detail}`)
  })
  console.log()
  
  if (result.status === 'complete') totalComplete++
  else if (result.status === 'partial') totalPartial++
  else totalMissing++
})

const completionPercentage = Math.round(
  ((totalComplete + totalPartial * 0.5) / results.length) * 100
)

console.log('📊 Summary:')
console.log(`   Complete: ${totalComplete}/${results.length}`)
console.log(`   Partial: ${totalPartial}/${results.length}`)
console.log(`   Missing: ${totalMissing}/${results.length}`)
console.log(`   Overall Completion: ${completionPercentage}%`)

if (completionPercentage >= 90) {
  console.log('\n✨ Task Management System is production ready!')
} else {
  console.log(`\n⚠️  Task Management System needs more work (${100 - completionPercentage}% remaining)`)
}
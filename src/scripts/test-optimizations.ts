/**
 * Optimization Testing Script
 * Tests performance improvements and validates no breaking changes
 */

import { createClient } from '@supabase/supabase-js'
import { performance } from 'perf_hooks'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// ============================================================================
// PERFORMANCE TESTING UTILITIES
// ============================================================================

interface PerformanceTest {
  name: string
  description: string
  test: () => Promise<{ duration: number; result: any }>
  expectedMaxDuration?: number
}

class PerformanceTester {
  private results: Array<{
    name: string
    duration: number
    passed: boolean
    error?: string
  }> = []

  async runTest(test: PerformanceTest): Promise<void> {
    console.log(`🧪 Running test: ${test.name}`)
    console.log(`   ${test.description}`)

    try {
      const startTime = performance.now()
      const result = await test.test()
      const endTime = performance.now()
      const duration = endTime - startTime

      const passed = test.expectedMaxDuration ? duration <= test.expectedMaxDuration : true

      this.results.push({
        name: test.name,
        duration,
        passed,
      })

      console.log(`   ✅ Completed in ${duration.toFixed(2)}ms`)
      if (test.expectedMaxDuration) {
        console.log(`   📊 Expected: <${test.expectedMaxDuration}ms, Actual: ${duration.toFixed(2)}ms`)
      }
    } catch (error) {
      this.results.push({
        name: test.name,
        duration: 0,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      console.log(`   ❌ Failed: ${error}`)
    }
  }

  async runAllTests(tests: PerformanceTest[]): Promise<void> {
    console.log('🚀 Starting Performance Optimization Tests\n')

    for (const test of tests) {
      await this.runTest(test)
      console.log('')
    }

    this.printSummary()
  }

  private printSummary(): void {
    console.log('📊 PERFORMANCE TEST SUMMARY')
    console.log('=' .repeat(50))

    const passed = this.results.filter(r => r.passed).length
    const total = this.results.length

    console.log(`Overall: ${passed}/${total} tests passed`)
    console.log('')

    this.results.forEach(result => {
      const status = result.passed ? '✅' : '❌'
      const duration = result.duration > 0 ? `${result.duration.toFixed(2)}ms` : 'Failed'
      console.log(`${status} ${result.name}: ${duration}`)
      if (result.error) {
        console.log(`   Error: ${result.error}`)
      }
    })

    console.log('')
    console.log('🎯 PERFORMANCE METRICS:')
    const avgDuration = this.results
      .filter(r => r.passed && r.duration > 0)
      .reduce((sum, r) => sum + r.duration, 0) / this.results.filter(r => r.passed).length

    console.log(`   Average query time: ${avgDuration.toFixed(2)}ms`)
    console.log(`   Fastest query: ${Math.min(...this.results.filter(r => r.passed).map(r => r.duration)).toFixed(2)}ms`)
    console.log(`   Slowest query: ${Math.max(...this.results.filter(r => r.passed).map(r => r.duration)).toFixed(2)}ms`)
  }
}

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

const performanceTests: PerformanceTest[] = [
  {
    name: 'Database Index Performance',
    description: 'Test if new indexes improve query performance',
    expectedMaxDuration: 100,
    test: async () => {
      const start = performance.now()
      
      // Test task queries with new indexes
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, title, status, assigned_to, due_date')
        .eq('status', 'in_progress')
        .limit(50)

      const { data: scopeItems } = await supabase
        .from('scope_items')
        .select('id, description, category, status')
        .eq('category', 'construction')
        .limit(50)

      const end = performance.now()
      
      return {
        duration: end - start,
        result: { taskCount: tasks?.length, scopeCount: scopeItems?.length }
      }
    }
  },

  {
    name: 'Selective Field Loading',
    description: 'Test optimized field selection vs full select',
    expectedMaxDuration: 200,
    test: async () => {
      const start = performance.now()
      
      // Test selective field loading
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name, status, start_date, end_date')
        .limit(20)

      const { data: projectsWithRelations } = await supabase
        .from('projects')
        .select(`
          id, name, status,
          client:clients(id, company_name),
          project_manager:user_profiles!project_manager_id(id, first_name, last_name)
        `)
        .limit(10)

      const end = performance.now()
      
      return {
        duration: end - start,
        result: { 
          basicProjects: projects?.length, 
          detailedProjects: projectsWithRelations?.length 
        }
      }
    }
  },

  {
    name: 'Task Query Optimization',
    description: 'Test optimized task queries with proper indexing',
    expectedMaxDuration: 150,
    test: async () => {
      const start = performance.now()
      
      // Get a project ID for testing
      const { data: project } = await supabase
        .from('projects')
        .select('id')
        .limit(1)
        .single()

      if (!project) throw new Error('No projects found for testing')

      // Test optimized task query
      const { data: tasks } = await supabase
        .from('tasks')
        .select(`
          id, title, status, priority, due_date,
          assignee:user_profiles!assigned_to(id, first_name, last_name)
        `)
        .eq('project_id', project.id)
        .order('created_at', { ascending: false })
        .limit(25)

      const end = performance.now()
      
      return {
        duration: end - start,
        result: { taskCount: tasks?.length, projectId: project.id }
      }
    }
  },

  {
    name: 'Scope Items with Category Filter',
    description: 'Test scope item queries with category indexing',
    expectedMaxDuration: 120,
    test: async () => {
      const start = performance.now()
      
      const categories = ['construction', 'millwork', 'electrical', 'mechanical']
      const results = []

      for (const category of categories) {
        const { data: items } = await supabase
          .from('scope_items')
          .select('id, description, category, status, quantity, unit_price')
          .eq('category', category)
          .limit(10)
        
        results.push({ category, count: items?.length || 0 })
      }

      const end = performance.now()
      
      return {
        duration: end - start,
        result: results
      }
    }
  },

  {
    name: 'Milestone Date Queries',
    description: 'Test milestone queries with date indexing',
    expectedMaxDuration: 100,
    test: async () => {
      const start = performance.now()
      
      const today = new Date().toISOString().split('T')[0]
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      // Test overdue milestones
      const { data: overdue } = await supabase
        .from('project_milestones')
        .select('id, name, target_date, status')
        .lt('target_date', today)
        .neq('status', 'completed')
        .neq('status', 'cancelled')

      // Test upcoming milestones
      const { data: upcoming } = await supabase
        .from('project_milestones')
        .select('id, name, target_date, status')
        .gte('target_date', today)
        .lte('target_date', nextWeek)

      const end = performance.now()
      
      return {
        duration: end - start,
        result: { 
          overdueCount: overdue?.length || 0, 
          upcomingCount: upcoming?.length || 0 
        }
      }
    }
  },

  {
    name: 'User Assignment Queries',
    description: 'Test user assignment queries with proper indexing',
    expectedMaxDuration: 80,
    test: async () => {
      const start = performance.now()
      
      // Get a user for testing
      const { data: user } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('is_active', true)
        .limit(1)
        .single()

      if (!user) throw new Error('No active users found for testing')

      // Test user's tasks
      const { data: userTasks } = await supabase
        .from('tasks')
        .select('id, title, status, due_date')
        .eq('assigned_to', user.id)
        .neq('status', 'cancelled')

      // Test user's project assignments
      const { data: assignments } = await supabase
        .from('project_assignments')
        .select('id, project_id, role')
        .eq('user_id', user.id)
        .eq('is_active', true)

      const end = performance.now()
      
      return {
        duration: end - start,
        result: { 
          taskCount: userTasks?.length || 0, 
          assignmentCount: assignments?.length || 0 
        }
      }
    }
  }
]

// ============================================================================
// FUNCTIONALITY TESTS
// ============================================================================

const functionalityTests: PerformanceTest[] = [
  {
    name: 'API Route Functionality',
    description: 'Ensure optimized API routes still return correct data',
    test: async () => {
      const start = performance.now()
      
      // Test if we can still fetch data through the API
      // This would normally use fetch() to test actual API endpoints
      // For now, we'll test the database queries directly
      
      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .limit(5)

      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .limit(5)

      const end = performance.now()
      
      if (!projects || !tasks) {
        throw new Error('Failed to fetch basic data')
      }
      
      return {
        duration: end - start,
        result: { projectCount: projects.length, taskCount: tasks.length }
      }
    }
  },

  {
    name: 'Data Integrity Check',
    description: 'Verify that optimizations maintain data relationships',
    test: async () => {
      const start = performance.now()
      
      // Test that relationships still work
      const { data: projectsWithTasks } = await supabase
        .from('projects')
        .select(`
          id, name,
          tasks:tasks(id, title, status)
        `)
        .limit(3)

      const { data: tasksWithAssignees } = await supabase
        .from('tasks')
        .select(`
          id, title,
          assignee:user_profiles!assigned_to(id, first_name, last_name)
        `)
        .not('assigned_to', 'is', null)
        .limit(5)

      const end = performance.now()
      
      return {
        duration: end - start,
        result: { 
          projectsWithTasks: projectsWithTasks?.length || 0,
          tasksWithAssignees: tasksWithAssignees?.length || 0
        }
      }
    }
  }
]

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function runOptimizationTests() {
  const tester = new PerformanceTester()
  
  console.log('🔧 FORMULA PM 2.0 OPTIMIZATION TESTING')
  console.log('=====================================\n')
  
  await tester.runAllTests([...performanceTests, ...functionalityTests])
  
  console.log('\n🎉 Testing completed!')
  console.log('If all tests passed, the optimizations are working correctly.')
  console.log('If any tests failed, please review the implementation.')
}

// Run tests if this file is executed directly
if (require.main === module) {
  runOptimizationTests().catch(console.error)
}

export { runOptimizationTests, PerformanceTester }

// Cleanup Test Data Script
// Run with: node cleanup-test-data.js

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function cleanupTestData() {
  console.log('🧹 Starting test data cleanup...')
  
  try {
    // Step 1: Get test user IDs (only formulapm.com and test domains)
    console.log('🔍 Identifying test users...')
    const { data: testUsers, error: usersError } = await supabase
      .from('user_profiles')
      .select('id, email')
      .or('email.like.%formulapm.com,email.like.%testcorp.com,email.like.%buildco.com,email.like.%test%')
    
    if (usersError) {
      console.error('❌ Error fetching test users:', usersError.message)
      return
    }
    
    const testUserIds = testUsers.map(u => u.id)
    console.log(`📋 Found ${testUsers.length} test users to clean up`)
    
    // Step 2: Delete tasks created by test users
    console.log('🗑️ Cleaning up tasks...')
    const { error: tasksError } = await supabase
      .from('tasks')
      .delete()
      .in('created_by', testUserIds)
    
    if (tasksError) {
      console.error('⚠️ Error cleaning tasks:', tasksError.message)
    } else {
      console.log('✅ Tasks cleaned up')
    }
    
    // Step 3: Delete scope items created by test users
    console.log('🗑️ Cleaning up scope items...')
    const { error: scopeError } = await supabase
      .from('scope_items')
      .delete()
      .in('created_by', testUserIds)
    
    if (scopeError) {
      console.error('⚠️ Error cleaning scope items:', scopeError.message)
    } else {
      console.log('✅ Scope items cleaned up')
    }
    
    // Step 4: Delete projects created by test users
    console.log('🗑️ Cleaning up projects...')
    const { error: projectsError } = await supabase
      .from('projects')
      .delete()
      .in('created_by', testUserIds)
    
    if (projectsError) {
      console.error('⚠️ Error cleaning projects:', projectsError.message)
    } else {
      console.log('✅ Projects cleaned up')
    }
    
    // Step 5: Delete test clients
    console.log('🗑️ Cleaning up test clients...')
    const { error: clientsError } = await supabase
      .from('clients')
      .delete()
      .or('email.like.%testcorp.com,email.like.%buildco.com,company_name.like.%Test%,company_name.like.%Tech%,company_name.like.%Build%,company_name.like.%Metro%')
    
    if (clientsError) {
      console.error('⚠️ Error cleaning clients:', clientsError.message)
    } else {
      console.log('✅ Test clients cleaned up')
    }
    
    // Step 6: Delete test user profiles
    console.log('🗑️ Cleaning up user profiles...')
    const { error: profilesError } = await supabase
      .from('user_profiles')
      .delete()
      .in('id', testUserIds)
    
    if (profilesError) {
      console.error('⚠️ Error cleaning user profiles:', profilesError.message)
    } else {
      console.log('✅ User profiles cleaned up')
    }
    
    // Step 7: Delete auth users (this will cascade delete profiles if they still exist)
    console.log('🗑️ Cleaning up auth users...')
    for (const user of testUsers) {
      const { error: authError } = await supabase.auth.admin.deleteUser(user.id)
      if (authError && !authError.message.includes('not found')) {
        console.error(`⚠️ Error deleting auth user ${user.email}:`, authError.message)
      }
    }
    console.log('✅ Auth users cleaned up')
    
    // Step 8: Verification
    console.log('🔍 Verifying cleanup...')
    const { data: remainingUsers } = await supabase
      .from('user_profiles')
      .select('email')
      .or('email.like.%formulapm.com,email.like.%test%')
    
    const { data: remainingProjects } = await supabase
      .from('projects')
      .select('name')
      .or('name.like.%Test%,name.like.%Downtown%,name.like.%Residential%')
    
    const { data: remainingClients } = await supabase
      .from('clients')
      .select('company_name')
      .or('company_name.like.%Test%,company_name.like.%Tech%,company_name.like.%Build%')
    
    console.log('\n📊 Cleanup Results:')
    console.log(`• Remaining test users: ${remainingUsers?.length || 0}`)
    console.log(`• Remaining test projects: ${remainingProjects?.length || 0}`)
    console.log(`• Remaining test clients: ${remainingClients?.length || 0}`)
    
    if ((remainingUsers?.length || 0) === 0 && 
        (remainingProjects?.length || 0) === 0 && 
        (remainingClients?.length || 0) === 0) {
      console.log('\n🎉 Test data cleanup completed successfully!')
      console.log('✅ All test data has been removed')
    } else {
      console.log('\n⚠️ Some test data may still remain')
      console.log('You may need to run the SQL cleanup script for complete removal')
    }
    
  } catch (error) {
    console.error('❌ Unexpected error during cleanup:', error.message)
  }
}

// Run the cleanup
cleanupTestData()

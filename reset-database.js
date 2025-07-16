// Quick Database Reset Script
// Run with: node reset-database.js

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

async function resetDatabase() {
  console.log('🔄 Starting database reset...')
  console.log('⚠️  This will remove ALL test data and create fresh mock data')
  
  try {
    // Step 1: Cleanup existing test data
    console.log('🧹 Cleaning up existing test data...')
    
    // Get all test users
    const { data: testUsers } = await supabase
      .from('user_profiles')
      .select('id, email')
      .or('email.like.%formulapm.com,email.like.%testcorp.com,email.like.%buildco.com,email.like.%test%')
    
    if (testUsers && testUsers.length > 0) {
      const testUserIds = testUsers.map(u => u.id)
      
      // Delete in correct order
      await supabase.from('tasks').delete().in('created_by', testUserIds)
      await supabase.from('scope_items').delete().in('created_by', testUserIds)
      await supabase.from('projects').delete().in('created_by', testUserIds)
      await supabase.from('clients').delete().or('email.like.%testcorp.com,email.like.%buildco.com,company_name.like.%Test%,company_name.like.%Tech%,company_name.like.%Build%,company_name.like.%Metro%')
      await supabase.from('user_profiles').delete().in('id', testUserIds)
      
      // Delete auth users
      for (const user of testUsers) {
        await supabase.auth.admin.deleteUser(user.id)
      }
    }
    
    console.log('✅ Cleanup completed')
    
    // Step 2: Create fresh mock data
    console.log('🚀 Creating fresh mock data...')
    
    // Import and run the mock data generator
    const { execSync } = require('child_process')
    execSync('node generate-mock-data.js', { stdio: 'inherit' })
    
    console.log('🎉 Database reset completed successfully!')
    console.log('\n📋 Fresh test credentials:')
    console.log('🔑 Admin: admin@formulapm.com / testpass123')
    console.log('👨‍💼 PM: pm1@formulapm.com / testpass123')
    console.log('🏢 Client: client1@testcorp.com / testpass123')
    
  } catch (error) {
    console.error('❌ Error during database reset:', error.message)
  }
}

// Run the reset
resetDatabase()

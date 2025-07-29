import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

console.log('🔧 FIXING TEST USERS - Creating in auth.users\n')

// Test users that need to be created
const testUsers = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'management.test@formulapm.com',
    password: 'testpass123',
    role: 'management',
    firstName: 'Management',
    lastName: 'User'
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    email: 'pm.test@formulapm.com',
    password: 'testpass123',
    role: 'project_manager',
    firstName: 'Project',
    lastName: 'Manager'
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    email: 'admin.test@formulapm.com',
    password: 'testpass123',
    role: 'admin',
    firstName: 'Admin',
    lastName: 'User'
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    email: 'client.test@formulapm.com',
    password: 'testpass123',
    role: 'client',
    firstName: 'Client',
    lastName: 'User'
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'purchase.test@formulapm.com',
    password: 'testpass123',
    role: 'purchase_manager',
    firstName: 'Purchase',
    lastName: 'Manager'
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    email: 'technical.test@formulapm.com',
    password: 'testpass123',
    role: 'technical_lead',
    firstName: 'Technical',
    lastName: 'Lead'
  }
]

console.log('Creating test users in auth.users...\n')

let successCount = 0
let errorCount = 0

for (const user of testUsers) {
  console.log(`📧 Creating: ${user.email}`)
  
  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      user_id: user.id,
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: {
        first_name: user.firstName,
        last_name: user.lastName
      },
      app_metadata: {
        user_role: user.role
      }
    })
    
    if (error) {
      console.error(`  ❌ Failed: ${error.message}`)
      errorCount++
    } else {
      console.log(`  ✅ Success! ID: ${data.user.id}`)
      successCount++
    }
  } catch (err) {
    console.error(`  💥 Exception: ${err.message}`)
    errorCount++
  }
}

console.log(`\n📊 SUMMARY:`)
console.log(`✅ Successfully created: ${successCount} users`)
console.log(`❌ Failed: ${errorCount} users`)

if (successCount > 0) {
  console.log('\n🧪 TESTING LOGIN WITH FIRST SUCCESSFUL USER:')
  
  const supabaseClient = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0')
  
  const testUser = testUsers[0]
  console.log(`Testing: ${testUser.email} / ${testUser.password}`)
  
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: testUser.email,
    password: testUser.password
  })
  
  if (error) {
    console.error(`❌ Login failed: ${error.message}`)
  } else {
    console.log(`✅ Login successful!`)
    console.log(`User: ${data.user.email}`)
    console.log(`Token: ${data.session.access_token.substring(0, 30)}...`)
    await supabaseClient.auth.signOut()
  }
}

console.log('\n🎯 NEXT STEPS:')
console.log('1. Update LoginForm to show these test credentials')
console.log('2. All test users should now be able to login')
console.log('3. Password for all: testpass123')
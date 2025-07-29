import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

console.log('🔧 Creating Test Users in Auth System...\n')

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
    id: '55555555-5555-5555-5555-555555555555',
    email: 'client.test@formulapm.com',
    password: 'testpass123',
    role: 'client',
    firstName: 'Client',
    lastName: 'User'
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    email: 'admin.test@formulapm.com',
    password: 'testpass123',
    role: 'admin',
    firstName: 'Admin',
    lastName: 'User'
  }
]

console.log('Creating test users...')

for (const user of testUsers) {
  console.log(`\n👤 Creating ${user.email}...`)
  
  try {
    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
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
    
    if (createError) {
      console.error(`  ❌ Failed: ${createError.message}`)
    } else {
      console.log(`  ✅ Success: ${createData.user.email} (ID: ${createData.user.id.substring(0, 8)}...)`)
    }
  } catch (err) {
    console.error(`  💥 Exception: ${err.message}`)
  }
}

console.log('\n🔍 Verifying created users...')

try {
  const { data: allUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()
  
  if (listError) {
    console.error('❌ Could not list users:', listError.message)
  } else {
    const testUsersList = allUsers.users.filter(u => u.email.includes('test@formulapm.com'))
    console.log(`✅ Found ${testUsersList.length} test users in auth system:`)
    
    testUsersList.forEach(user => {
      console.log(`  📧 ${user.email} - ID: ${user.id.substring(0, 8)}... - Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`)
    })
  }
} catch (err) {
  console.error('💥 Verification exception:', err.message)
}

console.log('\n🧪 Testing authentication with created users...')

const supabaseClient = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0')

// Test authentication with first user
const testEmail = 'management.test@formulapm.com'
console.log(`\n🔐 Testing login: ${testEmail}`)

try {
  const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
    email: testEmail,
    password: 'testpass123'
  })
  
  if (loginError) {
    console.error(`❌ Login failed: ${loginError.message}`)
  } else {
    console.log('✅ Login successful!')
    console.log(`📧 Email: ${loginData.user?.email}`)
    console.log(`🆔 ID: ${loginData.user?.id?.substring(0, 8)}...`)
    console.log(`🎟️ Token: ${loginData.session?.access_token ? 'Present' : 'Missing'}`)
    
    await supabaseClient.auth.signOut()
    console.log('🚪 Signed out')
  }
} catch (err) {
  console.error(`💥 Login exception: ${err.message}`)
}

console.log('\n🎯 SUMMARY:')
console.log('Test users have been created in the auth system.')
console.log('The LoginForm should now work with these credentials:')
console.log('  - management.test@formulapm.com')
console.log('  - pm.test@formulapm.com')
console.log('  - admin.test@formulapm.com')
console.log('  - client.test@formulapm.com')
console.log('  - purchase.test@formulapm.com')
console.log('  - technical.test@formulapm.com')
console.log('  - Password: testpass123')
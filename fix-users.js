/**
 * Fix Test Users - Delete old users and create new ones with proper auth
 */

const { createClient } = require('@supabase/supabase-js')

// Use service role key for admin operations
const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})

const testEmails = [
  'management.test@formulapm.com',
  'purchase.test@formulapm.com', 
  'technical.test@formulapm.com',
  'pm.test@formulapm.com',
  'client.test@formulapm.com',
  'admin.test@formulapm.com'
]

async function fixUsers() {
  console.log('🔧 Fixing Test Users...\n')
  
  console.log('1️⃣ Listing existing users...')
  
  // Get list of all users
  const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()
  
  if (listError) {
    console.log('❌ Error listing users:', listError.message)
    return
  }
  
  console.log(`Found ${users.users.length} total users`)
  
  // Find test users
  const testUsers = users.users.filter(user => 
    testEmails.includes(user.email)
  )
  
  console.log(`Found ${testUsers.length} test users:`)
  testUsers.forEach(user => {
    console.log(`  - ${user.email} (ID: ${user.id}, confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'})`)
  })
  
  console.log('\n2️⃣ Deleting old test users...')
  
  for (const user of testUsers) {
    console.log(`Deleting: ${user.email}`)
    
    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id)
    
    if (error) {
      console.log(`  ❌ Delete failed: ${error.message}`)
    } else {
      console.log(`  ✅ Deleted successfully`)
    }
  }
  
  console.log('\n3️⃣ Creating fresh test users...')
  
  // Test users to create
  const newUsers = [
    {
      email: 'pm.test@formulapm.com',
      password: 'testpass123',
      role: 'project_manager',
      first_name: 'Project',
      last_name: 'Manager'
    },
    {
      email: 'admin.test@formulapm.com',
      password: 'testpass123',
      role: 'admin',
      first_name: 'Admin',
      last_name: 'User'
    }
  ]
  
  for (const userData of newUsers) {
    console.log(`Creating: ${userData.email}`)
    
    try {
      // Create user via Auth API
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          first_name: userData.first_name,
          last_name: userData.last_name
        }
      })
      
      if (authError) {
        console.log(`  ❌ Auth creation failed: ${authError.message}`)
        continue
      }
      
      console.log(`  ✅ Auth user created: ${authData.user.id}`)
      
      // Create user profile
      const { error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .upsert({
          id: authData.user.id,
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role,
          seniority: 'regular',
          phone: '+1234567890',
          company: 'Formula PM',
          is_active: true
        })
      
      if (profileError) {
        console.log(`  ❌ Profile creation failed: ${profileError.message}`)
      } else {
        console.log(`  ✅ Profile created`)
      }
      
    } catch (error) {
      console.log(`  ❌ Exception: ${error.message}`)
    }
  }
  
  console.log('\n4️⃣ Testing login...')
  
  // Test with regular client
  const supabaseClient = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0')
  
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: 'pm.test@formulapm.com',
    password: 'testpass123'
  })
  
  if (error) {
    console.log(`❌ Test login failed: ${error.message}`)
  } else {
    console.log(`✅ Test login successful!`)
    console.log(`  User ID: ${data.user.id}`)
    console.log(`  Email: ${data.user.email}`)
    
    // Sign out
    await supabaseClient.auth.signOut()
  }
  
  console.log('\n🎉 Fix complete!')
  console.log('\n✅ Working credentials:')
  console.log('   Email: pm.test@formulapm.com')
  console.log('   Password: testpass123')
  console.log('\n   Email: admin.test@formulapm.com')
  console.log('   Password: testpass123')
}

fixUsers().catch(console.error)
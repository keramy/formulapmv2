/**
 * Create Final Working Test Users
 * Using the proven working method (Supabase Auth API)
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const client = createClient(supabaseUrl, supabaseAnonKey)
const admin = createClient(supabaseUrl, supabaseServiceKey)

const newUsers = [
  {
    email: 'pm.working@formulapm.com',
    password: 'testpass123',
    role: 'project_manager',
    first_name: 'Project',
    last_name: 'Manager'
  },
  {
    email: 'admin.working@formulapm.com', 
    password: 'testpass123',
    role: 'admin',
    first_name: 'Admin',
    last_name: 'User'
  },
  {
    email: 'client.working@formulapm.com',
    password: 'testpass123',
    role: 'client', 
    first_name: 'Client',
    last_name: 'User'
  }
]

async function createFinalUsers() {
  console.log('🚀 Creating Final Working Test Users...\n')
  
  for (const userData of newUsers) {
    console.log(`Creating: ${userData.email}`)
    
    try {
      // Create via signup (the proven working method)
      const { data: signupData, error: signupError } = await client.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            first_name: userData.first_name,
            last_name: userData.last_name
          }
        }
      })
      
      if (signupError) {
        console.log(`  ❌ Signup failed: ${signupError.message}`)
        continue
      }
      
      console.log(`  ✅ User created: ${signupData.user.id}`)
      
      // Create profile
      const { error: profileError } = await admin
        .from('user_profiles')
        .insert({
          id: signupData.user.id,
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role,
          seniority: 'regular',
          phone: '+1234567890',
          company: userData.role === 'client' ? 'Test Client Company' : 'Formula PM',
          is_active: true
        })
      
      if (profileError) {
        console.log(`  ❌ Profile failed: ${profileError.message}`)
      } else {
        console.log(`  ✅ Profile created (${userData.role})`)
      }
      
      // Test login immediately
      const { data: loginData, error: loginError } = await client.auth.signInWithPassword({
        email: userData.email,
        password: userData.password
      })
      
      if (loginError) {
        console.log(`  ❌ Login test failed: ${loginError.message}`)
      } else {
        console.log(`  ✅ Login test successful`)
        await client.auth.signOut()
      }
      
    } catch (error) {
      console.log(`  ❌ Exception: ${error.message}`)
    }
    
    console.log('') // Empty line for readability
  }
  
  console.log('🎉 Final user creation complete!\n')
  console.log('✅ WORKING TEST CREDENTIALS:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Email: test.user@formulapm.com')
  console.log('Password: testpass123')
  console.log('Role: project_manager')
  console.log('')
  console.log('Email: pm.working@formulapm.com')
  console.log('Password: testpass123') 
  console.log('Role: project_manager')
  console.log('')
  console.log('Email: admin.working@formulapm.com')
  console.log('Password: testpass123')
  console.log('Role: admin')
  console.log('')
  console.log('Email: client.working@formulapm.com')
  console.log('Password: testpass123')
  console.log('Role: client')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('\n🔥 ALL USERS READY FOR TESTING!')
}

createFinalUsers().catch(console.error)
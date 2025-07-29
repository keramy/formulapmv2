/**
 * Create Working Test Users via Supabase Auth API
 * This ensures passwords are hashed correctly by Supabase
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

// Test users to create
const testUsers = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'management.test@formulapm.com',
    password: 'testpass123',
    role: 'management',
    seniority: 'executive',
    first_name: 'Management',
    last_name: 'User'
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'purchase.test@formulapm.com',
    password: 'testpass123',
    role: 'purchase_manager',
    seniority: 'senior',
    first_name: 'Purchase',
    last_name: 'Manager'
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    email: 'technical.test@formulapm.com',
    password: 'testpass123',
    role: 'technical_lead',
    seniority: 'senior',
    first_name: 'Technical',
    last_name: 'Lead'
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    email: 'pm.test@formulapm.com',
    password: 'testpass123',
    role: 'project_manager',
    seniority: 'regular',
    first_name: 'Project',
    last_name: 'Manager'
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    email: 'client.test@formulapm.com',
    password: 'testpass123',
    role: 'client',
    seniority: 'regular',
    first_name: 'Client',
    last_name: 'User'
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    email: 'admin.test@formulapm.com',
    password: 'testpass123',
    role: 'admin',
    seniority: 'regular',
    first_name: 'Admin',
    last_name: 'User'
  }
]

async function createWorkingUsers() {
  console.log('🚀 Creating Working Test Users via Supabase Auth API...\n')
  
  for (const user of testUsers) {
    console.log(`Creating user: ${user.email}`)
    
    try {
      // Step 1: Create user via Auth API (this handles password hashing correctly)
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // Skip email verification for test users
        user_metadata: {
          first_name: user.first_name,
          last_name: user.last_name
        }
      })
      
      if (authError) {
        console.log(`  ❌ Auth creation failed: ${authError.message}`)
        continue
      }
      
      console.log(`  ✅ Auth user created: ${authData.user.id}`)
      
      // Step 2: Create corresponding user profile
      const { error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .upsert({
          id: authData.user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          seniority: user.seniority,
          phone: `+123456789${testUsers.indexOf(user)}`,
          company: user.role === 'client' ? 'Test Client Company' : 'Formula PM',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      
      if (profileError) {
        console.log(`  ❌ Profile creation failed: ${profileError.message}`)
      } else {
        console.log(`  ✅ Profile created: ${user.role}`)
      }
      
    } catch (error) {
      console.log(`  ❌ Exception: ${error.message}`)
    }
  }
  
  console.log('\n🧪 Testing newly created users...')
  
  // Test login with regular supabase client (non-admin)
  const supabaseClient = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0')
  
  // Test a few users
  const testLogins = ['pm.test@formulapm.com', 'admin.test@formulapm.com']
  
  for (const email of testLogins) {
    console.log(`\n🧪 Testing login: ${email}`)
    
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: 'testpass123'
    })
    
    if (error) {
      console.log(`  ❌ Login failed: ${error.message}`)
    } else {
      console.log(`  ✅ Login successful!`)
      console.log(`    User ID: ${data.user.id}`)
      console.log(`    Email confirmed: ${data.user.email_confirmed_at ? 'Yes' : 'No'}`)
      
      // Sign out
      await supabaseClient.auth.signOut()
    }
  }
  
  console.log('\n🎉 User creation complete!')
  console.log('\n✅ You can now login with:')
  console.log('   Email: pm.test@formulapm.com')
  console.log('   Password: testpass123')
  console.log('\n   Or any of the other test users with the same password.')
}

createWorkingUsers().catch(console.error)
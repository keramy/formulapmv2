import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

console.log('🧹 CLEANING AND CREATING TEST USERS\n')

// Step 1: Clean up orphaned profiles
console.log('1️⃣ CLEANING ORPHANED USER PROFILES')
const testEmails = [
  'management.test@formulapm.com',
  'pm.test@formulapm.com',
  'admin.test@formulapm.com',
  'client.test@formulapm.com',
  'purchase.test@formulapm.com',
  'technical.test@formulapm.com'
]

// First check which profiles exist without auth users
const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
const authUserIds = authUsers.users.map(u => u.id)

console.log(`Current auth users: ${authUsers.users.length}`)

// Delete orphaned profiles
const { error: deleteError } = await supabaseAdmin
  .from('user_profiles')
  .delete()
  .in('email', testEmails)
  .not('id', 'in', `(${authUserIds.join(',')})`)

if (deleteError) {
  console.error('❌ Error deleting orphaned profiles:', deleteError.message)
} else {
  console.log('✅ Orphaned profiles cleaned')
}

// Step 2: Create users using a simpler approach
console.log('\n2️⃣ CREATING TEST USERS WITH SIMPLER METHOD')

// Try creating without specifying user_id
const testUsersSimple = [
  {
    email: 'management.test@formulapm.com',
    password: 'testpass123',
    metadata: { first_name: 'Management', last_name: 'User', role: 'management' }
  },
  {
    email: 'pm.test@formulapm.com',
    password: 'testpass123',
    metadata: { first_name: 'Project', last_name: 'Manager', role: 'project_manager' }
  },
  {
    email: 'admin.test@formulapm.com',
    password: 'testpass123',
    metadata: { first_name: 'Admin', last_name: 'User', role: 'admin' }
  }
]

for (const user of testUsersSimple) {
  console.log(`\n📧 Creating: ${user.email}`)
  
  try {
    // Create without specifying user_id
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: user.metadata
    })
    
    if (error) {
      console.error(`  ❌ Failed: ${error.message}`)
      
      // If it's a duplicate, try to update the password
      if (error.message.includes('already been registered')) {
        console.log('  🔄 User exists, updating password...')
        
        const { data: users } = await supabaseAdmin.auth.admin.listUsers()
        const existingUser = users.users.find(u => u.email === user.email)
        
        if (existingUser) {
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            existingUser.id,
            { password: user.password }
          )
          
          if (updateError) {
            console.error(`  ❌ Password update failed: ${updateError.message}`)
          } else {
            console.log(`  ✅ Password updated for existing user`)
          }
        }
      }
    } else {
      console.log(`  ✅ Created! ID: ${data.user.id}`)
      
      // Create profile
      const { error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .upsert({
          id: data.user.id,
          email: user.email,
          first_name: user.metadata.first_name,
          last_name: user.metadata.last_name,
          role: user.metadata.role,
          is_active: true,
          seniority: 'regular',
          company: 'Formula PM'
        })
      
      if (profileError) {
        console.error(`  ⚠️ Profile creation failed: ${profileError.message}`)
      } else {
        console.log(`  ✅ Profile created`)
      }
    }
  } catch (err) {
    console.error(`  💥 Exception: ${err.message}`)
  }
}

// Step 3: Test login
console.log('\n3️⃣ TESTING LOGIN WITH EACH USER')

for (const user of testUsersSimple) {
  console.log(`\n🧪 Testing: ${user.email}`)
  
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: user.email,
    password: user.password
  })
  
  if (error) {
    console.error(`  ❌ Login failed: ${error.message}`)
  } else {
    console.log(`  ✅ Login successful!`)
    await supabaseClient.auth.signOut()
  }
}

// Step 4: List all working credentials
console.log('\n4️⃣ LISTING ALL WORKING CREDENTIALS')

const { data: finalUsers } = await supabaseAdmin.auth.admin.listUsers()
console.log('\n🎯 WORKING CREDENTIALS:')
console.log('=======================')

// Check which users can actually login
for (const user of finalUsers.users) {
  // Skip non-test users
  if (!user.email.includes('@formulapm.com')) continue
  
  console.log(`\n📧 ${user.email}`)
  
  // Try common passwords
  const passwords = ['admin123', 'testpass123', 'test123']
  let workingPassword = null
  
  for (const pwd of passwords) {
    const { error } = await supabaseClient.auth.signInWithPassword({
      email: user.email,
      password: pwd
    })
    
    if (!error) {
      workingPassword = pwd
      await supabaseClient.auth.signOut()
      break
    }
  }
  
  if (workingPassword) {
    console.log(`🔑 Password: ${workingPassword}`)
    console.log(`✅ Status: WORKING`)
  } else {
    console.log(`❌ Status: No working password found`)
  }
}

console.log('\n💡 Use these credentials in the LoginForm!')
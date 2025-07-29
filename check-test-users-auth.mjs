import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

console.log('🔍 CHECKING TEST USERS FROM MIGRATION\n')

// List of test users that should exist
const testUsers = [
  { email: 'management.test@formulapm.com', password: 'testpass123' },
  { email: 'pm.test@formulapm.com', password: 'testpass123' },
  { email: 'admin.test@formulapm.com', password: 'testpass123' },
  { email: 'client.test@formulapm.com', password: 'testpass123' },
  { email: 'purchase.test@formulapm.com', password: 'testpass123' },
  { email: 'technical.test@formulapm.com', password: 'testpass123' }
]

// Check which users exist in auth.users
console.log('📊 CHECKING AUTH.USERS TABLE:')
const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()

if (authError) {
  console.error('❌ Error:', authError)
} else {
  const authEmails = authUsers.users.map(u => u.email)
  console.log(`Found ${authUsers.users.length} users in auth system:`)
  authUsers.users.forEach(u => {
    console.log(`- ${u.email} (${u.id})`)
  })
  
  console.log('\n🔍 MISSING TEST USERS IN AUTH:')
  testUsers.forEach(tu => {
    if (!authEmails.includes(tu.email)) {
      console.log(`❌ ${tu.email} - NOT IN AUTH.USERS`)
    }
  })
}

console.log('\n📊 CHECKING USER_PROFILES TABLE:')
const { data: profiles, error: profileError } = await supabaseAdmin
  .from('user_profiles')
  .select('email, role')
  .in('email', testUsers.map(u => u.email))

if (profileError) {
  console.error('❌ Error:', profileError)
} else {
  console.log(`Found ${profiles.length} test user profiles:`)
  profiles.forEach(p => {
    console.log(`- ${p.email} (${p.role})`)
  })
}

console.log('\n🔐 TESTING LOGIN FOR EACH TEST USER:')
for (const user of testUsers) {
  console.log(`\n📧 Testing: ${user.email}`)
  
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: user.email,
      password: user.password
    })
    
    if (error) {
      console.error(`  ❌ Login failed: ${error.message}`)
      
      // Check if user exists in auth
      const authUser = authUsers?.users.find(u => u.email === user.email)
      if (!authUser) {
        console.log(`  ℹ️ User not found in auth.users table`)
      }
    } else {
      console.log(`  ✅ Login successful! User ID: ${data.user.id}`)
      await supabaseClient.auth.signOut()
    }
  } catch (err) {
    console.error(`  💥 Exception: ${err.message}`)
  }
}

console.log('\n🎯 SOLUTION:')
console.log('The test users from migration exist in user_profiles but NOT in auth.users!')
console.log('This is why they cannot login.')
console.log('\nTo fix this, we need to:')
console.log('1. Create the missing users in auth.users')
console.log('2. Or reset the database and fix the migration')
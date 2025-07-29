import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('🔍 Checking database state...\n')

// Check auth.users table
const { data: authUsers, error: authError } = await supabase
  .from('auth.users')
  .select('id, email, created_at')
  .like('email', '%test@formulapm.com%')

if (authError) {
  console.error('❌ Error querying auth.users:', authError.message)
} else {
  console.log('📊 AUTH.USERS Table:')
  console.log(`Found ${authUsers.length} test users in auth.users:`)
  authUsers.forEach(user => {
    console.log(`  ✅ ${user.email} (${user.id})`)
  })
  console.log('')
}

// Check user_profiles table  
const { data: profiles, error: profileError } = await supabase
  .from('user_profiles')
  .select('id, email, role, first_name, last_name, is_active')
  .like('email', '%test@formulapm.com%')

if (profileError) {
  console.error('❌ Error querying user_profiles:', profileError.message)
} else {
  console.log('👥 USER_PROFILES Table:')
  console.log(`Found ${profiles.length} test user profiles:`)
  profiles.forEach(profile => {
    console.log(`  ✅ ${profile.email} - ${profile.role} (${profile.first_name} ${profile.last_name}) - Active: ${profile.is_active}`)
  })
  console.log('')
}

// Test a specific login attempt
console.log('🔐 Testing authentication with management.test@formulapm.com...')
const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
  email: 'management.test@formulapm.com',
  password: 'testpass123'
})

if (loginError) {
  console.error('❌ Login failed:', loginError.message)
} else {
  console.log('✅ Login successful!')
  console.log('User ID:', loginData.user?.id)
  console.log('Email:', loginData.user?.email)
  console.log('')
}

// Test wrong credentials displayed in LoginForm
console.log('🔐 Testing with credentials shown in LoginForm (test.user@formulapm.com)...')
const { data: wrongLoginData, error: wrongLoginError } = await supabase.auth.signInWithPassword({
  email: 'test.user@formulapm.com',
  password: 'testpass123'
})

if (wrongLoginError) {
  console.error('❌ Login failed (expected):', wrongLoginError.message)
} else {
  console.log('✅ Login successful (unexpected!)')
}

console.log('\n🎯 SUMMARY:')
console.log('Expected test users based on migration:')
console.log('  - management.test@formulapm.com')
console.log('  - purchase.test@formulapm.com') 
console.log('  - technical.test@formulapm.com')
console.log('  - pm.test@formulapm.com')
console.log('  - client.test@formulapm.com')
console.log('  - admin.test@formulapm.com')
console.log('')
console.log('Test users shown in LoginForm:')
console.log('  - test.user@formulapm.com')
console.log('  - pm.working@formulapm.com')
console.log('  - admin.working@formulapm.com')
console.log('  - client.working@formulapm.com')
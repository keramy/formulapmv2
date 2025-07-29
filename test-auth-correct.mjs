import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

console.log('🔍 Testing Authentication After Database Reset...\n')

// Check auth.users table (service role required)
console.log('📊 Checking auth.users table...')
const authResult = await supabaseAdmin.rpc('auth.users', {})
if (authResult.error) {
  // Try direct SQL query instead
  const { data: authUsers, error: authError } = await supabaseAdmin
    .from('auth.users')
    .select('id, email, created_at, email_confirmed_at')
    .order('created_at')

  if (authError) {
    console.error('❌ Error querying auth.users:', authError.message)
    
    // Try raw SQL
    const { data: rawUsers, error: rawError } = await supabaseAdmin.rpc('exec', {
      sql: "SELECT id, email, email_confirmed_at FROM auth.users WHERE email LIKE '%test@formulapm.com' ORDER BY email"
    })
    
    if (rawError) {
      console.error('❌ Raw SQL failed:', rawError.message)
    } else {
      console.log('✅ Found users via raw SQL:', rawUsers)
    }
  } else {
    console.log(`Found ${authUsers.length} users in auth.users:`)
    authUsers.forEach(user => {
      console.log(`  📧 ${user.email} - ID: ${user.id.substring(0, 8)}... - Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`)
    })
  }
} else {
  console.log('✅ auth.users accessible')
}

console.log('')

// Check user_profiles table 
const { data: profiles, error: profileError } = await supabaseAdmin
  .from('user_profiles')
  .select('id, email, role, first_name, last_name, is_active')
  .like('email', '%test@formulapm.com%')
  .order('email')

if (profileError) {
  console.error('❌ Error querying user_profiles:', profileError.message)
} else {
  console.log('👥 USER_PROFILES Table:')
  console.log(`Found ${profiles.length} test user profiles:`)
  profiles.forEach(profile => {
    console.log(`  ✅ ${profile.email} - ${profile.role} (${profile.first_name} ${profile.last_name}) - Active: ${profile.is_active}`)
  })
}

console.log('')

// Test authentication with each user
const testUsers = [
  'management.test@formulapm.com',
  'pm.test@formulapm.com', 
  'admin.test@formulapm.com',
  'client.test@formulapm.com',
  'purchase.test@formulapm.com',
  'technical.test@formulapm.com'
]

console.log('🔐 Testing authentication with each test user...')
for (const email of testUsers) {
  console.log(`\n🧪 Testing: ${email}`)
  
  try {
    const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: 'testpass123'
    })
    
    if (loginError) {
      console.error(`  ❌ Login failed: ${loginError.message}`)
    } else {
      console.log(`  ✅ Login successful!`)
      console.log(`  📧 Email: ${loginData.user?.email}`)
      console.log(`  🆔 ID: ${loginData.user?.id?.substring(0, 8)}...`)
      console.log(`  🎟️ Token: ${loginData.session?.access_token ? 'Present' : 'Missing'}`)
      
      // Sign out to clean up
      await supabaseClient.auth.signOut()
    }
  } catch (err) {
    console.error(`  💥 Exception: ${err.message}`)
  }
}

console.log('\n🎯 SUMMARY:')
console.log('If authentication is working, you should see "Login successful!" for all test users.')
console.log('If not, the issue may be:')
console.log('  1. Password hashing mismatch')
console.log('  2. Test users not properly created in auth.users')
console.log('  3. Supabase auth configuration issue')
console.log('  4. RLS policies blocking authentication')
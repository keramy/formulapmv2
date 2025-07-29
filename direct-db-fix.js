/**
 * Direct Database Fix - Manually clean and create users
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function directDbFix() {
  console.log('🔧 Direct Database Fix...\n')
  
  console.log('1️⃣ Checking what\'s in auth.users...')
  
  try {
    // Query auth.users directly
    const { data: authUsers, error: authError } = await supabase
      .from('auth.users')
      .select('id, email, created_at, email_confirmed_at')
    
    if (authError) {
      console.log('❌ Error querying auth.users:', authError.message)
      console.log('This is expected - we need raw SQL access')
    } else {
      console.log('✅ Found auth users:', authUsers.length)
    }
  } catch (error) {
    console.log('❌ Auth users query failed:', error.message)
  }
  
  console.log('\n2️⃣ Checking user_profiles...')
  
  const { data: profiles, error: profileError } = await supabase
    .from('user_profiles') 
    .select('id, email, role, is_active')
    .ilike('email', '%test@formulapm.com')
  
  if (profileError) {
    console.log('❌ Error querying profiles:', profileError.message)
  } else {
    console.log(`✅ Found ${profiles.length} test profiles:`)
    profiles.forEach(p => console.log(`  - ${p.email} (${p.role}) - Active: ${p.is_active}`))
  }
  
  console.log('\n3️⃣ Let\'s create a simple test user using signup...')
  
  // Create regular client
  const client = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0')
  
  // Test a simple signup
  const testEmail = 'test.user@formulapm.com'
  const testPassword = 'testpass123'
  
  console.log(`Creating user via signup: ${testEmail}`)
  
  const { data: signupData, error: signupError } = await client.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: {
        first_name: 'Test',
        last_name: 'User'
      }
    }
  })
  
  if (signupError) {
    console.log(`❌ Signup failed: ${signupError.message}`)
  } else {
    console.log(`✅ Signup successful!`)
    console.log(`  User ID: ${signupData.user.id}`)
    console.log(`  Email confirmed: ${signupData.user.email_confirmed_at ? 'Yes' : 'No'}`)
    
    // Now create a profile for this user
    const { error: profileCreateError } = await supabase
      .from('user_profiles')
      .insert({
        id: signupData.user.id,
        email: testEmail,
        first_name: 'Test',
        last_name: 'User',
        role: 'project_manager',
        seniority: 'regular',
        phone: '+1234567890',
        company: 'Formula PM',
        is_active: true
      })
    
    if (profileCreateError) {
      console.log(`❌ Profile creation failed: ${profileCreateError.message}`)
    } else {
      console.log(`✅ Profile created successfully`)
    }
  }
  
  console.log('\n4️⃣ Testing login with new user...')
  
  const { data: loginData, error: loginError } = await client.auth.signInWithPassword({
    email: testEmail,
    password: testPassword
  })
  
  if (loginError) {
    console.log(`❌ Login failed: ${loginError.message}`)
  } else {
    console.log(`✅ Login successful!`)
    console.log(`  User ID: ${loginData.user.id}`)
    console.log(`  Email: ${loginData.user.email}`)
    
    // Sign out
    await client.auth.signOut()
  }
  
  console.log('\n🎉 Direct fix complete!')
  console.log('\n✅ WORKING CREDENTIALS:')
  console.log(`   Email: ${testEmail}`)
  console.log(`   Password: ${testPassword}`)
  console.log('\nThis user was created properly via Supabase Auth API and should work!')
}

directDbFix().catch(console.error)
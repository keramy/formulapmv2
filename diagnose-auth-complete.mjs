import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

console.log('🔍 COMPLETE AUTHENTICATION DIAGNOSIS\n')
console.log('===================================\n')

// 1. Check Supabase configuration
console.log('1️⃣ CHECKING SUPABASE CONFIGURATION')
console.log(`API URL: ${supabaseUrl}`)
console.log(`Service Key: ${supabaseServiceKey.substring(0, 20)}...`)
console.log(`Anon Key: ${supabaseAnonKey.substring(0, 20)}...`)

// 2. List all auth users
console.log('\n2️⃣ CHECKING AUTH.USERS TABLE')
try {
  const { data: authUsers, error } = await supabaseAdmin.auth.admin.listUsers()
  
  if (error) {
    console.error('❌ Error listing auth users:', error.message)
  } else {
    console.log(`✅ Found ${authUsers.users.length} users in auth.users:`)
    authUsers.users.forEach(user => {
      console.log(`\n📧 Email: ${user.email}`)
      console.log(`🆔 ID: ${user.id}`)
      console.log(`✅ Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`)
      console.log(`🔐 Has Password: ${user.encrypted_password ? 'Yes' : 'No'}`)
      console.log(`📅 Created: ${new Date(user.created_at).toLocaleString()}`)
      console.log(`🏷️ App Metadata:`, user.app_metadata)
      console.log(`👤 User Metadata:`, user.user_metadata)
    })
  }
} catch (err) {
  console.error('💥 Exception:', err.message)
}

// 3. Check user_profiles table
console.log('\n3️⃣ CHECKING USER_PROFILES TABLE')
try {
  const { data: profiles, error } = await supabaseAdmin
    .from('user_profiles')
    .select('*')
    .order('email')
  
  if (error) {
    console.error('❌ Error querying profiles:', error.message)
  } else {
    console.log(`✅ Found ${profiles.length} profiles:`)
    profiles.forEach(profile => {
      console.log(`\n📧 Email: ${profile.email}`)
      console.log(`👤 Name: ${profile.first_name} ${profile.last_name}`)
      console.log(`🎭 Role: ${profile.role}`)
      console.log(`✅ Active: ${profile.is_active}`)
    })
  }
} catch (err) {
  console.error('💥 Exception:', err.message)
}

// 4. Test authentication with different methods
console.log('\n4️⃣ TESTING AUTHENTICATION METHODS')

// Test with admin user we created
const testEmail = 'admin@formulapm.com'
const testPassword = 'admin123'

console.log(`\n🧪 Testing with: ${testEmail} / ${testPassword}`)

// Method A: Direct signInWithPassword
console.log('\n📍 Method A: Direct signInWithPassword')
try {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: testEmail,
    password: testPassword
  })
  
  if (error) {
    console.error(`❌ Login failed: ${error.message}`)
    console.error(`Error code: ${error.code}`)
    console.error(`Error details:`, error)
  } else {
    console.log('✅ Login successful!')
    console.log(`User ID: ${data.user.id}`)
    console.log(`Session: ${data.session ? 'Present' : 'Missing'}`)
    await supabaseClient.auth.signOut()
  }
} catch (err) {
  console.error('💥 Exception:', err)
}

// Method B: Check if it's a case sensitivity issue
console.log('\n📍 Method B: Testing case sensitivity')
try {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: testEmail.toLowerCase(),
    password: testPassword
  })
  
  if (error) {
    console.error(`❌ Lowercase email failed: ${error.message}`)
  } else {
    console.log('✅ Lowercase email worked!')
    await supabaseClient.auth.signOut()
  }
} catch (err) {
  console.error('💥 Exception:', err)
}

// 5. Check RLS policies on auth schema
console.log('\n5️⃣ CHECKING AUTH CONFIGURATION')
try {
  // Check if auth is enabled
  const authConfig = await fetch(`${supabaseUrl}/auth/v1/health`, {
    headers: {
      'apikey': supabaseAnonKey
    }
  })
  
  if (authConfig.ok) {
    console.log('✅ Auth service is healthy')
  } else {
    console.error('❌ Auth service issue:', authConfig.status)
  }
} catch (err) {
  console.error('💥 Auth health check failed:', err.message)
}

// 6. Direct database check
console.log('\n6️⃣ DIRECT DATABASE VERIFICATION')
try {
  const { data: dbCheck, error } = await supabaseAdmin.rpc('check_auth_setup', {
    test_email: testEmail
  }).catch(() => ({ data: null, error: 'Function not found' }))
  
  if (error === 'Function not found') {
    console.log('ℹ️ Direct DB check function not available')
  } else if (error) {
    console.error('❌ DB check error:', error)
  } else {
    console.log('✅ DB check result:', dbCheck)
  }
} catch (err) {
  console.error('💥 DB check exception:', err.message)
}

// 7. Test with a fresh user
console.log('\n7️⃣ CREATING AND TESTING FRESH USER')
const freshEmail = `test-${Date.now()}@formulapm.com`
const freshPassword = 'test123'

try {
  // Create fresh user
  const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: freshEmail,
    password: freshPassword,
    email_confirm: true
  })
  
  if (createError) {
    console.error('❌ Fresh user creation failed:', createError.message)
  } else {
    console.log('✅ Fresh user created:', freshEmail)
    
    // Try to login immediately
    const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
      email: freshEmail,
      password: freshPassword
    })
    
    if (loginError) {
      console.error('❌ Fresh user login failed:', loginError.message)
    } else {
      console.log('✅ Fresh user login successful!')
      await supabaseClient.auth.signOut()
    }
    
    // Cleanup
    await supabaseAdmin.auth.admin.deleteUser(createData.user.id)
    console.log('🧹 Fresh user cleaned up')
  }
} catch (err) {
  console.error('💥 Fresh user test exception:', err.message)
}

console.log('\n📊 DIAGNOSIS SUMMARY')
console.log('===================')
console.log('\n🔍 Where credentials are stored:')
console.log('- Emails: auth.users.email column')
console.log('- Passwords: auth.users.encrypted_password (bcrypt hashed)')
console.log('- Profiles: user_profiles table (synced with auth.users)')
console.log('\n🔐 How authentication works:')
console.log('1. User enters email/password in LoginForm')
console.log('2. useAuth hook calls supabase.auth.signInWithPassword()')
console.log('3. Supabase Auth service verifies against auth.users table')
console.log('4. If successful, returns JWT token and session')
console.log('5. Profile is loaded from user_profiles table')
console.log('\n❓ Common issues:')
console.log('- Password mismatch (bcrypt hash vs plain text)')
console.log('- Email case sensitivity')
console.log('- Email not confirmed')
console.log('- Auth service configuration')
console.log('- RLS policies blocking auth operations')
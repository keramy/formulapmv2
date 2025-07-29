/**
 * Authentication Diagnostic Script
 * Helps identify why test users can't login
 */

const { createClient } = require('@supabase/supabase-js')

// Supabase configuration from your env
const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function diagnosticAuthFlow() {
  console.log('🔍 Starting Authentication Diagnostic...\n')
  
  // Test 1: Check if auth service is responding
  console.log('1️⃣ Testing Auth Service Connection...')
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      console.log('❌ Auth service error:', error.message)
    } else {
      console.log('✅ Auth service is responding')
      console.log('Current session:', session ? 'Active' : 'None')
    }
  } catch (error) {
    console.log('❌ Auth service connection failed:', error.message)
    return
  }
  
  console.log('\n2️⃣ Testing User Login Attempts...')
  
  // Test users to try
  const testUsers = [
    { email: 'pm.test@formulapm.com', password: 'testpass123' },
    { email: 'admin.test@formulapm.com', password: 'testpass123' },
    { email: 'management.test@formulapm.com', password: 'testpass123' }
  ]
  
  for (const user of testUsers) {
    console.log(`\n🧪 Testing login: ${user.email}`)
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: user.password
      })
      
      if (error) {
        console.log(`❌ Login failed: ${error.message}`)
        console.log(`   Error code: ${error.status || 'N/A'}`)
      } else if (data.user) {
        console.log(`✅ Login successful!`)
        console.log(`   User ID: ${data.user.id}`)
        console.log(`   Email: ${data.user.email}`)
        console.log(`   Email confirmed: ${data.user.email_confirmed_at ? 'Yes' : 'No'}`)
        
        // Sign out immediately
        await supabase.auth.signOut()
      } else {
        console.log(`❌ Login failed: No user data returned`)
      }
    } catch (error) {
      console.log(`❌ Login exception: ${error.message}`)
    }
  }
  
  console.log('\n3️⃣ Testing User Signup (to compare)...')
  
  // Test signup to see if that works
  const testEmail = 'debug.test@example.com'
  const testPassword = 'testpass123'
  
  try {
    console.log(`🧪 Testing signup: ${testEmail}`)
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    })
    
    if (error) {
      console.log(`❌ Signup failed: ${error.message}`)
    } else if (data.user) {
      console.log(`✅ Signup successful!`)
      console.log(`   User ID: ${data.user.id}`)
      console.log(`   Email: ${data.user.email}`)
      console.log(`   Email confirmed: ${data.user.email_confirmed_at ? 'Yes' : 'No'}`)
      console.log(`   Confirmation sent: ${data.user.confirmation_sent_at ? 'Yes' : 'No'}`)
    }
  } catch (error) {
    console.log(`❌ Signup exception: ${error.message}`)
  }
  
  console.log('\n📊 Diagnostic Complete!')
  console.log('\nNext Steps:')
  console.log('1. Check Supabase Studio (http://127.0.0.1:54323) for user list')
  console.log('2. If users exist but login fails = password hash issue')
  console.log('3. If users don\'t exist = migration issue')
  console.log('4. If signup works but migration users don\'t = format mismatch')
}

// Run diagnostic
diagnosticAuthFlow().catch(console.error)
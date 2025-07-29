import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

console.log('🧪 Quick Authentication Test...\n')

const testEmail = 'management.test@formulapm.com'
const testPassword = 'testpass123'
const testUserId = '11111111-1111-1111-1111-111111111111'

console.log('1️⃣ Creating test user via Admin API...')
try {
  const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
    user_id: testUserId,
    email: testEmail,
    password: testPassword,
    email_confirm: true,
    user_metadata: {
      first_name: 'Management',
      last_name: 'User'
    },
    app_metadata: {
      user_role: 'management'
    }
  })
  
  if (createError) {
    console.error(`❌ Create failed: ${createError.message}`)
    
    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers.users.find(u => u.email === testEmail)
    
    if (existingUser) {
      console.log(`ℹ️ User already exists: ${existingUser.email} (${existingUser.id.substring(0, 8)}...)`)
    } else {
      console.log('❌ User creation failed and user does not exist')
      process.exit(1)
    }
  } else {
    console.log(`✅ User created: ${createData.user.email} (${createData.user.id.substring(0, 8)}...)`)
  }
} catch (err) {
  console.error(`💥 Create exception: ${err.message}`)
}

console.log('\n2️⃣ Testing authentication...')
try {
  const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
    email: testEmail,
    password: testPassword
  })
  
  if (loginError) {
    console.error(`❌ Login failed: ${loginError.message}`)
    console.log('Debugging login error...')
    
    // Check if user exists
    const { data: users } = await supabaseAdmin.auth.admin.listUsers()
    const user = users.users.find(u => u.email === testEmail)
    
    if (user) {
      console.log(`✅ User exists in auth: ${user.email}`)
      console.log(`📧 Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`)
      console.log(`🔒 Password set: ${user.encrypted_password ? 'Yes' : 'No'}`)
    } else {
      console.log('❌ User not found in auth system')
    }
  } else {
    console.log('🎉 LOGIN SUCCESSFUL!')
    console.log(`📧 Email: ${loginData.user?.email}`)
    console.log(`🆔 ID: ${loginData.user?.id?.substring(0, 8)}...`)
    console.log(`🎟️ Token: ${loginData.session?.access_token ? 'Present' : 'Missing'}`)
    
    // Test API call with token
    console.log('\n3️⃣ Testing API call with token...')
    const response = await fetch(`${supabaseUrl}/rest/v1/user_profiles?select=*&email=eq.${testEmail}`, {
      headers: {
        'Authorization': `Bearer ${loginData.session.access_token}`,
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json'
      }
    })
    
    if (response.ok) {
      const profiles = await response.json()
      console.log(`✅ API call successful: Found ${profiles.length} profiles`)
      if (profiles.length > 0) {
        console.log(`👤 Profile: ${profiles[0].first_name} ${profiles[0].last_name} (${profiles[0].role})`)
      }
    } else {
      console.error(`❌ API call failed: ${response.status} ${response.statusText}`)
    }
    
    await supabaseClient.auth.signOut()
    console.log('🚪 Signed out')
  }
} catch (err) {
  console.error(`💥 Login exception: ${err.message}`)
}

console.log('\n🎯 RESULT:')
if (loginError) {
  console.log('❌ Authentication is not working')
  console.log('Next steps: Debug the specific error or recreate users')
} else {
  console.log('✅ Authentication is working!')
  console.log('The LoginForm should work with these credentials')
}
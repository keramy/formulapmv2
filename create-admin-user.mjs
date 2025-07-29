import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

console.log('🔧 Creating Admin User - Professional Method\n')

// Admin user configuration
const adminUser = {
  email: 'admin@formulapm.com',
  password: 'admin123',
  userData: {
    first_name: 'Admin',
    last_name: 'User',
    role: 'admin'
  }
}

console.log('📧 Creating Admin User...')
console.log(`Email: ${adminUser.email}`)
console.log(`Password: ${adminUser.password}`)
console.log(`Role: ${adminUser.userData.role}\n`)

try {
  // Step 1: Create user in auth system
  console.log('1️⃣ Creating user in auth system...')
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: adminUser.email,
    password: adminUser.password,
    email_confirm: true,
    user_metadata: {
      first_name: adminUser.userData.first_name,
      last_name: adminUser.userData.last_name
    },
    app_metadata: {
      user_role: adminUser.userData.role
    }
  })

  if (authError) {
    throw new Error(`Auth creation failed: ${authError.message}`)
  }

  console.log(`✅ Auth user created: ${authData.user.id}`)
  
  // Step 2: Create user profile
  console.log('2️⃣ Creating user profile...')
  const { data: profileData, error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .insert({
      id: authData.user.id,
      email: adminUser.email,
      first_name: adminUser.userData.first_name,
      last_name: adminUser.userData.last_name,
      role: adminUser.userData.role,
      seniority: 'executive',
      phone: '+1234567890',
      company: 'Formula PM',
      is_active: true
    })
    .select()

  if (profileError) {
    throw new Error(`Profile creation failed: ${profileError.message}`)
  }

  console.log(`✅ User profile created`)

  // Step 3: Test authentication
  console.log('3️⃣ Testing authentication...')
  const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
    email: adminUser.email,
    password: adminUser.password
  })

  if (loginError) {
    throw new Error(`Login test failed: ${loginError.message}`)
  }

  console.log(`✅ Authentication successful!`)
  console.log(`🎟️ JWT Token: ${loginData.session.access_token.substring(0, 20)}...`)

  // Step 4: Test API access
  console.log('4️⃣ Testing API access...')
  const { data: profileTest, error: profileTestError } = await supabaseClient
    .from('user_profiles')
    .select('*')
    .eq('id', authData.user.id)

  if (profileTestError) {
    throw new Error(`API test failed: ${profileTestError.message}`)
  }

  console.log(`✅ API access successful`)
  console.log(`👤 Profile: ${profileTest[0].first_name} ${profileTest[0].last_name} (${profileTest[0].role})`)

  // Sign out
  await supabaseClient.auth.signOut()

  console.log('\n🎉 ADMIN USER CREATED SUCCESSFULLY!')
  console.log('================================')
  console.log(`📧 Email: ${adminUser.email}`)
  console.log(`🔑 Password: ${adminUser.password}`)
  console.log(`👤 Role: ${adminUser.userData.role}`)
  console.log(`🏢 Company: Formula PM`)
  console.log(`✅ Status: Active`)
  console.log('\n💡 You can now login using the LoginForm component')

} catch (error) {
  console.error('\n❌ ERROR CREATING ADMIN USER:')
  console.error(error.message)
  
  console.log('\n🔧 TROUBLESHOOTING STEPS:')
  console.log('1. Check if Supabase is running: npx supabase status')
  console.log('2. Check if database is accessible')
  console.log('3. Verify RLS policies allow user creation')
  console.log('4. Check auth configuration')
}
const { createClient } = require('@supabase/supabase-js')

// Supabase configuration for local development
const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupTestAuth() {
  console.log('Setting up test authentication...')
  
  try {
    // Check if profile already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', 'david.admin@formulapm.com')
      .single()
    
    if (existingProfile) {
      console.log('✅ User profile already exists:', existingProfile.email)
      console.log('🎯 Test credentials:')
      console.log('   Email: david.admin@formulapm.com')
      console.log('   Password: password123')
      console.log('   Role:', existingProfile.role)
      return
    }

    console.log('Profile not found, checking authentication...')
    
    // Try to sign in with the existing credentials
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'david.admin@formulapm.com',
      password: 'password123'
    })

    if (signInData.user) {
      console.log('✅ User can authenticate')
      
      // Create the missing profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: signInData.user.id,
          email: 'david.admin@formulapm.com',
          first_name: 'David',
          last_name: 'Administrator',
          role: 'admin',
          is_active: true,
          phone: '+1-555-0101',
          company: 'Formula PM',
          department: 'Administration'
        })
        .select()

      if (profileError) {
        console.error('Error creating user profile:', profileError)
      } else {
        console.log('✅ Created user profile')
        console.log('🎯 Ready to use:')
        console.log('   Email: david.admin@formulapm.com')
        console.log('   Password: password123')
        console.log('   Role: admin')
      }
    } else {
      console.log('❌ Authentication failed:', signInError?.message)
      console.log('The user account may need to be recreated in Supabase auth.')
    }

  } catch (error) {
    console.error('Setup error:', error)
  }
}

setupTestAuth()
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://localhost:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testLogin() {
  try {
    console.log('Testing login...')
    
    // Try to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'owner.test@formulapm.com',
      password: 'testpass123'
    })
    
    if (error) {
      console.error('❌ Login error:', error)
      return
    }
    
    console.log('✅ Login successful!')
    console.log('User ID:', data.user?.id)
    console.log('Email:', data.user?.email)
    
    // Now test fetching the profile
    console.log('\nTesting profile fetch...')
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()
    
    if (profileError) {
      console.error('❌ Profile fetch error:', profileError)
    } else {
      console.log('✅ Profile fetched successfully:', profile)
    }
    
    // Test the is_management_role function indirectly by checking access to other tables
    console.log('\nTesting access to projects table (should work for users)...')
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .limit(5)
    
    if (projectsError) {
      console.log('❌ Projects fetch error (expected due to RLS):', projectsError.message)
    } else {
      console.log('✅ Projects accessible:', projects?.length || 0, 'records')
    }
    
  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

testLogin()
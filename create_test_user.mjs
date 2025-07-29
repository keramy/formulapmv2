import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://localhost:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createTestUser() {
  try {
    console.log('Creating test user...')
    
    // Sign up a test user
    const { data, error } = await supabase.auth.signUp({
      email: 'owner.test@formulapm.com',
      password: 'testpass123',
      options: {
        data: {
          first_name: 'Owner',
          last_name: 'Test',
          role: 'management'
        }
      }
    })
    
    if (error) {
      console.error('Signup error:', error)
      return
    }
    
    console.log('✅ User created successfully:', data.user?.email)
    
    // Check if profile was created
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', 'owner.test@formulapm.com')
      .single()
    
    if (profileError) {
      console.error('❌ Profile fetch error:', profileError)
    } else {
      console.log('✅ Profile created successfully:', profile)
    }
    
  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

createTestUser()
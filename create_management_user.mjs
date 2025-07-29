import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://localhost:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

// Use service role to create and update users
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function createManagementUser() {
  try {
    console.log('Creating management user...')
    
    // Create user with service role
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: 'manager.test@formulapm.com',
      password: 'testpass123',
      email_confirm: true,
      user_metadata: {
        first_name: 'Manager',
        last_name: 'Test',
        role: 'management'
      }
    })
    
    if (authError) {
      console.error('❌ Auth user creation error:', authError)
      return
    }
    
    console.log('✅ Auth user created:', authData.user?.email)
    
    // Update the profile to have management role (since the trigger defaults to 'client')
    const { error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update({ 
        role: 'management',
        first_name: 'Manager',
        last_name: 'Test'
      })
      .eq('id', authData.user.id)
    
    if (updateError) {
      console.error('❌ Profile update error:', updateError)
      return
    }
    
    console.log('✅ Profile updated to management role')
    
    // Verify the profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()
    
    if (profileError) {
      console.error('❌ Profile fetch error:', profileError)
    } else {
      console.log('✅ Management user created successfully:', profile)
    }
    
  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

createManagementUser()
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

async function createProfile() {
  console.log('Creating user profile directly...')
  
  try {
    // Get the auth user ID
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'david.admin@formulapm.com',
      password: 'password123'
    })

    if (!signInData.user) {
      console.log('❌ Authentication failed:', signInError?.message)
      return
    }

    console.log('✅ User authenticated, ID:', signInData.user.id)

    // Use raw SQL to bypass RLS and create the profile
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        INSERT INTO user_profiles (id, email, first_name, last_name, role, is_active, phone, company, department)
        VALUES ('${signInData.user.id}', 'david.admin@formulapm.com', 'David', 'Administrator', 'admin', true, '+1-555-0101', 'Formula PM', 'Administration')
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          role = EXCLUDED.role,
          is_active = EXCLUDED.is_active,
          phone = EXCLUDED.phone,
          company = EXCLUDED.company,
          department = EXCLUDED.department
        RETURNING *;
      `
    })

    if (error) {
      console.error('Error with SQL function:', error)
      
      // Try direct insert bypassing RLS with service role
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: signInData.user.id,
          email: 'david.admin@formulapm.com',
          first_name: 'David',
          last_name: 'Administrator',
          role: 'admin',
          is_active: true,
          phone: '+1-555-0101',
          company: 'Formula PM',
          department: 'Administration'
        }, {
          onConflict: 'id'
        })
        .select()

      if (profileError) {
        console.error('Error creating profile with service role:', profileError)
      } else {
        console.log('✅ Created profile with service role')
        console.log('🎯 Ready to test:')
        console.log('   Email: david.admin@formulapm.com')
        console.log('   Password: password123')
        console.log('   Role: admin')
      }
    } else {
      console.log('✅ Created profile with SQL')
      console.log('🎯 Ready to test:')
      console.log('   Email: david.admin@formulapm.com')
      console.log('   Password: password123')
      console.log('   Role: admin')
    }

  } catch (error) {
    console.error('Setup error:', error)
  }
}

createProfile()
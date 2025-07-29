import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

console.log('🔍 Checking Auth System Status...\n')

// Method 1: Try to list auth users using admin API
try {
  console.log('📧 Method 1: Admin Auth API...')
  const { data: adminUsers, error: adminError } = await supabaseAdmin.auth.admin.listUsers()
  
  if (adminError) {
    console.error('❌ Admin API error:', adminError.message)
  } else {
    console.log(`✅ Found ${adminUsers.users.length} users in auth system:`)
    adminUsers.users.forEach(user => {
      console.log(`  📧 ${user.email} - ID: ${user.id.substring(0, 8)}... - Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`)
    })
  }
} catch (err) {
  console.error('💥 Admin API exception:', err.message)
}

console.log('')

// Method 2: Check migration logs to see if users were created
console.log('📝 Method 2: Checking if test user creation was successful...')
try {
  // Run the query that the migration should have executed
  const { data: migrationCheck, error: migrationError } = await supabaseAdmin.rpc('check_test_users_created')
  
  if (migrationError && migrationError.code === '42883') {
    // Function doesn't exist, let's create a simple check
    console.log('Creating temporary function to check auth users...')
    
    const { data: createResult, error: createError } = await supabaseAdmin.rpc('sql', {
      query: `
        CREATE OR REPLACE FUNCTION check_test_users_created()
        RETURNS TABLE(email text, id uuid, confirmed boolean) AS $$
        BEGIN
          RETURN QUERY
          SELECT u.email::text, u.id, (u.email_confirmed_at IS NOT NULL) as confirmed
          FROM auth.users u 
          WHERE u.email LIKE '%test@formulapm.com'
          ORDER BY u.email;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    })
    
    if (createError) {
      console.error('❌ Could not create check function:', createError.message)
    } else {
      const { data: users, error: usersError } = await supabaseAdmin.rpc('check_test_users_created')
      if (usersError) {
        console.error('❌ Could not check users:', usersError.message)
      } else {
        console.log(`✅ Found ${users.length} test users in auth.users:`)
        users.forEach(user => {
          console.log(`  📧 ${user.email} - ID: ${user.id.substring(0, 8)}... - Confirmed: ${user.confirmed}`)
        })
      }
    }
  }
} catch (err) {
  console.error('💥 Migration check exception:', err.message)
}

console.log('')

// Method 3: Try manual user creation to test the auth system
console.log('🧪 Method 3: Testing manual user creation...')
try {
  const testEmail = 'temp.test@formulapm.com'
  
  // Try to create a test user
  const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: testEmail,
    password: 'testpass123',
    email_confirm: true
  })
  
  if (createError) {
    console.error('❌ Could not create test user:', createError.message)
  } else {
    console.log('✅ Successfully created test user:', createData.user.email)
    
    // Now try to authenticate with it
    const supabaseClient = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0')
    
    const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
      email: testEmail,
      password: 'testpass123'
    })
    
    if (loginError) {
      console.error('❌ Could not login with created user:', loginError.message)
    } else {
      console.log('✅ Successfully authenticated with created user!')
      await supabaseClient.auth.signOut()
    }
    
    // Clean up
    await supabaseAdmin.auth.admin.deleteUser(createData.user.id)
    console.log('🧹 Cleaned up test user')
  }
} catch (err) {
  console.error('💥 Manual user creation exception:', err.message)
}

console.log('\n🎯 DIAGNOSIS:')
console.log('If Method 1 shows 0 users, the test users were not created in auth.users')
console.log('If Method 3 works but Method 1 shows no test users, the migration failed')
console.log('If nothing works, there might be a Supabase auth system issue')
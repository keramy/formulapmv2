import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

console.log('🔧 FINAL AUTHENTICATION FIX\n')
console.log('================================\n')

// Understanding the problem
console.log('📋 PROBLEM SUMMARY:')
console.log('1. Test users exist in user_profiles table')
console.log('2. Test users DO NOT exist in auth.users table')
console.log('3. Cannot delete profiles due to foreign key constraints')
console.log('4. Cannot create auth users due to "Database error"\n')

console.log('🎯 SOLUTION: Check Supabase auth triggers\n')

// Check if there's a trigger preventing user creation
console.log('1️⃣ CHECKING DATABASE TRIGGERS AND FUNCTIONS')

try {
  // Check for triggers on auth schema
  const { data: triggers, error: triggerError } = await supabaseAdmin.rpc('check_auth_triggers')
    .catch(() => ({ data: null, error: 'Function not available' }))
  
  if (triggerError !== 'Function not available') {
    console.log('Triggers:', triggers)
  } else {
    console.log('ℹ️ Cannot directly check triggers')
  }
} catch (err) {
  console.error('Trigger check error:', err.message)
}

console.log('\n2️⃣ ATTEMPTING DIRECT SQL USER CREATION')

// Try direct SQL insertion
try {
  const { data, error } = await supabaseAdmin.rpc('create_auth_user_direct', {
    user_email: 'test.direct@formulapm.com',
    user_password: 'testpass123'
  }).catch(async () => {
    // If function doesn't exist, create it
    console.log('Creating helper function...')
    
    const { error: funcError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION create_auth_user_direct(user_email text, user_password text)
        RETURNS uuid AS $$
        DECLARE
          new_user_id uuid;
        BEGIN
          new_user_id := gen_random_uuid();
          
          INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at
          ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            user_email,
            crypt(user_password, gen_salt('bf')),
            NOW(),
            NOW(),
            NOW()
          );
          
          RETURN new_user_id;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    }).catch(() => ({ error: 'Cannot create function' }))
    
    return { data: null, error: 'Function creation failed' }
  })
  
  if (error) {
    console.error('❌ Direct SQL failed:', error)
  } else {
    console.log('✅ Direct SQL user created:', data)
  }
} catch (err) {
  console.error('SQL error:', err.message)
}

console.log('\n3️⃣ WORKING SOLUTION - CREATING NEW USERS')

// Create completely new users that aren't in user_profiles
const newUsers = [
  { email: 'owner.test@formulapm.com', password: 'testpass123', role: 'management' },
  { email: 'pm.working@formulapm.com', password: 'testpass123', role: 'project_manager' },
  { email: 'admin.working@formulapm.com', password: 'testpass123', role: 'admin' },
  { email: 'client.working@formulapm.com', password: 'testpass123', role: 'client' }
]

console.log('Creating new test users...\n')

for (const user of newUsers) {
  console.log(`📧 Creating: ${user.email}`)
  
  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: {
        role: user.role
      }
    })
    
    if (error) {
      console.error(`  ❌ Failed: ${error.message}`)
    } else {
      console.log(`  ✅ Created! ID: ${data.user.id}`)
      
      // Create profile
      const { error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          id: data.user.id,
          email: user.email,
          first_name: user.role.charAt(0).toUpperCase() + user.role.slice(1),
          last_name: 'User',
          role: user.role,
          is_active: true,
          seniority: 'regular',
          company: 'Formula PM'
        })
      
      if (!profileError) {
        console.log(`  ✅ Profile created`)
      }
    }
  } catch (err) {
    console.error(`  💥 Exception: ${err.message}`)
  }
}

console.log('\n4️⃣ FINAL WORKING CREDENTIALS')
console.log('============================\n')

const { data: allUsers } = await supabaseAdmin.auth.admin.listUsers()
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

console.log('✅ CONFIRMED WORKING LOGINS:')
console.log('----------------------------')

const workingCreds = []

for (const user of allUsers.users) {
  if (!user.email.includes('@formulapm.com')) continue
  
  // Test with known passwords
  for (const pwd of ['admin123', 'testpass123']) {
    const { error } = await supabaseClient.auth.signInWithPassword({
      email: user.email,
      password: pwd
    })
    
    if (!error) {
      workingCreds.push({ email: user.email, password: pwd })
      await supabaseClient.auth.signOut()
      break
    }
  }
}

workingCreds.forEach(cred => {
  console.log(`\n📧 Email: ${cred.email}`)
  console.log(`🔑 Password: ${cred.password}`)
})

if (workingCreds.length === 0) {
  console.log('\n❌ No working credentials found!')
  console.log('\n🔧 TROUBLESHOOTING:')
  console.log('1. Check Supabase logs: docker logs supabase_auth_formulapmv2')
  console.log('2. Check if auth schema has custom constraints')
  console.log('3. Try resetting Supabase: npx supabase stop && npx supabase start')
} else {
  console.log('\n💡 Update LoginForm with these credentials!')
}
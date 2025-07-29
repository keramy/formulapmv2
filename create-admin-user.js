/**
 * Create Working Admin User - admin@formulapm.com
 * Full admin privileges for UI testing
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const client = createClient(supabaseUrl, supabaseAnonKey)
const admin = createClient(supabaseUrl, supabaseServiceKey)

async function createAdminUser() {
  console.log('🔥 Creating FULL ADMIN USER: admin@formulapm.com\n')
  
  const adminEmail = 'admin@formulapm.com'
  const adminPassword = 'testpass123'
  
  try {
    // Create via signup (the proven working method)
    console.log(`Creating admin user: ${adminEmail}`)
    
    const { data: signupData, error: signupError } = await client.auth.signUp({
      email: adminEmail,
      password: adminPassword,
      options: {
        data: {
          first_name: 'System',
          last_name: 'Administrator'
        }
      }
    })
    
    if (signupError) {
      console.log(`❌ Signup failed: ${signupError.message}`)
      
      // If user already exists, that's okay - they might be from the migration
      if (signupError.message.includes('already registered')) {
        console.log('✅ User already exists - this is expected')
        
        // Try to get the existing user and update their profile
        const { data: users } = await admin.auth.admin.listUsers()
        const existingUser = users.users.find(u => u.email === adminEmail)
        
        if (existingUser) {
          console.log(`✅ Found existing user: ${existingUser.id}`)
          
          // Update/create their profile with admin privileges
          const { error: profileError } = await admin
            .from('user_profiles')
            .upsert({
              id: existingUser.id,
              email: adminEmail,
              first_name: 'System',
              last_name: 'Administrator',
              role: 'admin',
              seniority: 'executive',
              phone: '+1234567890',
              company: 'Formula PM',
              is_active: true,
              permissions: {
                // Full admin permissions
                'users.read': true,
                'users.write': true,
                'users.delete': true,
                'projects.read': true,
                'projects.write': true,
                'projects.delete': true,
                'scope.read': true,
                'scope.write': true,
                'scope.delete': true,
                'purchase.read': true,
                'purchase.write': true,
                'purchase.delete': true,
                'financial.read': true,
                'financial.write': true,
                'reports.read': true,
                'reports.write': true,
                'system.admin': true,
                'client_portal.manage': true
              }
            })
          
          if (profileError) {
            console.log(`❌ Profile update failed: ${profileError.message}`)
          } else {
            console.log(`✅ Admin profile updated with FULL PERMISSIONS`)
          }
        }
      }
    } else {
      console.log(`✅ User created: ${signupData.user.id}`)
      
      // Create admin profile with full permissions
      const { error: profileError } = await admin
        .from('user_profiles')
        .insert({
          id: signupData.user.id,
          email: adminEmail,
          first_name: 'System',
          last_name: 'Administrator',
          role: 'admin',
          seniority: 'executive',
          phone: '+1234567890',
          company: 'Formula PM',
          is_active: true,
          permissions: {
            // Full admin permissions
            'users.read': true,
            'users.write': true,
            'users.delete': true,
            'projects.read': true,
            'projects.write': true,
            'projects.delete': true,
            'scope.read': true,
            'scope.write': true,
            'scope.delete': true,
            'purchase.read': true,
            'purchase.write': true,
            'purchase.delete': true,
            'financial.read': true,
            'financial.write': true,
            'reports.read': true,
            'reports.write': true,
            'system.admin': true,
            'client_portal.manage': true
          }
        })
      
      if (profileError) {
        console.log(`❌ Profile creation failed: ${profileError.message}`)
      } else {
        console.log(`✅ Admin profile created with FULL PERMISSIONS`)
      }
    }
    
    // Test login
    console.log('\n🧪 Testing admin login...')
    
    const { data: loginData, error: loginError } = await client.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword
    })
    
    if (loginError) {
      console.log(`❌ Login test failed: ${loginError.message}`)
      console.log('⚠️  You may need to use one of the other working admin accounts')
    } else {
      console.log(`✅ LOGIN TEST SUCCESSFUL!`)
      console.log(`   User ID: ${loginData.user.id}`)
      console.log(`   Email confirmed: ${loginData.user.email_confirmed_at ? 'Yes' : 'No'}`)
      
      // Sign out
      await client.auth.signOut()
    }
    
  } catch (error) {
    console.log(`❌ Exception: ${error.message}`)
  }
  
  console.log('\n🎉 ADMIN USER SETUP COMPLETE!\n')
  console.log('🔥 YOUR FULL ADMIN CREDENTIALS:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Email: admin@formulapm.com')
  console.log('Password: testpass123')
  console.log('Role: FULL SYSTEM ADMINISTRATOR')
  console.log('Permissions: ALL GRANTED ✅')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('\n🚀 READY TO ACCESS FULL UI!')
  console.log('   1. Logout from current session')
  console.log('   2. Login with admin@formulapm.com')
  console.log('   3. Access all features and admin panels')
  console.log('\n✨ You now have FULL SYSTEM ACCESS!')
}

createAdminUser().catch(console.error)
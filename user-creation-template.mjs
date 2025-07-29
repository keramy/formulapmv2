import { createClient } from '@supabase/supabase-js'

// Configuration
const supabaseUrl = 'http://127.0.0.1:54321'  // Local development
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Create a new user with profile
 * @param {Object} userData - User data
 * @param {string} userData.email - User email
 * @param {string} userData.password - User password
 * @param {string} userData.firstName - First name
 * @param {string} userData.lastName - Last name
 * @param {string} userData.role - User role (admin, management, project_manager, etc.)
 * @param {string} userData.seniority - Seniority level (executive, senior, regular)
 * @param {string} userData.company - Company name
 * @param {string} userData.phone - Phone number
 */
async function createUser(userData) {
  try {
    console.log(`🔧 Creating user: ${userData.email}`)

    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        first_name: userData.firstName,
        last_name: userData.lastName
      },
      app_metadata: {
        user_role: userData.role
      }
    })

    if (authError) throw new Error(`Auth creation failed: ${authError.message}`)

    // Step 2: Create user profile
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email: userData.email,
        first_name: userData.firstName,
        last_name: userData.lastName,
        role: userData.role,
        seniority: userData.seniority || 'regular',
        phone: userData.phone || '',
        company: userData.company || 'Formula PM',
        is_active: true
      })

    if (profileError) throw new Error(`Profile creation failed: ${profileError.message}`)

    console.log(`✅ User created successfully: ${userData.email}`)
    return authData.user

  } catch (error) {
    console.error(`❌ Error creating user ${userData.email}:`, error.message)
    throw error
  }
}

// Example: Create different types of users
async function createAllTestUsers() {
  const users = [
    {
      email: 'admin@formulapm.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      seniority: 'executive',
      phone: '+1234567890'
    },
    {
      email: 'manager@formulapm.com',
      password: 'manager123',
      firstName: 'Management',
      lastName: 'User',
      role: 'management',
      seniority: 'executive',
      phone: '+1234567891'
    },
    {
      email: 'pm@formulapm.com',
      password: 'pm123',
      firstName: 'Project',
      lastName: 'Manager',
      role: 'project_manager',
      seniority: 'senior',
      phone: '+1234567892'
    },
    {
      email: 'client@formulapm.com',
      password: 'client123',
      firstName: 'Client',
      lastName: 'User',
      role: 'client',
      seniority: 'regular',
      phone: '+1234567893'
    }
  ]

  console.log('🚀 Creating all test users...\n')
  
  for (const userData of users) {
    await createUser(userData)
  }

  console.log('\n🎉 All users created successfully!')
  console.log('\n📝 Login Credentials:')
  users.forEach(user => {
    console.log(`${user.role}: ${user.email} / ${user.password}`)
  })
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  await createAllTestUsers()
}
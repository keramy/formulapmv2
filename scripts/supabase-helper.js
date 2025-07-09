#!/usr/bin/env node

/**
 * Supabase Helper Script
 * Manages users and profiles in Supabase cloud database
 */

const { createClient } = require('@supabase/supabase-js')

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function listUsers() {
  console.log('📋 Listing all users...')
  
  // Get auth users
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
  if (authError) {
    console.error('Error fetching auth users:', authError)
    return
  }
  
  // Get profiles
  const { data: profiles, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
  
  if (profileError) {
    console.error('Error fetching profiles:', profileError)
    return
  }
  
  console.log('\n🔐 Auth Users:')
  authUsers.users.forEach(user => {
    console.log(`  - ${user.email} (${user.id})`)
  })
  
  console.log('\n👤 User Profiles:')
  profiles.forEach(profile => {
    console.log(`  - ${profile.email} (${profile.role}) - ${profile.first_name} ${profile.last_name}`)
  })
}

async function createUserProfile(userId, profileData) {
  console.log(`👤 Creating profile for user ${userId}...`)
  
  const { data, error } = await supabase
    .from('user_profiles')
    .insert({
      id: userId,
      ...profileData
    })
  
  if (error) {
    console.error('Error creating profile:', error)
    return false
  }
  
  console.log('✅ Profile created successfully!')
  return true
}

async function fixMissingProfiles() {
  console.log('🔧 Fixing missing profiles...')
  
  // Get all auth users
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
  if (authError) {
    console.error('Error fetching auth users:', authError)
    return
  }
  
  // Get existing profiles
  const { data: profiles, error: profileError } = await supabase
    .from('user_profiles')
    .select('id')
  
  if (profileError) {
    console.error('Error fetching profiles:', profileError)
    return
  }
  
  const existingProfileIds = profiles.map(p => p.id)
  
  // Find users without profiles
  const usersWithoutProfiles = authUsers.users.filter(user => 
    !existingProfileIds.includes(user.id)
  )
  
  console.log(`Found ${usersWithoutProfiles.length} users without profiles`)
  
  for (const user of usersWithoutProfiles) {
    const metadata = user.user_metadata || {}
    const profileData = {
      role: metadata.role || 'admin',
      first_name: metadata.first_name || 'User',
      last_name: metadata.last_name || 'Name',
      email: user.email,
      company: 'Formula PM',
      department: 'Administration',
      permissions: {},
      is_active: true
    }
    
    await createUserProfile(user.id, profileData)
  }
}

async function createTestUser(email, password, role, firstName, lastName) {
  console.log(`👤 Creating test user: ${email}...`)
  
  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: firstName,
      last_name: lastName,
      role
    }
  })
  
  if (authError) {
    console.error('Error creating auth user:', authError)
    return false
  }
  
  // Create profile
  const profileData = {
    role,
    first_name: firstName,
    last_name: lastName,
    email,
    company: 'Formula PM',
    department: role === 'admin' ? 'Administration' : 'Operations',
    permissions: {},
    is_active: true
  }
  
  const success = await createUserProfile(authData.user.id, profileData)
  if (success) {
    console.log(`✅ Test user created: ${email}`)
  }
  
  return success
}

async function main() {
  const command = process.argv[2]
  
  switch (command) {
    case 'list':
      await listUsers()
      break
      
    case 'fix':
      await fixMissingProfiles()
      break
      
    case 'create-admin':
      await createTestUser('admin@formulapm.com', 'password123', 'admin', 'Admin', 'User')
      break
      
    case 'create-pm':
      await createTestUser('pm@formulapm.com', 'password123', 'project_manager', 'Project', 'Manager')
      break
      
    case 'create-client':
      await createTestUser('client@formulapm.com', 'password123', 'client', 'Test', 'Client')
      break
      
    case 'create-all':
      await createTestUser('admin@formulapm.com', 'password123', 'admin', 'Admin', 'User')
      await createTestUser('pm@formulapm.com', 'password123', 'project_manager', 'Project', 'Manager')
      await createTestUser('client@formulapm.com', 'password123', 'client', 'Test', 'Client')
      break
      
    default:
      console.log(`
🚀 Supabase Helper Script

Usage:
  node scripts/supabase-helper.js <command>

Commands:
  list         - List all users and profiles
  fix          - Fix missing profiles for existing users
  create-admin - Create admin test user
  create-pm    - Create project manager test user
  create-client - Create client test user
  create-all   - Create all test users
      `)
  }
}

main().catch(console.error)
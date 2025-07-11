#!/usr/bin/env tsx

/**
 * Seed Test Users to Cloud Supabase
 * Creates test users in the cloud/production Supabase instance
 */

import { createClient } from '@supabase/supabase-js'
import { TEST_USERS } from '../src/__tests__/utils/real-supabase-utils'

// Cloud Supabase credentials
const CLOUD_SUPABASE_URL = 'https://xrrrtwrfadcilwkgwacs.supabase.co'
const CLOUD_SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhycnJ0d3JmYWRjaWx3a2d3YWNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjA2NDM1MSwiZXhwIjoyMDY3NjQwMzUxfQ.FHwH6p5CzouCCmNbihgBSEXyq9jW2C_INnj22TDZsVc'

async function seedCloudUsers() {
  console.log('☁️  Starting cloud Supabase user seeding...')
  console.log('🌐 Target: ', CLOUD_SUPABASE_URL)
  
  const supabase = createClient(CLOUD_SUPABASE_URL, CLOUD_SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
  
  try {
    // Get current users to avoid duplicates
    const { data: existingUsers } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    })
    
    const existingEmails = new Set(existingUsers?.users.map(u => u.email) || [])
    
    console.log('📋 Current users in cloud database:', Array.from(existingEmails))
    
    // Seed each test user
    for (const [userKey, userData] of Object.entries(TEST_USERS)) {
      if (existingEmails.has(userData.email)) {
        console.log(`⏭️  User ${userData.email} already exists, skipping...`)
        continue
      }
      
      try {
        console.log(`👤 Creating user: ${userData.email} (${userData.role})`)
        
        // Create auth user
        const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true
        })
        
        if (authError) {
          throw authError
        }
        
        // Create user profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: newUser.user!.id,
            role: userData.role as any,
            first_name: userData.first_name,
            last_name: userData.last_name,
            email: userData.email,
            is_active: true
          })
        
        if (profileError) {
          throw profileError
        }
        
        console.log(`✅ Successfully created: ${userData.email}`)
      } catch (error) {
        console.error(`❌ Failed to create ${userData.email}:`, error)
      }
    }
    
    // Verify final state
    const { data: finalUsers } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    })
    
    console.log('\n🎉 Cloud seeding complete!')
    console.log('📊 Final user count:', finalUsers?.users.length || 0)
    console.log('📧 Final users:')
    finalUsers?.users.forEach(user => {
      console.log(`   - ${user.email}`)
    })
    
  } catch (error) {
    console.error('💥 Cloud seeding failed:', error)
    process.exit(1)
  }
}

// Confirmation prompt
console.log('⚠️  WARNING: This will create users in your CLOUD Supabase instance!')
console.log('🌐 Target URL:', CLOUD_SUPABASE_URL)
console.log('\nPress Ctrl+C to cancel, or wait 5 seconds to continue...')

setTimeout(() => {
  seedCloudUsers()
    .then(() => {
      console.log('\n✨ Cloud users seeding completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Script failed:', error)
      process.exit(1)
    })
}, 5000)
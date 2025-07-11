#!/usr/bin/env tsx

/**
 * Seed Test Users Script
 * Creates all test users defined in real-supabase-utils.ts
 */

import { createTestSupabaseClient, TEST_USERS, seedTestUser } from '../src/__tests__/utils/real-supabase-utils'

async function seedAllTestUsers() {
  console.log('🌱 Starting test users seeding...')
  
  const supabase = createTestSupabaseClient()
  
  try {
    // Get current users to avoid duplicates
    const { data: existingUsers } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    })
    
    const existingEmails = new Set(existingUsers?.users.map(u => u.email) || [])
    
    console.log('📋 Current users in database:', Array.from(existingEmails))
    
    // Seed each test user
    for (const [userKey, userData] of Object.entries(TEST_USERS)) {
      if (existingEmails.has(userData.email)) {
        console.log(`⏭️  User ${userData.email} already exists, skipping...`)
        continue
      }
      
      try {
        console.log(`👤 Creating user: ${userData.email} (${userData.role})`)
        await seedTestUser(supabase, userKey as keyof typeof TEST_USERS)
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
    
    console.log('\n🎉 Seeding complete!')
    console.log('📊 Final user count:', finalUsers?.users.length || 0)
    console.log('📧 Final users:')
    finalUsers?.users.forEach(user => {
      console.log(`   - ${user.email}`)
    })
    
  } catch (error) {
    console.error('💥 Seeding failed:', error)
    process.exit(1)
  }
}

// Run the script
seedAllTestUsers()
  .then(() => {
    console.log('\n✨ Test users seeding completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })
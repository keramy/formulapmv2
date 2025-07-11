#!/usr/bin/env tsx

/**
 * Test Authentication Script
 * Verifies that test users can authenticate successfully
 */

import { createTestSupabaseClient, TEST_USERS } from '../src/__tests__/utils/real-supabase-utils'

async function testAuthentication() {
  console.log('🔐 Testing authentication...')
  
  const supabase = createTestSupabaseClient()
  
  // Test PM user login
  const testUser = TEST_USERS.project_manager
  console.log(`👤 Testing login for: ${testUser.email}`)
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password
    })
    
    if (error) {
      console.error('❌ Authentication failed:', error.message)
      return false
    }
    
    if (data.user) {
      console.log('✅ Authentication successful!')
      console.log(`📧 User email: ${data.user.email}`)
      console.log(`🆔 User ID: ${data.user.id}`)
      
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()
      
      if (profile) {
        console.log(`👥 User role: ${profile.role}`)
        console.log(`👤 User name: ${profile.first_name} ${profile.last_name}`)
      }
      
      // Sign out
      await supabase.auth.signOut()
      console.log('🚪 Signed out successfully')
      
      return true
    }
    
  } catch (error) {
    console.error('💥 Authentication test failed:', error)
    return false
  }
  
  return false
}

// Run the test
testAuthentication()
  .then((success) => {
    if (success) {
      console.log('\n✨ Authentication test completed successfully!')
      process.exit(0)
    } else {
      console.log('\n❌ Authentication test failed!')
      process.exit(1)
    }
  })
  .catch((error) => {
    console.error('💥 Test script failed:', error)
    process.exit(1)
  })
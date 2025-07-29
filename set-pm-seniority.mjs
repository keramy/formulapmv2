#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with local development settings
const supabaseUrl = 'http://localhost:54321'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function setPMSeniority(email, seniority) {
  if (!['executive', 'senior', 'regular'].includes(seniority)) {
    console.error('❌ Invalid seniority level. Must be: executive, senior, or regular')
    return
  }

  try {
    console.log(`🔍 Looking for PM user: ${email}`)
    
    // Get the current user profile
    const { data: user, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', email)
      .eq('role', 'project_manager')
      .single()

    if (fetchError || !user) {
      console.error('❌ PM user not found or error:', fetchError?.message)
      return
    }

    console.log(`📋 Current user:`, {
      name: `${user.first_name} ${user.last_name}`,
      role: user.role,
      currentPermissions: user.permissions
    })

    // Update permissions to include seniority
    const updatedPermissions = {
      ...user.permissions,
      seniority: seniority
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .update({ 
        permissions: updatedPermissions,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()

    if (error) {
      console.error('❌ Update failed:', error.message)
      return
    }

    console.log(`✅ Successfully set seniority to "${seniority}" for ${email}`)
    console.log(`🎯 Shop drawing approval access: ${seniority === 'senior' || seniority === 'executive' ? 'YES' : 'NO'}`)
    
    if (data && data[0]) {
      console.log(`📊 Updated permissions:`, data[0].permissions)
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

// Get command line arguments
const args = process.argv.slice(2)

if (args.length !== 2) {
  console.log(`
🔧 Set PM Seniority Level

Usage: node set-pm-seniority.mjs <email> <seniority>

Parameters:
  email      - Email of the PM user  
  seniority  - One of: executive, senior, regular

Examples:
  node set-pm-seniority.mjs pm@formulapm.com executive
  node set-pm-seniority.mjs pm@formulapm.com senior  
  node set-pm-seniority.mjs pm@formulapm.com regular

Seniority Levels:
  🎯 executive - Can approve all shop drawings (highest PM level)
  🎯 senior    - Can approve shop drawings  
  🎯 regular   - Cannot approve shop drawings (standard PM)
`)
  process.exit(1)
}

const [email, seniority] = args

console.log(`🚀 Setting seniority "${seniority}" for PM: ${email}`)
await setPMSeniority(email, seniority)
#!/usr/bin/env node
/**
 * User Data Backup Utility
 * Backs up custom users before database operations
 * Usage: node scripts/backup-users.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'fs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

console.log('🔄 Backing up user data...\n')

async function backupUsers() {
  try {
    // 1. Backup auth.users
    console.log('📥 Backing up auth.users...')
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      throw new Error(`Failed to fetch auth users: ${authError.message}`)
    }

    // 2. Backup user_profiles
    console.log('📥 Backing up user_profiles...')
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
    
    if (profilesError) {
      throw new Error(`Failed to fetch user profiles: ${profilesError.message}`)
    }

    // 3. Create backup object
    const backup = {
      timestamp: new Date().toISOString(),
      supabaseUrl,
      authUsers: authUsers.users,
      userProfiles: profiles
    }

    // 4. Save to file
    const filename = `user-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    writeFileSync(filename, JSON.stringify(backup, null, 2))

    console.log('✅ Backup completed successfully!')
    console.log(`📁 Backup saved to: ${filename}`)
    console.log(`👥 Auth users backed up: ${authUsers.users.length}`)
    console.log(`👤 User profiles backed up: ${profiles.length}`)
    
    // 5. List backed up users
    console.log('\n📋 Backed up users:')
    authUsers.users.forEach(user => {
      console.log(`  📧 ${user.email} (ID: ${user.id.substring(0, 8)}...)`)
    })

    return filename

  } catch (error) {
    console.error('❌ Backup failed:', error.message)
    process.exit(1)
  }
}

// Run backup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  await backupUsers()
}

export { backupUsers }
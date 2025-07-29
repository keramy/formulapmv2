#!/usr/bin/env node
/**
 * User Data Restore Utility
 * Restores users from backup after database operations
 * Usage: node scripts/restore-users.mjs [backup-file.json]
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

console.log('🔄 Restoring user data...\n')

async function restoreUsers(backupFile) {
  try {
    // 1. Load backup file
    console.log(`📂 Loading backup from: ${backupFile}`)
    const backupData = JSON.parse(readFileSync(backupFile, 'utf8'))
    
    console.log(`📅 Backup timestamp: ${backupData.timestamp}`)
    console.log(`👥 Auth users to restore: ${backupData.authUsers.length}`)
    console.log(`👤 User profiles to restore: ${backupData.userProfiles.length}`)

    // 2. Restore auth users (custom users only)
    console.log('\n🔐 Restoring auth users...')
    const customUsers = backupData.authUsers.filter(user => 
      !user.email.includes('@premiumbuild.com') && 
      !user.email.includes('@formulapm.com') &&
      !user.email.includes('test@')
    )

    for (const user of customUsers) {
      console.log(`  👤 Restoring ${user.email}...`)
      
      try {
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          user_id: user.id,
          email: user.email,
          password: 'restore-temp-password', // User needs to reset password
          email_confirm: user.email_confirmed_at ? true : false,
          user_metadata: user.user_metadata || {},
          app_metadata: user.app_metadata || {}
        })
        
        if (error && !error.message.includes('already exists')) {
          console.error(`    ❌ Failed: ${error.message}`)
        } else {
          console.log(`    ✅ Success`)
        }
      } catch (err) {
        console.error(`    💥 Exception: ${err.message}`)
      }
    }

    // 3. Restore user profiles (custom users only)
    console.log('\n👤 Restoring user profiles...')
    const customProfiles = backupData.userProfiles.filter(profile => 
      !profile.email.includes('@premiumbuild.com') && 
      !profile.email.includes('@formulapm.com') &&
      !profile.email.includes('test@')
    )

    for (const profile of customProfiles) {
      console.log(`  📋 Restoring profile for ${profile.email}...`)
      
      try {
        const { error } = await supabaseAdmin
          .from('user_profiles')
          .upsert({
            id: profile.id,
            email: profile.email,
            first_name: profile.first_name,
            last_name: profile.last_name,
            role: profile.role,
            seniority: profile.seniority,
            phone: profile.phone,
            company: profile.company,
            permissions: profile.permissions,
            is_active: profile.is_active,
            created_at: profile.created_at,
            updated_at: new Date().toISOString()
          })
        
        if (error) {
          console.error(`    ❌ Failed: ${error.message}`)
        } else {
          console.log(`    ✅ Success`)
        }
      } catch (err) {
        console.error(`    💥 Exception: ${err.message}`)
      }
    }

    console.log('\n✅ Restore completed successfully!')
    console.log('⚠️  Note: Restored users will need to reset their passwords')
    console.log(`🔐 Auth users restored: ${customUsers.length}`)
    console.log(`👤 User profiles restored: ${customProfiles.length}`)

    // 4. List restored users
    if (customUsers.length > 0) {
      console.log('\n📋 Restored users:')
      customUsers.forEach(user => {
        console.log(`  📧 ${user.email} (ID: ${user.id.substring(0, 8)}...)`)
      })
    }

  } catch (error) {
    console.error('❌ Restore failed:', error.message)
    process.exit(1)
  }
}

// Run restore if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const backupFile = process.argv[2]
  
  if (!backupFile) {
    console.error('❌ Usage: node scripts/restore-users.mjs [backup-file.json]')
    process.exit(1)
  }
  
  await restoreUsers(resolve(backupFile))
}

export { restoreUsers }
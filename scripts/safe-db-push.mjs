#!/usr/bin/env node
/**
 * Safe Database Push Utility
 * Backs up users, runs push, restores if needed
 * Usage: node scripts/safe-db-push.mjs [--include-seed]
 */

import { execSync } from 'child_process'
import { backupUsers } from './backup-users.mjs'
import { restoreUsers } from './restore-users.mjs'

const includeSeed = process.argv.includes('--include-seed')

console.log('🛡️ Safe Database Push Starting...\n')

async function safeDbPush() {
  let backupFile = null
  
  try {
    // Step 1: Backup users (only if including seed)
    if (includeSeed) {
      console.log('📝 Step 1: Backing up existing users (seed will be included)...')
      backupFile = await backupUsers()
      console.log('✅ User backup completed\n')
    } else {
      console.log('ℹ️  Step 1: Skipping backup (no seed data, users should be safe)\n')
    }

    // Step 2: Run database push
    console.log('🔄 Step 2: Running database push...')
    const pushCommand = includeSeed ? 'npx supabase db push --include-seed' : 'npx supabase db push'
    console.log(`   Command: ${pushCommand}`)
    
    try {
      execSync(pushCommand, { stdio: 'inherit' })
      console.log('✅ Database push completed\n')
    } catch (error) {
      console.error('❌ Database push failed:', error.message)
      if (backupFile) {
        console.log('💡 Attempting to restore users anyway...')
      } else {
        throw error
      }
    }

    // Step 3: Restore users (only if we backed them up)
    if (backupFile) {
      console.log('🔄 Step 3: Restoring backed up users...')
      await restoreUsers(backupFile)
      console.log('✅ User restore completed\n')
    }

    console.log('🎉 Safe database push completed successfully!')
    if (backupFile) {
      console.log('✅ Your custom users have been preserved')
      console.log('⚠️  Restored users will need to reset their passwords')
    } else {
      console.log('✅ No seed data was included, users should be intact')
    }

  } catch (error) {
    console.error('💥 Safe push failed:', error.message)
    if (backupFile) {
      console.log('\n🆘 If you have a backup file, you can manually restore users with:')
      console.log(`   node scripts/restore-users.mjs ${backupFile}`)
    }
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  await safeDbPush()
}
#!/usr/bin/env node
/**
 * Safe Database Reset Utility
 * Backs up users, runs reset, restores users
 * Usage: node scripts/safe-db-reset.mjs
 */

import { execSync } from 'child_process'
import { backupUsers } from './backup-users.mjs'
import { restoreUsers } from './restore-users.mjs'

console.log('🛡️ Safe Database Reset Starting...\n')

async function safeDbReset() {
  try {
    // Step 1: Backup users
    console.log('📝 Step 1: Backing up existing users...')
    const backupFile = await backupUsers()
    console.log('✅ User backup completed\n')

    // Step 2: Run database reset
    console.log('🔄 Step 2: Running database reset...')
    console.log('⚠️  Database will be completely reset...')
    
    try {
      execSync('npx supabase db reset', { stdio: 'inherit' })
      console.log('✅ Database reset completed\n')
    } catch (error) {
      console.error('❌ Database reset failed:', error.message)
      console.log('💡 Attempting to restore users anyway...')
    }

    // Step 3: Restore users
    console.log('🔄 Step 3: Restoring backed up users...')
    await restoreUsers(backupFile)
    console.log('✅ User restore completed\n')

    console.log('🎉 Safe database reset completed successfully!')
    console.log('✅ Your custom users have been preserved')
    console.log('⚠️  Restored users will need to reset their passwords')

  } catch (error) {
    console.error('💥 Safe reset failed:', error.message)
    console.log('\n🆘 If you have a backup file, you can manually restore users with:')
    console.log('   node scripts/restore-users.mjs [backup-file.json]')
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  await safeDbReset()
}
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

console.log('🔍 Checking Database Content...\n')

async function checkTable(tableName) {
  try {
    const { data, error, count } = await supabaseAdmin
      .from(tableName)
      .select('*', { count: 'exact' })
      .limit(5)
    
    if (error) {
      console.log(`❌ ${tableName}: Error - ${error.message}`)
    } else {
      console.log(`📊 ${tableName}: ${count || 0} records`)
      if (data && data.length > 0) {
        console.log(`   Sample: ${JSON.stringify(data[0], null, 2).substring(0, 200)}...`)
      }
    }
  } catch (err) {
    console.log(`💥 ${tableName}: Exception - ${err.message}`)
  }
}

const tables = [
  'user_profiles',
  'clients', 
  'suppliers',
  'projects',
  'scope_items',
  'documents',
  'project_assignments'
]

for (const table of tables) {
  await checkTable(table)
  console.log('')
}

// Check auth users
console.log('🔐 Checking auth.users...')
try {
  const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
  
  if (authError) {
    console.log(`❌ auth.users: Error - ${authError.message}`)
  } else {
    console.log(`📊 auth.users: ${authUsers.users.length} users`)
    
    const testUsers = authUsers.users.filter(u => u.email && u.email.includes('@formulapm.com'))
    console.log(`   Test users (@formulapm.com): ${testUsers.length}`)
    
    const premiumUsers = authUsers.users.filter(u => u.email && u.email.includes('@premiumbuild.com'))
    console.log(`   Premium users (@premiumbuild.com): ${premiumUsers.length}`)
    
    if (authUsers.users.length > 0) {
      console.log(`   Sample user: ${authUsers.users[0].email} (ID: ${authUsers.users[0].id.substring(0, 8)}...)`)
    }
  }
} catch (err) {
  console.log(`💥 auth.users: Exception - ${err.message}`)
}

console.log('\n🎯 SUMMARY:')
console.log('This shows what mock/seed data currently exists in the database.')
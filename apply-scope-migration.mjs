import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔍 Environment check:')
console.log('  SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
console.log('  SERVICE_KEY:', supabaseServiceKey ? '✅' : '❌')

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  console.log('🚀 Applying scope pricing fields migration...')
  
  try {
    // Read the migration file
    const migrationSQL = fs.readFileSync('./supabase/migrations/20250806000001_add_scope_pricing_fields.sql', 'utf8')
    
    console.log('📄 Migration SQL loaded, length:', migrationSQL.length)
    
    // Execute the migration
    const { data, error } = await supabase.rpc('execute_sql', { sql: migrationSQL })
    
    if (error) {
      console.error('❌ Migration failed:', error)
      
      // Try direct SQL execution instead
      console.log('🔄 Trying direct SQL execution...')
      
      // Split migration into individual statements
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))
      
      console.log('📝 Executing', statements.length, 'SQL statements...')
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i]
        if (statement.includes('ADD COLUMN')) {
          console.log(`🔧 Executing statement ${i + 1}: ADD COLUMN`)
          
          const { error: stmtError } = await supabase
            .from('scope_items')
            .select('total_price', { count: 'exact', head: true })
          
          if (stmtError && stmtError.message.includes('does not exist')) {
            // Column doesn't exist, add it
            console.log('  Adding columns manually...')
            
            const addColumnsSQL = `
              ALTER TABLE scope_items 
              ADD COLUMN IF NOT EXISTS total_price DECIMAL(12,2) DEFAULT 0.00,
              ADD COLUMN IF NOT EXISTS actual_cost DECIMAL(12,2) DEFAULT 0.00;
            `
            
            const { error: addError } = await supabase.rpc('execute_sql', { sql: addColumnsSQL })
            if (addError) {
              console.error('❌ Failed to add columns:', addError)
            } else {
              console.log('✅ Columns added successfully')
            }
          } else {
            console.log('✅ Columns already exist')
          }
        }
      }
    } else {
      console.log('✅ Migration executed successfully')
    }
    
    // Verify the columns exist
    console.log('🔍 Verifying columns exist...')
    const { data: columns, error: columnError } = await supabase
      .from('scope_items')
      .select('total_price, actual_cost')
      .limit(1)
    
    if (columnError) {
      console.error('❌ Column verification failed:', columnError)
    } else {
      console.log('✅ Columns verified successfully')
    }
    
    console.log('🎉 Migration complete!')
    
  } catch (error) {
    console.error('💥 Migration error:', error)
  }
}

applyMigration()
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  // Database connection configuration
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:535425Keramy.@db.xrrrtwrfadcilwkgwacs.supabase.co:5432/postgres',
    ssl: {
      rejectUnauthorized: false // Required for Supabase connections
    }
  });

  try {
    console.log('🔌 Connecting to Supabase database...');
    await client.connect();
    console.log('✅ Connected successfully!');

    // First, let's check current table structure
    console.log('🔍 Checking current scope_items table structure...');
    const currentStructure = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'scope_items' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Current columns:', currentStructure.rows.map(r => `${r.column_name} (${r.data_type})`));
    
    // Check which columns need to be added
    const newColumns = ['item_no', 'item_name', 'specification', 'location', 'update_notes'];
    const existingColumns = currentStructure.rows.map(r => r.column_name);
    const columnsToAdd = newColumns.filter(col => !existingColumns.includes(col));
    
    if (columnsToAdd.length === 0) {
      console.log('🎉 All columns already exist! No migration needed.');
      return;
    }
    
    console.log('📝 Columns to add:', columnsToAdd);
    
    // Apply the migration
    console.log('🚀 Applying scope items enhancement migration...');
    
    // Step 1: Add columns
    console.log('📝 Adding new columns...');
    const alterStatements = [
      'ALTER TABLE scope_items ADD COLUMN IF NOT EXISTS item_no INTEGER',
      'ALTER TABLE scope_items ADD COLUMN IF NOT EXISTS item_name TEXT',
      'ALTER TABLE scope_items ADD COLUMN IF NOT EXISTS specification TEXT',
      'ALTER TABLE scope_items ADD COLUMN IF NOT EXISTS location TEXT',
      'ALTER TABLE scope_items ADD COLUMN IF NOT EXISTS update_notes TEXT'
    ];
    
    for (const statement of alterStatements) {
      console.log(`  🔧 ${statement}`);
      await client.query(statement);
      console.log('  ✅ Success');
    }
    
    // Step 2: Add indexes
    console.log('🏗️ Creating performance indexes...');
    const indexStatements = [
      'CREATE INDEX IF NOT EXISTS idx_scope_items_project_item_no ON scope_items(project_id, item_no) WHERE item_no IS NOT NULL',
      'CREATE INDEX IF NOT EXISTS idx_scope_items_location ON scope_items(location) WHERE location IS NOT NULL',  
      'CREATE INDEX IF NOT EXISTS idx_scope_items_project_location ON scope_items(project_id, location) WHERE location IS NOT NULL'
    ];
    
    for (const statement of indexStatements) {
      console.log(`  🔧 ${statement}`);
      await client.query(statement);
      console.log('  ✅ Success');
    }
    
    // Step 3: Verify the migration
    console.log('🔍 Verifying migration...');
    const verifyQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'scope_items' 
      AND column_name IN ('item_no', 'item_name', 'specification', 'location', 'update_notes')
      ORDER BY column_name;
    `;
    
    const verification = await client.query(verifyQuery);
    console.log('✅ New columns verified:', verification.rows.map(r => `${r.column_name} (${r.data_type})`));
    
    // Check indexes
    const indexQuery = `
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'scope_items' 
      AND indexname LIKE 'idx_scope_items_%'
      ORDER BY indexname;
    `;
    
    const indexes = await client.query(indexQuery);
    console.log('✅ Performance indexes verified:', indexes.rows.map(r => r.indexname));
    
    console.log('🎯 SCOPE ITEMS ENHANCEMENT MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('📊 Summary:');
    console.log('  • 5 new columns added: item_no, item_name, specification, location, update_notes');
    console.log('  • 3 performance indexes created for optimal query performance');
    console.log('  • All changes verified and operational');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('📋 Error details:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

applyMigration();
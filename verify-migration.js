const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function verifyMigration() {
  try {
    console.log('🔍 Verifying scope items table structure...');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Test if new columns exist by trying to select them
    const newColumns = ['item_no', 'item_name', 'specification', 'location', 'update_notes'];
    const results = {};
    
    for (const column of newColumns) {
      try {
        const { error } = await supabase
          .from('scope_items')
          .select(column)
          .limit(1);
        
        if (error && error.code === '42703') {
          results[column] = '❌ Missing';
        } else {
          results[column] = '✅ Exists';
        }
      } catch (e) {
        results[column] = '❓ Error checking';
      }
    }
    
    console.log('📊 Column Status:');
    Object.entries(results).forEach(([col, status]) => {
      console.log(`  ${col}: ${status}`);
    });
    
    const existingCount = Object.values(results).filter(status => status === '✅ Exists').length;
    const missingCount = Object.values(results).filter(status => status === '❌ Missing').length;
    
    if (existingCount === 5) {
      console.log('🎉 ALL COLUMNS EXIST! Migration has been successfully applied.');
      return { success: true, status: 'complete' };
    } else if (existingCount > 0) {
      console.log(`⚠️ PARTIAL MIGRATION: ${existingCount}/5 columns exist, ${missingCount} missing.`);
      return { success: false, status: 'partial', existing: existingCount, missing: missingCount };
    } else {
      console.log('❌ NO NEW COLUMNS FOUND. Migration needs to be applied.');
      return { success: false, status: 'needed', existing: 0, missing: 5 };
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    return { success: false, error: error.message };
  }
}

verifyMigration().then(result => {
  console.log('📋 Final Status:', JSON.stringify(result, null, 2));
});
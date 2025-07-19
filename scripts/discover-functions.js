#!/usr/bin/env node

/**
 * Discover Existing Functions
 * 
 * This script discovers which functions actually exist in the database
 * and creates a corrected migration file.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load environment variables manually
function loadEnvFile(filePath) {
  try {
    const envContent = fs.readFileSync(filePath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        }
      }
    });
    
    return envVars;
  } catch (error) {
    console.error(`❌ Could not load ${filePath}:`, error.message);
    return {};
  }
}

// Load environment variables from .env.local
const envVars = loadEnvFile('.env.local');
const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Functions from the Performance Advisor report
const expectedFunctions = [
  'update_activity_summary',
  'calculate_tender_submission_item_total',
  'generate_po_number',
  'generate_invoice_number',
  'generate_payment_number',
  'generate_tender_number',
  'update_project_actual_cost',
  'generate_drawing_number',
  'notify_drawing_comment',
  'generate_purchase_request_number',
  'generate_purchase_order_number',
  'update_vendor_performance_rating',
  'track_client_document_access',
  'validate_client_access',
  'log_client_activity',
  'create_client_notification',
  'update_thread_last_message',
  'auto_close_inactive_threads',
  'validate_approval_workflow',
  'update_purchase_request_status',
  'is_user_active_from_auth',
  'get_user_role_from_auth',
  'is_management_role',
  'has_cost_tracking_access',
  'is_client_with_project_access',
  'has_project_access',
  'safe_has_project_access_for_profiles',
  'can_view_user_profile',
  'has_purchase_department_access',
  'can_create_purchase_requests',
  'can_approve_purchase_requests',
  'can_confirm_deliveries',
  'generate_scope_item_no',
  'update_milestone_timestamps',
  'populate_jwt_claims',
  'update_existing_jwt_claims',
  'update_updated_at_column',
  'update_suppliers_updated_at',
  'update_material_specs_updated_at',
  'update_scope_material_links_updated_at',
  'handle_material_approval',
  'track_index_usage',
  'log_activity',
  'ensure_updated_at_trigger',
  'broadcast_project_update',
  'broadcast_task_update',
  'broadcast_scope_update',
  'migrate_user_role',
  'assign_subcontractor_to_scope',
  'update_subcontractor_assignment_timestamp'
];

async function discoverFunctions() {
  console.log('🔍 Discovering existing functions in database...\n');

  try {
    // Get all functions in public schema
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          p.proname as function_name,
          pg_get_function_identity_arguments(p.oid) as arguments,
          CASE 
            WHEN p.proconfig IS NULL THEN 'No search_path set'
            WHEN 'search_path=' = ANY(p.proconfig) THEN 'Empty search_path (SECURE)'
            ELSE 'Custom search_path: ' || array_to_string(p.proconfig, ', ')
          END as search_path_status
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        ORDER BY p.proname;
      `
    });

    if (error) {
      console.error('❌ Query failed:', error);
      return false;
    }

    console.log('📊 All Functions in Database:');
    console.log('=' .repeat(100));
    
    const existingFunctions = [];
    const missingFunctions = [];
    const insecureFunctions = [];

    if (data && data.length > 0) {
      data.forEach(func => {
        const isExpected = expectedFunctions.includes(func.function_name);
        const isSecure = func.search_path_status.includes('Empty search_path (SECURE)');
        
        if (isExpected) {
          existingFunctions.push(func.function_name);
          if (!isSecure) {
            insecureFunctions.push(func.function_name);
          }
        }
        
        const status = isExpected ? (isSecure ? '✅' : '⚠️') : '📝';
        console.log(`${status} ${func.function_name.padEnd(45)} | ${func.search_path_status}`);
      });
    }

    // Find missing functions
    expectedFunctions.forEach(funcName => {
      if (!existingFunctions.includes(funcName)) {
        missingFunctions.push(funcName);
      }
    });

    console.log('=' .repeat(100));
    console.log(`📈 Summary:`);
    console.log(`   Total functions in database: ${data ? data.length : 0}`);
    console.log(`   Expected functions found: ${existingFunctions.length}/${expectedFunctions.length}`);
    console.log(`   Functions needing security fix: ${insecureFunctions.length}`);
    console.log(`   Missing functions: ${missingFunctions.length}`);

    if (missingFunctions.length > 0) {
      console.log('\n❌ Missing Functions:');
      missingFunctions.forEach(func => console.log(`   - ${func}`));
    }

    if (insecureFunctions.length > 0) {
      console.log('\n⚠️  Functions Needing Security Fix:');
      insecureFunctions.forEach(func => console.log(`   - ${func}`));
      
      // Generate corrected migration
      await generateCorrectedMigration(insecureFunctions);
    } else {
      console.log('\n🎉 All existing functions are already secure!');
    }

    return true;

  } catch (error) {
    console.error('❌ Discovery error:', error.message);
    return false;
  }
}

async function generateCorrectedMigration(insecureFunctions) {
  console.log('\n📝 Generating corrected migration...');

  const migrationSQL = `-- Corrected Function Search Path Security Fix
-- This migration only includes functions that actually exist in the database

${insecureFunctions.map(funcName => 
  `ALTER FUNCTION public.${funcName}() SECURITY DEFINER SET search_path = '';`
).join('\n')}

-- Verification query
SELECT 
  p.proname as function_name,
  CASE 
    WHEN p.proconfig IS NULL THEN '❌ No search_path set'
    WHEN 'search_path=' = ANY(p.proconfig) THEN '✅ Secure (empty search_path)'
    ELSE '⚠️ Custom search_path: ' || array_to_string(p.proconfig, ', ')
  END as security_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN (${insecureFunctions.map(f => `'${f}'`).join(', ')})
ORDER BY p.proname;`;

  // Write corrected migration
  fs.writeFileSync('CORRECTED_FUNCTION_SECURITY_FIX.sql', migrationSQL);
  console.log('✅ Created: CORRECTED_FUNCTION_SECURITY_FIX.sql');
  
  // Update the main migration file
  fs.writeFileSync('supabase/migrations/20250718000008_fix_function_search_path_security.sql', migrationSQL);
  console.log('✅ Updated: supabase/migrations/20250718000008_fix_function_search_path_security.sql');
}

async function main() {
  console.log('🔍 Function Discovery Tool\n');
  
  const success = await discoverFunctions();
  
  if (!success) {
    process.exit(1);
  }
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

main().catch(console.error);
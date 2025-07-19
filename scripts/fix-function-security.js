#!/usr/bin/env node

/**
 * Fix Function Search Path Security Issues
 * 
 * This script applies the migration to fix all database function security warnings
 * by setting search_path to empty string for all functions.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

async function applySecurityMigration() {
  console.log('🔧 Starting Function Security Fix Migration...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250718000008_fix_function_search_path_security.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Applying security migration...');
    
    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      return false;
    }

    console.log('✅ Security migration applied successfully!\n');
    return true;

  } catch (error) {
    console.error('❌ Error applying migration:', error.message);
    return false;
  }
}

async function validateSecurityFix() {
  console.log('🔍 Validating function security fixes...\n');

  try {
    // Query to check functions with mutable search_path
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          p.proname as function_name,
          p.prosecdef as security_definer,
          CASE 
            WHEN p.proconfig IS NULL THEN 'No search_path set'
            WHEN 'search_path=' = ANY(p.proconfig) THEN 'Empty search_path (SECURE)'
            ELSE 'Custom search_path: ' || array_to_string(p.proconfig, ', ')
          END as search_path_status
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname IN (
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
        )
        ORDER BY p.proname;
      `
    });

    if (error) {
      console.error('❌ Validation query failed:', error);
      return false;
    }

    console.log('📊 Function Security Status:');
    console.log('=' .repeat(80));
    
    let secureCount = 0;
    let totalCount = 0;

    if (data && data.length > 0) {
      data.forEach(func => {
        totalCount++;
        const isSecure = func.search_path_status.includes('Empty search_path (SECURE)');
        if (isSecure) secureCount++;
        
        const status = isSecure ? '✅' : '⚠️';
        console.log(`${status} ${func.function_name.padEnd(40)} | ${func.search_path_status}`);
      });
    }

    console.log('=' .repeat(80));
    console.log(`📈 Security Summary: ${secureCount}/${totalCount} functions secured`);
    
    if (secureCount === totalCount) {
      console.log('🎉 All functions are now secure with empty search_path!');
      return true;
    } else {
      console.log(`⚠️  ${totalCount - secureCount} functions still need security fixes`);
      return false;
    }

  } catch (error) {
    console.error('❌ Validation error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🔐 Database Function Security Fix\n');
  
  // Apply the migration
  const migrationSuccess = await applySecurityMigration();
  if (!migrationSuccess) {
    process.exit(1);
  }

  // Wait a moment for changes to propagate
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Validate the fix
  const validationSuccess = await validateSecurityFix();
  
  if (validationSuccess) {
    console.log('\n🎯 Function security fix completed successfully!');
    console.log('📋 Next steps:');
    console.log('   1. Re-run Supabase Performance Advisor to confirm warnings are cleared');
    console.log('   2. Test application functionality to ensure functions work correctly');
    console.log('   3. Consider running security audit to verify no other issues remain');
  } else {
    console.log('\n❌ Some functions may still have security issues');
    console.log('📋 Recommended actions:');
    console.log('   1. Review the validation output above');
    console.log('   2. Check for any functions that were missed');
    console.log('   3. Manually fix any remaining issues');
    process.exit(1);
  }
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

main().catch(console.error);
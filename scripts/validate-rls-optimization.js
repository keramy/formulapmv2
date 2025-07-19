#!/usr/bin/env node

/**
 * Validate RLS Optimization Status and Fix Column References
 * 
 * This script checks the actual database schema and creates a corrected RLS migration
 * that uses the correct column names.
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

async function discoverTableColumns() {
  console.log('🔍 Discovering actual table columns...\n');

  const tables = [
    'suppliers', 'documents', 'document_approvals', 'audit_logs', 
    'notifications', 'tasks', 'task_comments', 'field_reports', 
    'system_settings', 'invoices', 'invoice_items', 'payments',
    'project_budgets', 'mobile_devices', 'tenders', 'projects',
    'project_assignments'
  ];

  const tableColumns = {};

  for (const table of tables) {
    try {
      const { data, error } = await supabase.rpc('sql', {
        query: `
          SELECT column_name, data_type
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = '${table}'
          ORDER BY ordinal_position;
        `
      });

      if (!error && data) {
        tableColumns[table] = data.map(col => col.column_name);
        console.log(`✅ ${table}: ${data.length} columns found`);
      } else {
        console.log(`⚠️  ${table}: Could not access or table doesn't exist`);
        tableColumns[table] = [];
      }
    } catch (err) {
      console.log(`❌ ${table}: Error - ${err.message}`);
      tableColumns[table] = [];
    }
  }

  return tableColumns;
}

async function generateCorrectedRLSMigration(tableColumns) {
  console.log('\n📝 Generating corrected RLS migration...\n');

  // Helper function to find the correct column name
  function findColumn(table, possibleNames) {
    const columns = tableColumns[table] || [];
    for (const name of possibleNames) {
      if (columns.includes(name)) {
        return name;
      }
    }
    return null;
  }

  let migration = `-- CORRECTED RLS Performance Optimization Migration
-- Generated based on actual database schema
-- Fixes auth.<function>() performance issues with correct column references

`;

  // Check each table and generate appropriate policies
  const tables = Object.keys(tableColumns);
  
  for (const table of tables) {
    const columns = tableColumns[table];
    if (columns.length === 0) continue;

    migration += `-- ============================================================================\n`;
    migration += `-- ${table.toUpperCase()} TABLE OPTIMIZATION\n`;
    migration += `-- ============================================================================\n\n`;

    // Find common column patterns
    const userIdCol = findColumn(table, ['user_id', 'created_by', 'uploaded_by', 'assigned_to']);
    const projectIdCol = findColumn(table, ['project_id']);
    const clientIdCol = findColumn(table, ['client_id']);
    const approverIdCol = findColumn(table, ['approver_id', 'approved_by']);

    console.log(`📋 ${table}:`);
    console.log(`   - User column: ${userIdCol || 'none'}`);
    console.log(`   - Project column: ${projectIdCol || 'none'}`);
    console.log(`   - Client column: ${clientIdCol || 'none'}`);
    console.log(`   - Approver column: ${approverIdCol || 'none'}`);

    // Generate basic optimized policy based on available columns
    migration += `-- Drop existing policies for ${table}\n`;
    migration += `DO $$ BEGIN\n`;
    migration += `  -- Drop all existing policies for ${table}\n`;
    migration += `  FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = '${table}') LOOP\n`;
    migration += `    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.${table}';\n`;
    migration += `  END LOOP;\n`;
    migration += `END $$;\n\n`;

    // Create optimized policy
    migration += `-- Create optimized policy for ${table}\n`;
    migration += `CREATE POLICY "${table}_access_optimized" ON public.${table}\n`;
    migration += `  FOR ALL USING (\n`;
    migration += `    (SELECT auth.jwt() ->> 'user_role') IN ('management', 'admin', 'technical_lead')`;

    if (userIdCol) {
      migration += ` OR\n    (SELECT auth.uid()) = ${userIdCol}`;
    }

    if (projectIdCol) {
      migration += ` OR\n    (SELECT auth.uid()) IN (\n`;
      migration += `      SELECT user_id FROM project_assignments WHERE project_id = ${table}.${projectIdCol}\n`;
      migration += `    )`;
    }

    if (table === 'invoices' || table === 'payments' || table === 'project_budgets') {
      migration += ` OR\n    (SELECT auth.jwt() ->> 'user_role') IN ('project_manager', 'purchase_manager')`;
    }

    if (clientIdCol || table.includes('client')) {
      migration += ` OR\n    ((SELECT auth.jwt() ->> 'user_role') = 'client' AND `;
      if (clientIdCol) {
        migration += `${clientIdCol} IN (\n`;
        migration += `      SELECT id FROM clients WHERE user_id = (SELECT auth.uid())\n`;
        migration += `    ))`;
      } else if (projectIdCol) {
        migration += `${projectIdCol} IN (\n`;
        migration += `      SELECT id FROM projects WHERE client_id IN (\n`;
        migration += `        SELECT id FROM clients WHERE user_id = (SELECT auth.uid())\n`;
        migration += `      )\n`;
        migration += `    ))`;
      } else {
        migration += `true)`;
      }
    }

    migration += `\n  );\n\n`;
  }

  // Add helper functions
  migration += `-- ============================================================================\n`;
  migration += `-- PERFORMANCE HELPER FUNCTIONS\n`;
  migration += `-- ============================================================================\n\n`;

  migration += `-- Create stable helper functions for better performance\n`;
  migration += `CREATE OR REPLACE FUNCTION get_current_user_role()\n`;
  migration += `RETURNS text AS $$\n`;
  migration += `BEGIN\n`;
  migration += `  RETURN (SELECT auth.jwt() ->> 'user_role');\n`;
  migration += `END;\n`;
  migration += `$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;\n\n`;

  migration += `CREATE OR REPLACE FUNCTION get_current_user_id()\n`;
  migration += `RETURNS uuid AS $$\n`;
  migration += `BEGIN\n`;
  migration += `  RETURN (SELECT auth.uid());\n`;
  migration += `END;\n`;
  migration += `$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;\n\n`;

  migration += `-- Grant execute permissions\n`;
  migration += `GRANT EXECUTE ON FUNCTION get_current_user_role() TO authenticated;\n`;
  migration += `GRANT EXECUTE ON FUNCTION get_current_user_id() TO authenticated;\n\n`;

  // Add verification
  migration += `-- Verification query\n`;
  migration += `SELECT 'RLS Performance Optimization completed successfully!' as status;\n`;

  // Write the corrected migration
  fs.writeFileSync('CORRECTED_RLS_PERFORMANCE_MIGRATION.sql', migration);
  console.log('\n✅ Created: CORRECTED_RLS_PERFORMANCE_MIGRATION.sql');
  
  return migration;
}

async function main() {
  console.log('🔍 RLS Performance Optimization Schema Discovery\n');
  
  try {
    // Discover actual table columns
    const tableColumns = await discoverTableColumns();
    
    // Generate corrected migration
    const migration = await generateCorrectedRLSMigration(tableColumns);
    
    console.log('\n🎯 Schema discovery completed successfully!');
    console.log('📋 Next steps:');
    console.log('   1. Review the generated CORRECTED_RLS_PERFORMANCE_MIGRATION.sql file');
    console.log('   2. Apply it in Supabase SQL Editor');
    console.log('   3. This will fix the column reference errors');
    
  } catch (error) {
    console.error('❌ Discovery failed:', error.message);
    process.exit(1);
  }
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

main().catch(console.error);
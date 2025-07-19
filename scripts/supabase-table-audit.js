#!/usr/bin/env node

/**
 * Supabase Table Audit Script
 * Comprehensive analysis of all tables in Supabase database
 * Formula PM 2.0 - Database Schema Audit
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables manually
function loadEnvVars() {
  try {
    const envPath = path.join(__dirname, '..', '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && !key.startsWith('#') && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    });
    
    return envVars;
  } catch (error) {
    console.log('⚠️  Could not load .env.local file');
    return {};
  }
}

const envVars = loadEnvVars();

// Configuration
const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

// Expected core tables for Formula PM 2.0
const EXPECTED_CORE_TABLES = [
  // Core business tables
  'user_profiles',
  'clients',
  'suppliers',
  'projects',
  'project_assignments',
  'scope_items',
  'scope_dependencies',
  'documents',
  'document_approvals',
  
  // New role system tables
  'subcontractors',
  'subcontractor_assignments',
  'approval_requests',
  
  // Purchase system
  'vendors',
  'purchase_requests',
  'purchase_orders',
  'vendor_ratings',
  'purchase_approval_workflows',
  'delivery_confirmations',
  
  // Task management
  'tasks',
  'task_comments',
  'milestones',
  'material_specifications',
  
  // System tables
  'audit_logs',
  'notifications',
  'system_settings',
  'migration_log'
];

// System/Infrastructure tables (expected)
const EXPECTED_SYSTEM_TABLES = [
  // Supabase auth schema
  'auth.users',
  'auth.sessions',
  'auth.refresh_tokens',
  'auth.audit_log_entries',
  'auth.identities',
  'auth.instances',
  'auth.schema_migrations',
  'auth.mfa_factors',
  'auth.mfa_challenges',
  'auth.mfa_amr_claims',
  'auth.sso_providers',
  'auth.sso_domains',
  'auth.saml_providers',
  'auth.saml_relay_states',
  'auth.flow_state',
  'auth.one_time_tokens',
  
  // Supabase storage schema
  'storage.buckets',
  'storage.objects',
  'storage.migrations',
  
  // Supabase realtime schema
  'realtime.subscription',
  'realtime.schema_migrations',
  
  // PostgreSQL system tables
  'information_schema.*',
  'pg_catalog.*'
];

let supabase;
const auditResults = {
  summary: {
    totalTables: 0,
    coreTables: 0,
    systemTables: 0,
    unexpectedTables: 0,
    missingTables: 0,
    timestamp: new Date()
  },
  tables: [],
  coreTableStatus: {},
  unexpectedTables: [],
  missingTables: [],
  schemaAnalysis: {},
  recommendations: []
};

// Initialize Supabase client
try {
  if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
    process.exit(1);
  }
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  console.log('✅ Supabase client initialized');
} catch (error) {
  console.error('❌ Failed to initialize Supabase client:', error.message);
  process.exit(1);
}

// Get all tables from database
async function getAllTables() {
  console.log('\n🔍 Discovering all tables in database...');
  
  try {
    // Query information_schema to get all tables
    const { data, error } = await supabase.rpc('get_all_tables');
    
    if (error) {
      console.log('⚠️  RPC function not available, trying direct query...');
      
      // Fallback: try to query some known tables to understand structure
      const knownTables = ['user_profiles', 'projects', 'scope_items', 'tasks'];
      const discoveredTables = [];
      
      for (const tableName of knownTables) {
        try {
          const { error: tableError } = await supabase.from(tableName).select('*').limit(1);
          if (!tableError) {
            discoveredTables.push({
              table_name: tableName,
              table_schema: 'public',
              table_type: 'BASE TABLE'
            });
            console.log(`✅ Found table: ${tableName}`);
          }
        } catch (e) {
          console.log(`❌ Table not accessible: ${tableName}`);
        }
      }
      
      return discoveredTables;
    }
    
    return data || [];
  } catch (error) {
    console.error('❌ Error discovering tables:', error.message);
    return [];
  }
}

// Analyze table structure
async function analyzeTableStructure(tableName) {
  try {
    // Get basic info about the table
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact' })
      .limit(1);
    
    if (error) {
      return {
        accessible: false,
        error: error.message,
        rowCount: 0
      };
    }
    
    return {
      accessible: true,
      rowCount: count || 0,
      hasData: (count || 0) > 0,
      sampleColumns: data && data.length > 0 ? Object.keys(data[0]) : []
    };
  } catch (error) {
    return {
      accessible: false,
      error: error.message,
      rowCount: 0
    };
  }
}

// Check core business tables
async function checkCoreBusinessTables() {
  console.log('\n🔍 Checking core business tables...');
  
  for (const tableName of EXPECTED_CORE_TABLES) {
    console.log(`Checking ${tableName}...`);
    
    const analysis = await analyzeTableStructure(tableName);
    
    auditResults.coreTableStatus[tableName] = {
      exists: analysis.accessible,
      rowCount: analysis.rowCount,
      hasData: analysis.hasData,
      columns: analysis.sampleColumns || [],
      error: analysis.error
    };
    
    if (analysis.accessible) {
      console.log(`  ✅ ${tableName} - ${analysis.rowCount} rows`);
      auditResults.summary.coreTables++;
    } else {
      console.log(`  ❌ ${tableName} - ${analysis.error}`);
      auditResults.missingTables.push(tableName);
    }
  }
}

// Analyze unexpected tables
async function analyzeUnexpectedTables(allTables) {
  console.log('\n🔍 Analyzing unexpected tables...');
  
  const publicTables = allTables.filter(t => 
    t.table_schema === 'public' && 
    !EXPECTED_CORE_TABLES.includes(t.table_name)
  );
  
  console.log(`Found ${publicTables.length} unexpected public tables:`);
  
  for (const table of publicTables) {
    console.log(`  📋 ${table.table_name}`);
    
    const analysis = await analyzeTableStructure(table.table_name);
    
    auditResults.unexpectedTables.push({
      name: table.table_name,
      schema: table.table_schema,
      type: table.table_type,
      rowCount: analysis.rowCount,
      hasData: analysis.hasData,
      columns: analysis.sampleColumns || [],
      accessible: analysis.accessible
    });
  }
}

// Check for migration artifacts
async function checkMigrationArtifacts() {
  console.log('\n🔍 Checking for migration artifacts...');
  
  const migrationPatterns = [
    '_old',
    '_backup',
    '_temp',
    '_migration',
    '_archive',
    'backup_',
    'temp_',
    'old_'
  ];
  
  const migrationTables = auditResults.unexpectedTables.filter(table =>
    migrationPatterns.some(pattern => table.name.includes(pattern))
  );
  
  if (migrationTables.length > 0) {
    console.log(`⚠️  Found ${migrationTables.length} potential migration artifacts:`);
    migrationTables.forEach(table => {
      console.log(`  📦 ${table.name} (${table.rowCount} rows)`);
    });
    
    auditResults.recommendations.push(
      `Consider cleaning up ${migrationTables.length} migration artifact tables`
    );
  }
}

// Check for duplicate or similar tables
async function checkDuplicateTables() {
  console.log('\n🔍 Checking for duplicate or similar tables...');
  
  const tableNames = auditResults.unexpectedTables.map(t => t.name);
  const similarities = [];
  
  for (let i = 0; i < tableNames.length; i++) {
    for (let j = i + 1; j < tableNames.length; j++) {
      const name1 = tableNames[i];
      const name2 = tableNames[j];
      
      // Check for similar names (simple similarity check)
      if (name1.includes(name2) || name2.includes(name1)) {
        similarities.push([name1, name2]);
      }
    }
  }
  
  if (similarities.length > 0) {
    console.log(`⚠️  Found ${similarities.length} potential duplicate table pairs:`);
    similarities.forEach(([name1, name2]) => {
      console.log(`  🔄 ${name1} ↔ ${name2}`);
    });
    
    auditResults.recommendations.push(
      `Review ${similarities.length} pairs of potentially duplicate tables`
    );
  }
}

// Generate comprehensive report
function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📋 SUPABASE DATABASE AUDIT REPORT');
  console.log('='.repeat(80));
  
  console.log('\n📊 SUMMARY:');
  console.log(`Total Tables Discovered: ${auditResults.summary.totalTables}`);
  console.log(`Core Business Tables: ${auditResults.summary.coreTables}/${EXPECTED_CORE_TABLES.length}`);
  console.log(`Unexpected Tables: ${auditResults.unexpectedTables.length}`);
  console.log(`Missing Tables: ${auditResults.missingTables.length}`);
  
  if (auditResults.missingTables.length > 0) {
    console.log('\n❌ MISSING CORE TABLES:');
    auditResults.missingTables.forEach(table => {
      console.log(`  - ${table}`);
    });
  }
  
  if (auditResults.unexpectedTables.length > 0) {
    console.log('\n📋 UNEXPECTED TABLES:');
    auditResults.unexpectedTables
      .sort((a, b) => b.rowCount - a.rowCount)
      .forEach(table => {
        const dataStatus = table.hasData ? `${table.rowCount} rows` : 'empty';
        console.log(`  - ${table.name} (${dataStatus})`);
      });
  }
  
  console.log('\n✅ CORE TABLE STATUS:');
  Object.entries(auditResults.coreTableStatus).forEach(([name, status]) => {
    const icon = status.exists ? '✅' : '❌';
    const info = status.exists ? `${status.rowCount} rows` : status.error;
    console.log(`  ${icon} ${name} - ${info}`);
  });
  
  if (auditResults.recommendations.length > 0) {
    console.log('\n💡 RECOMMENDATIONS:');
    auditResults.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
  }
  
  // Save detailed report
  const reportPath = path.join(__dirname, '..', 'SUPABASE_TABLE_AUDIT_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(auditResults, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  
  return auditResults;
}

// Create helper RPC function for getting all tables
async function createHelperFunction() {
  console.log('📝 Creating helper function for table discovery...');
  
  const helperSQL = `
    CREATE OR REPLACE FUNCTION get_all_tables()
    RETURNS TABLE(
      table_name text,
      table_schema text,
      table_type text,
      row_count bigint
    ) AS $
    BEGIN
      RETURN QUERY
      SELECT 
        t.table_name::text,
        t.table_schema::text,
        t.table_type::text,
        COALESCE(
          (SELECT c.reltuples::bigint 
           FROM pg_class c 
           JOIN pg_namespace n ON c.relnamespace = n.oid 
           WHERE n.nspname = t.table_schema 
           AND c.relname = t.table_name), 
          0
        ) as row_count
      FROM information_schema.tables t
      WHERE t.table_schema IN ('public', 'auth', 'storage')
      ORDER BY t.table_schema, t.table_name;
    END;
    $ LANGUAGE plpgsql SECURITY DEFINER;
  `;
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql: helperSQL });
    if (error) {
      console.log('⚠️  Could not create helper function:', error.message);
    } else {
      console.log('✅ Helper function created');
    }
  } catch (error) {
    console.log('⚠️  Helper function creation failed:', error.message);
  }
}

// Main audit function
async function runTableAudit() {
  console.log('🚀 Starting Supabase Table Audit...');
  console.log(`📅 ${new Date().toISOString()}`);
  console.log(`🔗 Database: ${SUPABASE_URL}\n`);
  
  // Create helper function
  await createHelperFunction();
  
  // Discover all tables
  const allTables = await getAllTables();
  auditResults.summary.totalTables = allTables.length;
  auditResults.tables = allTables;
  
  console.log(`\n📊 Discovered ${allTables.length} total tables`);
  
  // Check core business tables
  await checkCoreBusinessTables();
  
  // Analyze unexpected tables
  if (allTables.length > 0) {
    await analyzeUnexpectedTables(allTables);
  }
  
  // Check for migration artifacts
  await checkMigrationArtifacts();
  
  // Check for duplicates
  await checkDuplicateTables();
  
  // Generate final report
  const results = generateReport();
  
  // Determine if action is needed
  const needsAttention = 
    results.missingTables.length > 0 || 
    results.unexpectedTables.length > 20 ||
    results.recommendations.length > 0;
  
  if (needsAttention) {
    console.log('\n⚠️  Database audit found issues that may need attention.');
    process.exit(1);
  } else {
    console.log('\n🎉 Database audit completed successfully!');
    process.exit(0);
  }
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
  process.exit(1);
});

// Run the audit
if (require.main === module) {
  runTableAudit();
}

module.exports = { runTableAudit };
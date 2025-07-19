#!/usr/bin/env node

/**
 * Comprehensive Table Discovery Script
 * Uses multiple methods to discover all tables in Supabase
 * Formula PM 2.0 - Complete Database Analysis
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
const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Comprehensive table discovery using multiple approaches
async function discoverAllTables() {
  console.log('🔍 Starting comprehensive table discovery...\n');
  
  const discoveredTables = new Set();
  const tableDetails = {};
  
  // Method 1: Try to query information_schema directly
  console.log('📋 Method 1: Querying information_schema...');
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_schema, table_type');
    
    if (!error && data) {
      console.log(`✅ Found ${data.length} tables via information_schema`);
      data.forEach(table => {
        const fullName = `${table.table_schema}.${table.table_name}`;
        discoveredTables.add(fullName);
        tableDetails[fullName] = {
          name: table.table_name,
          schema: table.table_schema,
          type: table.table_type,
          method: 'information_schema'
        };
      });
    } else {
      console.log('⚠️  information_schema not accessible:', error?.message);
    }
  } catch (error) {
    console.log('⚠️  information_schema query failed:', error.message);
  }
  
  // Method 2: Try known table patterns
  console.log('\n📋 Method 2: Testing known table patterns...');
  const knownTables = [
    // Core business tables
    'user_profiles', 'clients', 'suppliers', 'projects', 'project_assignments',
    'scope_items', 'scope_dependencies', 'documents', 'document_approvals',
    'subcontractors', 'subcontractor_assignments', 'approval_requests',
    'vendors', 'purchase_requests', 'purchase_orders', 'vendor_ratings',
    'delivery_confirmations', 'tasks', 'task_comments', 'milestones',
    'material_specifications', 'audit_logs', 'notifications', 'system_settings',
    'migration_log', 'migrations',
    
    // Potential additional tables
    'shop_drawings', 'shop_drawing_revisions', 'field_reports', 'mobile_forms',
    'invoices', 'tenders', 'tender_submissions', 'messages', 'client_companies',
    'client_users', 'client_project_access', 'client_permissions',
    'client_document_access', 'client_document_approvals', 'client_document_comments',
    'client_notifications', 'client_activity_logs', 'client_communication_threads',
    'client_messages', 'purchase_approval_workflows',
    
    // Backup/migration tables (common patterns)
    'user_profiles_backup', 'projects_old', 'scope_items_backup',
    'documents_archive', 'tasks_migration', 'old_user_data',
    'backup_projects', 'temp_scope_items', 'migration_backup',
    
    // Test tables
    'test_users', 'test_projects', 'test_data', 'sample_data',
    
    // System tables that might be accessible
    'pg_stat_user_tables', 'pg_tables'
  ];
  
  for (const tableName of knownTables) {
    try {
      const { error } = await supabase.from(tableName).select('*').limit(1);
      if (!error) {
        const fullName = `public.${tableName}`;
        discoveredTables.add(fullName);
        if (!tableDetails[fullName]) {
          tableDetails[fullName] = {
            name: tableName,
            schema: 'public',
            type: 'BASE TABLE',
            method: 'pattern_test'
          };
        }
        console.log(`✅ Found: ${tableName}`);
      }
    } catch (error) {
      // Table doesn't exist or not accessible
    }
  }
  
  // Method 3: Try to get table count and row counts
  console.log('\n📋 Method 3: Analyzing discovered tables...');
  const tableAnalysis = {};
  
  for (const fullTableName of discoveredTables) {
    const tableInfo = tableDetails[fullTableName];
    if (tableInfo.schema === 'public') {
      try {
        const { data, error, count } = await supabase
          .from(tableInfo.name)
          .select('*', { count: 'exact' })
          .limit(1);
        
        if (!error) {
          tableAnalysis[tableInfo.name] = {
            rowCount: count || 0,
            hasData: (count || 0) > 0,
            accessible: true,
            columns: data && data.length > 0 ? Object.keys(data[0]).length : 0
          };
        } else {
          tableAnalysis[tableInfo.name] = {
            rowCount: 0,
            hasData: false,
            accessible: false,
            error: error.message
          };
        }
      } catch (error) {
        tableAnalysis[tableInfo.name] = {
          rowCount: 0,
          hasData: false,
          accessible: false,
          error: error.message
        };
      }
    }
  }
  
  // Method 4: Try to discover auth and storage tables
  console.log('\n📋 Method 4: Checking system schemas...');
  const systemTables = [
    'auth.users', 'auth.sessions', 'auth.refresh_tokens', 'auth.audit_log_entries',
    'auth.identities', 'auth.instances', 'auth.schema_migrations',
    'storage.buckets', 'storage.objects', 'storage.migrations'
  ];
  
  for (const tableName of systemTables) {
    try {
      // Try to access system tables (may not work due to RLS)
      const [schema, table] = tableName.split('.');
      const { error } = await supabase.schema(schema).from(table).select('*').limit(1);
      if (!error) {
        discoveredTables.add(tableName);
        tableDetails[tableName] = {
          name: table,
          schema: schema,
          type: 'SYSTEM TABLE',
          method: 'system_test'
        };
        console.log(`✅ Found system table: ${tableName}`);
      }
    } catch (error) {
      // System table not accessible
    }
  }
  
  return { discoveredTables: Array.from(discoveredTables), tableDetails, tableAnalysis };
}

// Generate comprehensive report
function generateReport(discoveredTables, tableDetails, tableAnalysis) {
  console.log('\n' + '='.repeat(80));
  console.log('📋 COMPREHENSIVE DATABASE DISCOVERY REPORT');
  console.log('='.repeat(80));
  
  const publicTables = discoveredTables.filter(t => tableDetails[t].schema === 'public');
  const systemTables = discoveredTables.filter(t => tableDetails[t].schema !== 'public');
  
  console.log('\n📊 DISCOVERY SUMMARY:');
  console.log(`Total Tables Found: ${discoveredTables.length}`);
  console.log(`Public Schema Tables: ${publicTables.length}`);
  console.log(`System Schema Tables: ${systemTables.length}`);
  
  console.log('\n📋 PUBLIC SCHEMA TABLES:');
  publicTables
    .map(t => tableDetails[t])
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach(table => {
      const analysis = tableAnalysis[table.name];
      if (analysis) {
        const status = analysis.accessible ? '✅' : '❌';
        const info = analysis.accessible 
          ? `${analysis.rowCount} rows, ${analysis.columns} columns`
          : analysis.error;
        console.log(`  ${status} ${table.name} - ${info}`);
      } else {
        console.log(`  ❓ ${table.name} - not analyzed`);
      }
    });
  
  if (systemTables.length > 0) {
    console.log('\n🔧 SYSTEM SCHEMA TABLES:');
    systemTables
      .map(t => tableDetails[t])
      .sort((a, b) => `${a.schema}.${a.name}`.localeCompare(`${b.schema}.${b.name}`))
      .forEach(table => {
        console.log(`  📋 ${table.schema}.${table.name}`);
      });
  }
  
  // Categorize tables
  const categories = {
    core: [],
    purchase: [],
    client: [],
    system: [],
    backup: [],
    test: [],
    unknown: []
  };
  
  publicTables.forEach(fullName => {
    const table = tableDetails[fullName];
    const name = table.name.toLowerCase();
    
    if (name.includes('backup') || name.includes('old') || name.includes('temp') || name.includes('archive')) {
      categories.backup.push(table);
    } else if (name.includes('test') || name.includes('sample')) {
      categories.test.push(table);
    } else if (name.includes('client')) {
      categories.client.push(table);
    } else if (name.includes('purchase') || name.includes('vendor') || name.includes('delivery')) {
      categories.purchase.push(table);
    } else if (['user_profiles', 'projects', 'scope_items', 'tasks', 'documents'].includes(name)) {
      categories.core.push(table);
    } else if (name.includes('audit') || name.includes('log') || name.includes('migration') || name.includes('notification')) {
      categories.system.push(table);
    } else {
      categories.unknown.push(table);
    }
  });
  
  console.log('\n📊 TABLE CATEGORIZATION:');
  Object.entries(categories).forEach(([category, tables]) => {
    if (tables.length > 0) {
      console.log(`  ${category.toUpperCase()}: ${tables.length} tables`);
      tables.forEach(table => {
        const analysis = tableAnalysis[table.name];
        const rowInfo = analysis ? `(${analysis.rowCount} rows)` : '';
        console.log(`    - ${table.name} ${rowInfo}`);
      });
    }
  });
  
  // Save detailed report
  const report = {
    summary: {
      totalTables: discoveredTables.length,
      publicTables: publicTables.length,
      systemTables: systemTables.length,
      timestamp: new Date()
    },
    tables: tableDetails,
    analysis: tableAnalysis,
    categories: categories
  };
  
  const reportPath = path.join(__dirname, '..', 'COMPREHENSIVE_TABLE_DISCOVERY_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  
  return report;
}

// Main function
async function runDiscovery() {
  console.log('🚀 Starting Comprehensive Table Discovery...');
  console.log(`📅 ${new Date().toISOString()}`);
  console.log(`🔗 Database: ${SUPABASE_URL}\n`);
  
  try {
    const { discoveredTables, tableDetails, tableAnalysis } = await discoverAllTables();
    const report = generateReport(discoveredTables, tableDetails, tableAnalysis);
    
    console.log('\n🎉 Table discovery completed successfully!');
    
    if (discoveredTables.length >= 70) {
      console.log(`\n⚠️  Found ${discoveredTables.length} tables - this is quite a lot!`);
      console.log('Consider reviewing for unnecessary tables or migration artifacts.');
    }
    
  } catch (error) {
    console.error('❌ Discovery failed:', error);
    process.exit(1);
  }
}

// Run the discovery
if (require.main === module) {
  runDiscovery();
}

module.exports = { runDiscovery };
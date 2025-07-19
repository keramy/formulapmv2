#!/usr/bin/env node

/**
 * Pre-Optimization Backup Script
 * 
 * CRITICAL: Run this script BEFORE executing any RLS optimizations!
 * Creates comprehensive backup of all RLS policies that will be optimized.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
function loadEnvVars() {
  const envPath = '.env.local';
  const envVars = {};
  
  try {
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          envVars[key.trim()] = value.replace(/^["']|["']$/g, '');
        }
      });
    }
  } catch (error) {
    console.warn('Warning: Could not load .env.local file:', error.message);
  }
  
  return envVars;
}

class PreOptimizationBackup {
  constructor() {
    const envVars = loadEnvVars();
    this.supabase = createClient(
      envVars.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
      envVars.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    this.backupResults = {
      timestamp: new Date().toISOString(),
      backup_table_name: `rls_backup_${new Date().toISOString().replace(/[:.]/g, '_')}`,
      policies_backed_up: 0,
      backup_status: 'INITIALIZED'
    };
  }

  /**
   * Create comprehensive backup of all RLS policies
   */
  async createBackup() {
    console.log('💾 Creating Pre-Optimization Backup');
    console.log('=' .repeat(50));
    console.log(`Backup table: ${this.backupResults.backup_table_name}`);

    try {
      // Step 1: Create backup table
      console.log('\n📋 Step 1: Creating backup table...');
      await this.createBackupTable();

      // Step 2: Query all policies that will be optimized
      console.log('🔍 Step 2: Identifying policies to backup...');
      const policiesToBackup = await this.identifyPoliciesForBackup();
      
      console.log(`   Found ${policiesToBackup.length} policies with auth function calls`);

      // Step 3: Insert policies into backup table
      console.log('💾 Step 3: Backing up policies...');
      await this.backupPolicies(policiesToBackup);

      // Step 4: Verify backup integrity
      console.log('✅ Step 4: Verifying backup integrity...');
      await this.verifyBackup();

      // Step 5: Generate backup report
      console.log('📊 Step 5: Generating backup report...');
      const reportPath = await this.generateBackupReport();

      this.backupResults.backup_status = 'COMPLETED';
      
      console.log('\n🎉 Backup Complete!');
      console.log('=' .repeat(50));
      console.log(`✅ Policies backed up: ${this.backupResults.policies_backed_up}`);
      console.log(`📋 Backup table: ${this.backupResults.backup_table_name}`);
      console.log(`📄 Backup report: ${reportPath}`);
      console.log('\n🚀 Ready to proceed with optimization!');

      return this.backupResults;

    } catch (error) {
      console.error('\n❌ Backup Failed!');
      console.error('Error:', error.message);
      console.log('\n⚠️  DO NOT PROCEED with optimization without successful backup!');
      
      this.backupResults.backup_status = 'FAILED';
      this.backupResults.error = error.message;
      
      throw error;
    }
  }

  /**
   * Create the backup table structure
   */
  async createBackupTable() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${this.backupResults.backup_table_name} (
        backup_id SERIAL PRIMARY KEY,
        backup_timestamp TIMESTAMPTZ DEFAULT NOW(),
        schema_name TEXT NOT NULL,
        table_name TEXT NOT NULL,
        policy_name TEXT NOT NULL,
        policy_command TEXT NOT NULL,
        policy_permissive TEXT,
        policy_roles TEXT[],
        policy_qual TEXT,
        policy_with_check TEXT,
        original_policy_sql TEXT,
        backup_reason TEXT DEFAULT 'pre_optimization_backup',
        optimization_target BOOLEAN DEFAULT true
      );
    `;

    const { error } = await this.supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (error) {
      throw new Error(`Failed to create backup table: ${error.message}`);
    }

    console.log('   ✅ Backup table created successfully');
  }

  /**
   * Identify all policies that will be optimized
   */
  async identifyPoliciesForBackup() {
    const discoverySQL = `
      SELECT 
        schemaname,
        tablename,
        policyname,
        cmd,
        permissive,
        roles,
        qual,
        with_check,
        -- Reconstruct the original CREATE POLICY statement
        'DROP POLICY IF EXISTS ' || quote_ident(policyname) || ' ON ' || quote_ident(tablename) || ';' ||
        E'\n' ||
        'CREATE POLICY ' || quote_ident(policyname) || ' ON ' || quote_ident(tablename) ||
        CASE 
          WHEN permissive = 'PERMISSIVE' THEN ' AS PERMISSIVE'
          WHEN permissive = 'RESTRICTIVE' THEN ' AS RESTRICTIVE'
          ELSE ''
        END ||
        ' FOR ' || cmd ||
        CASE 
          WHEN roles IS NOT NULL AND array_length(roles, 1) > 0 
          THEN ' TO ' || array_to_string(roles, ', ')
          ELSE ''
        END ||
        CASE 
          WHEN qual IS NOT NULL 
          THEN ' USING (' || qual || ')'
          ELSE ''
        END ||
        CASE 
          WHEN with_check IS NOT NULL 
          THEN ' WITH CHECK (' || with_check || ')'
          ELSE ''
        END || ';' as original_policy_sql
      FROM pg_policies 
      WHERE schemaname = 'public'
      AND (
        qual LIKE '%auth.uid()%' OR 
        qual LIKE '%auth.jwt()%' OR
        with_check LIKE '%auth.uid()%' OR
        with_check LIKE '%auth.jwt()%'
      )
      ORDER BY tablename, policyname;
    `;

    const { data, error } = await this.supabase.rpc('exec_sql', { sql: discoverySQL });
    
    if (error) {
      throw new Error(`Failed to identify policies: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Backup the identified policies
   */
  async backupPolicies(policies) {
    for (const policy of policies) {
      const insertSQL = `
        INSERT INTO ${this.backupResults.backup_table_name} 
        (schema_name, table_name, policy_name, policy_command, policy_permissive, 
         policy_roles, policy_qual, policy_with_check, original_policy_sql)
        VALUES (
          '${policy.schemaname}',
          '${policy.tablename}',
          '${policy.policyname}',
          '${policy.cmd}',
          ${policy.permissive ? `'${policy.permissive}'` : 'NULL'},
          ${policy.roles ? `ARRAY[${policy.roles.map(r => `'${r}'`).join(',')}]` : 'NULL'},
          ${policy.qual ? `'${policy.qual.replace(/'/g, "''")}'` : 'NULL'},
          ${policy.with_check ? `'${policy.with_check.replace(/'/g, "''")}'` : 'NULL'},
          '${policy.original_policy_sql.replace(/'/g, "''")}'
        );
      `;

      const { error } = await this.supabase.rpc('exec_sql', { sql: insertSQL });
      
      if (error) {
        console.warn(`   ⚠️  Failed to backup policy ${policy.tablename}.${policy.policyname}: ${error.message}`);
      } else {
        this.backupResults.policies_backed_up++;
        console.log(`   ✅ Backed up: ${policy.tablename}.${policy.policyname}`);
      }
    }
  }

  /**
   * Verify backup integrity
   */
  async verifyBackup() {
    const verificationSQL = `
      SELECT 
        COUNT(*) as backup_count,
        COUNT(DISTINCT table_name) as tables_count,
        MIN(backup_timestamp) as earliest_backup,
        MAX(backup_timestamp) as latest_backup
      FROM ${this.backupResults.backup_table_name};
    `;

    const { data, error } = await this.supabase.rpc('exec_sql', { sql: verificationSQL });
    
    if (error) {
      throw new Error(`Backup verification failed: ${error.message}`);
    }

    const verification = data[0];
    
    if (verification.backup_count !== this.backupResults.policies_backed_up) {
      throw new Error(`Backup count mismatch: Expected ${this.backupResults.policies_backed_up}, found ${verification.backup_count}`);
    }

    console.log(`   ✅ Verified ${verification.backup_count} policies in ${verification.tables_count} tables`);
    
    this.backupResults.verification = verification;
  }

  /**
   * Generate backup report
   */
  async generateBackupReport() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = `rls-optimization-execution/backup-report-${timestamp}.json`;
    
    const report = {
      title: 'Pre-Optimization Backup Report',
      backup_details: this.backupResults,
      backup_instructions: {
        rollback_command: `SELECT rollback_from_backup('${this.backupResults.backup_table_name}');`,
        verification_command: `SELECT * FROM verify_rollback_success('${this.backupResults.backup_table_name}');`,
        emergency_rollback: `SELECT emergency_rollback();`
      },
      next_steps: [
        'Backup completed successfully',
        'Ready to proceed with RLS optimization',
        'Keep this backup table until optimization is verified',
        'Use rollback commands if optimization fails'
      ],
      critical_notes: [
        'DO NOT delete the backup table until optimization is fully verified',
        'Test rollback procedures before proceeding if unsure',
        'Monitor optimization progress and be ready to rollback if needed'
      ]
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    return reportPath;
  }
}

// Export for use as module
module.exports = PreOptimizationBackup;

// Run if called directly
if (require.main === module) {
  const backup = new PreOptimizationBackup();
  backup.createBackup().then(results => {
    console.log('\n💾 Backup process completed');
    process.exit(results.backup_status === 'COMPLETED' ? 0 : 1);
  }).catch(error => {
    console.error('\n❌ Backup process failed:', error.message);
    process.exit(1);
  });
}
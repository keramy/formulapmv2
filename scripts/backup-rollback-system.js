#!/usr/bin/env node

/**
 * RLS Policy Backup and Rollback System
 * 
 * This script provides comprehensive backup and rollback capabilities for RLS policy optimization.
 * It creates automated backups before optimization and provides recovery procedures.
 * 
 * Requirements: 3.1, 2.4, 3.5
 */

const fs = require('fs');
const path = require('path');

class BackupRollbackSystem {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      backup_status: 'initialized',
      backups_created: [],
      rollback_procedures: {},
      recovery_options: {}
    };
  }

  /**
   * Generate SQL scripts to export current policy definitions
   * Creates complete backup of all RLS policies before optimization
   */
  generatePolicyBackupSQL() {
    return {
      // Complete policy backup query
      full_policy_backup: `
        -- RLS Policy Backup Script
        -- Generated: ${new Date().toISOString()}
        -- This script exports all current RLS policy definitions for backup
        
        -- Create backup table to store policy definitions
        CREATE TABLE IF NOT EXISTS rls_policy_backup_${new Date().toISOString().replace(/[:.]/g, '_')} (
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
          backup_reason TEXT DEFAULT 'pre_optimization_backup'
        );
        
        -- Insert all current policies into backup table
        INSERT INTO rls_policy_backup_${new Date().toISOString().replace(/[:.]/g, '_')} 
        (schema_name, table_name, policy_name, policy_command, policy_permissive, policy_roles, policy_qual, policy_with_check)
        SELECT 
          schemaname,
          tablename,
          policyname,
          cmd,
          permissive,
          roles,
          qual,
          with_check
        FROM pg_policies 
        WHERE schemaname = 'public'
        ORDER BY tablename, policyname;
      `,

      // Targeted backup for policies with auth calls
      auth_policies_backup: `
        -- Backup Only Policies with Auth Function Calls
        -- This creates a focused backup of policies that will be optimized
        
        SELECT 
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
          END || ';' as backup_sql
        FROM pg_policies 
        WHERE schemaname = 'public'
        AND (
          qual LIKE '%auth.uid()%' OR 
          qual LIKE '%auth.jwt()%' OR
          with_check LIKE '%auth.uid()%' OR
          with_check LIKE '%auth.jwt()%'
        )
        ORDER BY tablename, policyname;
      `
    };
  }  /**
  
 * Generate automated backup procedures
   * Creates scripts that run automatically before each optimization batch
   */
  generateAutomatedBackupProcedures() {
    return {
      // Pre-optimization backup procedure
      pre_optimization_backup: `
        -- Automated Pre-Optimization Backup Procedure
        -- Run this before any RLS policy optimization
        
        DO $$
        DECLARE
          backup_table_name TEXT;
          backup_count INTEGER;
          policies_to_backup INTEGER;
        BEGIN
          -- Generate unique backup table name
          backup_table_name := 'rls_backup_' || to_char(NOW(), 'YYYY_MM_DD_HH24_MI_SS');
          
          -- Count policies that will be backed up
          SELECT COUNT(*) INTO policies_to_backup
          FROM pg_policies 
          WHERE schemaname = 'public'
          AND (
            qual LIKE '%auth.uid()%' OR 
            qual LIKE '%auth.jwt()%' OR
            with_check LIKE '%auth.uid()%' OR
            with_check LIKE '%auth.jwt()%'
          );
          
          -- Create backup table
          EXECUTE format('
            CREATE TABLE %I (
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
              backup_reason TEXT DEFAULT ''pre_optimization_backup''
            )', backup_table_name);
          
          -- Insert policies into backup table with reconstructed SQL
          EXECUTE format('
            INSERT INTO %I 
            (schema_name, table_name, policy_name, policy_command, policy_permissive, 
             policy_roles, policy_qual, policy_with_check, original_policy_sql)
            SELECT 
              schemaname,
              tablename,
              policyname,
              cmd,
              permissive,
              roles,
              qual,
              with_check,
              ''DROP POLICY IF EXISTS '' || quote_ident(policyname) || '' ON '' || quote_ident(tablename) || '';'' ||
              E''\n'' ||
              ''CREATE POLICY '' || quote_ident(policyname) || '' ON '' || quote_ident(tablename) ||
              CASE 
                WHEN permissive = ''PERMISSIVE'' THEN '' AS PERMISSIVE''
                WHEN permissive = ''RESTRICTIVE'' THEN '' AS RESTRICTIVE''
                ELSE ''''
              END ||
              '' FOR '' || cmd ||
              CASE 
                WHEN roles IS NOT NULL AND array_length(roles, 1) > 0 
                THEN '' TO '' || array_to_string(roles, '', '')
                ELSE ''''
              END ||
              CASE 
                WHEN qual IS NOT NULL 
                THEN '' USING ('' || qual || '')''
                ELSE ''''
              END ||
              CASE 
                WHEN with_check IS NOT NULL 
                THEN '' WITH CHECK ('' || with_check || '')''
                ELSE ''''
              END || '';''
            FROM pg_policies 
            WHERE schemaname = ''public''
            AND (
              qual LIKE ''%%auth.uid()%%'' OR 
              qual LIKE ''%%auth.jwt()%%'' OR
              with_check LIKE ''%%auth.uid()%%'' OR
              with_check LIKE ''%%auth.jwt()%%''
            )', backup_table_name);
          
          -- Verify backup was created successfully
          EXECUTE format('SELECT COUNT(*) FROM %I', backup_table_name) INTO backup_count;
          
          IF backup_count != policies_to_backup THEN
            RAISE EXCEPTION 'Backup verification failed: Expected % policies, backed up %', 
              policies_to_backup, backup_count;
          END IF;
          
          RAISE NOTICE 'SUCCESS: Backed up % RLS policies to table %', backup_count, backup_table_name;
          RAISE NOTICE 'Backup table: %', backup_table_name;
        END $$;
      `,

      // Table-specific backup procedure
      table_specific_backup: `
        -- Table-Specific Backup Procedure
        -- Use this to backup policies for a specific table before optimization
        
        CREATE OR REPLACE FUNCTION backup_table_policies(p_table_name TEXT)
        RETURNS TEXT AS $$
        DECLARE
          backup_table_name TEXT;
          backup_count INTEGER;
          result_message TEXT;
        BEGIN
          -- Generate backup table name
          backup_table_name := 'rls_backup_' || p_table_name || '_' || to_char(NOW(), 'YYYY_MM_DD_HH24_MI_SS');
          
          -- Create backup table for this specific table
          EXECUTE format('
            CREATE TABLE %I (
              backup_id SERIAL PRIMARY KEY,
              backup_timestamp TIMESTAMPTZ DEFAULT NOW(),
              table_name TEXT NOT NULL,
              policy_name TEXT NOT NULL,
              policy_sql TEXT NOT NULL,
              backup_reason TEXT DEFAULT ''table_specific_backup''
            )', backup_table_name);
          
          -- Backup policies for the specified table
          EXECUTE format('
            INSERT INTO %I (table_name, policy_name, policy_sql)
            SELECT 
              tablename,
              policyname,
              ''DROP POLICY IF EXISTS '' || quote_ident(policyname) || '' ON '' || quote_ident(tablename) || '';'' ||
              E''\n'' ||
              ''CREATE POLICY '' || quote_ident(policyname) || '' ON '' || quote_ident(tablename) ||
              CASE 
                WHEN permissive = ''PERMISSIVE'' THEN '' AS PERMISSIVE''
                WHEN permissive = ''RESTRICTIVE'' THEN '' AS RESTRICTIVE''
                ELSE ''''
              END ||
              '' FOR '' || cmd ||
              CASE 
                WHEN roles IS NOT NULL AND array_length(roles, 1) > 0 
                THEN '' TO '' || array_to_string(roles, '', '')
                ELSE ''''
              END ||
              CASE 
                WHEN qual IS NOT NULL 
                THEN '' USING ('' || qual || '')''
                ELSE ''''
              END ||
              CASE 
                WHEN with_check IS NOT NULL 
                THEN '' WITH CHECK ('' || with_check || '')''
                ELSE ''''
              END || '';''
            FROM pg_policies 
            WHERE schemaname = ''public''
            AND tablename = %L', backup_table_name, p_table_name);
          
          -- Get backup count
          EXECUTE format('SELECT COUNT(*) FROM %I', backup_table_name) INTO backup_count;
          
          result_message := format('Backed up %s policies for table %s to %s', 
            backup_count, p_table_name, backup_table_name);
          
          RETURN result_message;
        END $$ LANGUAGE plpgsql;
      `
    };
  }

  /**
   * Generate rollback scripts for each transformation
   * Creates specific rollback procedures for different types of optimizations
   */
  generateRollbackScripts() {
    return {
      // Complete rollback from backup table
      complete_rollback: `
        -- Complete Rollback from Backup Table
        -- Use this to restore all policies from a backup table
        
        CREATE OR REPLACE FUNCTION rollback_from_backup(p_backup_table_name TEXT)
        RETURNS TEXT AS $$
        DECLARE
          policy_record RECORD;
          rollback_count INTEGER := 0;
          error_count INTEGER := 0;
          result_message TEXT;
        BEGIN
          -- Verify backup table exists
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = p_backup_table_name
          ) THEN
            RAISE EXCEPTION 'Backup table % does not exist', p_backup_table_name;
          END IF;
          
          -- Process each policy in the backup
          FOR policy_record IN 
            EXECUTE format('SELECT * FROM %I ORDER BY table_name, policy_name', p_backup_table_name)
          LOOP
            BEGIN
              -- Execute the original policy SQL to restore it
              EXECUTE policy_record.original_policy_sql;
              rollback_count := rollback_count + 1;
              
              RAISE NOTICE 'Restored policy: %.%', 
                policy_record.table_name, policy_record.policy_name;
                
            EXCEPTION
              WHEN OTHERS THEN
                error_count := error_count + 1;
                RAISE WARNING 'Failed to restore policy %.%: %', 
                  policy_record.table_name, policy_record.policy_name, SQLERRM;
            END;
          END LOOP;
          
          result_message := format('Rollback complete: %s policies restored, %s errors', 
            rollback_count, error_count);
          
          RETURN result_message;
        END $$ LANGUAGE plpgsql;
      `,

      // Selective rollback for specific tables
      selective_rollback: `
        -- Selective Rollback for Specific Tables
        -- Use this to rollback only specific tables from a backup
        
        CREATE OR REPLACE FUNCTION rollback_table_from_backup(
          p_backup_table_name TEXT,
          p_target_table_name TEXT
        )
        RETURNS TEXT AS $$
        DECLARE
          policy_record RECORD;
          rollback_count INTEGER := 0;
          error_count INTEGER := 0;
          result_message TEXT;
        BEGIN
          -- Process policies for the specific table
          FOR policy_record IN 
            EXECUTE format('
              SELECT * FROM %I 
              WHERE table_name = %L 
              ORDER BY policy_name', 
              p_backup_table_name, p_target_table_name)
          LOOP
            BEGIN
              -- Execute the original policy SQL to restore it
              EXECUTE policy_record.original_policy_sql;
              rollback_count := rollback_count + 1;
              
              RAISE NOTICE 'Restored policy: %.%', 
                policy_record.table_name, policy_record.policy_name;
                
            EXCEPTION
              WHEN OTHERS THEN
                error_count := error_count + 1;
                RAISE WARNING 'Failed to restore policy %.%: %', 
                  policy_record.table_name, policy_record.policy_name, SQLERRM;
            END;
          END LOOP;
          
          IF rollback_count = 0 THEN
            RAISE WARNING 'No policies found for table % in backup %', 
              p_target_table_name, p_backup_table_name;
          END IF;
          
          result_message := format('Table rollback complete: %s policies restored for %s, %s errors', 
            rollback_count, p_target_table_name, error_count);
          
          RETURN result_message;
        END $$ LANGUAGE plpgsql;
      `,

      // Emergency rollback procedure
      emergency_rollback: `
        -- Emergency Rollback Procedure
        -- Use this for immediate rollback when optimization causes issues
        
        CREATE OR REPLACE FUNCTION emergency_rollback()
        RETURNS TEXT AS $$
        DECLARE
          latest_backup_table TEXT;
          rollback_result TEXT;
        BEGIN
          -- Find the most recent backup table
          SELECT table_name INTO latest_backup_table
          FROM information_schema.tables 
          WHERE table_name LIKE 'rls_backup_%'
          AND table_schema = 'public'
          ORDER BY table_name DESC
          LIMIT 1;
          
          IF latest_backup_table IS NULL THEN
            RAISE EXCEPTION 'No backup tables found for emergency rollback';
          END IF;
          
          RAISE NOTICE 'Emergency rollback using backup table: %', latest_backup_table;
          
          -- Execute complete rollback
          SELECT rollback_from_backup(latest_backup_table) INTO rollback_result;
          
          RETURN format('Emergency rollback completed using %s: %s', 
            latest_backup_table, rollback_result);
        END $$ LANGUAGE plpgsql;
      `
    };
  } 
 /**
   * Generate rollback verification procedures
   * Verifies that rollback operations completed successfully
   */
  generateRollbackVerification() {
    return {
      // Verify rollback success
      verify_rollback_success: `
        -- Rollback Verification Procedure
        -- Verifies that policies were successfully restored to their original state
        
        CREATE OR REPLACE FUNCTION verify_rollback_success(p_backup_table_name TEXT)
        RETURNS TABLE (
          table_name TEXT,
          policy_name TEXT,
          rollback_status TEXT,
          current_qual TEXT,
          backup_qual TEXT,
          verification_result TEXT
        ) AS $$
        BEGIN
          RETURN QUERY
          EXECUTE format('
            SELECT 
              b.table_name::TEXT,
              b.policy_name::TEXT,
              CASE 
                WHEN p.policyname IS NOT NULL THEN ''POLICY_EXISTS''
                ELSE ''POLICY_MISSING''
              END::TEXT as rollback_status,
              p.qual::TEXT as current_qual,
              b.policy_qual::TEXT as backup_qual,
              CASE 
                WHEN p.policyname IS NULL THEN ''❌ ROLLBACK_FAILED''
                WHEN p.qual = b.policy_qual THEN ''✅ ROLLBACK_SUCCESS''
                WHEN p.qual != b.policy_qual THEN ''⚠️ ROLLBACK_PARTIAL''
                ELSE ''❓ ROLLBACK_UNKNOWN''
              END::TEXT as verification_result
            FROM %I b
            LEFT JOIN pg_policies p ON (
              p.schemaname = ''public'' 
              AND p.tablename = b.table_name 
              AND p.policyname = b.policy_name
            )
            ORDER BY b.table_name, b.policy_name', p_backup_table_name);
        END $$ LANGUAGE plpgsql;
      `,

      // Compare current state with backup
      compare_with_backup: `
        -- Compare Current Policies with Backup
        -- Detailed comparison to verify rollback accuracy
        
        CREATE OR REPLACE FUNCTION compare_policies_with_backup(p_backup_table_name TEXT)
        RETURNS TABLE (
          comparison_type TEXT,
          table_name TEXT,
          policy_name TEXT,
          field_name TEXT,
          current_value TEXT,
          backup_value TEXT,
          match_status TEXT
        ) AS $$
        BEGIN
          RETURN QUERY
          EXECUTE format('
            WITH policy_comparison AS (
              SELECT 
                b.table_name,
                b.policy_name,
                p.qual as current_qual,
                b.policy_qual as backup_qual,
                p.with_check as current_with_check,
                b.policy_with_check as backup_with_check,
                p.cmd as current_cmd,
                b.policy_command as backup_cmd
              FROM %I b
              LEFT JOIN pg_policies p ON (
                p.schemaname = ''public'' 
                AND p.tablename = b.table_name 
                AND p.policyname = b.policy_name
              )
            )
            SELECT 
              ''QUAL_COMPARISON''::TEXT,
              table_name::TEXT,
              policy_name::TEXT,
              ''qual''::TEXT,
              current_qual::TEXT,
              backup_qual::TEXT,
              CASE 
                WHEN current_qual = backup_qual THEN ''✅ MATCH''
                WHEN current_qual IS NULL AND backup_qual IS NULL THEN ''✅ MATCH''
                ELSE ''❌ MISMATCH''
              END::TEXT
            FROM policy_comparison
            WHERE current_qual IS DISTINCT FROM backup_qual
            
            UNION ALL
            
            SELECT 
              ''WITH_CHECK_COMPARISON''::TEXT,
              table_name::TEXT,
              policy_name::TEXT,
              ''with_check''::TEXT,
              current_with_check::TEXT,
              backup_with_check::TEXT,
              CASE 
                WHEN current_with_check = backup_with_check THEN ''✅ MATCH''
                WHEN current_with_check IS NULL AND backup_with_check IS NULL THEN ''✅ MATCH''
                ELSE ''❌ MISMATCH''
              END::TEXT
            FROM policy_comparison
            WHERE current_with_check IS DISTINCT FROM backup_with_check
            
            ORDER BY table_name, policy_name, field_name', p_backup_table_name);
        END $$ LANGUAGE plpgsql;
      `
    };
  }

  /**
   * Generate manual recovery procedures for complex failures
   * Provides step-by-step recovery procedures for different failure scenarios
   */
  generateManualRecoveryProcedures() {
    return {
      // Manual recovery guide
      manual_recovery_guide: `
        -- Manual Recovery Procedures for Complex Failures
        -- Use these procedures when automated rollback fails
        
        /*
        MANUAL RECOVERY PROCEDURE 1: Partial Rollback Failure
        
        When some policies fail to rollback automatically:
        
        1. Identify failed policies:
           SELECT * FROM verify_rollback_success('your_backup_table_name')
           WHERE verification_result LIKE '%FAILED%';
        
        2. For each failed policy, manually execute:
           -- Drop the current (potentially corrupted) policy
           DROP POLICY IF EXISTS "policy_name" ON "table_name";
           
           -- Recreate from backup (get SQL from backup table)
           SELECT original_policy_sql FROM your_backup_table_name 
           WHERE table_name = 'your_table' AND policy_name = 'your_policy';
           
           -- Execute the returned SQL
        
        3. Verify the manual fix:
           SELECT * FROM verify_rollback_success('your_backup_table_name')
           WHERE table_name = 'your_table' AND policy_name = 'your_policy';
        */
        
        /*
        MANUAL RECOVERY PROCEDURE 2: Complete System Recovery
        
        When the entire optimization needs to be reversed:
        
        1. List all backup tables:
           SELECT table_name FROM information_schema.tables 
           WHERE table_name LIKE 'rls_backup_%' 
           ORDER BY table_name DESC;
        
        2. Choose the appropriate backup (usually the most recent):
           -- Use the latest backup for complete recovery
           
        3. Execute emergency rollback:
           SELECT emergency_rollback();
        
        4. If emergency rollback fails, manual restoration:
           -- Get all policy SQL from backup
           SELECT table_name, policy_name, original_policy_sql 
           FROM your_backup_table_name 
           ORDER BY table_name, policy_name;
           
           -- Execute each original_policy_sql statement manually
        
        5. Verify complete recovery:
           SELECT * FROM verify_rollback_success('your_backup_table_name');
        */
        
        /*
        MANUAL RECOVERY PROCEDURE 3: Backup Table Recovery
        
        When backup tables are corrupted or missing:
        
        1. Check for alternative backups:
           -- Look for file-based backups in analysis-reports/
           -- Check for database dumps
           -- Look for version control history
        
        2. If no backups available, reconstruct policies:
           -- Review application code for expected RLS behavior
           -- Check documentation for policy requirements
           -- Recreate policies based on security requirements
        
        3. Test reconstructed policies thoroughly:
           -- Use security verification tests
           -- Verify user access patterns
           -- Test role-based access controls
        */
        
        SELECT 'Manual recovery procedures loaded. See comments for detailed instructions.' as status;
      `,

      // Recovery validation checklist
      recovery_validation_checklist: `
        -- Recovery Validation Checklist
        -- Use this checklist to verify successful recovery
        
        CREATE OR REPLACE FUNCTION recovery_validation_checklist()
        RETURNS TABLE (
          check_category TEXT,
          check_description TEXT,
          check_status TEXT,
          check_result TEXT,
          action_required TEXT
        ) AS $$
        DECLARE
          total_policies INTEGER;
          policies_with_auth INTEGER;
          optimized_policies INTEGER;
          unoptimized_policies INTEGER;
        BEGIN
          -- Get policy counts
          SELECT COUNT(*) INTO total_policies
          FROM pg_policies WHERE schemaname = 'public';
          
          SELECT COUNT(*) INTO policies_with_auth
          FROM pg_policies 
          WHERE schemaname = 'public'
          AND (qual LIKE '%auth.uid()%' OR qual LIKE '%auth.jwt()%' OR
               with_check LIKE '%auth.uid()%' OR with_check LIKE '%auth.jwt()%');
          
          SELECT COUNT(*) INTO optimized_policies
          FROM pg_policies 
          WHERE schemaname = 'public'
          AND (qual LIKE '%(SELECT auth.uid())%' OR qual LIKE '%(SELECT auth.jwt())%' OR
               with_check LIKE '%(SELECT auth.uid())%' OR with_check LIKE '%(SELECT auth.jwt())%');
          
          SELECT COUNT(*) INTO unoptimized_policies
          FROM pg_policies 
          WHERE schemaname = 'public'
          AND ((qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%') OR
               (qual LIKE '%auth.jwt()%' AND qual NOT LIKE '%(SELECT auth.jwt())%') OR
               (with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%') OR
               (with_check LIKE '%auth.jwt()%' AND with_check NOT LIKE '%(SELECT auth.jwt())%'));
          
          -- Return validation results
          RETURN QUERY VALUES
            ('POLICY_COUNT', 'Total RLS policies exist', 
             CASE WHEN total_policies > 0 THEN '✅ PASS' ELSE '❌ FAIL' END,
             total_policies::TEXT || ' policies found',
             CASE WHEN total_policies = 0 THEN 'Restore policies from backup' ELSE 'None' END),
            
            ('AUTH_POLICIES', 'Policies with auth functions exist', 
             CASE WHEN policies_with_auth > 0 THEN '✅ PASS' ELSE '⚠️ WARNING' END,
             policies_with_auth::TEXT || ' policies with auth functions',
             CASE WHEN policies_with_auth = 0 THEN 'Verify if auth policies should exist' ELSE 'None' END),
            
            ('OPTIMIZATION_STATUS', 'Check optimization state after recovery', 
             CASE 
               WHEN unoptimized_policies = 0 AND optimized_policies > 0 THEN '⚠️ STILL_OPTIMIZED'
               WHEN unoptimized_policies > 0 AND optimized_policies = 0 THEN '✅ ROLLBACK_SUCCESS'
               WHEN unoptimized_policies > 0 AND optimized_policies > 0 THEN '⚠️ MIXED_STATE'
               ELSE '❓ UNKNOWN'
             END,
             'Optimized: ' || optimized_policies::TEXT || ', Unoptimized: ' || unoptimized_policies::TEXT,
             CASE 
               WHEN unoptimized_policies = 0 AND optimized_policies > 0 THEN 'Rollback may not have completed'
               WHEN unoptimized_policies > 0 AND optimized_policies > 0 THEN 'Some policies may need manual rollback'
               ELSE 'None'
             END);
        END $$ LANGUAGE plpgsql;
      `
    };
  }  /**

   * Generate comprehensive backup and rollback report
   */
  async generateBackupRollbackReport() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportDir = 'analysis-reports/backup-rollback';
    
    // Ensure directory exists
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const backupSQL = this.generatePolicyBackupSQL();
    const automatedBackups = this.generateAutomatedBackupProcedures();
    const rollbackScripts = this.generateRollbackScripts();
    const rollbackVerification = this.generateRollbackVerification();
    const manualRecovery = this.generateManualRecoveryProcedures();

    const report = {
      title: 'RLS Policy Backup and Rollback System',
      generated_at: this.results.timestamp,
      purpose: 'Comprehensive backup and recovery system for RLS policy optimization',
      components: {
        backup_procedures: {
          description: 'Automated and manual backup procedures',
          procedures: { ...backupSQL, ...automatedBackups }
        },
        rollback_scripts: {
          description: 'Automated rollback procedures for failed optimizations',
          scripts: rollbackScripts
        },
        verification_procedures: {
          description: 'Procedures to verify successful rollback operations',
          procedures: rollbackVerification
        },
        manual_recovery: {
          description: 'Manual recovery procedures for complex failure scenarios',
          procedures: manualRecovery
        }
      },
      usage_workflow: {
        before_optimization: [
          "Execute pre-optimization backup procedure",
          "Verify backup table was created successfully",
          "Store backup table name for potential rollback"
        ],
        during_optimization: [
          "Monitor optimization progress",
          "Check for any errors or failures",
          "Be prepared to execute emergency rollback if needed"
        ],
        after_optimization: [
          "Verify optimization completed successfully",
          "Test optimized policies work correctly",
          "Keep backup tables for safety period before cleanup"
        ],
        rollback_if_needed: [
          "Execute appropriate rollback procedure",
          "Verify rollback completed successfully",
          "Run recovery validation checklist",
          "Document rollback reason and resolution"
        ]
      },
      patterns_for_future_agents: this.generateBackupPatternsForFutureAgents(),
      recommendations: this.generateBackupRecommendations()
    };

    // Save comprehensive report
    const reportPath = path.join(reportDir, `backup-rollback-report-${timestamp}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Save SQL files for different components
    const backupSQLPath = path.join(reportDir, `backup-procedures-${timestamp}.sql`);
    const rollbackSQLPath = path.join(reportDir, `rollback-procedures-${timestamp}.sql`);
    const verificationSQLPath = path.join(reportDir, `verification-procedures-${timestamp}.sql`);
    const recoverySQLPath = path.join(reportDir, `manual-recovery-procedures-${timestamp}.sql`);

    fs.writeFileSync(backupSQLPath, this.generateBackupSQL(backupSQL, automatedBackups));
    fs.writeFileSync(rollbackSQLPath, this.generateRollbackSQL(rollbackScripts));
    fs.writeFileSync(verificationSQLPath, this.generateVerificationSQL(rollbackVerification));
    fs.writeFileSync(recoverySQLPath, this.generateRecoverySQL(manualRecovery));

    // Save patterns for future agents
    const patternsPath = path.join(reportDir, `backup-patterns-for-future-agents-${timestamp}.md`);
    const patternsMarkdown = this.generateBackupPatternsMarkdown(report.patterns_for_future_agents);
    fs.writeFileSync(patternsPath, patternsMarkdown);

    console.log(`💾 Backup and rollback system reports saved:`);
    console.log(`   📄 Comprehensive report: ${reportPath}`);
    console.log(`   💾 Backup procedures: ${backupSQLPath}`);
    console.log(`   🔄 Rollback procedures: ${rollbackSQLPath}`);
    console.log(`   ✅ Verification procedures: ${verificationSQLPath}`);
    console.log(`   🛠️ Manual recovery procedures: ${recoverySQLPath}`);
    console.log(`   📋 Future agent patterns: ${patternsPath}`);

    return { reportPath, backupSQLPath, rollbackSQLPath, verificationSQLPath, recoverySQLPath, patternsPath };
  }

  /**
   * Generate backup patterns for future AI agents
   */
  generateBackupPatternsForFutureAgents() {
    return {
      backup_before_changes: {
        description: "Always create backups before making RLS policy changes",
        pattern: `
          -- Pattern: Backup Before Changes
          -- Always execute this before modifying RLS policies
          
          DO $$
          DECLARE
            backup_table_name TEXT;
          BEGIN
            -- Create timestamped backup
            backup_table_name := 'rls_backup_' || to_char(NOW(), 'YYYY_MM_DD_HH24_MI_SS');
            
            -- Execute backup procedure
            PERFORM backup_table_policies('your_table_name');
            
            -- Verify backup success
            IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = backup_table_name) THEN
              RAISE EXCEPTION 'Backup failed - aborting changes';
            END IF;
            
            RAISE NOTICE 'Backup completed: %', backup_table_name;
          END $$;
        `
      },
      rollback_on_failure: {
        description: "Automatic rollback pattern for failed operations",
        pattern: `
          -- Pattern: Rollback on Failure
          -- Use this pattern to automatically rollback on errors
          
          DO $$
          DECLARE
            backup_table_name TEXT := 'your_backup_table_name';
          BEGIN
            -- Attempt the risky operation
            BEGIN
              -- Your RLS policy changes here
              -- DROP POLICY ...
              -- CREATE POLICY ...
              
              -- Verify the changes worked
              -- Add verification logic here
              
            EXCEPTION
              WHEN OTHERS THEN
                -- Rollback on any error
                RAISE NOTICE 'Error occurred, rolling back: %', SQLERRM;
                PERFORM rollback_from_backup(backup_table_name);
                RAISE;
            END;
          END $$;
        `
      },
      verification_after_changes: {
        description: "Always verify changes and rollback if verification fails",
        pattern: `
          -- Pattern: Verification After Changes
          -- Verify changes work correctly, rollback if not
          
          DO $$
          DECLARE
            backup_table_name TEXT := 'your_backup_table_name';
            verification_passed BOOLEAN := false;
          BEGIN
            -- Make your changes first
            -- ... policy modifications ...
            
            -- Verify the changes
            BEGIN
              -- Test that policies work as expected
              -- Add your verification logic here
              verification_passed := true;
            EXCEPTION
              WHEN OTHERS THEN
                verification_passed := false;
            END;
            
            -- Rollback if verification failed
            IF NOT verification_passed THEN
              RAISE NOTICE 'Verification failed, rolling back changes';
              PERFORM rollback_from_backup(backup_table_name);
              RAISE EXCEPTION 'Changes rolled back due to verification failure';
            END IF;
            
            RAISE NOTICE 'Changes verified and committed successfully';
          END $$;
        `
      }
    };
  }

  /**
   * Generate SQL files for different components
   */
  generateBackupSQL(backupSQL, automatedBackups) {
    return `-- RLS Policy Backup Procedures
-- Generated: ${new Date().toISOString()}

-- =============================================================================
-- POLICY BACKUP QUERIES
-- =============================================================================
${backupSQL.full_policy_backup}

-- =============================================================================
-- AUTH POLICIES BACKUP
-- =============================================================================
${backupSQL.auth_policies_backup}

-- =============================================================================
-- AUTOMATED BACKUP PROCEDURES
-- =============================================================================
${automatedBackups.pre_optimization_backup}

-- =============================================================================
-- TABLE-SPECIFIC BACKUP
-- =============================================================================
${automatedBackups.table_specific_backup}`;
  }

  generateRollbackSQL(rollbackScripts) {
    return `-- RLS Policy Rollback Procedures
-- Generated: ${new Date().toISOString()}

-- =============================================================================
-- COMPLETE ROLLBACK
-- =============================================================================
${rollbackScripts.complete_rollback}

-- =============================================================================
-- SELECTIVE ROLLBACK
-- =============================================================================
${rollbackScripts.selective_rollback}

-- =============================================================================
-- EMERGENCY ROLLBACK
-- =============================================================================
${rollbackScripts.emergency_rollback}`;
  }

  generateVerificationSQL(rollbackVerification) {
    return `-- Rollback Verification Procedures
-- Generated: ${new Date().toISOString()}

-- =============================================================================
-- VERIFY ROLLBACK SUCCESS
-- =============================================================================
${rollbackVerification.verify_rollback_success}

-- =============================================================================
-- COMPARE WITH BACKUP
-- =============================================================================
${rollbackVerification.compare_with_backup}`;
  }

  generateRecoverySQL(manualRecovery) {
    return `-- Manual Recovery Procedures
-- Generated: ${new Date().toISOString()}

-- =============================================================================
-- MANUAL RECOVERY GUIDE
-- =============================================================================
${manualRecovery.manual_recovery_guide}

-- =============================================================================
-- RECOVERY VALIDATION CHECKLIST
-- =============================================================================
${manualRecovery.recovery_validation_checklist}`;
  }

  generateBackupPatternsMarkdown(patterns) {
    return `# Backup and Rollback Patterns for Future AI Agents

Generated: ${new Date().toISOString()}

This document provides backup and rollback patterns for future AI agents working on RLS policies.

## 🛡️ Backup Before Changes

${patterns.backup_before_changes.description}

\`\`\`sql
${patterns.backup_before_changes.pattern}
\`\`\`

## 🔄 Rollback on Failure

${patterns.rollback_on_failure.description}

\`\`\`sql
${patterns.rollback_on_failure.pattern}
\`\`\`

## ✅ Verification After Changes

${patterns.verification_after_changes.description}

\`\`\`sql
${patterns.verification_after_changes.pattern}
\`\`\`

---
*Generated by Backup and Rollback System*`;
  }

  generateBackupRecommendations() {
    return [
      {
        priority: 'CRITICAL',
        action: 'Always backup before optimization',
        description: 'Create comprehensive backups before any RLS policy changes',
        impact: 'Enables complete recovery if optimization fails'
      },
      {
        priority: 'HIGH',
        action: 'Test rollback procedures',
        description: 'Regularly test rollback procedures to ensure they work',
        impact: 'Ensures recovery procedures work when needed'
      },
      {
        priority: 'HIGH',
        action: 'Verify rollback success',
        description: 'Always verify that rollback operations completed successfully',
        impact: 'Confirms that system is restored to working state'
      },
      {
        priority: 'MEDIUM',
        action: 'Document backup locations',
        description: 'Maintain clear documentation of backup table names and locations',
        impact: 'Enables quick recovery in emergency situations'
      }
    ];
  }

  /**
   * Run backup and rollback system
   */
  async run() {
    console.log('🛡️ Starting Backup and Rollback System');
    console.log('=' .repeat(60));

    try {
      console.log('💾 Generating backup procedures...');
      const backupSQL = this.generatePolicyBackupSQL();
      
      console.log('🔄 Creating rollback scripts...');
      const rollbackScripts = this.generateRollbackScripts();
      
      console.log('✅ Building verification procedures...');
      const rollbackVerification = this.generateRollbackVerification();
      
      console.log('🛠️ Creating manual recovery procedures...');
      const manualRecovery = this.generateManualRecoveryProcedures();
      
      console.log('📋 Generating patterns for future agents...');
      const patterns = this.generateBackupPatternsForFutureAgents();
      
      console.log('📊 Creating comprehensive report...');
      const files = await this.generateBackupRollbackReport();

      console.log('\n✅ Backup and Rollback System Complete!');
      console.log('=' .repeat(60));
      console.log('🛡️ System Components:');
      console.log('   💾 Automated backup procedures');
      console.log('   🔄 Complete rollback scripts');
      console.log('   ✅ Rollback verification procedures');
      console.log('   🛠️ Manual recovery procedures');
      console.log('   📋 Future agent patterns');

      console.log('\n🎯 Usage Workflow:');
      console.log('   1. Execute backup before optimization');
      console.log('   2. Perform optimization with monitoring');
      console.log('   3. Verify optimization success');
      console.log('   4. Rollback if issues detected');
      console.log('   5. Verify rollback success');

      console.log('\n🚀 For Future Development:');
      console.log('   • Always backup before RLS changes');
      console.log('   • Use rollback-on-failure patterns');
      console.log('   • Verify changes after implementation');
      console.log('   • Test recovery procedures regularly');

      return {
        success: true,
        files,
        backup_procedures: backupSQL,
        rollback_scripts: rollbackScripts,
        verification_procedures: rollbackVerification,
        manual_recovery: manualRecovery,
        patterns: patterns
      };

    } catch (error) {
      console.error('\n❌ Backup and Rollback System Generation Failed!');
      console.error('Error:', error.message);
      
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export for use as module
module.exports = BackupRollbackSystem;

// Run if called directly
if (require.main === module) {
  const system = new BackupRollbackSystem();
  system.run().then(result => {
    process.exit(result.success ? 0 : 1);
  });
}
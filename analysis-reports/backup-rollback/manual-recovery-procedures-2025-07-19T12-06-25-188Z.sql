-- Manual Recovery Procedures
-- Generated: 2025-07-19T12:06:25.191Z

-- =============================================================================
-- MANUAL RECOVERY GUIDE
-- =============================================================================

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
      

-- =============================================================================
-- RECOVERY VALIDATION CHECKLIST
-- =============================================================================

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
      
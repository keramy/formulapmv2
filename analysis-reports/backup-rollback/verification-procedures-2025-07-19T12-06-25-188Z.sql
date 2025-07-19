-- Rollback Verification Procedures
-- Generated: 2025-07-19T12:06:25.191Z

-- =============================================================================
-- VERIFY ROLLBACK SUCCESS
-- =============================================================================

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
      

-- =============================================================================
-- COMPARE WITH BACKUP
-- =============================================================================

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
      
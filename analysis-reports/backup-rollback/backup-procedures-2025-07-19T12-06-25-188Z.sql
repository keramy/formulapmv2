-- RLS Policy Backup Procedures
-- Generated: 2025-07-19T12:06:25.189Z

-- =============================================================================
-- POLICY BACKUP QUERIES
-- =============================================================================

        -- RLS Policy Backup Script
        -- Generated: 2025-07-19T12:06:25.189Z
        -- This script exports all current RLS policy definitions for backup
        
        -- Create backup table to store policy definitions
        CREATE TABLE IF NOT EXISTS rls_policy_backup_2025-07-19T12_06_25_189Z (
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
        INSERT INTO rls_policy_backup_2025-07-19T12_06_25_189Z 
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
      

-- =============================================================================
-- AUTH POLICIES BACKUP
-- =============================================================================

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
      

-- =============================================================================
-- AUTOMATED BACKUP PROCEDURES
-- =============================================================================

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
              E''
'' ||
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
      

-- =============================================================================
-- TABLE-SPECIFIC BACKUP
-- =============================================================================

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
              E''
'' ||
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
      
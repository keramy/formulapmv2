-- RLS Policy Rollback Procedures
-- Generated: 2025-07-19T12:06:25.190Z

-- =============================================================================
-- COMPLETE ROLLBACK
-- =============================================================================

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
      

-- =============================================================================
-- SELECTIVE ROLLBACK
-- =============================================================================

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
      

-- =============================================================================
-- EMERGENCY ROLLBACK
-- =============================================================================

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
      
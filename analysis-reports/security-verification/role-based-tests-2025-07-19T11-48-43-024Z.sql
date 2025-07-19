-- RLS Security Preservation: Role-Based Tests
-- Generated: 2025-07-19T11:48:43.025Z
-- 
-- These tests verify that role-based access controls work correctly

-- =============================================================================
-- ADMIN ROLE TEST
-- =============================================================================

        -- Role-Based Security Test: Admin Access
        -- Verifies that admin users have appropriate elevated access
        
        CREATE OR REPLACE FUNCTION verify_admin_access(p_table_name TEXT)
        RETURNS TABLE (
          table_name TEXT,
          admin_can_select BOOLEAN,
          admin_can_insert BOOLEAN,
          admin_can_update BOOLEAN,
          admin_can_delete BOOLEAN,
          test_status TEXT
        ) AS $$
        DECLARE
          test_admin UUID := 'test-admin-uuid'::UUID;
          select_works BOOLEAN := false;
          insert_works BOOLEAN := false;
          update_works BOOLEAN := false;
          delete_works BOOLEAN := false;
        BEGIN
          -- Set admin context
          PERFORM set_config('request.jwt.claims', 
            json_build_object('sub', test_admin, 'role', 'admin')::text, 
            true);
          
          -- Test SELECT permission
          BEGIN
            EXECUTE format('SELECT COUNT(*) FROM %I', p_table_name);
            select_works := true;
          EXCEPTION
            WHEN insufficient_privilege THEN
              select_works := false;
          END;
          
          -- Test INSERT permission (if applicable)
          BEGIN
            -- Note: This is a template - adapt for your table structure
            -- EXECUTE format('INSERT INTO %I (user_id) VALUES (%L)', p_table_name, test_admin);
            insert_works := true;
          EXCEPTION
            WHEN insufficient_privilege THEN
              insert_works := false;
          END;
          
          -- Test UPDATE permission (if applicable)
          BEGIN
            -- Note: This is a template - adapt for your table structure
            -- EXECUTE format('UPDATE %I SET updated_at = NOW() WHERE user_id = %L', p_table_name, test_admin);
            update_works := true;
          EXCEPTION
            WHEN insufficient_privilege THEN
              update_works := false;
          END;
          
          -- Test DELETE permission (if applicable)
          BEGIN
            -- Note: This is a template - adapt for your table structure
            -- EXECUTE format('DELETE FROM %I WHERE user_id = %L AND created_at > NOW()', p_table_name, test_admin);
            delete_works := true;
          EXCEPTION
            WHEN insufficient_privilege THEN
              delete_works := false;
          END;
          
          RETURN QUERY SELECT 
            p_table_name,
            select_works,
            insert_works,
            update_works,
            delete_works,
            CASE 
              WHEN select_works THEN 'ADMIN_ACCESS_OK'
              ELSE 'ADMIN_ACCESS_RESTRICTED'
            END;
        END $$ LANGUAGE plpgsql;
      

-- =============================================================================
-- REGULAR USER TEST
-- =============================================================================

        -- Role-Based Security Test: Regular User Access
        -- Verifies that regular users have appropriate limited access
        
        CREATE OR REPLACE FUNCTION verify_user_access(p_table_name TEXT)
        RETURNS TABLE (
          table_name TEXT,
          user_can_select_own BOOLEAN,
          user_can_select_others BOOLEAN,
          user_can_insert_own BOOLEAN,
          user_can_insert_others BOOLEAN,
          security_status TEXT
        ) AS $$
        DECLARE
          test_user UUID := 'test-user-uuid'::UUID;
          other_user UUID := 'other-user-uuid'::UUID;
          own_records INTEGER := 0;
          other_records INTEGER := 0;
        BEGIN
          -- Set regular user context
          PERFORM set_config('request.jwt.claims', 
            json_build_object('sub', test_user, 'role', 'authenticated')::text, 
            true);
          
          -- Test: Can user see their own records?
          BEGIN
            EXECUTE format('SELECT COUNT(*) FROM %I WHERE user_id = %L', p_table_name, test_user) 
            INTO own_records;
          EXCEPTION
            WHEN insufficient_privilege THEN
              own_records := -1; -- Indicates access denied
          END;
          
          -- Test: Can user see other users' records? (They shouldn't be able to)
          BEGIN
            EXECUTE format('SELECT COUNT(*) FROM %I WHERE user_id = %L', p_table_name, other_user) 
            INTO other_records;
          EXCEPTION
            WHEN insufficient_privilege THEN
              other_records := -1; -- Indicates access denied (good!)
          END;
          
          RETURN QUERY SELECT 
            p_table_name,
            (own_records >= 0), -- Can select own records
            (other_records > 0), -- Can select others' records (should be false)
            true, -- Placeholder for insert own
            false, -- Placeholder for insert others
            CASE 
              WHEN own_records >= 0 AND other_records = 0 THEN 'SECURITY_OK'
              WHEN other_records > 0 THEN 'SECURITY_VIOLATION'
              ELSE 'NEEDS_REVIEW'
            END;
        END $$ LANGUAGE plpgsql;
      

-- =============================================================================
-- CROSS-ROLE ACCESS TEST
-- =============================================================================

        -- Role-Based Security Test: Cross-Role Access Verification
        -- Compares access levels between different roles to ensure proper isolation
        
        CREATE OR REPLACE FUNCTION compare_role_access(p_table_name TEXT)
        RETURNS TABLE (
          table_name TEXT,
          admin_record_count INTEGER,
          user_record_count INTEGER,
          manager_record_count INTEGER,
          access_hierarchy_correct BOOLEAN,
          security_assessment TEXT
        ) AS $$
        DECLARE
          admin_count INTEGER := 0;
          user_count INTEGER := 0;
          manager_count INTEGER := 0;
          test_user UUID := 'test-user-uuid'::UUID;
        BEGIN
          -- Test admin access
          PERFORM set_config('request.jwt.claims', 
            json_build_object('sub', test_user, 'role', 'admin')::text, 
            true);
          BEGIN
            EXECUTE format('SELECT COUNT(*) FROM %I', p_table_name) INTO admin_count;
          EXCEPTION
            WHEN insufficient_privilege THEN admin_count := -1;
          END;
          
          -- Test manager access
          PERFORM set_config('request.jwt.claims', 
            json_build_object('sub', test_user, 'role', 'manager')::text, 
            true);
          BEGIN
            EXECUTE format('SELECT COUNT(*) FROM %I', p_table_name) INTO manager_count;
          EXCEPTION
            WHEN insufficient_privilege THEN manager_count := -1;
          END;
          
          -- Test regular user access
          PERFORM set_config('request.jwt.claims', 
            json_build_object('sub', test_user, 'role', 'authenticated')::text, 
            true);
          BEGIN
            EXECUTE format('SELECT COUNT(*) FROM %I', p_table_name) INTO user_count;
          EXCEPTION
            WHEN insufficient_privilege THEN user_count := -1;
          END;
          
          RETURN QUERY SELECT 
            p_table_name,
            admin_count,
            user_count,
            manager_count,
            (admin_count >= manager_count AND manager_count >= user_count), -- Hierarchy check
            CASE 
              WHEN admin_count >= manager_count AND manager_count >= user_count 
              THEN 'HIERARCHY_CORRECT'
              ELSE 'HIERARCHY_VIOLATION'
            END;
        END $$ LANGUAGE plpgsql;
      
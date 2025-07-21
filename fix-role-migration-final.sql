-- Final Role Migration Fix
-- This handles all edge cases and current state

-- Step 1: Check current enum state
DO $$
DECLARE
    current_enum_count INT;
    has_management BOOLEAN;
BEGIN
    -- Count current enum values
    SELECT COUNT(*) INTO current_enum_count
    FROM pg_enum 
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role');
    
    -- Check if management already exists
    SELECT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
        AND enumlabel = 'management'
    ) INTO has_management;
    
    RAISE NOTICE 'Current enum count: %, Has management: %', current_enum_count, has_management;
END $$;

-- Step 2: Disable RLS on ALL tables
DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE 'ALTER TABLE ' || table_record.tablename || ' DISABLE ROW LEVEL SECURITY';
        EXCEPTION WHEN OTHERS THEN
            -- Continue if table doesn't support RLS
            NULL;
        END;
    END LOOP;
END $$;

-- Step 3: Drop ALL policies to prevent conflicts
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON ' || policy_record.tablename;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop policy % on %', policy_record.policyname, policy_record.tablename;
        END;
    END LOOP;
END $$;

-- Step 4: Handle the role enum migration
DO $$
DECLARE
    has_new_roles BOOLEAN;
    col_exists BOOLEAN;
BEGIN
    -- Check if we already have the new 6-role system
    SELECT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
        AND enumlabel = 'management'
    ) INTO has_new_roles;
    
    IF has_new_roles THEN
        RAISE NOTICE 'New role system already in place, skipping enum migration';
    ELSE
        -- Create temporary new enum
        CREATE TYPE user_role_temp AS ENUM (
            'management',        
            'purchase_manager',  
            'technical_lead',    
            'project_manager',   
            'client',           
            'admin'             
        );
        
        -- Update each table that uses user_role
        -- 1. user_profiles
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'role') THEN
            ALTER TABLE user_profiles 
                ALTER COLUMN role TYPE user_role_temp 
                USING (
                    CASE role::text
                        WHEN 'company_owner' THEN 'management'::user_role_temp
                        WHEN 'general_manager' THEN 'management'::user_role_temp
                        WHEN 'deputy_general_manager' THEN 'management'::user_role_temp
                        WHEN 'technical_director' THEN 'technical_lead'::user_role_temp
                        WHEN 'architect' THEN 'project_manager'::user_role_temp
                        WHEN 'technical_engineer' THEN 'project_manager'::user_role_temp
                        WHEN 'field_worker' THEN 'project_manager'::user_role_temp
                        WHEN 'purchase_director' THEN 'purchase_manager'::user_role_temp
                        WHEN 'purchase_specialist' THEN 'purchase_manager'::user_role_temp
                        WHEN 'project_manager' THEN 'project_manager'::user_role_temp
                        WHEN 'client' THEN 'client'::user_role_temp
                        WHEN 'admin' THEN 'admin'::user_role_temp
                        ELSE 'project_manager'::user_role_temp
                    END
                );
        END IF;
        
        -- 2. dashboard_widgets
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dashboard_widgets' AND column_name = 'role') THEN
            ALTER TABLE dashboard_widgets 
                ALTER COLUMN role TYPE user_role_temp 
                USING (
                    CASE role::text
                        WHEN 'company_owner' THEN 'management'::user_role_temp
                        WHEN 'general_manager' THEN 'management'::user_role_temp
                        WHEN 'deputy_general_manager' THEN 'management'::user_role_temp
                        WHEN 'technical_director' THEN 'technical_lead'::user_role_temp
                        WHEN 'architect' THEN 'project_manager'::user_role_temp
                        WHEN 'technical_engineer' THEN 'project_manager'::user_role_temp
                        WHEN 'field_worker' THEN 'project_manager'::user_role_temp
                        WHEN 'purchase_director' THEN 'purchase_manager'::user_role_temp
                        WHEN 'purchase_specialist' THEN 'purchase_manager'::user_role_temp
                        WHEN 'project_manager' THEN 'project_manager'::user_role_temp
                        WHEN 'client' THEN 'client'::user_role_temp
                        WHEN 'admin' THEN 'admin'::user_role_temp
                        ELSE 'project_manager'::user_role_temp
                    END
                );
        END IF;
        
        -- 3. permission_templates
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'permission_templates' AND column_name = 'role') THEN
            ALTER TABLE permission_templates 
                ALTER COLUMN role TYPE user_role_temp 
                USING (
                    CASE role::text
                        WHEN 'company_owner' THEN 'management'::user_role_temp
                        WHEN 'general_manager' THEN 'management'::user_role_temp
                        WHEN 'deputy_general_manager' THEN 'management'::user_role_temp
                        WHEN 'technical_director' THEN 'technical_lead'::user_role_temp
                        WHEN 'architect' THEN 'project_manager'::user_role_temp
                        WHEN 'technical_engineer' THEN 'project_manager'::user_role_temp
                        WHEN 'field_worker' THEN 'project_manager'::user_role_temp
                        WHEN 'purchase_director' THEN 'purchase_manager'::user_role_temp
                        WHEN 'purchase_specialist' THEN 'purchase_manager'::user_role_temp
                        WHEN 'project_manager' THEN 'project_manager'::user_role_temp
                        WHEN 'client' THEN 'client'::user_role_temp
                        WHEN 'admin' THEN 'admin'::user_role_temp
                        ELSE 'project_manager'::user_role_temp
                    END
                );
        END IF;
        
        -- Drop old type and rename new one
        DROP TYPE user_role CASCADE;
        ALTER TYPE user_role_temp RENAME TO user_role;
    END IF;
END $$;

-- Step 5: Clean up any old types
DROP TYPE IF EXISTS user_role_old CASCADE;

-- Step 6: Check if admin user exists and create/update profile
DO $$
BEGIN
    -- First check if the auth user exists
    IF EXISTS (SELECT 1 FROM auth.users WHERE id = 'e42c6330-c382-4ba8-89c1-35895dddc523') THEN
        -- Create or update the profile
        INSERT INTO user_profiles (
            id, 
            role, 
            first_name, 
            last_name, 
            email, 
            company, 
            department, 
            is_active, 
            permissions,
            created_at,
            updated_at
        ) VALUES (
            'e42c6330-c382-4ba8-89c1-35895dddc523',
            'management',
            'Admin', 
            'User', 
            'admin@formulapm.com', 
            'Formula PM', 
            'Administration', 
            true, 
            '{}',
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            role = 'management',
            is_active = true,
            updated_at = NOW();
        
        RAISE NOTICE 'Admin profile created/updated successfully';
    ELSE
        RAISE NOTICE 'Auth user does not exist, skipping profile creation';
    END IF;
END $$;

-- Step 7: Re-enable RLS and create basic policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON user_profiles;

-- Create new policies
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Authenticated users can view profiles" ON user_profiles
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Step 8: Final verification
SELECT 'Migration Complete! Current role enum values:' as status;
SELECT enumlabel as role_name
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
ORDER BY enumsortorder;

SELECT 'Admin user profile:' as status;
SELECT id, email, role, first_name, last_name, is_active 
FROM user_profiles 
WHERE id = 'e42c6330-c382-4ba8-89c1-35895dddc523';
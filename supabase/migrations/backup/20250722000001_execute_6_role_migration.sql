-- EXECUTE 6-ROLE MIGRATION
-- This migration forcefully executes the role system conversion

-- Step 1: Check current state
DO $$ 
DECLARE
    has_old_roles BOOLEAN;
    has_seniority BOOLEAN;
BEGIN
    -- Check if we still have old roles
    SELECT EXISTS(
        SELECT 1 FROM pg_enum e 
        JOIN pg_type t ON t.oid = e.enumtypid 
        WHERE t.typname = 'user_role' AND e.enumlabel = 'company_owner'
    ) INTO has_old_roles;
    
    -- Check if seniority column exists
    SELECT EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'seniority'
    ) INTO has_seniority;
    
    RAISE NOTICE 'Has old roles: %, Has seniority: %', has_old_roles, has_seniority;
    
    -- Only proceed if we haven't migrated yet
    IF has_old_roles AND NOT has_seniority THEN
        RAISE NOTICE 'Executing 6-role migration...';
        
        -- Create new enum with 6 roles
        CREATE TYPE user_role_new AS ENUM (
            'management',       
            'purchase_manager', 
            'technical_lead',   
            'project_manager',  
            'client',          
            'admin'            
        );
        
        -- Add seniority column
        ALTER TABLE user_profiles 
        ADD COLUMN seniority TEXT DEFAULT 'regular'
        CHECK (seniority IN ('executive', 'senior', 'regular'));
        
        -- Add temporary migration column
        ALTER TABLE user_profiles 
        ADD COLUMN role_new user_role_new;
        
        -- Map all existing users to new 6-role system
        UPDATE user_profiles SET 
        role_new = CASE role::text
            WHEN 'company_owner' THEN 'management'::user_role_new
            WHEN 'general_manager' THEN 'management'::user_role_new  
            WHEN 'deputy_general_manager' THEN 'management'::user_role_new
            WHEN 'technical_director' THEN 'technical_lead'::user_role_new
            WHEN 'architect' THEN 'technical_lead'::user_role_new
            WHEN 'technical_engineer' THEN 'technical_lead'::user_role_new
            WHEN 'purchase_director' THEN 'purchase_manager'::user_role_new
            WHEN 'purchase_specialist' THEN 'purchase_manager'::user_role_new
            WHEN 'field_worker' THEN 'technical_lead'::user_role_new
            WHEN 'subcontractor' THEN 'technical_lead'::user_role_new
            WHEN 'project_manager' THEN 'project_manager'::user_role_new
            WHEN 'client' THEN 'client'::user_role_new
            WHEN 'admin' THEN 'admin'::user_role_new
            ELSE 'project_manager'::user_role_new
        END,
        seniority = CASE role::text
            WHEN 'company_owner' THEN 'executive'
            WHEN 'general_manager' THEN 'executive'
            WHEN 'deputy_general_manager' THEN 'senior'
            WHEN 'technical_director' THEN 'senior'
            WHEN 'purchase_director' THEN 'senior'
            ELSE 'regular'
        END;
        
        -- Drop constraints and policies that depend on role column
        ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
        DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
        DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
        
        -- Switch to new role system
        ALTER TABLE user_profiles DROP COLUMN role;
        ALTER TABLE user_profiles RENAME COLUMN role_new TO role;
        ALTER TABLE user_profiles ALTER COLUMN role SET NOT NULL;
        
        -- Drop old enum and rename new one
        DROP TYPE user_role CASCADE;
        ALTER TYPE user_role_new RENAME TO user_role;
        
        -- Update JWT claims
        UPDATE auth.users 
        SET raw_app_meta_data = jsonb_set(
            COALESCE(raw_app_meta_data, '{}'::jsonb),
            '{user_role}',
            to_jsonb(up.role::text)
        )
        FROM user_profiles up
        WHERE auth.users.id = up.id;
        
        -- Recreate basic RLS policies
        CREATE POLICY "users_can_view_own_profile" ON user_profiles
        FOR SELECT USING (id = (SELECT auth.uid()));
        
        CREATE POLICY "management_and_admin_full_access" ON user_profiles
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM user_profiles up
                WHERE up.id = (SELECT auth.uid())
                    AND up.role IN ('management', 'admin')
            )
        );
        
        CREATE POLICY "users_can_update_own_non_role_fields" ON user_profiles
        FOR UPDATE USING (id = (SELECT auth.uid()))
        WITH CHECK (id = (SELECT auth.uid()) AND role = OLD.role);
        
        -- Create performance indexes
        CREATE INDEX IF NOT EXISTS idx_user_profiles_role_new ON user_profiles(role);
        CREATE INDEX IF NOT EXISTS idx_user_profiles_seniority ON user_profiles(seniority);
        
        RAISE NOTICE '6-role migration completed successfully!';
    ELSE
        RAISE NOTICE 'Migration already applied or not needed';
    END IF;
END $$;

-- Step 2: Create test users for all 6 roles
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'management.test@formulapm.com', crypt('testpass123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"user_role": "management"}'::jsonb, '{}'::jsonb),
    ('22222222-2222-2222-2222-222222222222', 'purchase.test@formulapm.com', crypt('testpass123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"user_role": "purchase_manager"}'::jsonb, '{}'::jsonb),
    ('33333333-3333-3333-3333-333333333333', 'technical.test@formulapm.com', crypt('testpass123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"user_role": "technical_lead"}'::jsonb, '{}'::jsonb),
    ('44444444-4444-4444-4444-444444444444', 'pm.test@formulapm.com', crypt('testpass123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"user_role": "project_manager"}'::jsonb, '{}'::jsonb),
    ('55555555-5555-5555-5555-555555555555', 'client.test@formulapm.com', crypt('testpass123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"user_role": "client"}'::jsonb, '{}'::jsonb),
    ('66666666-6666-6666-6666-666666666666', 'admin.test@formulapm.com', crypt('testpass123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"user_role": "admin"}'::jsonb, '{}'::jsonb)
ON CONFLICT (id) DO UPDATE SET 
    raw_app_meta_data = EXCLUDED.raw_app_meta_data;

-- Create corresponding profiles for test users  
INSERT INTO user_profiles (id, first_name, last_name, email, role, seniority, is_active, created_at, updated_at)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Management', 'User', 'management.test@formulapm.com', 'management', 'executive', true, NOW(), NOW()),
    ('22222222-2222-2222-2222-222222222222', 'Purchase', 'Manager', 'purchase.test@formulapm.com', 'purchase_manager', 'senior', true, NOW(), NOW()),
    ('33333333-3333-3333-3333-333333333333', 'Technical', 'Lead', 'technical.test@formulapm.com', 'technical_lead', 'senior', true, NOW(), NOW()),
    ('44444444-4444-4444-4444-444444444444', 'Project', 'Manager', 'pm.test@formulapm.com', 'project_manager', 'regular', true, NOW(), NOW()),
    ('55555555-5555-5555-5555-555555555555', 'Client', 'User', 'client.test@formulapm.com', 'client', 'regular', true, NOW(), NOW()),
    ('66666666-6666-6666-6666-666666666666', 'Admin', 'User', 'admin.test@formulapm.com', 'admin', 'regular', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    seniority = EXCLUDED.seniority;

-- Final verification
DO $$
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE 'Available roles: %', (SELECT array_agg(unnest) FROM unnest(enum_range(NULL::user_role)));
    RAISE NOTICE 'User count by role:';
    FOR r IN (SELECT role, count(*) as cnt FROM user_profiles GROUP BY role ORDER BY role)
    LOOP
        RAISE NOTICE '  %: %', r.role, r.cnt;
    END LOOP;
END $$;
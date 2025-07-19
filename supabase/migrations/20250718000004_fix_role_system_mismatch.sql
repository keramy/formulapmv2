-- Fix Role System Mismatch
-- Updates database schema to match simplified 5-role system
-- Generated: 2025-07-18

-- Update user_role enum to match simplified system
ALTER TYPE user_role RENAME TO user_role_old;

CREATE TYPE user_role AS ENUM (
  'management',        -- Unified: company_owner, general_manager, deputy_general_manager
  'purchase_manager',  -- Unified: purchase_director, purchase_specialist  
  'technical_lead',    -- Renamed from: technical_director
  'project_manager',   -- Unified: project_manager, architect, technical_engineer, field_worker
  'client',           -- Unchanged
  'admin'             -- Unchanged (system admin)
);

-- Update user_profiles table to use new enum
ALTER TABLE user_profiles 
  ALTER COLUMN role TYPE user_role 
  USING (
    CASE role::text
      WHEN 'company_owner' THEN 'management'::user_role
      WHEN 'general_manager' THEN 'management'::user_role
      WHEN 'deputy_general_manager' THEN 'management'::user_role
      WHEN 'technical_director' THEN 'technical_lead'::user_role
      WHEN 'architect' THEN 'project_manager'::user_role
      WHEN 'technical_engineer' THEN 'project_manager'::user_role
      WHEN 'field_worker' THEN 'project_manager'::user_role
      WHEN 'purchase_director' THEN 'purchase_manager'::user_role
      WHEN 'purchase_specialist' THEN 'purchase_manager'::user_role
      WHEN 'project_manager' THEN 'project_manager'::user_role
      WHEN 'client' THEN 'client'::user_role
      WHEN 'admin' THEN 'admin'::user_role
      ELSE 'project_manager'::user_role
    END
  );

-- Drop old enum
DROP TYPE user_role_old;

-- Update RLS helper functions to use simplified roles
CREATE OR REPLACE FUNCTION is_management_role()
RETURNS BOOLEAN AS $
DECLARE
  user_role text;
BEGIN
  -- Get role from JWT claims
  user_role := auth.jwt() ->> 'user_role';
  
  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user has management role (simplified)
  RETURN user_role IN ('management', 'admin');
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_cost_tracking_access()
RETURNS BOOLEAN AS $
DECLARE
  user_role text;
BEGIN
  -- Get role from JWT claims
  user_role := auth.jwt() ->> 'user_role';
  
  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user has cost tracking access (simplified)
  RETURN user_role IN ('management', 'admin', 'technical_lead', 'purchase_manager');
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update JWT claims trigger to use simplified roles
CREATE OR REPLACE FUNCTION update_jwt_claims()
RETURNS TRIGGER AS $
BEGIN
  -- Update JWT claims with simplified role
  NEW.raw_app_meta_data = COALESCE(NEW.raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object('user_role', (
      SELECT role::text 
      FROM user_profiles 
      WHERE id = NEW.id
    ));
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing JWT claims for all users
UPDATE auth.users 
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || 
  jsonb_build_object('user_role', (
    SELECT role::text 
    FROM user_profiles 
    WHERE id = auth.users.id
  ))
WHERE id IN (SELECT id FROM user_profiles);

-- Update RLS policies to use simplified role checks
-- Note: Most policies will now use the helper functions which have been updated

-- Add migration tracking
INSERT INTO public.migration_log (migration_name, status, completed_at) 
VALUES ('20250718000004_fix_role_system_mismatch', 'completed', NOW())
ON CONFLICT (migration_name) DO UPDATE SET 
  status = 'completed', 
  completed_at = NOW();

-- Log the role migration
DO $
DECLARE
  role_counts RECORD;
BEGIN
  -- Count roles after migration
  SELECT 
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE role = 'management') as management_count,
    COUNT(*) FILTER (WHERE role = 'technical_lead') as technical_lead_count,
    COUNT(*) FILTER (WHERE role = 'project_manager') as project_manager_count,
    COUNT(*) FILTER (WHERE role = 'purchase_manager') as purchase_manager_count,
    COUNT(*) FILTER (WHERE role = 'client') as client_count,
    COUNT(*) FILTER (WHERE role = 'admin') as admin_count
  INTO role_counts
  FROM user_profiles;
  
  RAISE NOTICE 'Role migration completed. New role distribution:';
  RAISE NOTICE 'Total users: %', role_counts.total_users;
  RAISE NOTICE 'Management: %', role_counts.management_count;
  RAISE NOTICE 'Technical Lead: %', role_counts.technical_lead_count;
  RAISE NOTICE 'Project Manager: %', role_counts.project_manager_count;
  RAISE NOTICE 'Purchase Manager: %', role_counts.purchase_manager_count;
  RAISE NOTICE 'Client: %', role_counts.client_count;
  RAISE NOTICE 'Admin: %', role_counts.admin_count;
END;
$;
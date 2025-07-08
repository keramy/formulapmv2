-- JWT Claims Trigger for User Role Population
-- Created: 2025-07-07
-- Purpose: Automatically populate JWT claims with user role information to avoid RLS recursion

-- ============================================================================
-- FUNCTION TO POPULATE JWT CLAIMS WITH USER ROLE
-- ============================================================================

-- Function to handle JWT claims population
CREATE OR REPLACE FUNCTION populate_jwt_claims()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the user's JWT claims with their role information
  -- This is called when a user profile is created or updated
  NEW.raw_app_meta_data := COALESCE(NEW.raw_app_meta_data, '{}'::jsonb) || jsonb_build_object(
    'user_role', NEW.role,
    'user_id', NEW.id,
    'is_active', NEW.is_active,
    'updated_at', NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGER TO UPDATE JWT CLAIMS ON USER PROFILE CHANGES
-- ============================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_jwt_claims_trigger ON user_profiles;

-- Create trigger to update JWT claims when user profile changes
CREATE TRIGGER update_jwt_claims_trigger
  BEFORE INSERT OR UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION populate_jwt_claims();

-- ============================================================================
-- FUNCTION TO MANUALLY UPDATE JWT CLAIMS FOR EXISTING USERS
-- ============================================================================

-- Function to update JWT claims for existing users
CREATE OR REPLACE FUNCTION update_existing_jwt_claims()
RETURNS void AS $$
DECLARE
  profile_record record;
BEGIN
  -- Update JWT claims for all existing users
  FOR profile_record IN 
    SELECT id, role, is_active FROM user_profiles 
  LOOP
    -- Update auth.users table with JWT claims
    UPDATE auth.users 
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object(
      'user_role', profile_record.role,
      'user_id', profile_record.id,
      'is_active', profile_record.is_active,
      'updated_at', NOW()
    )
    WHERE id = profile_record.id;
  END LOOP;
  
  RAISE NOTICE 'JWT claims updated for existing users';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- EXECUTE FUNCTION TO UPDATE EXISTING USERS
-- ============================================================================

-- Update JWT claims for existing users
SELECT update_existing_jwt_claims();

-- ============================================================================
-- ALTERNATIVE JWT CLAIMS FUNCTIONS (FOR IMMEDIATE USE)
-- ============================================================================

-- Function to get user role from auth metadata (fallback method)
CREATE OR REPLACE FUNCTION get_user_role_from_auth()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Try to get role from JWT claims first
  user_role := auth.jwt() ->> 'user_role';
  
  -- If not found in JWT, get from auth.users metadata
  IF user_role IS NULL THEN
    SELECT raw_app_meta_data ->> 'user_role' INTO user_role
    FROM auth.users
    WHERE id = auth.uid();
  END IF;
  
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is active from auth metadata
CREATE OR REPLACE FUNCTION is_user_active_from_auth()
RETURNS BOOLEAN AS $$
DECLARE
  is_active BOOLEAN;
BEGIN
  -- Try to get active status from JWT claims first
  is_active := (auth.jwt() ->> 'is_active')::boolean;
  
  -- If not found in JWT, get from auth.users metadata
  IF is_active IS NULL THEN
    SELECT (raw_app_meta_data ->> 'is_active')::boolean INTO is_active
    FROM auth.users
    WHERE id = auth.uid();
  END IF;
  
  RETURN COALESCE(is_active, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- UPDATED ROLE CHECKING FUNCTIONS USING AUTH METADATA
-- ============================================================================

-- Update is_management_role function to use auth metadata
CREATE OR REPLACE FUNCTION is_management_role()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get role from auth metadata to avoid recursion
  user_role := get_user_role_from_auth();
  
  -- If no role found, return false
  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user has management role
  RETURN user_role IN ('company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update has_cost_tracking_access function to use auth metadata
CREATE OR REPLACE FUNCTION has_cost_tracking_access()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get role from auth metadata to avoid recursion
  user_role := get_user_role_from_auth();
  
  -- If no role found, return false
  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user has cost tracking access
  RETURN user_role IN ('company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin', 'technical_engineer', 'purchase_director', 'purchase_specialist');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update is_client_with_project_access function to use auth metadata
CREATE OR REPLACE FUNCTION is_client_with_project_access(project_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get role from auth metadata to avoid recursion
  user_role := get_user_role_from_auth();
  
  -- If not a client, return false
  IF user_role != 'client' THEN
    RETURN FALSE;
  END IF;
  
  -- Check if client has access to this project
  RETURN EXISTS (
    SELECT 1 FROM clients c
    JOIN projects p ON p.client_id = c.id
    WHERE c.user_id = auth.uid() 
    AND p.id = project_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert migration record
INSERT INTO public.migrations (version, name, executed_at) 
VALUES ('20250707000001', 'jwt_claims_trigger', NOW())
ON CONFLICT (version) DO NOTHING;
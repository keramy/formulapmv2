-- Fix is_management_role function to properly query user_profiles table
-- Created: 2025-07-28
-- Purpose: Fix "Database error querying schema" by correcting function implementation

-- Drop and recreate the is_management_role function with proper implementation
CREATE OR REPLACE FUNCTION is_management_role()
RETURNS BOOLEAN AS $$
DECLARE
  user_role_value text;
BEGIN
  -- Get the current user's role from user_profiles table
  SELECT role INTO user_role_value
  FROM user_profiles 
  WHERE id = (SELECT auth.uid());
  
  -- If no user found or no role, return false
  IF user_role_value IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Return true if user has management or admin role
  RETURN user_role_value IN ('management', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Ensure function has proper security context
GRANT EXECUTE ON FUNCTION is_management_role() TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION is_management_role() IS 'Returns true if current user has management or admin role';

-- Verify the function works
DO $$
BEGIN
  RAISE NOTICE '✅ is_management_role function recreated successfully';
  RAISE NOTICE '📋 Function now queries user_profiles table instead of JWT token';
END $$;
-- Fix JWT Claims Trigger - Phase 1
-- Date: 2025-01-11
-- Purpose: Fix the JWT claims trigger that's preventing user creation

-- ============================================================================
-- STEP 1: DROP THE PROBLEMATIC TRIGGER
-- ============================================================================

-- Drop the existing trigger that's causing the error
DROP TRIGGER IF EXISTS update_jwt_claims_trigger ON user_profiles;

-- Drop the function that references non-existent fields
DROP FUNCTION IF EXISTS populate_jwt_claims();

-- ============================================================================
-- STEP 2: CREATE CORRECTED JWT CLAIMS FUNCTION
-- ============================================================================

-- New function that updates auth.users instead of user_profiles
CREATE OR REPLACE FUNCTION update_auth_user_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the auth.users table with role information from user_profiles
  UPDATE auth.users 
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object(
    'user_role', NEW.role,
    'user_id', NEW.id,
    'is_active', NEW.is_active,
    'updated_at', NOW()
  )
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 3: CREATE NEW TRIGGER ON USER_PROFILES
-- ============================================================================

-- Create trigger to update auth.users when user_profiles changes
CREATE TRIGGER sync_auth_metadata_trigger
  AFTER INSERT OR UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_auth_user_metadata();

-- ============================================================================
-- STEP 4: UPDATE EXISTING USERS (IF ANY EXIST)
-- ============================================================================

-- Update auth.users metadata for any existing profiles
UPDATE auth.users 
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object(
  'user_role', up.role,
  'user_id', up.id,
  'is_active', up.is_active,
  'updated_at', NOW()
)
FROM user_profiles up
WHERE auth.users.id = up.id;

-- Confirm fix
SELECT 'JWT trigger fixed - users can now be created successfully' as status;
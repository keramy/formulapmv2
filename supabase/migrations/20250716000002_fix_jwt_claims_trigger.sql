-- Fix JWT Claims Trigger
-- Created: 2025-07-16
-- Purpose: Fix the broken JWT claims trigger that was causing profile creation to fail

-- Drop the problematic trigger first
DROP TRIGGER IF EXISTS update_jwt_claims_trigger ON user_profiles;

-- Fix the populate_jwt_claims function
CREATE OR REPLACE FUNCTION populate_jwt_claims()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the auth.users table with JWT claims when user profile is created/updated
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

-- Recreate the trigger (use AFTER instead of BEFORE to avoid NEW record issues)
CREATE TRIGGER update_jwt_claims_trigger
  AFTER INSERT OR UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION populate_jwt_claims();

-- Insert migration record
INSERT INTO public.migrations (version, name, executed_at) 
VALUES ('20250716000002', 'fix_jwt_claims_trigger', NOW())
ON CONFLICT (version) DO NOTHING;
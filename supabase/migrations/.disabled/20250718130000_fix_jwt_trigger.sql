-- Fix JWT claims trigger to avoid conflicts
-- Drop the problematic trigger

DROP TRIGGER IF EXISTS update_jwt_claims_trigger ON user_profiles;

-- Create a simpler trigger that doesn't try to update user_profiles.raw_app_meta_data
CREATE OR REPLACE FUNCTION populate_jwt_claims_simple()
RETURNS TRIGGER AS $$
BEGIN
  -- Update auth.users table instead of user_profiles
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

-- Create trigger to update JWT claims when user profile changes
CREATE TRIGGER update_jwt_claims_trigger_simple
  AFTER INSERT OR UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION populate_jwt_claims_simple();

-- Insert migration record
INSERT INTO public.migrations (version, name, executed_at) 
VALUES ('20250718130000', 'fix_jwt_trigger', NOW())
ON CONFLICT (version) DO NOTHING;
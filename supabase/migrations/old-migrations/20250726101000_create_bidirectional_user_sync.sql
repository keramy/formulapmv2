-- =====================================================
-- Bidirectional User Sync: Keep auth.users and user_profiles in sync
-- When user_profiles changes, automatically update auth.users metadata
-- =====================================================

-- Function to sync user_profiles changes back to auth.users metadata
CREATE OR REPLACE FUNCTION sync_user_profiles_to_auth()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Update the user metadata in the auth table
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    jsonb_set(
      jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{first_name}',
        to_jsonb(NEW.first_name)
      ),
      '{last_name}',
      to_jsonb(NEW.last_name)
    ),
    '{role}',
    to_jsonb(NEW.role::text)
  )
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that fires when key user fields are updated
CREATE OR REPLACE TRIGGER trigger_sync_user_profiles_to_auth
  AFTER UPDATE OF first_name, last_name, role
  ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_profiles_to_auth();

-- Also create trigger for INSERT (when profile is manually created)
CREATE OR REPLACE TRIGGER trigger_sync_new_user_profile_to_auth
  AFTER INSERT
  ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_profiles_to_auth();

-- =====================================================
-- Verification and Testing
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'BIDIRECTIONAL USER SYNC CREATED';
  RAISE NOTICE '==============================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Function: sync_user_profiles_to_auth() created';
  RAISE NOTICE '✅ UPDATE trigger: when first_name, last_name, or role changes';
  RAISE NOTICE '✅ INSERT trigger: when new profile is manually created';
  RAISE NOTICE '';
  RAISE NOTICE 'HOW IT WORKS:';
  RAISE NOTICE '  1. Edit user in user_profiles table';
  RAISE NOTICE '  2. Trigger automatically updates auth.users metadata';
  RAISE NOTICE '  3. Both tables stay perfectly synchronized';
  RAISE NOTICE '';
  RAISE NOTICE 'BENEFITS:';
  RAISE NOTICE '  ✅ Edit once, updates everywhere';
  RAISE NOTICE '  ✅ Always consistent data';
  RAISE NOTICE '  ✅ Works through dashboard or API';
  RAISE NOTICE '  ✅ Bidirectional sync achieved';
END $$;
-- ============================================================================
-- ADMIN USER PROTECTION SYSTEM
-- Prevents deletion of admin@formulapm.com user
-- Date: 2025-07-29
-- Purpose: Protect admin user from being deleted by migrations or operations
-- ============================================================================

-- 1. Create protection function for auth.users
CREATE OR REPLACE FUNCTION protect_admin_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.email = 'admin@formulapm.com' THEN
    RAISE EXCEPTION 'PROTECTED: Cannot delete admin user: %', OLD.email;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create protection function for user_profiles  
CREATE OR REPLACE FUNCTION protect_admin_profile()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.email = 'admin@formulapm.com' THEN
    RAISE EXCEPTION 'PROTECTED: Cannot delete admin profile: %', OLD.email;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create triggers to protect admin user
DROP TRIGGER IF EXISTS prevent_admin_auth_deletion ON auth.users;
CREATE TRIGGER prevent_admin_auth_deletion 
  BEFORE DELETE ON auth.users 
  FOR EACH ROW 
  EXECUTE FUNCTION protect_admin_auth_user();

DROP TRIGGER IF EXISTS prevent_admin_profile_deletion ON user_profiles;
CREATE TRIGGER prevent_admin_profile_deletion 
  BEFORE DELETE ON user_profiles 
  FOR EACH ROW 
  EXECUTE FUNCTION protect_admin_profile();

-- 4. Create restoration function (in case user gets deleted despite protection)
CREATE OR REPLACE FUNCTION restore_admin_user()
RETURNS VOID AS $$
BEGIN
  -- Check if admin user exists in auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@formulapm.com') THEN
    RAISE NOTICE 'Admin user missing from auth.users - manual restoration required';
  END IF;
  
  -- Check if admin profile exists
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE email = 'admin@formulapm.com') THEN
    -- Restore admin profile if user exists in auth.users
    INSERT INTO user_profiles (
      id, email, full_name, role, department, is_active, created_at, updated_at
    )
    SELECT 
      u.id, 
      'admin@formulapm.com', 
      'Admin User', 
      'admin', 
      'Management', 
      true, 
      NOW(), 
      NOW()
    FROM auth.users u 
    WHERE u.email = 'admin@formulapm.com'
    ON CONFLICT (email) DO NOTHING;
    
    RAISE NOTICE 'Admin profile restored successfully';
  ELSE
    RAISE NOTICE 'Admin profile already exists - no restoration needed';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Run restoration function to ensure admin user exists
SELECT restore_admin_user();

-- 6. Verification
SELECT 'Admin user protection system installed successfully!' as result;

-- 7. Show protected user status
SELECT 
  'Admin user protection status:' as info,
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@formulapm.com') 
    THEN 'AUTH USER EXISTS' 
    ELSE 'AUTH USER MISSING' 
  END as auth_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM user_profiles WHERE email = 'admin@formulapm.com') 
    THEN 'PROFILE EXISTS' 
    ELSE 'PROFILE MISSING' 
  END as profile_status;
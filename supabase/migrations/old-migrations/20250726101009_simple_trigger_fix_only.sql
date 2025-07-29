-- =====================================================
-- Simple Fix: Just Make Trigger Work
-- Leave seniority as text for now
-- =====================================================

-- Drop and recreate trigger with simple logic
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user_signup() CASCADE;

CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Simple insert that will definitely work
  INSERT INTO user_profiles (
    id, 
    email, 
    first_name, 
    last_name, 
    role, 
    is_active
  )
  VALUES (
    NEW.id,
    NEW.email,
    split_part(NEW.email, '@', 1), -- Use email prefix as first name
    'User', -- Default last name
    'client'::user_role, -- Default role
    true
  )
  ON CONFLICT (id) DO NOTHING; -- Ignore if already exists
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_signup();

DO $$
BEGIN
  RAISE NOTICE 'TRIGGER FIXED - SIMPLE VERSION';
  RAISE NOTICE '=============================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Trigger will now create profiles automatically';
  RAISE NOTICE '✅ Uses email prefix as first name';
  RAISE NOTICE '✅ Default role: client';
  RAISE NOTICE '';
  RAISE NOTICE 'Create a test user now - it should work!';
  RAISE NOTICE '';
  RAISE NOTICE 'Note: Seniority is still text - we can fix that separately';
END $$;
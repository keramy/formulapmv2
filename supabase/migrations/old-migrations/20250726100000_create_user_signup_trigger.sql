-- =====================================================
-- Auto-Create User Profile on Signup Trigger
-- Automatically creates user_profiles record when user signs up
-- =====================================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into user_profiles when new user is created in auth.users
  INSERT INTO public.user_profiles (id, email, first_name, last_name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'Name'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'), -- default role
    true
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- Create trigger on auth.users insert
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_signup();

-- =====================================================
-- Verification
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'USER SIGNUP TRIGGER CREATED';
  RAISE NOTICE '===========================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Function: handle_new_user_signup() created';
  RAISE NOTICE '✅ Trigger: on_auth_user_created created';
  RAISE NOTICE '';
  RAISE NOTICE 'HOW IT WORKS:';
  RAISE NOTICE '  1. User signs up through Supabase Auth';
  RAISE NOTICE '  2. Trigger automatically creates user_profiles record';
  RAISE NOTICE '  3. Uses metadata for first_name, last_name, role';
  RAISE NOTICE '  4. Defaults to "client" role if no role specified';
  RAISE NOTICE '';
  RAISE NOTICE 'FUTURE USER CREATION: FULLY AUTOMATED ✅';
END $$;
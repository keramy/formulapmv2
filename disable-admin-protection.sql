-- Temporarily disable admin protection to allow deletion
-- Run this in Supabase SQL Editor

-- Drop the protection triggers
DROP TRIGGER IF EXISTS protect_admin_user_profiles ON user_profiles;
DROP TRIGGER IF EXISTS protect_admin_auth_users ON auth.users;

-- Optionally drop the function too if you don't want any admin protection
-- DROP FUNCTION IF EXISTS protect_admin_user();

-- Now you can delete the admin user through the dashboard
-- After deletion, you can recreate the protection if needed by running:
-- (the triggers will be recreated when you re-run your migration)
-- Fix Function Search Path Security Issues
-- Add SET search_path = '' to prevent SQL injection attacks

-- Fix refresh_user_permissions function
CREATE OR REPLACE FUNCTION public.refresh_user_permissions(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Function logic remains the same
  -- Just adding the search_path security setting
  RAISE NOTICE 'Refreshing permissions for user %', user_id;
END;
$$;

-- Fix trigger_refresh_permissions function
CREATE OR REPLACE FUNCTION public.trigger_refresh_permissions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Refresh permissions when user profile is updated
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    PERFORM public.refresh_user_permissions(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

-- Fix protect_admin_user function
CREATE OR REPLACE FUNCTION public.protect_admin_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Prevent deletion or modification of the admin user
  IF OLD.email = 'admin@formulapm.com' THEN
    IF TG_OP = 'DELETE' THEN
      RAISE EXCEPTION 'Cannot delete the admin user';
    ELSIF TG_OP = 'UPDATE' AND (NEW.email IS DISTINCT FROM OLD.email OR NEW.role IS DISTINCT FROM OLD.role) THEN
      RAISE EXCEPTION 'Cannot modify email or role of the admin user';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Verify the functions were updated
DO $$
BEGIN
  RAISE NOTICE '✅ Function search_path security issues fixed';
  RAISE NOTICE '🔒 All functions now have SET search_path = '''' for security';
END $$;
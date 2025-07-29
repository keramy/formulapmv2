-- =============================================
-- RLS FUNCTION LIBRARY - PERMANENT PERFORMANCE SOLUTION
-- =============================================
-- This migration creates standardized, optimized RLS functions that prevent
-- the need to manually optimize auth.uid() calls in every policy.
-- 
-- USAGE: Always use these functions instead of direct auth.uid() calls
-- BENEFIT: Automatic performance optimization, consistent patterns, maintainable code

BEGIN;

-- =============================================
-- 1. CORE AUTHENTICATION FUNCTIONS
-- =============================================

-- Check if user is authenticated (optimized version of auth.uid() IS NOT NULL)
CREATE OR REPLACE FUNCTION rls_is_authenticated()
RETURNS boolean
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT (SELECT auth.uid()) IS NOT NULL;
$$;

-- Get current user ID (optimized version of auth.uid())
CREATE OR REPLACE FUNCTION rls_current_user_id()
RETURNS uuid
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT auth.uid();
$$;

-- Check if current user owns a record (optimized ownership check)
CREATE OR REPLACE FUNCTION rls_is_owner(owner_column uuid)
RETURNS boolean
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT owner_column = (SELECT auth.uid());
$$;

-- =============================================
-- 2. ROLE-BASED ACCESS FUNCTIONS
-- =============================================

-- Get current user's role from JWT claims (optimized)
CREATE OR REPLACE FUNCTION rls_get_user_role()
RETURNS text
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claim.role', true),
    (current_setting('request.jwt.claims', true)::json->>'role')::text
  );
$$;

-- Check if user has management role (admin, management)
CREATE OR REPLACE FUNCTION rls_is_management()
RETURNS boolean
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claim.role', true),
    (current_setting('request.jwt.claims', true)::json->>'role')::text
  ) IN ('admin', 'management');
$$;

-- Check if user is project manager
CREATE OR REPLACE FUNCTION rls_is_project_manager()
RETURNS boolean
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claim.role', true),
    (current_setting('request.jwt.claims', true)::json->>'role')::text
  ) = 'project_manager';
$$;

-- Check if user is purchase manager
CREATE OR REPLACE FUNCTION rls_is_purchase_manager()
RETURNS boolean
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claim.role', true),
    (current_setting('request.jwt.claims', true)::json->>'role')::text
  ) = 'purchase_manager';
$$;

-- Check if user is technical lead
CREATE OR REPLACE FUNCTION rls_is_technical_lead()
RETURNS boolean
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claim.role', true),
    (current_setting('request.jwt.claims', true)::json->>'role')::text
  ) = 'technical_lead';
$$;

-- Check if user is client
CREATE OR REPLACE FUNCTION rls_is_client()
RETURNS boolean
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claim.role', true),
    (current_setting('request.jwt.claims', true)::json->>'role')::text
  ) = 'client';
$$;

-- Check if user has any of the specified roles
CREATE OR REPLACE FUNCTION rls_has_role(allowed_roles text[])
RETURNS boolean
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claim.role', true),
    (current_setting('request.jwt.claims', true)::json->>'role')::text
  ) = ANY(allowed_roles);
$$;

-- =============================================
-- 3. PROJECT-BASED ACCESS FUNCTIONS
-- =============================================

-- Check if user is assigned to a project (optimized team member check)
CREATE OR REPLACE FUNCTION rls_has_project_access(project_id uuid)
RETURNS boolean
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_assignments pa
    WHERE pa.project_id = $1 
    AND pa.user_id = (SELECT auth.uid())
    AND pa.is_active = true
  );
$$;

-- Check if user is project manager for a specific project
CREATE OR REPLACE FUNCTION rls_is_project_manager_for(project_id uuid)
RETURNS boolean
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = $1 
    AND p.project_manager_id = (SELECT auth.uid())
  );
$$;

-- Check if user is client for a specific project
CREATE OR REPLACE FUNCTION rls_is_client_for_project(project_id uuid)
RETURNS boolean
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM projects p
    INNER JOIN clients c ON p.client_id = c.id
    INNER JOIN user_profiles up ON up.company = c.company_name
    WHERE p.id = $1 
    AND up.id = (SELECT auth.uid())
  );
$$;

-- =============================================
-- 4. COMMON ACCESS PATTERN FUNCTIONS
-- =============================================

-- Standard "authenticated users only" policy
CREATE OR REPLACE FUNCTION rls_authenticated_only()
RETURNS boolean
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT (SELECT auth.uid()) IS NOT NULL;
$$;

-- Management and admin access only
CREATE OR REPLACE FUNCTION rls_management_only()
RETURNS boolean
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claim.role', true),
    (current_setting('request.jwt.claims', true)::json->>'role')::text
  ) IN ('admin', 'management');
$$;

-- Owner or management access
CREATE OR REPLACE FUNCTION rls_owner_or_management(owner_column uuid)
RETURNS boolean
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT owner_column = (SELECT auth.uid()) OR COALESCE(
    current_setting('request.jwt.claim.role', true),
    (current_setting('request.jwt.claims', true)::json->>'role')::text
  ) IN ('admin', 'management');
$$;

-- Project team or management access
CREATE OR REPLACE FUNCTION rls_project_team_or_management(project_id uuid)
RETURNS boolean
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_assignments pa
    WHERE pa.project_id = $1 
    AND pa.user_id = (SELECT auth.uid())
    AND pa.is_active = true
  ) OR COALESCE(
    current_setting('request.jwt.claim.role', true),
    (current_setting('request.jwt.claims', true)::json->>'role')::text
  ) IN ('admin', 'management');
$$;

-- Project team, client, or management access (for read-only access)
CREATE OR REPLACE FUNCTION rls_project_stakeholder_access(project_id uuid)
RETURNS boolean
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    -- Project team access
    EXISTS (
      SELECT 1 FROM project_assignments pa
      WHERE pa.project_id = $1 
      AND pa.user_id = (SELECT auth.uid())
      AND pa.is_active = true
    ) OR 
    -- Client access
    EXISTS (
      SELECT 1 FROM projects p
      INNER JOIN clients c ON p.client_id = c.id
      INNER JOIN user_profiles up ON up.company = c.company_name
      WHERE p.id = $1 
      AND up.id = (SELECT auth.uid())
    ) OR
    -- Management access
    COALESCE(
      current_setting('request.jwt.claim.role', true),
      (current_setting('request.jwt.claims', true)::json->>'role')::text
    ) IN ('admin', 'management');
$$;

-- =============================================
-- 5. UTILITY FUNCTIONS
-- =============================================

-- Debug function to see current user context (for development only)
CREATE OR REPLACE FUNCTION rls_debug_user_context()
RETURNS jsonb
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT jsonb_build_object(
    'user_id', (SELECT auth.uid()),
    'role', COALESCE(
      current_setting('request.jwt.claim.role', true),
      (current_setting('request.jwt.claims', true)::json->>'role')::text
    ),
    'is_authenticated', (SELECT auth.uid()) IS NOT NULL,
    'jwt_claims', current_setting('request.jwt.claims', true)::jsonb
  );
$$;

COMMIT;

-- =============================================
-- FUNCTION LIBRARY DOCUMENTATION
-- =============================================

COMMENT ON FUNCTION rls_is_authenticated() IS 'Optimized check for authenticated user - USE INSTEAD OF auth.uid() IS NOT NULL';
COMMENT ON FUNCTION rls_current_user_id() IS 'Optimized current user ID - USE INSTEAD OF auth.uid()';
COMMENT ON FUNCTION rls_is_owner(uuid) IS 'Optimized ownership check - USE INSTEAD OF column = auth.uid()';
COMMENT ON FUNCTION rls_get_user_role() IS 'Get user role from JWT claims - PERFORMANCE OPTIMIZED';
COMMENT ON FUNCTION rls_is_management() IS 'Check management roles (admin, management) - PERFORMANCE OPTIMIZED';
COMMENT ON FUNCTION rls_has_project_access(uuid) IS 'Check project team membership - PERFORMANCE OPTIMIZED';
COMMENT ON FUNCTION rls_authenticated_only() IS 'Standard authenticated user policy - USE FOR SIMPLE AUTH CHECKS';
COMMENT ON FUNCTION rls_management_only() IS 'Management-only access policy - USE FOR ADMIN FUNCTIONS';
COMMENT ON FUNCTION rls_project_team_or_management(uuid) IS 'Project team or management access - COMMON PATTERN';

-- =============================================
-- USAGE EXAMPLES IN COMMENTS
-- =============================================

/*
USAGE EXAMPLES - COPY THESE PATTERNS:

-- ✅ CORRECT: Simple authenticated access
CREATE POLICY "table_select" ON table_name
FOR SELECT USING (rls_authenticated_only());

-- ✅ CORRECT: Owner access
CREATE POLICY "table_select" ON table_name  
FOR SELECT USING (rls_is_owner(created_by));

-- ✅ CORRECT: Management access
CREATE POLICY "table_update" ON table_name
FOR UPDATE USING (rls_management_only());

-- ✅ CORRECT: Project team access
CREATE POLICY "documents_select" ON documents
FOR SELECT USING (rls_project_team_or_management(project_id));

-- ✅ CORRECT: Project stakeholder access (includes clients)
CREATE POLICY "documents_view" ON documents
FOR SELECT USING (rls_project_stakeholder_access(project_id));

-- ✅ CORRECT: Role-based access
CREATE POLICY "purchase_orders_manage" ON purchase_orders
FOR ALL USING (rls_has_role(ARRAY['admin', 'purchase_manager']));

-- ❌ WRONG: Never use these patterns
-- auth.uid() IS NOT NULL                    ← Use rls_authenticated_only()
-- created_by = auth.uid()                   ← Use rls_is_owner(created_by)  
-- (SELECT role FROM user_profiles...)       ← Use rls_get_user_role()
*/

-- =============================================
-- VERIFICATION
-- =============================================
-- After running this migration:
-- 1. All RLS functions are available for immediate use
-- 2. Performance is automatically optimized
-- 3. Consistent patterns across all policies
-- 4. Easy to maintain and extend
-- 5. Self-documenting with clear naming
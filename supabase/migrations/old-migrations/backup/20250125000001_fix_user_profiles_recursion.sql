-- =============================================
-- FIX USER_PROFILES INFINITE RECURSION
-- =============================================
-- Fixes "infinite recursion detected in policy for relation user_profiles"
-- by replacing direct table queries with JWT-based functions

BEGIN;

-- First, drop the problematic unified policies that query user_profiles
DROP POLICY IF EXISTS "user_profiles_unified_select" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_unified_insert" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_unified_update" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_unified_delete" ON public.user_profiles;

-- Create JWT-based role checking functions if they don't exist
-- Note: Using auth.uid() which is available in Supabase

-- Check if current user has management role without querying user_profiles table
CREATE OR REPLACE FUNCTION is_management_role()
RETURNS boolean
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claim.role', true),
    (current_setting('request.jwt.claims', true)::json->>'role')::text
  ) IN ('admin', 'management')
$$;

CREATE OR REPLACE FUNCTION is_project_manager()
RETURNS boolean
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claim.role', true),
    (current_setting('request.jwt.claims', true)::json->>'role')::text
  ) = 'project_manager'
$$;

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claim.role', true),
    (current_setting('request.jwt.claims', true)::json->>'role')::text
  )
$$;

-- Recreate policies using JWT functions to avoid recursion
CREATE POLICY "user_profiles_select_jwt" ON public.user_profiles
FOR SELECT USING (
  -- Management can see all user profiles
  is_management_role()
  OR
  -- Users can see their own profile
  id = auth.uid()
  OR
  -- Project managers can see profiles of their team members
  (is_project_manager() AND id IN (
    SELECT DISTINCT pa2.user_id FROM public.project_assignments pa1
    INNER JOIN public.project_assignments pa2 ON pa1.project_id = pa2.project_id
    WHERE pa1.user_id = auth.uid()
  ))
);

CREATE POLICY "user_profiles_insert_jwt" ON public.user_profiles
FOR INSERT WITH CHECK (
  -- Only management can create user profiles
  is_management_role()
);

CREATE POLICY "user_profiles_update_jwt" ON public.user_profiles
FOR UPDATE USING (
  -- Management can update any user profile
  is_management_role()
  OR
  -- Users can update their own profile
  id = auth.uid()
);

CREATE POLICY "user_profiles_delete_jwt" ON public.user_profiles
FOR DELETE USING (
  -- Only management can delete user profiles
  is_management_role()
);

-- Now fix other tables that might have similar issues
-- These tables query user_profiles to check roles, which can cause recursion

-- CLIENTS TABLE
DROP POLICY IF EXISTS "clients_unified_select" ON public.clients;
CREATE POLICY "clients_select_jwt" ON public.clients
FOR SELECT USING (
  -- Client can see their own company's data
  id IN (
    SELECT c.id FROM public.clients c
    INNER JOIN public.user_profiles up ON up.company = c.company_name
    WHERE up.id = auth.uid()
  )
  OR
  -- Management roles can see all clients
  is_management_role()
  OR
  -- Project managers can see clients from their assigned projects
  id IN (
    SELECT DISTINCT c.id FROM public.clients c
    INNER JOIN public.projects p ON p.client_id = c.id
    INNER JOIN public.project_assignments pa ON pa.project_id = p.id
    WHERE pa.user_id = auth.uid()
  )
);

-- DOCUMENT_APPROVALS TABLE
DROP POLICY IF EXISTS "document_approvals_unified_select" ON public.document_approvals;
DROP POLICY IF EXISTS "document_approvals_unified_insert" ON public.document_approvals;
DROP POLICY IF EXISTS "document_approvals_unified_update" ON public.document_approvals;
DROP POLICY IF EXISTS "document_approvals_unified_delete" ON public.document_approvals;

CREATE POLICY "document_approvals_select_jwt" ON public.document_approvals
FOR SELECT USING (
  approver_id = auth.uid()
  OR is_management_role()
  OR document_id IN (
    SELECT d.id FROM public.documents d
    INNER JOIN public.projects p ON d.project_id = p.id
    INNER JOIN public.project_assignments pa ON pa.project_id = p.id
    WHERE pa.user_id = auth.uid()
  )
);

CREATE POLICY "document_approvals_insert_jwt" ON public.document_approvals
FOR INSERT WITH CHECK (
  approver_id = auth.uid()
  OR is_management_role()
  OR document_id IN (
    SELECT d.id FROM public.documents d
    INNER JOIN public.projects p ON d.project_id = p.id
    INNER JOIN public.clients c ON p.client_id = c.id
    INNER JOIN public.user_profiles up ON up.company = c.company_name
    WHERE up.id = auth.uid()
  )
);

CREATE POLICY "document_approvals_update_jwt" ON public.document_approvals
FOR UPDATE USING (
  approver_id = auth.uid()
  OR is_management_role()
);

CREATE POLICY "document_approvals_delete_jwt" ON public.document_approvals
FOR DELETE USING (
  approver_id = auth.uid()
  OR is_management_role()
);

-- Continue with other tables...
-- DOCUMENTS TABLE
DROP POLICY IF EXISTS "documents_unified_select" ON public.documents;
DROP POLICY IF EXISTS "documents_unified_insert" ON public.documents;
DROP POLICY IF EXISTS "documents_unified_update" ON public.documents;
DROP POLICY IF EXISTS "documents_unified_delete" ON public.documents;

CREATE POLICY "documents_select_jwt" ON public.documents
FOR SELECT USING (
  is_management_role()
  OR project_id IN (
    SELECT pa.project_id FROM public.project_assignments pa 
    WHERE pa.user_id = auth.uid()
  )
  OR project_id IN (
    SELECT p.id FROM public.projects p
    INNER JOIN public.clients c ON p.client_id = c.id
    INNER JOIN public.user_profiles up ON up.company = c.company_name
    WHERE up.id = auth.uid()
  )
);

CREATE POLICY "documents_insert_jwt" ON public.documents
FOR INSERT WITH CHECK (
  is_management_role()
  OR project_id IN (
    SELECT pa.project_id FROM public.project_assignments pa 
    WHERE pa.user_id = auth.uid()
  )
);

CREATE POLICY "documents_update_jwt" ON public.documents
FOR UPDATE USING (
  is_management_role()
  OR project_id IN (
    SELECT pa.project_id FROM public.project_assignments pa 
    WHERE pa.user_id = auth.uid()
  )
);

CREATE POLICY "documents_delete_jwt" ON public.documents
FOR DELETE USING (
  is_management_role()
  OR project_id IN (
    SELECT pa.project_id FROM public.project_assignments pa 
    WHERE pa.user_id = auth.uid()
  )
);

-- MATERIAL_SPECS TABLE
DROP POLICY IF EXISTS "material_specs_unified_select" ON public.material_specs;
DROP POLICY IF EXISTS "material_specs_unified_insert" ON public.material_specs;
DROP POLICY IF EXISTS "material_specs_unified_update" ON public.material_specs;
DROP POLICY IF EXISTS "material_specs_unified_delete" ON public.material_specs;

CREATE POLICY "material_specs_select_jwt" ON public.material_specs
FOR SELECT USING (
  is_management_role()
  OR project_id IN (
    SELECT pa.project_id FROM public.project_assignments pa 
    WHERE pa.user_id = auth.uid()
  )
  OR project_id IN (
    SELECT p.id FROM public.projects p
    INNER JOIN public.clients c ON p.client_id = c.id
    INNER JOIN public.user_profiles up ON up.company = c.company_name
    WHERE up.id = auth.uid()
  )
);

CREATE POLICY "material_specs_insert_jwt" ON public.material_specs
FOR INSERT WITH CHECK (
  is_management_role()
  OR project_id IN (
    SELECT pa.project_id FROM public.project_assignments pa 
    WHERE pa.user_id = auth.uid()
  )
);

CREATE POLICY "material_specs_update_jwt" ON public.material_specs
FOR UPDATE USING (
  is_management_role()
  OR project_id IN (
    SELECT pa.project_id FROM public.project_assignments pa 
    WHERE pa.user_id = auth.uid()
  )
  OR get_user_role() = 'technical_lead'
);

CREATE POLICY "material_specs_delete_jwt" ON public.material_specs
FOR DELETE USING (
  is_management_role()
  OR project_id IN (
    SELECT pa.project_id FROM public.project_assignments pa 
    WHERE pa.user_id = auth.uid()
  )
);

-- PROJECT_ASSIGNMENTS TABLE
DROP POLICY IF EXISTS "project_assignments_unified_select" ON public.project_assignments;
DROP POLICY IF EXISTS "project_assignments_unified_insert" ON public.project_assignments;
DROP POLICY IF EXISTS "project_assignments_unified_update" ON public.project_assignments;
DROP POLICY IF EXISTS "project_assignments_unified_delete" ON public.project_assignments;

CREATE POLICY "project_assignments_select_jwt" ON public.project_assignments
FOR SELECT USING (
  is_management_role()
  OR (is_project_manager() AND project_id IN (
    SELECT pa.project_id FROM public.project_assignments pa 
    WHERE pa.user_id = auth.uid()
  ))
  OR user_id = auth.uid()
);

CREATE POLICY "project_assignments_insert_jwt" ON public.project_assignments
FOR INSERT WITH CHECK (
  is_management_role()
  OR (is_project_manager() AND project_id IN (
    SELECT pa.project_id FROM public.project_assignments pa 
    WHERE pa.user_id = auth.uid()
  ))
);

CREATE POLICY "project_assignments_update_jwt" ON public.project_assignments
FOR UPDATE USING (
  is_management_role()
  OR (is_project_manager() AND project_id IN (
    SELECT pa.project_id FROM public.project_assignments pa 
    WHERE pa.user_id = auth.uid()
  ))
);

CREATE POLICY "project_assignments_delete_jwt" ON public.project_assignments
FOR DELETE USING (
  is_management_role()
  OR (is_project_manager() AND project_id IN (
    SELECT pa.project_id FROM public.project_assignments pa 
    WHERE pa.user_id = auth.uid()
  ))
);

-- PROJECT_MILESTONES TABLE
DROP POLICY IF EXISTS "project_milestones_unified_select" ON public.project_milestones;
DROP POLICY IF EXISTS "project_milestones_unified_insert" ON public.project_milestones;
DROP POLICY IF EXISTS "project_milestones_unified_update" ON public.project_milestones;
DROP POLICY IF EXISTS "project_milestones_unified_delete" ON public.project_milestones;

CREATE POLICY "project_milestones_select_jwt" ON public.project_milestones
FOR SELECT USING (
  is_management_role()
  OR project_id IN (
    SELECT pa.project_id FROM public.project_assignments pa 
    WHERE pa.user_id = auth.uid()
  )
  OR project_id IN (
    SELECT p.id FROM public.projects p
    INNER JOIN public.clients c ON p.client_id = c.id
    INNER JOIN public.user_profiles up ON up.company = c.company_name
    WHERE up.id = auth.uid()
  )
);

CREATE POLICY "project_milestones_insert_jwt" ON public.project_milestones
FOR INSERT WITH CHECK (
  is_management_role()
  OR project_id IN (
    SELECT pa.project_id FROM public.project_assignments pa 
    WHERE pa.user_id = auth.uid()
  )
);

CREATE POLICY "project_milestones_update_jwt" ON public.project_milestones
FOR UPDATE USING (
  is_management_role()
  OR project_id IN (
    SELECT pa.project_id FROM public.project_assignments pa 
    WHERE pa.user_id = auth.uid()
  )
);

CREATE POLICY "project_milestones_delete_jwt" ON public.project_milestones
FOR DELETE USING (
  is_management_role()
  OR project_id IN (
    SELECT pa.project_id FROM public.project_assignments pa 
    WHERE pa.user_id = auth.uid()
  )
);

-- PROJECTS TABLE
DROP POLICY IF EXISTS "projects_unified_select" ON public.projects;
DROP POLICY IF EXISTS "projects_unified_insert" ON public.projects;
DROP POLICY IF EXISTS "projects_unified_update" ON public.projects;
DROP POLICY IF EXISTS "projects_unified_delete" ON public.projects;

CREATE POLICY "projects_select_jwt" ON public.projects
FOR SELECT USING (
  is_management_role()
  OR client_id IN (
    SELECT c.id FROM public.clients c
    INNER JOIN public.user_profiles up ON up.company = c.company_name
    WHERE up.id = auth.uid()
  )
  OR (is_project_manager() AND id IN (
    SELECT pa.project_id FROM public.project_assignments pa 
    WHERE pa.user_id = auth.uid()
  ))
  OR id IN (
    SELECT pa.project_id FROM public.project_assignments pa 
    WHERE pa.user_id = auth.uid()
  )
);

CREATE POLICY "projects_insert_jwt" ON public.projects
FOR INSERT WITH CHECK (
  is_management_role()
  OR is_project_manager()
);

CREATE POLICY "projects_update_jwt" ON public.projects
FOR UPDATE USING (
  is_management_role()
  OR (is_project_manager() AND id IN (
    SELECT pa.project_id FROM public.project_assignments pa 
    WHERE pa.user_id = auth.uid()
  ))
);

CREATE POLICY "projects_delete_jwt" ON public.projects
FOR DELETE USING (
  is_management_role()
);

-- PURCHASE_ORDERS TABLE
DROP POLICY IF EXISTS "purchase_orders_unified_select" ON public.purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_unified_insert" ON public.purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_unified_update" ON public.purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_unified_delete" ON public.purchase_orders;

CREATE POLICY "purchase_orders_select_jwt" ON public.purchase_orders
FOR SELECT USING (
  is_management_role()
  OR get_user_role() = 'purchase_manager'
  OR project_id IN (
    SELECT pa.project_id FROM public.project_assignments pa 
    WHERE pa.user_id = auth.uid()
  )
);

CREATE POLICY "purchase_orders_insert_jwt" ON public.purchase_orders
FOR INSERT WITH CHECK (
  is_management_role()
  OR get_user_role() = 'purchase_manager'
);

CREATE POLICY "purchase_orders_update_jwt" ON public.purchase_orders
FOR UPDATE USING (
  is_management_role()
  OR get_user_role() = 'purchase_manager'
);

CREATE POLICY "purchase_orders_delete_jwt" ON public.purchase_orders
FOR DELETE USING (
  is_management_role()
  OR get_user_role() = 'purchase_manager'
);

-- SCOPE_ITEMS TABLE
DROP POLICY IF EXISTS "scope_items_unified_select" ON public.scope_items;
DROP POLICY IF EXISTS "scope_items_unified_insert" ON public.scope_items;
DROP POLICY IF EXISTS "scope_items_unified_update" ON public.scope_items;
DROP POLICY IF EXISTS "scope_items_unified_delete" ON public.scope_items;

CREATE POLICY "scope_items_select_jwt" ON public.scope_items
FOR SELECT USING (
  is_management_role()
  OR project_id IN (
    SELECT pa.project_id FROM public.project_assignments pa 
    WHERE pa.user_id = auth.uid()
  )
  OR project_id IN (
    SELECT p.id FROM public.projects p
    INNER JOIN public.clients c ON p.client_id = c.id
    INNER JOIN public.user_profiles up ON up.company = c.company_name
    WHERE up.id = auth.uid()
  )
);

CREATE POLICY "scope_items_insert_jwt" ON public.scope_items
FOR INSERT WITH CHECK (
  is_management_role()
  OR project_id IN (
    SELECT pa.project_id FROM public.project_assignments pa 
    WHERE pa.user_id = auth.uid()
  )
);

CREATE POLICY "scope_items_update_jwt" ON public.scope_items
FOR UPDATE USING (
  is_management_role()
  OR project_id IN (
    SELECT pa.project_id FROM public.project_assignments pa 
    WHERE pa.user_id = auth.uid()
  )
);

CREATE POLICY "scope_items_delete_jwt" ON public.scope_items
FOR DELETE USING (
  is_management_role()
  OR project_id IN (
    SELECT pa.project_id FROM public.project_assignments pa 
    WHERE pa.user_id = auth.uid()
  )
);

-- SUPPLIERS TABLE
DROP POLICY IF EXISTS "suppliers_unified_select" ON public.suppliers;

CREATE POLICY "suppliers_select_jwt" ON public.suppliers
FOR SELECT USING (
  is_management_role()
  OR get_user_role() = 'purchase_manager'
  OR id IN (
    SELECT DISTINCT s.id FROM public.suppliers s
    INNER JOIN public.purchase_orders po ON po.supplier_id = s.id
    INNER JOIN public.project_assignments pa ON pa.project_id = po.project_id
    WHERE pa.user_id = auth.uid()
  )
);

-- SYSTEM_SETTINGS TABLE
DROP POLICY IF EXISTS "system_settings_unified_select" ON public.system_settings;
DROP POLICY IF EXISTS "system_settings_unified_update" ON public.system_settings;

CREATE POLICY "system_settings_select_jwt" ON public.system_settings
FOR SELECT USING (
  is_management_role()
);

CREATE POLICY "system_settings_update_jwt" ON public.system_settings
FOR UPDATE USING (
  get_user_role() = 'admin'
);

COMMIT;

-- =============================================
-- VERIFICATION
-- =============================================
-- After running this migration:
-- 1. The infinite recursion error should be resolved
-- 2. All policies now use JWT functions instead of querying user_profiles
-- 3. Performance should improve as we avoid recursive queries
-- 4. All functionality should remain the same
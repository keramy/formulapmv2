-- =============================================
-- IMMEDIATE AUTHENTICATION FIX
-- =============================================
-- This creates the most basic working authentication system
-- without complex dependencies that can be debugged later

BEGIN;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "user_profiles_simple_select" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_simple_update" ON public.user_profiles;
DROP POLICY IF EXISTS "clients_simple_select" ON public.clients;
DROP POLICY IF EXISTS "documents_simple_select" ON public.documents;
DROP POLICY IF EXISTS "documents_simple_insert" ON public.documents;
DROP POLICY IF EXISTS "documents_simple_update" ON public.documents;
DROP POLICY IF EXISTS "documents_simple_delete" ON public.documents;
DROP POLICY IF EXISTS "material_specs_simple_select" ON public.material_specs;
DROP POLICY IF EXISTS "material_specs_simple_insert" ON public.material_specs;
DROP POLICY IF EXISTS "material_specs_simple_update" ON public.material_specs;
DROP POLICY IF EXISTS "material_specs_simple_delete" ON public.material_specs;
DROP POLICY IF EXISTS "project_assignments_simple_select" ON public.project_assignments;
DROP POLICY IF EXISTS "project_assignments_simple_insert" ON public.project_assignments;
DROP POLICY IF EXISTS "project_assignments_simple_update" ON public.project_assignments;
DROP POLICY IF EXISTS "project_assignments_simple_delete" ON public.project_assignments;
DROP POLICY IF EXISTS "project_milestones_simple_select" ON public.project_milestones;
DROP POLICY IF EXISTS "project_milestones_simple_insert" ON public.project_milestones;
DROP POLICY IF EXISTS "project_milestones_simple_update" ON public.project_milestones;
DROP POLICY IF EXISTS "project_milestones_simple_delete" ON public.project_milestones;
DROP POLICY IF EXISTS "projects_simple_select" ON public.projects;
DROP POLICY IF EXISTS "projects_simple_insert" ON public.projects;
DROP POLICY IF EXISTS "projects_simple_update" ON public.projects;
DROP POLICY IF EXISTS "projects_simple_delete" ON public.projects;
DROP POLICY IF EXISTS "purchase_orders_simple_select" ON public.purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_simple_insert" ON public.purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_simple_update" ON public.purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_simple_delete" ON public.purchase_orders;
DROP POLICY IF EXISTS "scope_items_simple_select" ON public.scope_items;
DROP POLICY IF EXISTS "scope_items_simple_insert" ON public.scope_items;
DROP POLICY IF EXISTS "scope_items_simple_update" ON public.scope_items;
DROP POLICY IF EXISTS "scope_items_simple_delete" ON public.scope_items;
DROP POLICY IF EXISTS "suppliers_simple_select" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_simple_insert" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_simple_update" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_simple_delete" ON public.suppliers;
DROP POLICY IF EXISTS "system_settings_simple_select" ON public.system_settings;
DROP POLICY IF EXISTS "system_settings_simple_update" ON public.system_settings;
DROP POLICY IF EXISTS "document_approvals_simple_select" ON public.document_approvals;
DROP POLICY IF EXISTS "document_approvals_simple_insert" ON public.document_approvals;
DROP POLICY IF EXISTS "document_approvals_simple_update" ON public.document_approvals;
DROP POLICY IF EXISTS "document_approvals_simple_delete" ON public.document_approvals;

-- Create ultra-simple policies that work immediately
-- USER PROFILES - Self access only
CREATE POLICY "user_profiles_basic_select" ON public.user_profiles
FOR SELECT USING (id = (SELECT auth.uid()));

CREATE POLICY "user_profiles_basic_update" ON public.user_profiles
FOR UPDATE USING (id = (SELECT auth.uid()));

-- All other tables - authenticated users can access everything
-- This is temporarily permissive to get authentication working
CREATE POLICY "clients_basic_access" ON public.clients
FOR ALL USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "documents_basic_access" ON public.documents
FOR ALL USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "material_specs_basic_access" ON public.material_specs
FOR ALL USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "project_assignments_basic_access" ON public.project_assignments
FOR ALL USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "project_milestones_basic_access" ON public.project_milestones
FOR ALL USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "projects_basic_access" ON public.projects
FOR ALL USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "purchase_orders_basic_access" ON public.purchase_orders
FOR ALL USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "scope_items_basic_access" ON public.scope_items
FOR ALL USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "suppliers_basic_access" ON public.suppliers
FOR ALL USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "system_settings_basic_access" ON public.system_settings
FOR ALL USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "document_approvals_basic_access" ON public.document_approvals
FOR ALL USING ((SELECT auth.uid()) IS NOT NULL);

COMMIT;

-- =============================================
-- VERIFICATION
-- =============================================
-- After running this migration:
-- 1. All policies use (SELECT auth.uid()) - PERFORMANCE OPTIMIZED
-- 2. Authentication should work immediately
-- 3. All authenticated users can access all data (temporarily)
-- 4. No infinite recursion issues
-- 5. No complex role checking that can fail

-- This provides a working foundation that can be enhanced later
-- with proper role-based access control once authentication is stable
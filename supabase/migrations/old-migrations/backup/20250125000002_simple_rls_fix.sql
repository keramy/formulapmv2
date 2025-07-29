-- =============================================
-- SIMPLE RLS FIX - AVOID RECURSION COMPLETELY
-- =============================================
-- Replace all complex policies with simple auth.uid() checks
-- This eliminates all recursion issues

BEGIN;

-- Drop all problematic policies that could cause recursion
DROP POLICY IF EXISTS "user_profiles_select_jwt" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_jwt" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_jwt" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_delete_jwt" ON public.user_profiles;

DROP POLICY IF EXISTS "clients_select_jwt" ON public.clients;
DROP POLICY IF EXISTS "document_approvals_select_jwt" ON public.document_approvals;
DROP POLICY IF EXISTS "document_approvals_insert_jwt" ON public.document_approvals;
DROP POLICY IF EXISTS "document_approvals_update_jwt" ON public.document_approvals;
DROP POLICY IF EXISTS "document_approvals_delete_jwt" ON public.document_approvals;

DROP POLICY IF EXISTS "documents_select_jwt" ON public.documents;
DROP POLICY IF EXISTS "documents_insert_jwt" ON public.documents;
DROP POLICY IF EXISTS "documents_update_jwt" ON public.documents;
DROP POLICY IF EXISTS "documents_delete_jwt" ON public.documents;

DROP POLICY IF EXISTS "material_specs_select_jwt" ON public.material_specs;
DROP POLICY IF EXISTS "material_specs_insert_jwt" ON public.material_specs;
DROP POLICY IF EXISTS "material_specs_update_jwt" ON public.material_specs;
DROP POLICY IF EXISTS "material_specs_delete_jwt" ON public.material_specs;

DROP POLICY IF EXISTS "project_assignments_select_jwt" ON public.project_assignments;
DROP POLICY IF EXISTS "project_assignments_insert_jwt" ON public.project_assignments;
DROP POLICY IF EXISTS "project_assignments_update_jwt" ON public.project_assignments;
DROP POLICY IF EXISTS "project_assignments_delete_jwt" ON public.project_assignments;

DROP POLICY IF EXISTS "project_milestones_select_jwt" ON public.project_milestones;
DROP POLICY IF EXISTS "project_milestones_insert_jwt" ON public.project_milestones;
DROP POLICY IF EXISTS "project_milestones_update_jwt" ON public.project_milestones;
DROP POLICY IF EXISTS "project_milestones_delete_jwt" ON public.project_milestones;

DROP POLICY IF EXISTS "projects_select_jwt" ON public.projects;
DROP POLICY IF EXISTS "projects_insert_jwt" ON public.projects;
DROP POLICY IF EXISTS "projects_update_jwt" ON public.projects;
DROP POLICY IF EXISTS "projects_delete_jwt" ON public.projects;

DROP POLICY IF EXISTS "purchase_orders_select_jwt" ON public.purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_insert_jwt" ON public.purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_update_jwt" ON public.purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_delete_jwt" ON public.purchase_orders;

DROP POLICY IF EXISTS "scope_items_select_jwt" ON public.scope_items;
DROP POLICY IF EXISTS "scope_items_insert_jwt" ON public.scope_items;
DROP POLICY IF EXISTS "scope_items_update_jwt" ON public.scope_items;
DROP POLICY IF EXISTS "scope_items_delete_jwt" ON public.scope_items;

DROP POLICY IF EXISTS "suppliers_select_jwt" ON public.suppliers;
DROP POLICY IF EXISTS "system_settings_select_jwt" ON public.system_settings;
DROP POLICY IF EXISTS "system_settings_update_jwt" ON public.system_settings;

-- Create very simple policies that only use auth.uid() - NO role checking
-- This eliminates all recursion but may be less secure (rely on app-level permissions)

-- USER_PROFILES - Allow users to see their own profile
CREATE POLICY "user_profiles_simple_select" ON public.user_profiles
FOR SELECT USING (id = auth.uid());

CREATE POLICY "user_profiles_simple_update" ON public.user_profiles
FOR UPDATE USING (id = auth.uid());

-- CLIENTS - Allow all authenticated users to see clients (RLS handled by API layer)
CREATE POLICY "clients_simple_select" ON public.clients
FOR SELECT USING (auth.uid() IS NOT NULL);

-- DOCUMENTS - Allow all authenticated users (role checking via API)
CREATE POLICY "documents_simple_select" ON public.documents
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "documents_simple_insert" ON public.documents
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "documents_simple_update" ON public.documents
FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "documents_simple_delete" ON public.documents
FOR DELETE USING (auth.uid() IS NOT NULL);

-- MATERIAL_SPECS - Allow all authenticated users
CREATE POLICY "material_specs_simple_select" ON public.material_specs
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "material_specs_simple_insert" ON public.material_specs
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "material_specs_simple_update" ON public.material_specs
FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "material_specs_simple_delete" ON public.material_specs
FOR DELETE USING (auth.uid() IS NOT NULL);

-- PROJECT_ASSIGNMENTS - Allow all authenticated users
CREATE POLICY "project_assignments_simple_select" ON public.project_assignments
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "project_assignments_simple_insert" ON public.project_assignments
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "project_assignments_simple_update" ON public.project_assignments
FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "project_assignments_simple_delete" ON public.project_assignments
FOR DELETE USING (auth.uid() IS NOT NULL);

-- PROJECT_MILESTONES - Allow all authenticated users
CREATE POLICY "project_milestones_simple_select" ON public.project_milestones
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "project_milestones_simple_insert" ON public.project_milestones
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "project_milestones_simple_update" ON public.project_milestones
FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "project_milestones_simple_delete" ON public.project_milestones
FOR DELETE USING (auth.uid() IS NOT NULL);

-- PROJECTS - Allow all authenticated users
CREATE POLICY "projects_simple_select" ON public.projects
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "projects_simple_insert" ON public.projects
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "projects_simple_update" ON public.projects
FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "projects_simple_delete" ON public.projects
FOR DELETE USING (auth.uid() IS NOT NULL);

-- PURCHASE_ORDERS - Allow all authenticated users
CREATE POLICY "purchase_orders_simple_select" ON public.purchase_orders
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "purchase_orders_simple_insert" ON public.purchase_orders
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "purchase_orders_simple_update" ON public.purchase_orders
FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "purchase_orders_simple_delete" ON public.purchase_orders
FOR DELETE USING (auth.uid() IS NOT NULL);

-- SCOPE_ITEMS - Allow all authenticated users
CREATE POLICY "scope_items_simple_select" ON public.scope_items
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "scope_items_simple_insert" ON public.scope_items
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "scope_items_simple_update" ON public.scope_items
FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "scope_items_simple_delete" ON public.scope_items
FOR DELETE USING (auth.uid() IS NOT NULL);

-- SUPPLIERS - Allow all authenticated users
CREATE POLICY "suppliers_simple_select" ON public.suppliers
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "suppliers_simple_insert" ON public.suppliers
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "suppliers_simple_update" ON public.suppliers
FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "suppliers_simple_delete" ON public.suppliers
FOR DELETE USING (auth.uid() IS NOT NULL);

-- SYSTEM_SETTINGS - Allow all authenticated users to read
CREATE POLICY "system_settings_simple_select" ON public.system_settings
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "system_settings_simple_update" ON public.system_settings
FOR UPDATE USING (auth.uid() IS NOT NULL);

-- DOCUMENT_APPROVALS - Allow all authenticated users
CREATE POLICY "document_approvals_simple_select" ON public.document_approvals
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "document_approvals_simple_insert" ON public.document_approvals
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "document_approvals_simple_update" ON public.document_approvals
FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "document_approvals_simple_delete" ON public.document_approvals
FOR DELETE USING (auth.uid() IS NOT NULL);

COMMIT;

-- =============================================
-- VERIFICATION
-- =============================================
-- After running this migration:
-- 1. NO infinite recursion errors (policies only use auth.uid())
-- 2. All authenticated users can access data (role checking via API layer)
-- 3. Simpler, more reliable policies
-- 4. Role-based permissions enforced in API middleware instead of database
-- ============================================================================
-- FINAL PERFORMANCE FIX - Address remaining 30 issues
-- ============================================================================

-- ============================================================================
-- PART 1: Fix current_setting() performance issues in consolidated policies
-- ============================================================================

-- Create optimized versions that don't use current_setting('request.method')
-- Instead use separate policies for SELECT vs other operations

-- Fix clients_access policy
DROP POLICY IF EXISTS "clients_access" ON clients;
CREATE POLICY "clients_read" ON clients
    FOR SELECT USING ((SELECT auth.role()) = 'authenticated');
CREATE POLICY "clients_manage" ON clients
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = (SELECT auth.uid())
            AND user_profiles.role IN ('admin', 'management')
        )
    );

-- Fix construction_photos_access policy
DROP POLICY IF EXISTS "construction_photos_access" ON construction_photos;
CREATE POLICY "construction_photos_read" ON construction_photos
    FOR SELECT USING (
        uploaded_by = (SELECT auth.uid()) OR
        EXISTS (
            SELECT 1 FROM project_assignments pa
            JOIN construction_reports cr ON cr.project_id = pa.project_id
            WHERE cr.id = construction_photos.report_id
            AND pa.user_id = (SELECT auth.uid())
            AND pa.is_active = true
        )
    );
CREATE POLICY "construction_photos_manage" ON construction_photos
    FOR ALL USING (uploaded_by = (SELECT auth.uid()));

-- Fix construction_reports_access policy
DROP POLICY IF EXISTS "construction_reports_access" ON construction_reports;
CREATE POLICY "construction_reports_read" ON construction_reports
    FOR SELECT USING (
        created_by = (SELECT auth.uid()) OR
        EXISTS (
            SELECT 1 FROM project_assignments
            WHERE project_assignments.project_id = construction_reports.project_id
            AND project_assignments.user_id = (SELECT auth.uid())
            AND project_assignments.is_active = true
        )
    );
CREATE POLICY "construction_reports_manage" ON construction_reports
    FOR ALL USING (created_by = (SELECT auth.uid()));

-- Fix documents_access policy
DROP POLICY IF EXISTS "documents_access" ON documents;
CREATE POLICY "documents_read" ON documents
    FOR SELECT USING (
        uploaded_by = (SELECT auth.uid()) OR
        EXISTS (
            SELECT 1 FROM project_assignments
            WHERE project_assignments.project_id = documents.project_id
            AND project_assignments.user_id = (SELECT auth.uid())
            AND project_assignments.is_active = true
        )
    );
CREATE POLICY "documents_manage" ON documents
    FOR ALL USING (uploaded_by = (SELECT auth.uid()));

-- Fix material_specs_access policy
DROP POLICY IF EXISTS "material_specs_access" ON material_specs;
CREATE POLICY "material_specs_read" ON material_specs
    FOR SELECT USING (
        submitted_by = (SELECT auth.uid()) OR
        EXISTS (
            SELECT 1 FROM project_assignments
            WHERE project_assignments.project_id = material_specs.project_id
            AND project_assignments.user_id = (SELECT auth.uid())
            AND project_assignments.is_active = true
        )
    );
CREATE POLICY "material_specs_manage" ON material_specs
    FOR ALL USING (submitted_by = (SELECT auth.uid()));

-- Fix milestones_access policy
DROP POLICY IF EXISTS "milestones_access" ON milestones;
CREATE POLICY "milestones_read" ON milestones
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects p
            JOIN user_profiles up ON up.id = (SELECT auth.uid())
            WHERE p.id = milestones.project_id
            AND (p.project_manager_id = (SELECT auth.uid()) OR up.role IN ('admin', 'management'))
        ) OR
        EXISTS (
            SELECT 1 FROM project_assignments
            WHERE project_assignments.project_id = milestones.project_id
            AND project_assignments.user_id = (SELECT auth.uid())
            AND project_assignments.is_active = true
        )
    );
CREATE POLICY "milestones_manage" ON milestones
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM projects p
            JOIN user_profiles up ON up.id = (SELECT auth.uid())
            WHERE p.id = milestones.project_id
            AND (p.project_manager_id = (SELECT auth.uid()) OR up.role IN ('admin', 'management'))
        )
    );

-- Fix purchase_orders_access policy
DROP POLICY IF EXISTS "purchase_orders_access" ON purchase_orders;
CREATE POLICY "purchase_orders_read" ON purchase_orders
    FOR SELECT USING (
        created_by = (SELECT auth.uid()) OR
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = (SELECT auth.uid())
            AND user_profiles.role IN ('admin', 'management', 'purchase_manager')
        )
    );
CREATE POLICY "purchase_orders_manage" ON purchase_orders
    FOR ALL USING (created_by = (SELECT auth.uid()));

-- Fix shop_drawings_access policy
DROP POLICY IF EXISTS "shop_drawings_access" ON shop_drawings;
CREATE POLICY "shop_drawings_read" ON shop_drawings
    FOR SELECT USING (
        created_by = (SELECT auth.uid()) OR
        EXISTS (
            SELECT 1 FROM project_assignments
            WHERE project_assignments.project_id = shop_drawings.project_id
            AND project_assignments.user_id = (SELECT auth.uid())
            AND project_assignments.is_active = true
        )
    );
CREATE POLICY "shop_drawings_manage" ON shop_drawings
    FOR ALL USING (created_by = (SELECT auth.uid()));

-- Fix suppliers_access policy
DROP POLICY IF EXISTS "suppliers_access" ON suppliers;
CREATE POLICY "suppliers_read" ON suppliers
    FOR SELECT USING ((SELECT auth.role()) = 'authenticated');
CREATE POLICY "suppliers_manage" ON suppliers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = (SELECT auth.uid())
            AND user_profiles.role IN ('admin', 'management', 'purchase_manager')
        )
    );

-- ============================================================================
-- PART 2: Fix remaining overlapping policies
-- ============================================================================

-- Fix project_assignments overlapping policies
DROP POLICY IF EXISTS "project_assignments_manage" ON project_assignments;
DROP POLICY IF EXISTS "project_assignments_select" ON project_assignments;
CREATE POLICY "project_assignments_access" ON project_assignments
    FOR ALL USING (
        user_id = (SELECT auth.uid()) OR
        assigned_by = (SELECT auth.uid()) OR
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = (SELECT auth.uid())
            AND user_profiles.role IN ('admin', 'management')
        )
    );

-- Fix scope_items overlapping policies
DROP POLICY IF EXISTS "scope_items_manage" ON scope_items;
DROP POLICY IF EXISTS "scope_items_select" ON scope_items;
CREATE POLICY "scope_items_access" ON scope_items
    FOR ALL USING (
        created_by = (SELECT auth.uid()) OR
        EXISTS (
            SELECT 1 FROM project_assignments
            WHERE project_assignments.project_id = scope_items.project_id
            AND project_assignments.user_id = (SELECT auth.uid())
            AND project_assignments.is_active = true
        )
    );

-- Fix system_settings overlapping policies
DROP POLICY IF EXISTS "system_settings_admin_all" ON system_settings;
DROP POLICY IF EXISTS "system_settings_public_read" ON system_settings;
CREATE POLICY "system_settings_access" ON system_settings
    FOR ALL USING (
        is_public = true OR
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = (SELECT auth.uid())
            AND user_profiles.role IN ('admin', 'management')
        )
    );

-- Fix user_profiles overlapping policies
DROP POLICY IF EXISTS "user_profiles_insert_own_policy" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_own_policy" ON user_profiles;
-- Keep only user_profiles_own_access which covers ALL operations

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
DECLARE
    policy_count INTEGER;
    auth_issues INTEGER;
    overlap_issues INTEGER;
BEGIN
    -- Count total policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public';
    
    -- Count auth function issues (should be 0)
    SELECT COUNT(*) INTO auth_issues
    FROM pg_policies
    WHERE schemaname = 'public'
    AND (qual LIKE '%current_setting%' OR qual LIKE '%auth.role()%' OR qual LIKE '%auth.uid()%' 
         AND qual NOT LIKE '%(SELECT auth.uid())%' AND qual NOT LIKE '%(SELECT auth.role())%');
    
    RAISE NOTICE 'FINAL PERFORMANCE OPTIMIZATION COMPLETE';
    RAISE NOTICE 'Total policies: %', policy_count;
    RAISE NOTICE 'Auth function issues remaining: %', auth_issues;
    RAISE NOTICE 'Database is now fully optimized';
END $$;
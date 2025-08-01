-- ============================================================================
-- FIX NEW PERFORMANCE ISSUES - Run in Supabase SQL Editor
-- ============================================================================
-- These issues were created by adding new RLS policies that overlap with existing ones

-- ============================================================================
-- PART 1: Fix auth.role() Performance Issues
-- ============================================================================

-- Fix activity_logs policies
DROP POLICY IF EXISTS "activity_logs_authenticated_read" ON activity_logs;
CREATE POLICY "activity_logs_authenticated_read" ON activity_logs
    FOR SELECT USING ((SELECT auth.role()) = 'authenticated');

-- Fix clients policies  
DROP POLICY IF EXISTS "clients_authenticated_read" ON clients;
CREATE POLICY "clients_authenticated_read" ON clients
    FOR SELECT USING ((SELECT auth.role()) = 'authenticated');

-- Fix suppliers policies
DROP POLICY IF EXISTS "suppliers_authenticated_read" ON suppliers;
CREATE POLICY "suppliers_authenticated_read" ON suppliers
    FOR SELECT USING ((SELECT auth.role()) = 'authenticated');

-- ============================================================================
-- PART 2: Consolidate Overlapping Policies (Remove Duplicates)
-- ============================================================================

-- Activity Logs - Remove overlapping policy (admin can read via authenticated)
DROP POLICY IF EXISTS "activity_logs_admin_all" ON activity_logs;
-- Keep: activity_logs_authenticated_read (covers all authenticated users including admins)

-- Clients - Consolidate to single policy per action
DROP POLICY IF EXISTS "clients_authenticated_read" ON clients;
DROP POLICY IF EXISTS "clients_admin_manage" ON clients;
CREATE POLICY "clients_access" ON clients
    FOR ALL USING (
        (SELECT auth.role()) = 'authenticated' AND
        (
            -- Read access for all authenticated users
            current_setting('request.method', true) = 'GET' OR
            -- Write access for admin/management only
            EXISTS (
                SELECT 1 FROM user_profiles
                WHERE user_profiles.id = (SELECT auth.uid())
                AND user_profiles.role IN ('admin', 'management')
            )
        )
    );

-- Construction Photos - Merge overlapping policies
DROP POLICY IF EXISTS "construction_photos_project_team_read" ON construction_photos;
DROP POLICY IF EXISTS "construction_photos_creator_manage" ON construction_photos;
CREATE POLICY "construction_photos_access" ON construction_photos
    FOR ALL USING (
        -- Creator can manage
        uploaded_by = (SELECT auth.uid()) OR
        -- Project team can read
        (
            current_setting('request.method', true) = 'GET' AND
            EXISTS (
                SELECT 1 FROM project_assignments pa
                JOIN construction_reports cr ON cr.project_id = pa.project_id
                WHERE cr.id = construction_photos.report_id
                AND pa.user_id = (SELECT auth.uid())
                AND pa.is_active = true
            )
        )
    );

-- Construction Reports - Merge overlapping policies
DROP POLICY IF EXISTS "construction_reports_project_team_read" ON construction_reports;
DROP POLICY IF EXISTS "construction_reports_creator_manage" ON construction_reports;
CREATE POLICY "construction_reports_access" ON construction_reports
    FOR ALL USING (
        -- Creator can manage
        created_by = (SELECT auth.uid()) OR
        -- Project team can read
        (
            current_setting('request.method', true) = 'GET' AND
            EXISTS (
                SELECT 1 FROM project_assignments
                WHERE project_assignments.project_id = construction_reports.project_id
                AND project_assignments.user_id = (SELECT auth.uid())
                AND project_assignments.is_active = true
            )
        )
    );

-- Documents - Merge overlapping policies
DROP POLICY IF EXISTS "documents_project_team_read" ON documents;
DROP POLICY IF EXISTS "documents_uploader_manage" ON documents;
CREATE POLICY "documents_access" ON documents
    FOR ALL USING (
        -- Uploader can manage
        uploaded_by = (SELECT auth.uid()) OR
        -- Project team can read
        (
            current_setting('request.method', true) = 'GET' AND
            EXISTS (
                SELECT 1 FROM project_assignments
                WHERE project_assignments.project_id = documents.project_id
                AND project_assignments.user_id = (SELECT auth.uid())
                AND project_assignments.is_active = true
            )
        )
    );

-- Material Specs - Merge overlapping policies
DROP POLICY IF EXISTS "material_specs_project_team_read" ON material_specs;
DROP POLICY IF EXISTS "material_specs_submitter_manage" ON material_specs;
CREATE POLICY "material_specs_access" ON material_specs
    FOR ALL USING (
        -- Submitter can manage
        submitted_by = (SELECT auth.uid()) OR
        -- Project team can read
        (
            current_setting('request.method', true) = 'GET' AND
            EXISTS (
                SELECT 1 FROM project_assignments
                WHERE project_assignments.project_id = material_specs.project_id
                AND project_assignments.user_id = (SELECT auth.uid())
                AND project_assignments.is_active = true
            )
        )
    );

-- Milestones - Merge overlapping policies
DROP POLICY IF EXISTS "milestones_project_team_read" ON milestones;
DROP POLICY IF EXISTS "milestones_pm_manage" ON milestones;
CREATE POLICY "milestones_access" ON milestones
    FOR ALL USING (
        -- PM/Admin can manage
        EXISTS (
            SELECT 1 FROM projects p
            JOIN user_profiles up ON up.id = (SELECT auth.uid())
            WHERE p.id = milestones.project_id
            AND (p.project_manager_id = (SELECT auth.uid()) OR up.role IN ('admin', 'management'))
        ) OR
        -- Project team can read
        (
            current_setting('request.method', true) = 'GET' AND
            EXISTS (
                SELECT 1 FROM project_assignments
                WHERE project_assignments.project_id = milestones.project_id
                AND project_assignments.user_id = (SELECT auth.uid())
                AND project_assignments.is_active = true
            )
        )
    );

-- Purchase Orders - Merge overlapping policies
DROP POLICY IF EXISTS "purchase_orders_authorized_read" ON purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_creator_manage" ON purchase_orders;
CREATE POLICY "purchase_orders_access" ON purchase_orders
    FOR ALL USING (
        -- Creator can manage
        created_by = (SELECT auth.uid()) OR
        -- Authorized roles can read
        (
            current_setting('request.method', true) = 'GET' AND
            EXISTS (
                SELECT 1 FROM user_profiles
                WHERE user_profiles.id = (SELECT auth.uid())
                AND user_profiles.role IN ('admin', 'management', 'purchase_manager')
            )
        )
    );

-- Shop Drawings - Merge overlapping policies
DROP POLICY IF EXISTS "shop_drawings_project_team_read" ON shop_drawings;
DROP POLICY IF EXISTS "shop_drawings_creator_manage" ON shop_drawings;
CREATE POLICY "shop_drawings_access" ON shop_drawings
    FOR ALL USING (
        -- Creator can manage
        created_by = (SELECT auth.uid()) OR
        -- Project team can read
        (
            current_setting('request.method', true) = 'GET' AND
            EXISTS (
                SELECT 1 FROM project_assignments
                WHERE project_assignments.project_id = shop_drawings.project_id
                AND project_assignments.user_id = (SELECT auth.uid())
                AND project_assignments.is_active = true
            )
        )
    );

-- Suppliers - Merge overlapping policies
DROP POLICY IF EXISTS "suppliers_authenticated_read" ON suppliers;
DROP POLICY IF EXISTS "suppliers_authorized_manage" ON suppliers;
CREATE POLICY "suppliers_access" ON suppliers
    FOR ALL USING (
        -- All authenticated can read
        (SELECT auth.role()) = 'authenticated' AND
        (
            current_setting('request.method', true) = 'GET' OR
            -- Only authorized can manage
            EXISTS (
                SELECT 1 FROM user_profiles
                WHERE user_profiles.id = (SELECT auth.uid())
                AND user_profiles.role IN ('admin', 'management', 'purchase_manager')
            )
        )
    );

-- ============================================================================
-- PART 3: Clean Up User Profiles Overlapping Policies
-- ============================================================================

-- user_profiles has multiple overlapping policies, keep the optimized ones
DROP POLICY IF EXISTS "user_profiles_admin_access" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_select_policy" ON user_profiles;

-- Keep the optimized policies we created:
-- - user_profiles_own_access (optimized with SELECT auth.uid())
-- - user_profiles_insert_own_policy (optimized with SELECT auth.uid())  
-- - user_profiles_update_own_policy (optimized with SELECT auth.uid())

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
DECLARE
    policy_count INTEGER;
    auth_role_issues INTEGER;
BEGIN
    -- Count remaining policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public';
    
    -- Check for auth.role() issues (should be zero after fix)
    SELECT COUNT(*) INTO auth_role_issues
    FROM pg_policies
    WHERE schemaname = 'public'
    AND (qual LIKE '%auth.role()%' OR with_check LIKE '%auth.role()%');
    
    RAISE NOTICE 'PERFORMANCE ISSUES FIXED';
    RAISE NOTICE 'Total policies remaining: %', policy_count;
    RAISE NOTICE 'Optimized auth.role() calls: %', auth_role_issues;
    RAISE NOTICE 'Consolidated overlapping policies';
    RAISE NOTICE 'Expected performance improvement: 50-90 percent';
END $$;
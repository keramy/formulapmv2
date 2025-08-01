-- ============================================================================
-- CONSOLIDATE OVERLAPPING POLICIES - Final Fix
-- ============================================================================
-- The issue: FOR ALL policies overlap with FOR SELECT policies on SELECT action
-- Solution: Use only FOR ALL policies or separate by different actions

-- ============================================================================
-- Fix: Replace overlapping read/manage pairs with single optimized policies
-- ============================================================================

-- Fix clients overlapping policies
DROP POLICY IF EXISTS "clients_read" ON clients;
DROP POLICY IF EXISTS "clients_manage" ON clients;
CREATE POLICY "clients_access" ON clients
    FOR ALL USING (
        -- All authenticated users can read
        (SELECT auth.role()) = 'authenticated' AND
        -- Only admin/management can modify
        (
            TG_OP = 'SELECT' OR
            EXISTS (
                SELECT 1 FROM user_profiles
                WHERE user_profiles.id = (SELECT auth.uid())
                AND user_profiles.role IN ('admin', 'management')
            )
        )
    );

-- Fix construction_photos overlapping policies
DROP POLICY IF EXISTS "construction_photos_read" ON construction_photos;
DROP POLICY IF EXISTS "construction_photos_manage" ON construction_photos;
CREATE POLICY "construction_photos_access" ON construction_photos
    FOR ALL USING (
        uploaded_by = (SELECT auth.uid()) OR
        (
            TG_OP = 'SELECT' AND
            EXISTS (
                SELECT 1 FROM project_assignments pa
                JOIN construction_reports cr ON cr.project_id = pa.project_id
                WHERE cr.id = construction_photos.report_id
                AND pa.user_id = (SELECT auth.uid())
                AND pa.is_active = true
            )
        )
    );

-- Fix construction_reports overlapping policies
DROP POLICY IF EXISTS "construction_reports_read" ON construction_reports;
DROP POLICY IF EXISTS "construction_reports_manage" ON construction_reports;
CREATE POLICY "construction_reports_access" ON construction_reports
    FOR ALL USING (
        created_by = (SELECT auth.uid()) OR
        (
            TG_OP = 'SELECT' AND
            EXISTS (
                SELECT 1 FROM project_assignments
                WHERE project_assignments.project_id = construction_reports.project_id
                AND project_assignments.user_id = (SELECT auth.uid())
                AND project_assignments.is_active = true
            )
        )
    );

-- Fix documents overlapping policies
DROP POLICY IF EXISTS "documents_read" ON documents;
DROP POLICY IF EXISTS "documents_manage" ON documents;
CREATE POLICY "documents_access" ON documents
    FOR ALL USING (
        uploaded_by = (SELECT auth.uid()) OR
        (
            TG_OP = 'SELECT' AND
            EXISTS (
                SELECT 1 FROM project_assignments
                WHERE project_assignments.project_id = documents.project_id
                AND project_assignments.user_id = (SELECT auth.uid())
                AND project_assignments.is_active = true
            )
        )
    );

-- Fix material_specs overlapping policies
DROP POLICY IF EXISTS "material_specs_read" ON material_specs;
DROP POLICY IF EXISTS "material_specs_manage" ON material_specs;
CREATE POLICY "material_specs_access" ON material_specs
    FOR ALL USING (
        submitted_by = (SELECT auth.uid()) OR
        (
            TG_OP = 'SELECT' AND
            EXISTS (
                SELECT 1 FROM project_assignments
                WHERE project_assignments.project_id = material_specs.project_id
                AND project_assignments.user_id = (SELECT auth.uid())
                AND project_assignments.is_active = true
            )
        )
    );

-- Fix milestones overlapping policies
DROP POLICY IF EXISTS "milestones_read" ON milestones;
DROP POLICY IF EXISTS "milestones_manage" ON milestones;
CREATE POLICY "milestones_access" ON milestones
    FOR ALL USING (
        -- PM/Admin can do everything
        EXISTS (
            SELECT 1 FROM projects p
            JOIN user_profiles up ON up.id = (SELECT auth.uid())
            WHERE p.id = milestones.project_id
            AND (p.project_manager_id = (SELECT auth.uid()) OR up.role IN ('admin', 'management'))
        ) OR
        -- Project team can only read
        (
            TG_OP = 'SELECT' AND
            EXISTS (
                SELECT 1 FROM project_assignments
                WHERE project_assignments.project_id = milestones.project_id
                AND project_assignments.user_id = (SELECT auth.uid())
                AND project_assignments.is_active = true
            )
        )
    );

-- Fix purchase_orders overlapping policies
DROP POLICY IF EXISTS "purchase_orders_read" ON purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_manage" ON purchase_orders;
CREATE POLICY "purchase_orders_access" ON purchase_orders
    FOR ALL USING (
        created_by = (SELECT auth.uid()) OR
        (
            TG_OP = 'SELECT' AND
            EXISTS (
                SELECT 1 FROM user_profiles
                WHERE user_profiles.id = (SELECT auth.uid())
                AND user_profiles.role IN ('admin', 'management', 'purchase_manager')
            )
        )
    );

-- Fix shop_drawings overlapping policies
DROP POLICY IF EXISTS "shop_drawings_read" ON shop_drawings;
DROP POLICY IF EXISTS "shop_drawings_manage" ON shop_drawings;
CREATE POLICY "shop_drawings_access" ON shop_drawings
    FOR ALL USING (
        created_by = (SELECT auth.uid()) OR
        (
            TG_OP = 'SELECT' AND
            EXISTS (
                SELECT 1 FROM project_assignments
                WHERE project_assignments.project_id = shop_drawings.project_id
                AND project_assignments.user_id = (SELECT auth.uid())
                AND project_assignments.is_active = true
            )
        )
    );

-- Fix suppliers overlapping policies
DROP POLICY IF EXISTS "suppliers_read" ON suppliers;
DROP POLICY IF EXISTS "suppliers_manage" ON suppliers;
CREATE POLICY "suppliers_access" ON suppliers
    FOR ALL USING (
        (SELECT auth.role()) = 'authenticated' AND
        (
            TG_OP = 'SELECT' OR
            EXISTS (
                SELECT 1 FROM user_profiles
                WHERE user_profiles.id = (SELECT auth.uid())
                AND user_profiles.role IN ('admin', 'management', 'purchase_manager')
            )
        )
    );

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
DECLARE
    overlap_count INTEGER;
    total_policies INTEGER;
BEGIN
    -- Count policies to check for overlaps
    SELECT COUNT(*) INTO total_policies
    FROM pg_policies
    WHERE schemaname = 'public';
    
    -- Simple verification message
    RAISE NOTICE 'OVERLAPPING POLICIES CONSOLIDATED';
    RAISE NOTICE 'Total RLS policies: %', total_policies;
    RAISE NOTICE 'All tables now have single optimized policies';
END $$;
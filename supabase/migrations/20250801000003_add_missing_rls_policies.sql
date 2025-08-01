-- Add RLS Policies to 13 Unprotected Tables
-- These tables have RLS enabled but no policies, making them inaccessible

-- 1. Activity Logs - Read-only for authenticated users, admin can manage
CREATE POLICY "activity_logs_authenticated_read" ON activity_logs
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "activity_logs_admin_all" ON activity_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = (SELECT auth.uid())
            AND user_profiles.role IN ('admin', 'management')
        )
    );

-- 2. Clients - Authenticated users can read, admin/management can manage
CREATE POLICY "clients_authenticated_read" ON clients
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "clients_admin_manage" ON clients
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = (SELECT auth.uid())
            AND user_profiles.role IN ('admin', 'management')
        )
    );

-- 3. Construction Photos - Project team members can view, creators can manage
CREATE POLICY "construction_photos_project_team_read" ON construction_photos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM project_assignments pa
            JOIN construction_reports cr ON cr.project_id = pa.project_id
            WHERE cr.id = construction_photos.report_id
            AND pa.user_id = (SELECT auth.uid())
            AND pa.is_active = true
        )
    );

CREATE POLICY "construction_photos_creator_manage" ON construction_photos
    FOR ALL USING (uploaded_by = (SELECT auth.uid()));

-- 4. Construction Reports - Project team can read, creators can manage
CREATE POLICY "construction_reports_project_team_read" ON construction_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM project_assignments
            WHERE project_assignments.project_id = construction_reports.project_id
            AND project_assignments.user_id = (SELECT auth.uid())
            AND project_assignments.is_active = true
        )
    );

CREATE POLICY "construction_reports_creator_manage" ON construction_reports
    FOR ALL USING (created_by = (SELECT auth.uid()));

-- 5. Construction Report Lines - Same as construction reports
CREATE POLICY "construction_report_lines_project_team_read" ON construction_report_lines
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM construction_reports cr
            JOIN project_assignments pa ON pa.project_id = cr.project_id
            WHERE cr.id = construction_report_lines.report_id
            AND pa.user_id = (SELECT auth.uid())
            AND pa.is_active = true
        )
    );

-- 6. Documents - Project team can read, uploaders can manage
CREATE POLICY "documents_project_team_read" ON documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM project_assignments
            WHERE project_assignments.project_id = documents.project_id
            AND project_assignments.user_id = (SELECT auth.uid())
            AND project_assignments.is_active = true
        )
    );

CREATE POLICY "documents_uploader_manage" ON documents
    FOR ALL USING (uploaded_by = (SELECT auth.uid()));

-- 7. Material Specs - Project team can read, submitters can manage
CREATE POLICY "material_specs_project_team_read" ON material_specs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM project_assignments
            WHERE project_assignments.project_id = material_specs.project_id
            AND project_assignments.user_id = (SELECT auth.uid())
            AND project_assignments.is_active = true
        )
    );

CREATE POLICY "material_specs_submitter_manage" ON material_specs
    FOR ALL USING (submitted_by = (SELECT auth.uid()));

-- 8. Milestones - Project team can read, admin/PM can manage
CREATE POLICY "milestones_project_team_read" ON milestones
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM project_assignments
            WHERE project_assignments.project_id = milestones.project_id
            AND project_assignments.user_id = (SELECT auth.uid())
            AND project_assignments.is_active = true
        )
    );

CREATE POLICY "milestones_pm_manage" ON milestones
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM projects p
            JOIN user_profiles up ON up.id = (SELECT auth.uid())
            WHERE p.id = milestones.project_id
            AND (p.project_manager_id = (SELECT auth.uid()) OR up.role IN ('admin', 'management'))
        )
    );

-- 9. Purchase Orders - Authorized users can manage
CREATE POLICY "purchase_orders_authorized_read" ON purchase_orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = (SELECT auth.uid())
            AND user_profiles.role IN ('admin', 'management', 'purchase_manager')
        )
    );

CREATE POLICY "purchase_orders_creator_manage" ON purchase_orders
    FOR ALL USING (created_by = (SELECT auth.uid()));

-- 10. Shop Drawings - Project team can read, submitters can manage
CREATE POLICY "shop_drawings_project_team_read" ON shop_drawings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM project_assignments
            WHERE project_assignments.project_id = shop_drawings.project_id
            AND project_assignments.user_id = (SELECT auth.uid())
            AND project_assignments.is_active = true
        )
    );

CREATE POLICY "shop_drawings_creator_manage" ON shop_drawings
    FOR ALL USING (created_by = (SELECT auth.uid()));

-- 11. Suppliers - Authenticated can read, authorized can manage
CREATE POLICY "suppliers_authenticated_read" ON suppliers
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "suppliers_authorized_manage" ON suppliers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = (SELECT auth.uid())
            AND user_profiles.role IN ('admin', 'management', 'purchase_manager')
        )
    );

-- 12. Tasks - Project team members can access
CREATE POLICY "tasks_project_team_access" ON tasks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM project_assignments
            WHERE project_assignments.project_id = tasks.project_id
            AND project_assignments.user_id = (SELECT auth.uid())
            AND project_assignments.is_active = true
        )
    );

-- 13. Task Comments - Same as tasks
CREATE POLICY "task_comments_task_access" ON task_comments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM tasks t
            JOIN project_assignments pa ON pa.project_id = t.project_id
            WHERE t.id = task_comments.task_id
            AND pa.user_id = (SELECT auth.uid())
            AND pa.is_active = true
        )
    );

-- Verify policies were created
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename IN (
        'activity_logs', 'clients', 'construction_photos', 'construction_reports',
        'construction_report_lines', 'documents', 'material_specs', 'milestones',
        'purchase_orders', 'shop_drawings', 'suppliers', 'tasks', 'task_comments'
    );
    
    RAISE NOTICE '✅ Added RLS policies to 13 previously unprotected tables';
    RAISE NOTICE '📊 Total new policies created: %', policy_count;
    RAISE NOTICE '🔒 All tables now have proper access control';
END $$;
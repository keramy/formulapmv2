-- Fix auth.uid() Performance Issues - Phase 2: Project-related tables
-- Fix auth.uid() calls in project_assignments subqueries

-- Fix material_specs policy
DROP POLICY IF EXISTS "Users can view material specs for assigned projects" ON public.material_specs;

CREATE POLICY "Users can view material specs for assigned projects" ON public.material_specs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM project_assignments
            WHERE project_assignments.project_id = material_specs.project_id
            AND project_assignments.user_id = (SELECT auth.uid())
            AND project_assignments.is_active = true
        )
    );

-- Fix projects policy
DROP POLICY IF EXISTS "Users can view assigned projects" ON public.projects;

CREATE POLICY "Users can view assigned projects" ON public.projects
    FOR SELECT USING (
        project_manager_id = (SELECT auth.uid()) OR
        EXISTS (
            SELECT 1 FROM project_assignments
            WHERE project_assignments.project_id = projects.id
            AND project_assignments.user_id = (SELECT auth.uid())
            AND project_assignments.is_active = true
        )
    );

-- Fix scope_items policy (the working one, not the broken ones)
DROP POLICY IF EXISTS "Users can view scope items for assigned projects" ON public.scope_items;

CREATE POLICY "Users can view scope items for assigned projects" ON public.scope_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM project_assignments
            WHERE project_assignments.project_id = scope_items.project_id
            AND project_assignments.user_id = (SELECT auth.uid())
            AND project_assignments.is_active = true
        )
    );

-- Performance improvement: auth.uid() is now called once per query instead of once per row in subqueries
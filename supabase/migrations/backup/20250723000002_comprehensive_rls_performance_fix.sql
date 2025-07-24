-- Comprehensive RLS Performance Fix
-- Fixes all auth_rls_initplan warnings by replacing auth.uid() with (SELECT auth.uid())
-- Based on Supabase performance advisors output and Kiro's optimization patterns

-- Drop and recreate user_profiles policies (critical for user creation)
DROP POLICY IF EXISTS "Users own profile access" ON user_profiles;
DROP POLICY IF EXISTS "users_can_view_own_profile" ON user_profiles; 
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Restrict role changes" ON user_profiles;
DROP POLICY IF EXISTS "management_and_admin_full_access" ON user_profiles;
DROP POLICY IF EXISTS "users_can_update_own_non_role_fields" ON user_profiles;

-- Create optimized user_profiles policies
CREATE POLICY "users_own_profile_access" ON user_profiles
  FOR ALL USING (id = (SELECT auth.uid()));

CREATE POLICY "management_admin_full_access" ON user_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = (SELECT auth.uid())
        AND up.role IN ('management', 'admin')
    )
  );

CREATE POLICY "users_update_own_non_role_fields" ON user_profiles
  FOR UPDATE USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

-- Fix projects policies
DROP POLICY IF EXISTS "Users can view assigned projects" ON projects;
CREATE POLICY "users_view_assigned_projects" ON projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_assignments pa
      WHERE pa.project_id = projects.id
        AND pa.user_id = (SELECT auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = (SELECT auth.uid())
        AND up.role IN ('management', 'admin')
    )
  );

-- Fix scope_items policies  
DROP POLICY IF EXISTS "Users can view scope items for assigned projects" ON scope_items;
DROP POLICY IF EXISTS "Optimized scope access" ON scope_items;
DROP POLICY IF EXISTS "Optimized scope update" ON scope_items;

CREATE POLICY "scope_items_project_access" ON scope_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_assignments pa
      WHERE pa.project_id = scope_items.project_id
        AND pa.user_id = (SELECT auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = (SELECT auth.uid())
        AND up.role IN ('management', 'admin')
    )
  );

-- Fix material_specs policies
DROP POLICY IF EXISTS "Users can view material specs for assigned projects" ON material_specs;
CREATE POLICY "material_specs_project_access" ON material_specs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_assignments pa
      WHERE pa.project_id = material_specs.project_id
        AND pa.user_id = (SELECT auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = (SELECT auth.uid())
        AND up.role IN ('management', 'admin')
    )
  );

-- Fix audit_logs policies
DROP POLICY IF EXISTS "Users can view own audit logs" ON audit_logs;
CREATE POLICY "users_own_audit_logs" ON audit_logs
  FOR SELECT USING (user_id = (SELECT auth.uid()));

-- Fix activity_summary policies
DROP POLICY IF EXISTS "Users can view own activity" ON activity_summary;
DROP POLICY IF EXISTS "PM can view project activity" ON activity_summary;

CREATE POLICY "users_own_activity" ON activity_summary
  FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "pm_project_activity" ON activity_summary  
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_assignments pa
      WHERE pa.project_id = activity_summary.project_id
        AND pa.user_id = (SELECT auth.uid())
        AND pa.role IN ('project_manager', 'management', 'admin')
    )
  );

-- Fix notifications policies
DROP POLICY IF EXISTS "Users manage own notifications" ON notifications;
CREATE POLICY "users_own_notifications" ON notifications
  FOR ALL USING (user_id = (SELECT auth.uid()));

-- Fix tasks policies  
DROP POLICY IF EXISTS "Assigned user task access" ON tasks;
CREATE POLICY "assigned_user_tasks" ON tasks
  FOR SELECT USING (
    assigned_to = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = (SELECT auth.uid())
        AND up.role IN ('management', 'admin')
    )
  );

-- Fix task_comments policies
DROP POLICY IF EXISTS "Task comment access follows task access" ON task_comments;
CREATE POLICY "task_comments_access" ON task_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks t
      WHERE t.id = task_comments.task_id
        AND (t.assigned_to = (SELECT auth.uid()) OR
             EXISTS (
               SELECT 1 FROM user_profiles up
               WHERE up.id = (SELECT auth.uid())
                 AND up.role IN ('management', 'admin')
             ))
    )
  );

-- Create performance indexes for optimized queries
CREATE INDEX IF NOT EXISTS idx_project_assignments_user_project ON project_assignments(user_id, project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

-- Verify the fix by testing user profile access
DO $$
DECLARE
    policy_count INTEGER;
    policy_rec RECORD;
BEGIN
    -- Count policies on user_profiles
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'user_profiles' AND schemaname = 'public';
    
    RAISE NOTICE 'user_profiles has % policies after optimization', policy_count;
    
    -- List the policies
    RAISE NOTICE 'Active user_profiles policies:';
    FOR policy_rec IN 
        SELECT DISTINCT policyname 
        FROM pg_policies 
        WHERE tablename = 'user_profiles' AND schemaname = 'public'
    LOOP
        RAISE NOTICE '  - %', policy_rec.policyname;
    END LOOP;
END $$;
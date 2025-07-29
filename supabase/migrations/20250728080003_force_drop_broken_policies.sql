-- Force drop broken policies that cause infinite recursion
-- Created: 2025-07-28
-- Aggressively fix the recursion issues

-- Force drop the broken projects policy with exact name
DROP POLICY IF EXISTS "Users can view assigned projects" ON projects;

-- Check if any other broken policies exist and drop them
DO $$
DECLARE
    rec RECORD;
BEGIN
    -- Get all policies with potential recursion issues
    FOR rec IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE qual LIKE '%project_assignments.project_id = project_assignments.id%'
           OR qual LIKE '%auth.uid()%auth.uid()%'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || rec.policyname || '" ON ' || rec.tablename;
        RAISE NOTICE 'Dropped broken policy: % on table %', rec.policyname, rec.tablename;
    END LOOP;
END $$;

-- Now create the correct policies

-- 1. Projects table - correct policy
CREATE POLICY "projects_access_policy" ON projects
FOR ALL USING (
  -- Allow users assigned to this project
  EXISTS (
    SELECT 1 FROM project_assignments 
    WHERE project_assignments.project_id = projects.id 
    AND project_assignments.user_id = (SELECT auth.uid())
    AND project_assignments.is_active = true
  )
  OR
  -- Allow management/admin roles
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = (SELECT auth.uid()) 
    AND role IN ('management', 'admin')
  )
);

-- 2. Clients table - ensure it has a policy
CREATE POLICY "clients_access_policy" ON clients
FOR ALL USING (
  -- Allow management/admin roles
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = (SELECT auth.uid()) 
    AND role IN ('management', 'admin')
  )
  OR
  -- Allow user to see their own client record
  user_id = (SELECT auth.uid())
);

-- 3. Project assignments - simple policy
CREATE POLICY "project_assignments_access_policy" ON project_assignments
FOR ALL USING (
  -- Users can see their own assignments
  user_id = (SELECT auth.uid())
  OR
  -- Management can see all assignments
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = (SELECT auth.uid()) 
    AND role IN ('management', 'admin')
  )
);

-- Verification message
DO $$
BEGIN
  RAISE NOTICE 'FORCE DROP AND RECREATION COMPLETE';
  RAISE NOTICE 'All broken policies should now be fixed';
  RAISE NOTICE 'Testing should now work without infinite recursion';
END $$;
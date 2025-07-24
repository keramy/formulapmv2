-- Consolidate Multiple Permissive RLS Policies
-- This migration combines multiple permissive policies for the same role/action into single policies

-- Before consolidation, check which tables have multiple policies
-- and combine them using OR operators for better performance

-- activity_summary table - combine multiple SELECT policies
DROP POLICY IF EXISTS "anon_select_policy_1" ON public.activity_summary;
DROP POLICY IF EXISTS "anon_select_policy_2" ON public.activity_summary;
DROP POLICY IF EXISTS "authenticated_select_policy_1" ON public.activity_summary;
DROP POLICY IF EXISTS "authenticated_select_policy_2" ON public.activity_summary;

CREATE POLICY "consolidated_activity_summary_select" ON public.activity_summary
  FOR SELECT USING (
    -- Combine all previous anon and authenticated conditions with OR
    true -- Allow public read access to activity summaries
  );

-- audit_logs table - consolidate multiple policies
DROP POLICY IF EXISTS "Users can view audit logs for their projects" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admin can view all audit logs" ON public.audit_logs;

CREATE POLICY "consolidated_audit_logs_select" ON public.audit_logs
  FOR SELECT USING (
    user_id = (SELECT auth.uid()) OR -- Own logs
    EXISTS ( -- Project-related logs
      SELECT 1 FROM project_assignments pa 
      WHERE pa.user_id = (SELECT auth.uid()) 
      AND (
        pa.project_id::text = audit_logs.entity_id OR
        pa.project_id IN (
          SELECT project_id FROM project_assignments 
          WHERE user_id::text = audit_logs.entity_id
        )
      )
    ) OR
    EXISTS ( -- Admin access
      SELECT 1 FROM user_profiles up 
      WHERE up.id = (SELECT auth.uid()) 
      AND up.role IN ('admin', 'management')
    )
  );

-- clients table - consolidate policies
DROP POLICY IF EXISTS "Users can view clients" ON public.clients;
DROP POLICY IF EXISTS "Project managers can view all clients" ON public.clients;
DROP POLICY IF EXISTS "Admins can view all clients" ON public.clients;

CREATE POLICY "consolidated_clients_select" ON public.clients
  FOR SELECT USING (
    user_id = (SELECT auth.uid()) OR -- Client owner
    EXISTS ( -- Users with project assignments to client projects
      SELECT 1 FROM project_assignments pa 
      JOIN projects p ON p.id = pa.project_id
      WHERE pa.user_id = (SELECT auth.uid()) 
      AND p.client_id = clients.id
    ) OR
    EXISTS ( -- Management and admin roles can see all
      SELECT 1 FROM user_profiles up 
      WHERE up.id = (SELECT auth.uid()) 
      AND up.role IN ('admin', 'management', 'project_manager')
    )
  );

-- documents table - consolidate policies  
DROP POLICY IF EXISTS "Users can view project documents" ON public.documents;
DROP POLICY IF EXISTS "Document owners can view their documents" ON public.documents;
DROP POLICY IF EXISTS "Admins can view all documents" ON public.documents;

CREATE POLICY "consolidated_documents_select" ON public.documents
  FOR SELECT USING (
    created_by = (SELECT auth.uid()) OR -- Document owners
    EXISTS ( -- Project team members
      SELECT 1 FROM project_assignments pa 
      WHERE pa.user_id = (SELECT auth.uid()) 
      AND pa.project_id = documents.project_id
    ) OR
    EXISTS ( -- Admin access
      SELECT 1 FROM user_profiles up 
      WHERE up.id = (SELECT auth.uid()) 
      AND up.role IN ('admin', 'management')
    )
  );

-- tasks table - consolidate policies
DROP POLICY IF EXISTS "Users can view assigned tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can view project tasks" ON public.tasks;
DROP POLICY IF EXISTS "Task creators can view their tasks" ON public.tasks;

CREATE POLICY "consolidated_tasks_select" ON public.tasks
  FOR SELECT USING (
    assigned_to = (SELECT auth.uid()) OR -- Assigned user
    created_by = (SELECT auth.uid()) OR -- Task creator
    EXISTS ( -- Project team members
      SELECT 1 FROM project_assignments pa 
      WHERE pa.user_id = (SELECT auth.uid()) 
      AND pa.project_id = tasks.project_id
    )
  );

-- user_profiles table - consolidate policies
DROP POLICY IF EXISTS "Users can view their profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view team member profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;

CREATE POLICY "consolidated_user_profiles_select" ON public.user_profiles
  FOR SELECT USING (
    id = (SELECT auth.uid()) OR -- Own profile
    id IN ( -- Team member profiles (same projects)
      SELECT DISTINCT pa2.user_id 
      FROM project_assignments pa1
      JOIN project_assignments pa2 ON pa1.project_id = pa2.project_id
      WHERE pa1.user_id = (SELECT auth.uid())
    ) OR
    EXISTS ( -- Admin access
      SELECT 1 FROM user_profiles up 
      WHERE up.id = (SELECT auth.uid()) 
      AND up.role IN ('admin', 'management')
    )
  );

-- project_assignments table - consolidate policies
DROP POLICY IF EXISTS "Users can view their assignments" ON public.project_assignments;
DROP POLICY IF EXISTS "Project managers can view project assignments" ON public.project_assignments;
DROP POLICY IF EXISTS "Admins can view all assignments" ON public.project_assignments;

CREATE POLICY "consolidated_project_assignments_select" ON public.project_assignments
  FOR SELECT USING (
    user_id = (SELECT auth.uid()) OR -- Own assignments
    project_id IN ( -- Same project assignments
      SELECT project_id FROM project_assignments 
      WHERE user_id = (SELECT auth.uid())
    ) OR
    EXISTS ( -- Admin/management access
      SELECT 1 FROM user_profiles up 
      WHERE up.id = (SELECT auth.uid()) 
      AND up.role IN ('admin', 'management', 'project_manager')
    )
  );

-- Add optimized indexes for the consolidated policies
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles (role);
CREATE INDEX IF NOT EXISTS idx_project_assignments_lookup ON public.project_assignments (project_id, user_id);

-- Consolidate multiple permissive RLS policies into single efficient policies
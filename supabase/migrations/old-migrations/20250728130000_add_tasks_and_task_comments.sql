-- Add Tasks and Task Comments System
-- Created: 2025-07-28
-- Purpose: Add comprehensive task management with comments system
-- Following enterprise optimization patterns from CLAUDE.md

-- ============================================================================
-- TASK ENUMS
-- ============================================================================

-- Task status types (aligned with requirements)
CREATE TYPE task_status AS ENUM (
  'pending',
  'in_progress', 
  'review',
  'done',
  'cancelled'
);

-- Task priority levels (aligned with requirements)
CREATE TYPE task_priority AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

-- ============================================================================
-- TASKS TABLE
-- ============================================================================

-- Tasks table with all required fields
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic fields
  title TEXT NOT NULL,
  description TEXT,
  status task_status DEFAULT 'pending',
  priority task_priority DEFAULT 'medium',
  due_date DATE,
  
  -- Time tracking fields
  estimated_hours DECIMAL(8,2) CHECK (estimated_hours >= 0),
  actual_hours DECIMAL(8,2) CHECK (actual_hours >= 0),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  
  -- Relationship fields
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scope_item_id UUID REFERENCES scope_items(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
  depends_on_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  
  -- Metadata fields
  tags TEXT[] DEFAULT '{}',
  
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT chk_tasks_valid_progress CHECK (
    (status = 'done' AND progress_percentage = 100) OR 
    (status != 'done' AND progress_percentage < 100)
  ),
  CONSTRAINT chk_tasks_valid_due_date CHECK (due_date >= CURRENT_DATE OR due_date IS NULL)
);

-- ============================================================================
-- TASK COMMENTS TABLE
-- ============================================================================

-- Task comments table
CREATE TABLE task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- AUTO-UPDATE TRIGGERS
-- ============================================================================

-- Apply updated_at triggers to new tables
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_comments_updated_at BEFORE UPDATE ON task_comments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PERFORMANCE INDEXES (FOLLOWING ENTERPRISE PATTERNS)
-- ============================================================================

-- Tasks table indexes (following foreign key indexing pattern)
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_scope_item_id ON tasks(scope_item_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_depends_on_task_id ON tasks(depends_on_task_id);

-- Tasks status and priority indexes for filtering
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_tasks_project_status ON tasks(project_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_status ON tasks(assigned_to, status) WHERE assigned_to IS NOT NULL;

-- Task comments indexes
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user_id ON task_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_created_at ON task_comments(created_at);

-- ============================================================================
-- ROW LEVEL SECURITY (FOLLOWING ENTERPRISE OPTIMIZATION PATTERNS)
-- ============================================================================

-- Enable RLS on both tables
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES (USING OPTIMIZED (SELECT auth.uid()) PATTERN)
-- ============================================================================

-- Tasks RLS Policies
-- Policy for SELECT: Users can see tasks if they have project access or are assigned to them
CREATE POLICY "tasks_select_policy" ON tasks
FOR SELECT USING (
  -- Management roles can see all tasks
  is_management_role() OR
  -- Project access through has_project_access function
  has_project_access(project_id) OR  
  -- Users can see tasks assigned to them
  assigned_to = (SELECT auth.uid()) OR
  -- Users can see tasks they created
  created_by = (SELECT auth.uid())
);

-- Policy for INSERT: Users can create tasks if they have project access
CREATE POLICY "tasks_insert_policy" ON tasks
FOR INSERT WITH CHECK (
  -- Management roles can create tasks anywhere
  is_management_role() OR
  -- Users can create tasks in projects they have access to
  has_project_access(project_id)
);

-- Policy for UPDATE: Users can update tasks if they have project access or are assigned
CREATE POLICY "tasks_update_policy" ON tasks
FOR UPDATE USING (
  -- Management roles can update all tasks
  is_management_role() OR
  -- Project access through has_project_access function
  has_project_access(project_id) OR
  -- Users can update tasks assigned to them
  assigned_to = (SELECT auth.uid()) OR
  -- Users can update tasks they created
  created_by = (SELECT auth.uid())
) WITH CHECK (
  -- Same conditions for the updated data
  is_management_role() OR
  has_project_access(project_id) OR
  assigned_to = (SELECT auth.uid()) OR
  created_by = (SELECT auth.uid())
);

-- Policy for DELETE: Only management and creators can delete tasks
CREATE POLICY "tasks_delete_policy" ON tasks
FOR DELETE USING (
  -- Management roles can delete tasks
  is_management_role() OR  
  -- Users can delete tasks they created (and have project access)
  (created_by = (SELECT auth.uid()) AND has_project_access(project_id))
);

-- Task Comments RLS Policies
-- Policy for SELECT: Users can see comments on tasks they have access to
CREATE POLICY "task_comments_select_policy" ON task_comments
FOR SELECT USING (
  -- Management roles can see all comments
  is_management_role() OR
  -- Users can see comments on tasks they have access to
  EXISTS (
    SELECT 1 FROM tasks t 
    WHERE t.id = task_id 
    AND (
      has_project_access(t.project_id) OR
      t.assigned_to = (SELECT auth.uid()) OR
      t.created_by = (SELECT auth.uid())
    )
  )
);

-- Policy for INSERT: Users can add comments to tasks they have access to
CREATE POLICY "task_comments_insert_policy" ON task_comments
FOR INSERT WITH CHECK (
  -- Management roles can comment anywhere
  is_management_role() OR
  -- Users can comment on tasks they have access to
  EXISTS (
    SELECT 1 FROM tasks t 
    WHERE t.id = task_id 
    AND (
      has_project_access(t.project_id) OR
      t.assigned_to = (SELECT auth.uid()) OR
      t.created_by = (SELECT auth.uid())
    )
  )
);

-- Policy for UPDATE: Users can update their own comments
CREATE POLICY "task_comments_update_policy" ON task_comments  
FOR UPDATE USING (
  -- Management roles can update all comments
  is_management_role() OR
  -- Users can update their own comments
  user_id = (SELECT auth.uid())
) WITH CHECK (
  -- Same conditions for updated data
  is_management_role() OR
  user_id = (SELECT auth.uid())
);

-- Policy for DELETE: Users can delete their own comments or management can delete any
CREATE POLICY "task_comments_delete_policy" ON task_comments
FOR DELETE USING (
  -- Management roles can delete any comment
  is_management_role() OR
  -- Users can delete their own comments
  user_id = (SELECT auth.uid())
);

-- ============================================================================
-- PERFORMANCE VERIFICATION QUERIES
-- ============================================================================

-- Verify indexes were created successfully
DO $$
DECLARE
  index_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO index_count 
  FROM pg_indexes 
  WHERE tablename IN ('tasks', 'task_comments')
  AND schemaname = 'public';
  
  RAISE NOTICE '✅ Created % indexes for tasks and task_comments tables', index_count;
END $$;

-- ============================================================================
-- TABLE COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE tasks IS 'Task management system with time tracking and dependencies';  
COMMENT ON TABLE task_comments IS 'Comments system for tasks with full audit trail';

COMMENT ON COLUMN tasks.progress_percentage IS 'Progress from 0-100, must be 100 when status is done';
COMMENT ON COLUMN tasks.depends_on_task_id IS 'Self-referencing for task dependencies';
COMMENT ON COLUMN tasks.estimated_hours IS 'Estimated time to complete task';
COMMENT ON COLUMN tasks.actual_hours IS 'Actual time spent on task';

-- ============================================================================
-- MIGRATION COMPLETION NOTIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Tasks and Task Comments System Migration Completed Successfully';
  RAISE NOTICE '📊 Tables Created: tasks, task_comments';
  RAISE NOTICE '🔒 RLS Policies: 8 policies created using optimized (SELECT auth.uid()) pattern';
  RAISE NOTICE '⚡ Performance: All foreign keys indexed for optimal JOIN performance';
  RAISE NOTICE '🎯 Enterprise Grade: Following CLAUDE.md optimization patterns';
END $$;
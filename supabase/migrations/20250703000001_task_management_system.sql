-- Formula PM 2.0 Task Management System Migration
-- Created: 2025-07-03
-- Purpose: Standalone task management with @mention intelligence

-- ============================================================================
-- TASK SYSTEM ENUMS
-- ============================================================================

-- Task status types (already defined in audit_system migration)
-- Using existing task_status enum from audit_system

-- Task priority types
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Comment reaction types
CREATE TYPE reaction_type AS ENUM ('like', 'love', 'thumbs_up', 'thumbs_down', 'celebrate', 'confused');

-- ============================================================================
-- MAIN TASKS TABLE
-- ============================================================================

-- Standalone tasks table with @mention support
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  
  -- Core Task Fields
  title TEXT NOT NULL,
  description TEXT, -- Rich text with @mention support
  status task_status DEFAULT 'todo',
  priority task_priority DEFAULT 'medium',
  
  -- Assignment & Timeline
  assigned_to UUID[] DEFAULT '{}', -- User IDs
  created_by UUID REFERENCES user_profiles(id),
  due_date DATE,
  estimated_hours DECIMAL(5,2),
  actual_hours DECIMAL(5,2) DEFAULT 0,
  
  -- @Mention References (Smart Linking)
  mentioned_projects UUID[] DEFAULT '{}', -- Project IDs referenced with @project
  mentioned_scope_items UUID[] DEFAULT '{}', -- Scope item IDs referenced with @scope
  mentioned_documents UUID[] DEFAULT '{}', -- Document IDs referenced with @document
  mentioned_users UUID[] DEFAULT '{}', -- User IDs referenced with @user
  mentioned_tasks UUID[] DEFAULT '{}', -- Task IDs referenced with @task
  
  -- Task Dependencies
  depends_on UUID[] DEFAULT '{}', -- Task IDs this task depends on
  blocks UUID[] DEFAULT '{}', -- Task IDs this task blocks
  
  -- Collaboration & Tracking
  comments_count INTEGER DEFAULT 0,
  attachments_count INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_hours CHECK (estimated_hours IS NULL OR estimated_hours >= 0),
  CONSTRAINT valid_actual_hours CHECK (actual_hours >= 0)
);

-- ============================================================================
-- TASK COMMENTS SYSTEM
-- ============================================================================

-- Task comments with threading support and @mentions
CREATE TABLE task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id),
  parent_comment_id UUID REFERENCES task_comments(id) ON DELETE CASCADE,
  
  content TEXT NOT NULL, -- Rich text with @mention support
  mentioned_users UUID[] DEFAULT '{}', -- Users mentioned in this comment
  mentioned_projects UUID[] DEFAULT '{}',
  mentioned_scope_items UUID[] DEFAULT '{}',
  mentioned_documents UUID[] DEFAULT '{}',
  mentioned_tasks UUID[] DEFAULT '{}',
  
  is_edited BOOLEAN DEFAULT false,
  edit_count INTEGER DEFAULT 0,
  reactions_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TASK ATTACHMENTS
-- ============================================================================

-- Task attachments
CREATE TABLE task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES user_profiles(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comment attachments  
CREATE TABLE comment_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID REFERENCES task_comments(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES user_profiles(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- COLLABORATION FEATURES
-- ============================================================================

-- Comment reactions (emoji responses)
CREATE TABLE comment_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID REFERENCES task_comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id),
  reaction_type reaction_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id, reaction_type)
);

-- Task activity log for notifications and history
CREATE TABLE task_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id),
  activity_type TEXT NOT NULL, -- 'created', 'updated', 'commented', 'assigned', 'completed', 'mentioned'
  details JSONB DEFAULT '{}',
  mentioned_user_id UUID REFERENCES user_profiles(id), -- For mention notifications
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- @Mention reference tracking for navigation
CREATE TABLE mention_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL, -- 'task', 'comment'
  source_id UUID NOT NULL, -- task_id or comment_id
  target_type TEXT NOT NULL, -- 'project', 'scope', 'document', 'user', 'task'
  target_id UUID NOT NULL,
  mentioned_by UUID REFERENCES user_profiles(id),
  context TEXT, -- Surrounding text for preview
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Index for fast lookups
  CONSTRAINT valid_source_type CHECK (source_type IN ('task', 'comment')),
  CONSTRAINT valid_target_type CHECK (target_type IN ('project', 'scope', 'document', 'user', 'task'))
);

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================

-- Core task indexes
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_assigned ON tasks USING gin(assigned_to);
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
CREATE INDEX idx_tasks_parent ON tasks(parent_task_id) WHERE parent_task_id IS NOT NULL;
CREATE INDEX idx_tasks_last_activity ON tasks(last_activity_at);

-- @Mention indexes for fast autocomplete
CREATE INDEX idx_tasks_mentions_projects ON tasks USING gin(mentioned_projects);
CREATE INDEX idx_tasks_mentions_scope ON tasks USING gin(mentioned_scope_items);
CREATE INDEX idx_tasks_mentions_documents ON tasks USING gin(mentioned_documents);
CREATE INDEX idx_tasks_mentions_users ON tasks USING gin(mentioned_users);
CREATE INDEX idx_tasks_mentions_tasks ON tasks USING gin(mentioned_tasks);

-- Dependency indexes
CREATE INDEX idx_tasks_depends_on ON tasks USING gin(depends_on);
CREATE INDEX idx_tasks_blocks ON tasks USING gin(blocks);

-- Comment indexes
CREATE INDEX idx_task_comments_task ON task_comments(task_id);
CREATE INDEX idx_task_comments_user ON task_comments(user_id);
CREATE INDEX idx_task_comments_parent ON task_comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;
CREATE INDEX idx_task_comments_created ON task_comments(created_at);
CREATE INDEX idx_task_comments_mentions ON task_comments USING gin(mentioned_users);

-- Activity and notification indexes
CREATE INDEX idx_task_activities_task ON task_activities(task_id);
CREATE INDEX idx_task_activities_user ON task_activities(user_id);
CREATE INDEX idx_task_activities_mentioned_user ON task_activities(mentioned_user_id) WHERE mentioned_user_id IS NOT NULL;
CREATE INDEX idx_task_activities_type ON task_activities(activity_type);
CREATE INDEX idx_task_activities_created ON task_activities(created_at);

-- Attachment indexes
CREATE INDEX idx_task_attachments_task ON task_attachments(task_id);
CREATE INDEX idx_task_attachments_uploaded_by ON task_attachments(uploaded_by);
CREATE INDEX idx_comment_attachments_comment ON comment_attachments(comment_id);

-- Reaction indexes
CREATE INDEX idx_comment_reactions_comment ON comment_reactions(comment_id);
CREATE INDEX idx_comment_reactions_user ON comment_reactions(user_id);

-- Mention reference indexes
CREATE INDEX idx_mentions_source ON mention_references(source_type, source_id);
CREATE INDEX idx_mentions_target ON mention_references(target_type, target_id);
CREATE INDEX idx_mentions_by_user ON mention_references(mentioned_by);

-- ============================================================================
-- AUTO-UPDATE TRIGGERS
-- ============================================================================

-- Update task timestamps and activity
CREATE OR REPLACE FUNCTION update_task_activity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_activity_at = NOW();
  
  -- Set completed_at when status changes to done
  IF NEW.status = 'done' AND OLD.status != 'done' THEN
    NEW.completed_at = NOW();
  ELSIF NEW.status != 'done' AND OLD.status = 'done' THEN
    NEW.completed_at = NULL;
  END IF;
  
  -- Log status change activity
  IF OLD.status != NEW.status THEN
    INSERT INTO task_activities (task_id, user_id, activity_type, details)
    VALUES (NEW.id, NEW.created_by, 'status_changed', 
      json_build_object('old_status', OLD.status, 'new_status', NEW.status));
  END IF;
  
  -- Log assignment changes
  IF OLD.assigned_to != NEW.assigned_to THEN
    INSERT INTO task_activities (task_id, user_id, activity_type, details)
    VALUES (NEW.id, NEW.created_by, 'assignment_changed', 
      json_build_object('old_assigned', OLD.assigned_to, 'new_assigned', NEW.assigned_to));
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_task_activity_trigger
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE PROCEDURE update_task_activity();

-- Update comment count on tasks
CREATE OR REPLACE FUNCTION update_task_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tasks 
    SET comments_count = comments_count + 1,
        last_activity_at = NOW()
    WHERE id = NEW.task_id;
    
    -- Update parent comment replies count
    IF NEW.parent_comment_id IS NOT NULL THEN
      UPDATE task_comments
      SET replies_count = replies_count + 1
      WHERE id = NEW.parent_comment_id;
    END IF;
    
    -- Log comment activity
    INSERT INTO task_activities (task_id, user_id, activity_type, details)
    VALUES (NEW.task_id, NEW.user_id, 'commented', 
      json_build_object('comment_id', NEW.id, 'is_reply', NEW.parent_comment_id IS NOT NULL));
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE tasks 
    SET comments_count = comments_count - 1,
        last_activity_at = NOW()
    WHERE id = OLD.task_id;
    
    -- Update parent comment replies count
    IF OLD.parent_comment_id IS NOT NULL THEN
      UPDATE task_comments
      SET replies_count = replies_count - 1
      WHERE id = OLD.parent_comment_id;
    END IF;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER task_comment_count_trigger
  AFTER INSERT OR DELETE ON task_comments
  FOR EACH ROW EXECUTE PROCEDURE update_task_comment_count();

-- Update reaction count on comments
CREATE OR REPLACE FUNCTION update_comment_reaction_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE task_comments 
    SET reactions_count = reactions_count + 1
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE task_comments 
    SET reactions_count = reactions_count - 1
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER comment_reaction_count_trigger
  AFTER INSERT OR DELETE ON comment_reactions
  FOR EACH ROW EXECUTE PROCEDURE update_comment_reaction_count();

-- Update attachment count on tasks
CREATE OR REPLACE FUNCTION update_task_attachment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tasks 
    SET attachments_count = attachments_count + 1,
        last_activity_at = NOW()
    WHERE id = NEW.task_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE tasks 
    SET attachments_count = attachments_count - 1,
        last_activity_at = NOW()
    WHERE id = OLD.task_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER task_attachment_count_trigger
  AFTER INSERT OR DELETE ON task_attachments
  FOR EACH ROW EXECUTE PROCEDURE update_task_attachment_count();

-- ============================================================================
-- @MENTION PROCESSING FUNCTIONS
-- ============================================================================

-- Function to extract and store mention references
CREATE OR REPLACE FUNCTION process_mention_references(
  source_type TEXT,
  source_id UUID,
  content TEXT,
  mentioned_by_user UUID
)
RETURNS VOID AS $$
DECLARE
  mention_record RECORD;
  project_matches TEXT[];
  scope_matches TEXT[];
  user_matches TEXT[];
  task_matches TEXT[];
  document_matches TEXT[];
BEGIN
  -- Delete existing mentions for this source
  DELETE FROM mention_references 
  WHERE source_type = process_mention_references.source_type 
    AND source_id = process_mention_references.source_id;
  
  -- Extract @project mentions
  SELECT ARRAY(
    SELECT unnest(regexp_split_to_array(content, '@project:([a-zA-Z0-9-_]+)', 'g'))
  ) INTO project_matches;
  
  -- Extract @scope mentions  
  SELECT ARRAY(
    SELECT unnest(regexp_split_to_array(content, '@scope:([0-9]+)', 'g'))
  ) INTO scope_matches;
  
  -- Extract @user mentions
  SELECT ARRAY(
    SELECT unnest(regexp_split_to_array(content, '@user:([a-zA-Z0-9-_]+)', 'g'))
  ) INTO user_matches;
  
  -- Extract @task mentions
  SELECT ARRAY(
    SELECT unnest(regexp_split_to_array(content, '@task:([a-zA-Z0-9-_]+)', 'g'))
  ) INTO task_matches;
  
  -- Extract @document mentions
  SELECT ARRAY(
    SELECT unnest(regexp_split_to_array(content, '@(?:document|shopdrawing):([a-zA-Z0-9-_]+)', 'g'))
  ) INTO document_matches;
  
  -- Store mention references (simplified for now - in production would validate entity existence)
  -- This is a basic implementation - the actual mention parsing will be done in the application layer
  
END;
$$ language 'plpgsql';

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to get task hierarchy (parent/child relationships)
CREATE OR REPLACE FUNCTION get_task_hierarchy(task_uuid UUID)
RETURNS TABLE(
  id UUID,
  title TEXT,
  level INTEGER,
  path TEXT[]
) AS $$
WITH RECURSIVE task_tree AS (
  -- Base case: start with the specified task
  SELECT t.id, t.title, t.parent_task_id, 0 as level, ARRAY[t.title] as path
  FROM tasks t
  WHERE t.id = task_uuid
  
  UNION ALL
  
  -- Recursive case: find children
  SELECT t.id, t.title, t.parent_task_id, tt.level + 1, tt.path || t.title
  FROM tasks t
  JOIN task_tree tt ON t.parent_task_id = tt.id
)
SELECT id, title, level, path
FROM task_tree
ORDER BY level, title;
$$ language 'sql';

-- Function to check for circular dependencies
CREATE OR REPLACE FUNCTION check_task_circular_dependency(
  task_uuid UUID,
  new_depends_on UUID[]
)
RETURNS BOOLEAN AS $$
DECLARE
  circular_found BOOLEAN := FALSE;
BEGIN
  -- Check if any of the new dependencies would create a circular reference
  WITH RECURSIVE dependency_check AS (
    -- Start with the current task
    SELECT task_uuid as id, 0 as depth
    
    UNION ALL
    
    -- Follow the dependency chain
    SELECT unnest(t.depends_on) as id, dc.depth + 1
    FROM tasks t
    JOIN dependency_check dc ON t.id = dc.id
    WHERE dc.depth < 10 -- Prevent infinite recursion
  )
  SELECT EXISTS (
    SELECT 1 FROM dependency_check 
    WHERE id = ANY(new_depends_on) AND depth > 0
  ) INTO circular_found;
  
  RETURN circular_found;
END;
$$ language 'plpgsql';

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE tasks IS 'Standalone task management system with @mention intelligence and project integration';
COMMENT ON TABLE task_comments IS 'Threaded comment system for tasks with @mention support and real-time collaboration';
COMMENT ON TABLE task_attachments IS 'File attachments for tasks with size and type tracking';
COMMENT ON TABLE comment_attachments IS 'File attachments for individual comments';
COMMENT ON TABLE comment_reactions IS 'Emoji reactions for comments to support team collaboration';
COMMENT ON TABLE task_activities IS 'Activity log for tasks including mentions, status changes, and notifications';
COMMENT ON TABLE mention_references IS 'Normalized mention reference tracking for fast navigation and context';

COMMENT ON COLUMN tasks.mentioned_projects IS 'Array of project IDs mentioned in task description using @project:id syntax';
COMMENT ON COLUMN tasks.mentioned_scope_items IS 'Array of scope item IDs mentioned using @scope:item_no syntax';
COMMENT ON COLUMN tasks.mentioned_documents IS 'Array of document IDs mentioned using @document:id or @shopdrawing:id syntax';
COMMENT ON COLUMN tasks.mentioned_users IS 'Array of user IDs mentioned using @user:id syntax for notifications';
COMMENT ON COLUMN tasks.mentioned_tasks IS 'Array of task IDs mentioned using @task:id syntax for cross-references';
COMMENT ON COLUMN tasks.depends_on IS 'Array of task IDs that this task depends on - blocks this task until dependencies complete';
COMMENT ON COLUMN tasks.blocks IS 'Array of task IDs that this task blocks - prevents those tasks from starting';

-- Migration completion marker
INSERT INTO public.migrations (version, name, executed_at) 
VALUES ('20250703000001', 'task_management_system', NOW())
ON CONFLICT (version) DO NOTHING;
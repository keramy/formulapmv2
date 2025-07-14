-- Enable Real-time Triggers for OPTIMIZATION PHASE 1.3
-- This migration sets up the necessary triggers and functions to support real-time features

-- Create activity_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on activity_logs
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Create indexes for activity_logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON activity_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_id ON activity_logs(entity_id);

-- Enable realtime on tables that need live updates (only if they exist)
DO $$
BEGIN
    -- Add tables to realtime publication if they exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
        ALTER publication supabase_realtime ADD TABLE projects;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') THEN
        ALTER publication supabase_realtime ADD TABLE tasks;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'scope_items') THEN
        ALTER publication supabase_realtime ADD TABLE scope_items;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_logs') THEN
        ALTER publication supabase_realtime ADD TABLE activity_logs;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        ALTER publication supabase_realtime ADD TABLE user_profiles;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_assignments') THEN
        ALTER publication supabase_realtime ADD TABLE project_assignments;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'milestones') THEN
        ALTER publication supabase_realtime ADD TABLE milestones;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'material_specs') THEN
        ALTER publication supabase_realtime ADD TABLE material_specs;
    END IF;
END $$;

-- Create activity logging function
CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log for specific tables and operations
  IF TG_TABLE_NAME IN ('projects', 'tasks', 'scope_items', 'milestones', 'material_specs') THEN
    INSERT INTO activity_logs (
      user_id,
      action,
      entity_type,
      entity_id,
      details,
      created_at
    ) VALUES (
      COALESCE(NEW.updated_by, NEW.created_by, auth.uid()),
      CASE 
        WHEN TG_OP = 'INSERT' THEN 'created'
        WHEN TG_OP = 'UPDATE' THEN 'updated'
        WHEN TG_OP = 'DELETE' THEN 'deleted'
        ELSE 'modified'
      END,
      TG_TABLE_NAME,
      COALESCE(NEW.id, OLD.id),
      jsonb_build_object(
        'operation', TG_OP,
        'table', TG_TABLE_NAME,
        'old_data', CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        'new_data', CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END
      ),
      NOW()
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for activity logging (only if tables exist)
DO $$
BEGIN
    -- Projects activity trigger
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
        DROP TRIGGER IF EXISTS projects_activity_trigger ON projects;
        CREATE TRIGGER projects_activity_trigger
          AFTER INSERT OR UPDATE OR DELETE ON projects
          FOR EACH ROW EXECUTE FUNCTION log_activity();
    END IF;
    
    -- Tasks activity trigger
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') THEN
        DROP TRIGGER IF EXISTS tasks_activity_trigger ON tasks;
        CREATE TRIGGER tasks_activity_trigger
          AFTER INSERT OR UPDATE OR DELETE ON tasks
          FOR EACH ROW EXECUTE FUNCTION log_activity();
    END IF;
    
    -- Scope items activity trigger
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'scope_items') THEN
        DROP TRIGGER IF EXISTS scope_items_activity_trigger ON scope_items;
        CREATE TRIGGER scope_items_activity_trigger
          AFTER INSERT OR UPDATE OR DELETE ON scope_items
          FOR EACH ROW EXECUTE FUNCTION log_activity();
    END IF;
    
    -- Milestones activity trigger
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'milestones') THEN
        DROP TRIGGER IF EXISTS milestones_activity_trigger ON milestones;
        CREATE TRIGGER milestones_activity_trigger
          AFTER INSERT OR UPDATE OR DELETE ON milestones
          FOR EACH ROW EXECUTE FUNCTION log_activity();
    END IF;
    
    -- Material specs activity trigger
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'material_specs') THEN
        DROP TRIGGER IF EXISTS material_specs_activity_trigger ON material_specs;
        CREATE TRIGGER material_specs_activity_trigger
          AFTER INSERT OR UPDATE OR DELETE ON material_specs
          FOR EACH ROW EXECUTE FUNCTION log_activity();
    END IF;
END $$;

-- Create function to update timestamps on changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to tables that don't have them
CREATE OR REPLACE FUNCTION ensure_updated_at_trigger(table_name text)
RETURNS void AS $$
BEGIN
  EXECUTE format('
    DROP TRIGGER IF EXISTS %I_updated_at_trigger ON %I;
    CREATE TRIGGER %I_updated_at_trigger
      BEFORE UPDATE ON %I
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  ', table_name, table_name, table_name, table_name);
END;
$$ LANGUAGE plpgsql;

-- Ensure updated_at triggers exist (only if tables exist)
DO $$
BEGIN
    -- Ensure updated_at triggers exist for each table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
        PERFORM ensure_updated_at_trigger('projects');
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') THEN
        PERFORM ensure_updated_at_trigger('tasks');
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'scope_items') THEN
        PERFORM ensure_updated_at_trigger('scope_items');
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'milestones') THEN
        PERFORM ensure_updated_at_trigger('milestones');
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'material_specs') THEN
        PERFORM ensure_updated_at_trigger('material_specs');
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        PERFORM ensure_updated_at_trigger('user_profiles');
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_assignments') THEN
        PERFORM ensure_updated_at_trigger('project_assignments');
    END IF;
END $$;

-- Create function to broadcast project updates
CREATE OR REPLACE FUNCTION broadcast_project_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Broadcast to project-specific channel
  PERFORM pg_notify(
    'project_' || NEW.id,
    json_build_object(
      'type', 'project_update',
      'project_id', NEW.id,
      'operation', TG_OP,
      'data', row_to_json(NEW)
    )::text
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to broadcast task updates
CREATE OR REPLACE FUNCTION broadcast_task_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Broadcast to project-specific channel
  PERFORM pg_notify(
    'project_tasks_' || NEW.project_id,
    json_build_object(
      'type', 'task_update',
      'project_id', NEW.project_id,
      'task_id', NEW.id,
      'operation', TG_OP,
      'data', row_to_json(NEW)
    )::text
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to broadcast scope updates
CREATE OR REPLACE FUNCTION broadcast_scope_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Broadcast to project-specific channel
  PERFORM pg_notify(
    'project_scope_' || NEW.project_id,
    json_build_object(
      'type', 'scope_update',
      'project_id', NEW.project_id,
      'scope_id', NEW.id,
      'operation', TG_OP,
      'data', row_to_json(NEW)
    )::text
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create broadcast triggers (only if tables exist)
DO $$
BEGIN
    -- Project broadcast trigger
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
        DROP TRIGGER IF EXISTS project_broadcast_trigger ON projects;
        CREATE TRIGGER project_broadcast_trigger
          AFTER INSERT OR UPDATE ON projects
          FOR EACH ROW EXECUTE FUNCTION broadcast_project_update();
    END IF;
    
    -- Task broadcast trigger
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') THEN
        DROP TRIGGER IF EXISTS task_broadcast_trigger ON tasks;
        CREATE TRIGGER task_broadcast_trigger
          AFTER INSERT OR UPDATE ON tasks
          FOR EACH ROW EXECUTE FUNCTION broadcast_task_update();
    END IF;
    
    -- Scope broadcast trigger
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'scope_items') THEN
        DROP TRIGGER IF EXISTS scope_broadcast_trigger ON scope_items;
        CREATE TRIGGER scope_broadcast_trigger
          AFTER INSERT OR UPDATE ON scope_items
          FOR EACH ROW EXECUTE FUNCTION broadcast_scope_update();
    END IF;
END $$;

-- Create indexes for better real-time performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id_created_at ON activity_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type_created_at ON activity_logs(entity_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_id_created_at ON activity_logs(entity_id, created_at DESC);

-- Create RLS policies for real-time access (only if tables exist)
DO $$
BEGIN
    -- Activity logs policy
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_logs') THEN
        DROP POLICY IF EXISTS "Users can view activity logs they have access to" ON activity_logs;
        CREATE POLICY "Users can view activity logs they have access to" ON activity_logs
          FOR SELECT USING (
            -- Users can see their own activity
            user_id = auth.uid()
          );
    END IF;

    -- Projects real-time policy (simplified - use existing RLS)
    -- Note: Projects table should already have RLS policies from previous migrations
    
    -- Tasks real-time policy (simplified - use existing RLS)
    -- Note: Tasks table should already have RLS policies from previous migrations
    
    -- Scope items real-time policy (simplified - use existing RLS)
    -- Note: Scope items table should already have RLS policies from previous migrations
END $$;

-- Comment with setup instructions
COMMENT ON FUNCTION log_activity() IS 'Logs user activity for real-time feeds - OPTIMIZATION PHASE 1.3';
COMMENT ON FUNCTION broadcast_project_update() IS 'Broadcasts project updates for real-time collaboration - OPTIMIZATION PHASE 1.3';
COMMENT ON FUNCTION broadcast_task_update() IS 'Broadcasts task updates for real-time collaboration - OPTIMIZATION PHASE 1.3';
COMMENT ON FUNCTION broadcast_scope_update() IS 'Broadcasts scope updates for real-time collaboration - OPTIMIZATION PHASE 1.3';
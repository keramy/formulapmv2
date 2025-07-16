-- Performance Optimization Indexes
-- Safe to apply - only adds indexes, no schema changes
-- Created: 2025-01-16

-- ============================================================================
-- TASK MANAGEMENT INDEXES
-- ============================================================================

-- Most common task queries
CREATE INDEX IF NOT EXISTS idx_tasks_project_status 
ON tasks(project_id, status) 
WHERE status != 'cancelled';

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to_status 
ON tasks(assigned_to, status) 
WHERE assigned_to IS NOT NULL AND status != 'cancelled';

CREATE INDEX IF NOT EXISTS idx_tasks_due_date_status 
ON tasks(due_date, status) 
WHERE due_date IS NOT NULL AND status IN ('pending', 'in_progress');

CREATE INDEX IF NOT EXISTS idx_tasks_project_created_at 
ON tasks(project_id, created_at DESC);

-- Task comments performance
CREATE INDEX IF NOT EXISTS idx_task_comments_task_created 
ON task_comments(task_id, created_at DESC);

-- ============================================================================
-- SCOPE MANAGEMENT INDEXES
-- ============================================================================

-- Scope items by project and category (most common filter)
CREATE INDEX IF NOT EXISTS idx_scope_items_project_category 
ON scope_items(project_id, category);

-- Scope items by status (for dashboard stats)
CREATE INDEX IF NOT EXISTS idx_scope_items_project_status 
ON scope_items(project_id, status);

-- Scope items by assigned users
CREATE INDEX IF NOT EXISTS idx_scope_items_assigned_to 
ON scope_items USING GIN(assigned_to) 
WHERE assigned_to != '{}';

-- Cost tracking queries
CREATE INDEX IF NOT EXISTS idx_scope_items_project_costs 
ON scope_items(project_id, total_price) 
WHERE total_price > 0;

-- Timeline queries
CREATE INDEX IF NOT EXISTS idx_scope_items_timeline 
ON scope_items(project_id, timeline_start, timeline_end) 
WHERE timeline_start IS NOT NULL;

-- ============================================================================
-- PROJECT MANAGEMENT INDEXES
-- ============================================================================

-- Project listings by status and manager
CREATE INDEX IF NOT EXISTS idx_projects_status_manager 
ON projects(status, project_manager_id);

-- Project assignments lookup
CREATE INDEX IF NOT EXISTS idx_project_assignments_user_active 
ON project_assignments(user_id, is_active) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_project_assignments_project_active 
ON project_assignments(project_id, is_active) 
WHERE is_active = true;

-- Budget tracking
CREATE INDEX IF NOT EXISTS idx_projects_budget_tracking 
ON projects(status, budget, actual_cost) 
WHERE budget > 0;

-- ============================================================================
-- MILESTONE MANAGEMENT INDEXES
-- ============================================================================

-- Check which date column exists and create appropriate indexes
DO $$
BEGIN
    -- Check if target_date column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'project_milestones'
        AND column_name = 'target_date'
    ) THEN
        -- Use target_date
        CREATE INDEX IF NOT EXISTS idx_milestones_project_target_date
        ON project_milestones(project_id, target_date);

        CREATE INDEX IF NOT EXISTS idx_milestones_overdue
        ON project_milestones(target_date, status)
        WHERE status != 'completed' AND status != 'cancelled';

        RAISE NOTICE 'Created milestone indexes using target_date column';

    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'project_milestones'
        AND column_name = 'milestone_date'
    ) THEN
        -- Use milestone_date
        CREATE INDEX IF NOT EXISTS idx_milestones_project_milestone_date
        ON project_milestones(project_id, milestone_date);

        CREATE INDEX IF NOT EXISTS idx_milestones_overdue
        ON project_milestones(milestone_date, status)
        WHERE status != 'completed' AND status != 'cancelled';

        RAISE NOTICE 'Created milestone indexes using milestone_date column';

    ELSE
        RAISE NOTICE 'No milestone date column found - skipping milestone date indexes';
    END IF;

    -- Always create project_id + status index (these columns should exist)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_milestones') THEN
        CREATE INDEX IF NOT EXISTS idx_milestones_project_status
        ON project_milestones(project_id, status);

        RAISE NOTICE 'Created milestone project_status index';
    ELSE
        RAISE NOTICE 'project_milestones table does not exist - skipping milestone indexes';
    END IF;
END $$;

-- ============================================================================
-- USER AND AUTHENTICATION INDEXES
-- ============================================================================

-- User profile lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_active 
ON user_profiles(role, is_active) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_user_profiles_email_active 
ON user_profiles(email, is_active) 
WHERE is_active = true;

-- ============================================================================
-- AUDIT AND ACTIVITY INDEXES
-- ============================================================================

-- Activity logs by project (if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        CREATE INDEX IF NOT EXISTS idx_audit_logs_project_created 
        ON audit_logs(project_id, created_at DESC) 
        WHERE project_id IS NOT NULL;
        
        CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created 
        ON audit_logs(user_id, created_at DESC);
    END IF;
END $$;

-- ============================================================================
-- PERFORMANCE STATISTICS
-- ============================================================================

-- Create a view for index usage monitoring
CREATE OR REPLACE VIEW index_usage_stats AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Create a function to analyze query performance
CREATE OR REPLACE FUNCTION analyze_table_performance()
RETURNS TABLE(
    table_name text,
    total_size text,
    index_size text,
    row_count bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.table_name::text,
        pg_size_pretty(pg_total_relation_size(t.table_name::regclass))::text as total_size,
        pg_size_pretty(pg_indexes_size(t.table_name::regclass))::text as index_size,
        (SELECT n_tup_ins + n_tup_upd + n_tup_del FROM pg_stat_user_tables WHERE relname = t.table_name) as row_count
    FROM information_schema.tables t
    WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
    AND t.table_name IN ('tasks', 'scope_items', 'projects', 'project_milestones', 'user_profiles')
    ORDER BY pg_total_relation_size(t.table_name::regclass) DESC;
END;
$$ LANGUAGE plpgsql;

-- Success message
SELECT 'Performance indexes created successfully! No schema changes made.' as result;

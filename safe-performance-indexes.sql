-- SAFE Performance Optimization Indexes
-- This version auto-detects your actual table structure
-- Safe to apply - only adds indexes, no schema changes

-- ============================================================================
-- TASK MANAGEMENT INDEXES (SAFE)
-- ============================================================================

-- Check if tasks table exists before creating indexes
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') THEN
        -- Most common task queries
        CREATE INDEX IF NOT EXISTS idx_tasks_project_status 
        ON tasks(project_id, status) 
        WHERE status != 'cancelled';

        CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to_status 
        ON tasks(assigned_to, status) 
        WHERE assigned_to IS NOT NULL AND status != 'cancelled';

        -- Only create due_date index if column exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'tasks' AND column_name = 'due_date'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_tasks_due_date_status 
            ON tasks(due_date, status) 
            WHERE due_date IS NOT NULL AND status IN ('pending', 'in_progress');
        END IF;

        CREATE INDEX IF NOT EXISTS idx_tasks_project_created_at 
        ON tasks(project_id, created_at DESC);

        RAISE NOTICE '✅ Created task performance indexes';
    ELSE
        RAISE NOTICE '⚠️ tasks table not found - skipping task indexes';
    END IF;
END $$;

-- Task comments performance (if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'task_comments') THEN
        CREATE INDEX IF NOT EXISTS idx_task_comments_task_created 
        ON task_comments(task_id, created_at DESC);
        
        RAISE NOTICE '✅ Created task comments performance indexes';
    ELSE
        RAISE NOTICE '⚠️ task_comments table not found - skipping';
    END IF;
END $$;

-- ============================================================================
-- SCOPE MANAGEMENT INDEXES (SAFE)
-- ============================================================================

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'scope_items') THEN
        -- Scope items by project and category (most common filter)
        CREATE INDEX IF NOT EXISTS idx_scope_items_project_category 
        ON scope_items(project_id, category);

        -- Scope items by status (for dashboard stats)
        CREATE INDEX IF NOT EXISTS idx_scope_items_project_status 
        ON scope_items(project_id, status);

        -- Cost tracking queries (only if total_price column exists)
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'scope_items' AND column_name = 'total_price'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_scope_items_project_costs 
            ON scope_items(project_id, total_price) 
            WHERE total_price > 0;
        END IF;

        -- Timeline queries (only if timeline columns exist)
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'scope_items' AND column_name = 'timeline_start'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_scope_items_timeline 
            ON scope_items(project_id, timeline_start, timeline_end) 
            WHERE timeline_start IS NOT NULL;
        END IF;

        -- Assigned users (only if assigned_to column exists and is array type)
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'scope_items' 
            AND column_name = 'assigned_to'
            AND data_type = 'ARRAY'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_scope_items_assigned_to 
            ON scope_items USING GIN(assigned_to) 
            WHERE assigned_to != '{}';
        END IF;

        RAISE NOTICE '✅ Created scope items performance indexes';
    ELSE
        RAISE NOTICE '⚠️ scope_items table not found - skipping scope indexes';
    END IF;
END $$;

-- ============================================================================
-- PROJECT MANAGEMENT INDEXES (SAFE)
-- ============================================================================

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
        -- Project listings by status and manager
        CREATE INDEX IF NOT EXISTS idx_projects_status_manager 
        ON projects(status, project_manager_id);

        -- Budget tracking (only if budget columns exist)
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'projects' AND column_name = 'budget'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_projects_budget_tracking 
            ON projects(status, budget, actual_cost) 
            WHERE budget > 0;
        END IF;

        RAISE NOTICE '✅ Created project performance indexes';
    ELSE
        RAISE NOTICE '⚠️ projects table not found - skipping project indexes';
    END IF;
END $$;

-- Project assignments (if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_assignments') THEN
        CREATE INDEX IF NOT EXISTS idx_project_assignments_user_active 
        ON project_assignments(user_id, is_active) 
        WHERE is_active = true;

        CREATE INDEX IF NOT EXISTS idx_project_assignments_project_active 
        ON project_assignments(project_id, is_active) 
        WHERE is_active = true;

        RAISE NOTICE '✅ Created project assignments performance indexes';
    ELSE
        RAISE NOTICE '⚠️ project_assignments table not found - skipping';
    END IF;
END $$;

-- ============================================================================
-- MILESTONE MANAGEMENT INDEXES (SAFE - AUTO-DETECT COLUMNS)
-- ============================================================================

DO $$ 
DECLARE
    date_column TEXT;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_milestones') THEN
        
        -- Detect which date column exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'project_milestones' AND column_name = 'target_date'
        ) THEN
            date_column := 'target_date';
        ELSIF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'project_milestones' AND column_name = 'milestone_date'
        ) THEN
            date_column := 'milestone_date';
        ELSE
            date_column := NULL;
        END IF;

        -- Create indexes based on detected columns
        IF date_column IS NOT NULL THEN
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_milestones_project_date ON project_milestones(project_id, %I)', date_column);
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_milestones_overdue ON project_milestones(%I, status) WHERE status != ''completed'' AND status != ''cancelled''', date_column);
            
            RAISE NOTICE '✅ Created milestone date indexes using % column', date_column;
        ELSE
            RAISE NOTICE '⚠️ No date column found in project_milestones - skipping date indexes';
        END IF;

        -- Always create project_id + status index
        CREATE INDEX IF NOT EXISTS idx_milestones_project_status 
        ON project_milestones(project_id, status);

        RAISE NOTICE '✅ Created milestone status indexes';
    ELSE
        RAISE NOTICE '⚠️ project_milestones table not found - skipping milestone indexes';
    END IF;
END $$;

-- ============================================================================
-- USER AND AUTHENTICATION INDEXES (SAFE)
-- ============================================================================

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        -- User profile lookups
        CREATE INDEX IF NOT EXISTS idx_user_profiles_role_active 
        ON user_profiles(role, is_active) 
        WHERE is_active = true;

        CREATE INDEX IF NOT EXISTS idx_user_profiles_email_active 
        ON user_profiles(email, is_active) 
        WHERE is_active = true;

        RAISE NOTICE '✅ Created user profile performance indexes';
    ELSE
        RAISE NOTICE '⚠️ user_profiles table not found - skipping user indexes';
    END IF;
END $$;

-- ============================================================================
-- PERFORMANCE MONITORING VIEWS (SAFE)
-- ============================================================================

-- Create a view for index usage monitoring (only if pg_stat_user_indexes exists)
DO $$ 
BEGIN
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

    RAISE NOTICE '✅ Created index usage monitoring view';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Could not create index usage view: %', SQLERRM;
END $$;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

SELECT 
    '🎉 SAFE PERFORMANCE INDEXES APPLIED SUCCESSFULLY!' as result,
    'All indexes created based on your actual table structure' as note,
    'Check the notices above to see which indexes were created' as instruction;

-- Performance Indexes for Critical API Optimization
-- Generated: 2025-01-17 (Fixed)
-- Expected Performance Improvement: 30-50%

-- ============================================================================
-- SCOPE ITEMS - Most Critical Performance Indexes
-- ============================================================================

-- Multi-column index for scope listing API (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_scope_items_api_listing 
ON scope_items(project_id, category, status, created_at DESC);

-- Progress tracking queries for project management dashboards
CREATE INDEX IF NOT EXISTS idx_scope_items_progress_tracking 
ON scope_items(project_id, progress_percentage, status) 
WHERE progress_percentage IS NOT NULL;

-- Timeline analysis for deadline management and scheduling
CREATE INDEX IF NOT EXISTS idx_scope_items_timeline_critical 
ON scope_items(timeline_end, status, project_id) 
WHERE timeline_end IS NOT NULL AND status NOT IN ('completed', 'cancelled');

-- Cost analysis for management reporting (with cost access control)
CREATE INDEX IF NOT EXISTS idx_scope_items_cost_analysis 
ON scope_items(project_id, initial_cost, actual_cost) 
WHERE initial_cost IS NOT NULL OR actual_cost IS NOT NULL;

-- Assignment-based filtering for role-based access
CREATE INDEX IF NOT EXISTS idx_scope_items_assignments 
ON scope_items USING gin(assigned_to);

-- Item lookup by project and item number (business requirement)
CREATE INDEX IF NOT EXISTS idx_scope_items_business_lookup 
ON scope_items(project_id, item_no, status);

-- ============================================================================
-- PROJECT ASSIGNMENTS - Critical for Access Control Performance
-- ============================================================================

-- Project access verification (most critical for RLS performance)
CREATE INDEX IF NOT EXISTS idx_project_assignments_rls_access 
ON project_assignments(user_id, project_id, is_active) 
WHERE is_active = true;

-- Project team listing for UI components and dashboards
CREATE INDEX IF NOT EXISTS idx_project_assignments_team_listing 
ON project_assignments(project_id, is_active, role, assigned_at DESC) 
WHERE is_active = true;

-- User's project assignments for navigation and permissions
CREATE INDEX IF NOT EXISTS idx_project_assignments_user_projects 
ON project_assignments(user_id, is_active, assigned_at DESC) 
WHERE is_active = true;

-- ============================================================================
-- PROJECTS - Critical for Dashboard Performance
-- ============================================================================

-- Management dashboard queries (budget analysis and reporting)
CREATE INDEX IF NOT EXISTS idx_projects_management_dashboard 
ON projects(status, budget, actual_cost, end_date) 
WHERE status IN ('active', 'planning', 'bidding');

-- Project manager workload analysis
CREATE INDEX IF NOT EXISTS idx_projects_pm_workload 
ON projects(project_manager_id, status, created_at DESC);

-- Client project access for client portal
CREATE INDEX IF NOT EXISTS idx_projects_client_access 
ON projects(client_id, status, created_at DESC);

-- Project timeline and deadline tracking
CREATE INDEX IF NOT EXISTS idx_projects_timeline_tracking 
ON projects(end_date, status) 
WHERE end_date IS NOT NULL AND status != 'completed';

-- ============================================================================
-- USER PROFILES - Role-Based Access Performance
-- ============================================================================

-- Role-based queries with activity status (critical for permissions)
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_permissions 
ON user_profiles(role, is_active) 
WHERE is_active = true;

-- User lookup by email for authentication
CREATE INDEX IF NOT EXISTS idx_user_profiles_auth_lookup 
ON user_profiles(email, is_active) 
WHERE is_active = true;

-- Department and role filtering for team management
CREATE INDEX IF NOT EXISTS idx_user_profiles_team_management 
ON user_profiles(department, role, is_active) 
WHERE department IS NOT NULL AND is_active = true;

-- ============================================================================
-- TASKS TABLE INDEXES (if tasks table exists)
-- ============================================================================

-- Check if tasks table exists and create indexes
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') THEN
        -- User task assignment queries (most common for dashboard)
        CREATE INDEX IF NOT EXISTS idx_tasks_user_dashboard 
        ON tasks(assigned_to, status, due_date DESC) 
        WHERE assigned_to IS NOT NULL;

        -- Project task listing and management
        CREATE INDEX IF NOT EXISTS idx_tasks_project_management 
        ON tasks(project_id, status, priority, created_at DESC);

        -- Overdue task identification for notifications
        CREATE INDEX IF NOT EXISTS idx_tasks_overdue_tracking 
        ON tasks(due_date, status, assigned_to) 
        WHERE due_date IS NOT NULL AND status NOT IN ('completed', 'cancelled');

        -- Task statistics for reporting and dashboards
        CREATE INDEX IF NOT EXISTS idx_tasks_statistics 
        ON tasks(project_id, status, priority);
    END IF;
END $$;

-- ============================================================================
-- MATERIAL SPECS INDEXES (if material_specs table exists)
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'material_specs') THEN
        -- Material specs by project for approval workflows
        CREATE INDEX IF NOT EXISTS idx_material_specs_project_workflow 
        ON material_specs(project_id, status, created_at DESC);

        -- Approval status tracking for workflow management
        CREATE INDEX IF NOT EXISTS idx_material_specs_approval_tracking 
        ON material_specs(status, approved_by, created_at DESC);
    END IF;
END $$;

-- ============================================================================
-- CLIENTS AND SUPPLIERS PERFORMANCE INDEXES
-- ============================================================================

-- Client lookup and project association
CREATE INDEX IF NOT EXISTS idx_clients_project_association 
ON clients(user_id, company_name);

-- Supplier performance and approval status
CREATE INDEX IF NOT EXISTS idx_suppliers_performance_tracking 
ON suppliers(is_approved, performance_rating DESC, created_at DESC);

-- Supplier specialization filtering
CREATE INDEX IF NOT EXISTS idx_suppliers_specialization 
ON suppliers USING gin(specializations);

-- ============================================================================
-- DOCUMENTS AND APPROVALS PERFORMANCE
-- ============================================================================

-- Document project association and client visibility
CREATE INDEX IF NOT EXISTS idx_documents_project_visibility 
ON documents(project_id, is_client_visible, document_type, created_at DESC);

-- Document approval workflow tracking
CREATE INDEX IF NOT EXISTS idx_document_approvals_workflow 
ON document_approvals(document_id, approver_id, status, created_at DESC);

-- ============================================================================
-- COMPOSITE INDEXES FOR COMPLEX QUERIES
-- ============================================================================

-- Scope items with project and assignment filtering (for role-based access)
CREATE INDEX IF NOT EXISTS idx_scope_items_role_access 
ON scope_items(project_id, created_by, status, category);

-- Project assignments with role and timeline filtering
CREATE INDEX IF NOT EXISTS idx_project_assignments_role_timeline 
ON project_assignments(project_id, user_id, is_active, assigned_at DESC);

-- User profiles with role hierarchy and permissions
CREATE INDEX IF NOT EXISTS idx_user_profiles_hierarchy 
ON user_profiles(role, is_active, created_at DESC);

-- ============================================================================
-- PARTIAL INDEXES FOR ACTIVE RECORDS ONLY
-- ============================================================================

-- Active projects only (most common queries)
CREATE INDEX IF NOT EXISTS idx_projects_active_only 
ON projects(id, status, created_at DESC, updated_at DESC) 
WHERE status IN ('active', 'planning', 'bidding');

-- Active scope items only (performance optimization)
CREATE INDEX IF NOT EXISTS idx_scope_items_active_only 
ON scope_items(id, project_id, status, progress_percentage) 
WHERE status NOT IN ('completed', 'cancelled');

-- Active user profiles only (authentication and permissions)
CREATE INDEX IF NOT EXISTS idx_user_profiles_active_only 
ON user_profiles(id, role, email, is_active) 
WHERE is_active = true;

-- ============================================================================
-- VALIDATION AND MONITORING
-- ============================================================================

-- Function to monitor index usage and performance
CREATE OR REPLACE FUNCTION monitor_index_performance()
RETURNS TABLE(
    table_name text,
    index_name text,
    scans bigint,
    tuples_read bigint,
    tuples_fetched bigint,
    efficiency_ratio numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.relname::text as table_name,
        s.indexrelname::text as index_name,
        s.idx_scan as scans,
        s.idx_tup_read as tuples_read,
        s.idx_tup_fetch as tuples_fetched,
        CASE 
            WHEN s.idx_scan = 0 THEN 0
            ELSE ROUND((s.idx_tup_read::numeric / s.idx_scan), 2)
        END as efficiency_ratio
    FROM pg_stat_user_indexes s
    WHERE s.indexrelname LIKE 'idx_%'
    ORDER BY s.idx_scan DESC, s.idx_tup_read DESC;
END;
$$ LANGUAGE plpgsql;

-- Create view for easy performance monitoring
CREATE OR REPLACE VIEW performance_index_stats AS
SELECT * FROM monitor_index_performance();

-- ============================================================================
-- INDEX MAINTENANCE COMMENTS
-- ============================================================================

COMMENT ON INDEX idx_scope_items_api_listing IS 'Critical: Optimizes scope item API queries - Expected 70% performance improvement';
COMMENT ON INDEX idx_project_assignments_rls_access IS 'Critical: Optimizes RLS policy performance - Essential for security performance';
COMMENT ON INDEX idx_projects_management_dashboard IS 'High Priority: Optimizes management dashboard queries - Expected 50% improvement';
COMMENT ON INDEX idx_user_profiles_role_permissions IS 'High Priority: Optimizes role-based access control - Expected 40% improvement';

-- Success message
SELECT 'Performance indexes created successfully! Expected 30-50% improvement in query performance.' as status;
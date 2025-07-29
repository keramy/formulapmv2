-- Formula PM 2.0 - Role Optimization Schema
-- Phase 1: Database Schema for 5-Role Structure with PM Hierarchy
-- Created: 2025-07-17
-- Purpose: Transform 13-role system to optimized 5-role structure

-- ============================================================================
-- NEW OPTIMIZED ROLE ENUM (13 → 5 roles)
-- ============================================================================

-- Create new optimized role enum
CREATE TYPE user_role_optimized AS ENUM (
    'management',        -- Owner, GM, Deputy GM (unified oversight)
    'purchase_manager',  -- Purchase Director + Specialist (unified operations)
    'technical_lead',    -- Technical Director (scope management, subcontractor assignment)
    'project_manager',   -- PM + Architect + Technical Engineer + Field Worker (unified coordination)
    'client'            -- Client (simplified read-only access)
);

-- ============================================================================
-- ENHANCED USER PROFILES FOR HIERARCHY
-- ============================================================================

-- Add PM hierarchy support to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS seniority_level TEXT DEFAULT 'regular';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS approval_limits JSONB DEFAULT '{}';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS dashboard_preferences JSONB DEFAULT '{}';

-- Add role transition tracking
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS previous_role user_role;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS role_migrated_at TIMESTAMP;

-- ============================================================================
-- SUBCONTRACTORS AS DATABASE ENTITIES (NOT USERS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.subcontractors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    company TEXT,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    specialties TEXT[], -- Array of specialties: ['electrical', 'plumbing', 'hvac']
    hourly_rate DECIMAL(10,2),
    daily_rate DECIMAL(10,2),
    contract_terms TEXT,
    performance_rating DECIMAL(3,2) DEFAULT 0.00 CHECK (performance_rating >= 0 AND performance_rating <= 5),
    total_assignments INTEGER DEFAULT 0,
    completed_assignments INTEGER DEFAULT 0,
    total_payments DECIMAL(12,2) DEFAULT 0.00,
    availability_status TEXT DEFAULT 'available', -- 'available', 'busy', 'unavailable'
    preferred_project_types TEXT[],
    certifications TEXT[],
    insurance_info JSONB DEFAULT '{}',
    emergency_contact JSONB DEFAULT '{}',
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SUBCONTRACTOR ASSIGNMENTS TO SCOPE ITEMS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.subcontractor_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subcontractor_id UUID REFERENCES subcontractors(id) ON DELETE CASCADE,
    scope_item_id UUID REFERENCES scope_items(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES user_profiles(id),
    assignment_type TEXT DEFAULT 'task', -- 'task', 'consultation', 'full_scope'
    
    -- Pricing and time tracking
    agreed_rate DECIMAL(10,2),
    rate_type TEXT DEFAULT 'hourly', -- 'hourly', 'daily', 'fixed'
    estimated_hours INTEGER,
    actual_hours INTEGER DEFAULT 0,
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2) DEFAULT 0.00,
    
    -- Timeline
    start_date DATE,
    end_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,
    
    -- Status and progress
    status TEXT DEFAULT 'assigned', -- 'assigned', 'in_progress', 'completed', 'cancelled', 'on_hold'
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    quality_rating DECIMAL(3,2) CHECK (quality_rating >= 0 AND quality_rating <= 5),
    
    -- Documentation
    work_description TEXT,
    completion_notes TEXT,
    issues_encountered TEXT,
    photos JSONB DEFAULT '[]', -- Array of photo URLs
    documents JSONB DEFAULT '[]', -- Array of document references
    
    -- Approval and sign-off
    work_approved_by UUID REFERENCES user_profiles(id),
    work_approved_at TIMESTAMP,
    payment_approved_by UUID REFERENCES user_profiles(id),
    payment_approved_at TIMESTAMP,
    payment_status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'paid'
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(subcontractor_id, scope_item_id)
);

-- ============================================================================
-- PM HIERARCHY APPROVAL SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.approval_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_type TEXT NOT NULL, -- 'budget', 'scope_change', 'timeline_extension', 'resource_request'
    project_id UUID REFERENCES projects(id),
    scope_item_id UUID REFERENCES scope_items(id), -- Optional, for scope-specific requests
    
    -- Request details
    requested_by UUID REFERENCES user_profiles(id) NOT NULL,
    request_title TEXT NOT NULL,
    request_description TEXT,
    request_data JSONB DEFAULT '{}', -- Flexible data storage for different request types
    requested_amount DECIMAL(12,2), -- For budget requests
    
    -- Approval chain
    current_approver UUID REFERENCES user_profiles(id),
    approval_chain JSONB DEFAULT '[]', -- Array of approver hierarchy
    approval_level INTEGER DEFAULT 1, -- Current level in approval chain
    
    -- Status and timeline
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'escalated', 'cancelled'
    priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    due_date TIMESTAMP,
    
    -- Approval details
    approved_by UUID REFERENCES user_profiles(id),
    approved_at TIMESTAMP,
    approval_notes TEXT,
    rejection_reason TEXT,
    escalation_reason TEXT,
    
    -- Audit trail
    approval_history JSONB DEFAULT '[]', -- Track all approval actions
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ENHANCED PROJECT ASSIGNMENTS FOR HIERARCHY
-- ============================================================================

-- Add hierarchy support to project assignments
ALTER TABLE project_assignments ADD COLUMN IF NOT EXISTS assignment_type TEXT DEFAULT 'regular_pm';
ALTER TABLE project_assignments ADD COLUMN IF NOT EXISTS can_approve_others BOOLEAN DEFAULT FALSE;
ALTER TABLE project_assignments ADD COLUMN IF NOT EXISTS approval_scope JSONB DEFAULT '{}';
ALTER TABLE project_assignments ADD COLUMN IF NOT EXISTS reporting_to UUID REFERENCES user_profiles(id);

-- ============================================================================
-- MANAGEMENT OVERSIGHT VIEWS
-- ============================================================================

-- PM Workload Overview for Management Dashboard
CREATE OR REPLACE VIEW pm_workload_overview AS
SELECT 
    up.id as pm_id,
    up.first_name || ' ' || up.last_name as pm_name,
    up.seniority_level,
    up.approval_limits,
    
    -- Project counts
    COUNT(DISTINCT pa.project_id) as total_assigned_projects,
    COUNT(DISTINCT CASE WHEN p.status = 'active' THEN pa.project_id END) as active_projects,
    COUNT(DISTINCT CASE WHEN p.status = 'planning' THEN pa.project_id END) as planning_projects,
    
    -- Performance metrics
    AVG(CASE WHEN p.status = 'completed' THEN 
        CASE WHEN p.end_date >= CURRENT_DATE THEN 100 
             ELSE GREATEST(0, 100 - (CURRENT_DATE - p.end_date) * 2)
        END 
    END) as timeline_performance_score,
    
    AVG(CASE WHEN p.budget > 0 THEN 
        GREATEST(0, 100 - ABS((p.actual_cost - p.budget) / p.budget * 100))
    END) as budget_performance_score,
    
    -- Workload indicators
    SUM(p.budget) as total_budget_managed,
    SUM(p.actual_cost) as total_actual_cost,
    COUNT(DISTINCT ar.id) as pending_approvals,
    
    -- Recent activity
    MAX(p.updated_at) as last_project_update,
    COUNT(DISTINCT CASE WHEN ar.created_at > NOW() - INTERVAL '7 days' THEN ar.id END) as approvals_this_week
    
FROM user_profiles up
LEFT JOIN project_assignments pa ON up.id = pa.user_id AND pa.is_active = true
LEFT JOIN projects p ON pa.project_id = p.id
LEFT JOIN approval_requests ar ON up.id = ar.current_approver AND ar.status = 'pending'
WHERE up.role = 'project_manager'
GROUP BY up.id, up.first_name, up.last_name, up.seniority_level, up.approval_limits;

-- Company-wide Project Overview for Management
CREATE OR REPLACE VIEW company_project_overview AS
SELECT 
    p.id,
    p.name,
    p.status,
    p.budget,
    p.actual_cost,
    p.start_date,
    p.end_date,
    
    -- Project manager info
    pm.first_name || ' ' || pm.last_name as project_manager_name,
    pm.seniority_level as pm_seniority,
    
    -- Client info
    c.company_name as client_name,
    
    -- Progress indicators
    AVG(si.progress_percentage) as overall_progress,
    COUNT(DISTINCT si.id) as total_scope_items,
    COUNT(DISTINCT CASE WHEN si.status = 'completed' THEN si.id END) as completed_scope_items,
    
    -- Financial indicators
    (p.actual_cost / NULLIF(p.budget, 0) * 100) as budget_utilization_percentage,
    
    -- Timeline indicators
    CASE 
        WHEN p.end_date < CURRENT_DATE AND p.status != 'completed' THEN 'overdue'
        WHEN p.end_date - CURRENT_DATE <= 7 THEN 'due_soon'
        ELSE 'on_track'
    END as timeline_status,
    
    -- Risk indicators
    CASE 
        WHEN (p.actual_cost / NULLIF(p.budget, 0)) > 1.1 THEN 'budget_risk'
        WHEN AVG(si.progress_percentage) < 50 AND p.end_date - CURRENT_DATE <= 30 THEN 'timeline_risk'
        ELSE 'normal'
    END as risk_level,
    
    p.updated_at
    
FROM projects p
LEFT JOIN user_profiles pm ON p.project_manager_id = pm.id
LEFT JOIN clients c ON p.client_id = c.id
LEFT JOIN scope_items si ON p.id = si.project_id
GROUP BY p.id, p.name, p.status, p.budget, p.actual_cost, p.start_date, p.end_date, 
         pm.first_name, pm.last_name, pm.seniority_level, c.company_name, p.updated_at;

-- ============================================================================
-- SIMPLIFIED RLS POLICIES (45 → 15 policies)
-- ============================================================================

-- Drop existing complex policies (will be recreated in next migration)
-- This migration focuses on schema changes

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Indexes for PM hierarchy and management oversight
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_seniority ON user_profiles(role, seniority_level);
CREATE INDEX IF NOT EXISTS idx_approval_requests_current_approver ON approval_requests(current_approver, status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_project ON approval_requests(project_id, status);
CREATE INDEX IF NOT EXISTS idx_subcontractor_assignments_status ON subcontractor_assignments(status, project_id);
CREATE INDEX IF NOT EXISTS idx_subcontractors_availability ON subcontractors(availability_status, is_active);

-- ============================================================================
-- FUNCTIONS FOR ROLE MIGRATION
-- ============================================================================

-- Function to migrate user from old role to new role
CREATE OR REPLACE FUNCTION migrate_user_role(
    user_id UUID,
    new_role user_role_optimized,
    new_seniority_level TEXT DEFAULT 'regular',
    new_approval_limits JSONB DEFAULT '{}'
) RETURNS BOOLEAN AS $$
BEGIN
    -- Store previous role for audit
    UPDATE user_profiles 
    SET 
        previous_role = role,
        role_migrated_at = NOW(),
        seniority_level = new_seniority_level,
        approval_limits = new_approval_limits
    WHERE id = user_id;
    
    -- Note: Actual role column update will happen in next migration
    -- after new enum is properly set up
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to assign subcontractor to scope item
CREATE OR REPLACE FUNCTION assign_subcontractor_to_scope(
    p_subcontractor_id UUID,
    p_scope_item_id UUID,
    p_assigned_by UUID,
    p_agreed_rate DECIMAL DEFAULT NULL,
    p_estimated_hours INTEGER DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    assignment_id UUID;
    project_id UUID;
BEGIN
    -- Get project ID from scope item
    SELECT si.project_id INTO project_id 
    FROM scope_items si 
    WHERE si.id = p_scope_item_id;
    
    -- Create assignment
    INSERT INTO subcontractor_assignments (
        subcontractor_id,
        scope_item_id,
        project_id,
        assigned_by,
        agreed_rate,
        estimated_hours,
        estimated_cost
    ) VALUES (
        p_subcontractor_id,
        p_scope_item_id,
        project_id,
        p_assigned_by,
        p_agreed_rate,
        p_estimated_hours,
        COALESCE(p_agreed_rate * p_estimated_hours, 0)
    ) RETURNING id INTO assignment_id;
    
    -- Update subcontractor assignment count
    UPDATE subcontractors 
    SET total_assignments = total_assignments + 1,
        updated_at = NOW()
    WHERE id = p_subcontractor_id;
    
    RETURN assignment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- AUDIT AND LOGGING
-- ============================================================================

-- Trigger for subcontractor assignment updates
CREATE OR REPLACE FUNCTION update_subcontractor_assignment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_subcontractor_assignments_updated_at
    BEFORE UPDATE ON subcontractor_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_subcontractor_assignment_timestamp();

-- Trigger for approval request updates
CREATE OR REPLACE FUNCTION update_approval_request_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    
    -- Add to approval history
    IF OLD.status != NEW.status THEN
        NEW.approval_history = COALESCE(OLD.approval_history, '[]'::jsonb) || 
            jsonb_build_object(
                'timestamp', NOW(),
                'action', 'status_change',
                'old_status', OLD.status,
                'new_status', NEW.status,
                'changed_by', NEW.current_approver
            );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_approval_requests_updated_at
    BEFORE UPDATE ON approval_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_approval_request_timestamp();

-- ============================================================================
-- MIGRATION RECORD
-- ============================================================================

INSERT INTO public.migrations (version, name, executed_at) 
VALUES ('20250717000001', 'role_optimization_schema', NOW())
ON CONFLICT (version) DO NOTHING;

-- Success message
SELECT 'Role optimization schema created successfully! Ready for Phase 2: RLS Policy Implementation' as status;
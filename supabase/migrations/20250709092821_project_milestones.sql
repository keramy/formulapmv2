-- Formula PM 2.0 - Project Milestones System
-- Created: 2025-07-09
-- Purpose: Implements milestone tracking for project progress monitoring (P1.02)

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Create milestone status enum
CREATE TYPE milestone_status AS ENUM (
    'upcoming',
    'in_progress', 
    'completed',
    'overdue',
    'cancelled'
);

-- ============================================================================
-- TABLES
-- ============================================================================

-- Create project_milestones table
CREATE TABLE project_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    target_date DATE NOT NULL,
    actual_date DATE,
    status milestone_status DEFAULT 'upcoming',
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT ck_milestone_actual_date CHECK (
        actual_date IS NULL OR actual_date >= created_at::DATE
    ),
    CONSTRAINT ck_milestone_status_date CHECK (
        (status IN ('completed', 'cancelled') AND actual_date IS NOT NULL) OR
        (status IN ('upcoming', 'in_progress', 'overdue') AND actual_date IS NULL)
    )
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Performance indexes
CREATE INDEX idx_project_milestones_project_id ON project_milestones (project_id);
CREATE INDEX idx_project_milestones_status ON project_milestones (status);
CREATE INDEX idx_project_milestones_target_date ON project_milestones (target_date);
CREATE INDEX idx_project_milestones_project_status ON project_milestones (project_id, status);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Update updated_at column automatically
CREATE OR REPLACE FUNCTION update_project_milestones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_milestones_updated_at
    BEFORE UPDATE ON project_milestones
    FOR EACH ROW
    EXECUTE FUNCTION update_project_milestones_updated_at();

-- Function to automatically update milestone status based on target date
CREATE OR REPLACE FUNCTION update_milestone_overdue_status()
RETURNS TRIGGER AS $$
BEGIN
    -- If target date has passed and status is upcoming or in_progress, mark as overdue
    IF NEW.target_date < CURRENT_DATE AND NEW.status IN ('upcoming', 'in_progress') THEN
        NEW.status = 'overdue';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_milestone_overdue
    BEFORE INSERT OR UPDATE ON project_milestones
    FOR EACH ROW
    EXECUTE FUNCTION update_milestone_overdue_status();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can view milestones for projects they have access to
CREATE POLICY "Users can view project milestones" ON project_milestones
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_milestones.project_id
            AND (
                -- Project owner
                p.created_by = auth.uid()
                -- Team member
                OR EXISTS (
                    SELECT 1 FROM project_assignments pa
                    WHERE pa.project_id = p.id
                    AND pa.user_id = auth.uid()
                    AND pa.is_active = true
                )
                -- Admin
                OR EXISTS (
                    SELECT 1 FROM user_profiles up
                    WHERE up.id = auth.uid()
                    AND up.role = 'admin'
                )
            )
        )
    );

-- Users can create milestones for projects they manage
CREATE POLICY "Project managers can create milestones" ON project_milestones
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_id
            AND (
                -- Project owner
                p.created_by = auth.uid()
                -- Project manager
                OR EXISTS (
                    SELECT 1 FROM project_assignments pa
                    WHERE pa.project_id = p.id
                    AND pa.user_id = auth.uid()
                    AND pa.role IN ('project_manager', 'owner')
                    AND pa.is_active = true
                )
                -- Admin
                OR EXISTS (
                    SELECT 1 FROM user_profiles up
                    WHERE up.id = auth.uid()
                    AND up.role = 'admin'
                )
            )
        )
    );

-- Users can update milestones for projects they manage
CREATE POLICY "Project managers can update milestones" ON project_milestones
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_milestones.project_id
            AND (
                -- Project owner
                p.created_by = auth.uid()
                -- Project manager
                OR EXISTS (
                    SELECT 1 FROM project_assignments pa
                    WHERE pa.project_id = p.id
                    AND pa.user_id = auth.uid()
                    AND pa.role IN ('project_manager', 'owner')
                    AND pa.is_active = true
                )
                -- Admin
                OR EXISTS (
                    SELECT 1 FROM user_profiles up
                    WHERE up.id = auth.uid()
                    AND up.role = 'admin'
                )
            )
        )
    );

-- Users can delete milestones for projects they manage
CREATE POLICY "Project managers can delete milestones" ON project_milestones
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_milestones.project_id
            AND (
                -- Project owner
                p.created_by = auth.uid()
                -- Project manager with owner role
                OR EXISTS (
                    SELECT 1 FROM project_assignments pa
                    WHERE pa.project_id = p.id
                    AND pa.user_id = auth.uid()
                    AND pa.role = 'owner'
                    AND pa.is_active = true
                )
                -- Admin
                OR EXISTS (
                    SELECT 1 FROM user_profiles up
                    WHERE up.id = auth.uid()
                    AND up.role = 'admin'
                )
            )
        )
    );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE project_milestones IS 'Tracks project milestones for progress monitoring';
COMMENT ON COLUMN project_milestones.id IS 'Unique identifier for the milestone';
COMMENT ON COLUMN project_milestones.project_id IS 'Reference to the associated project';
COMMENT ON COLUMN project_milestones.name IS 'Name of the milestone (e.g., "Foundation Complete")';
COMMENT ON COLUMN project_milestones.description IS 'Detailed description of the milestone';
COMMENT ON COLUMN project_milestones.target_date IS 'Target completion date for the milestone';
COMMENT ON COLUMN project_milestones.actual_date IS 'Actual completion date (set when status changes to completed)';
COMMENT ON COLUMN project_milestones.status IS 'Current status of the milestone';
COMMENT ON COLUMN project_milestones.created_by IS 'User who created the milestone';
COMMENT ON COLUMN project_milestones.created_at IS 'Timestamp when milestone was created';
COMMENT ON COLUMN project_milestones.updated_at IS 'Timestamp when milestone was last updated';

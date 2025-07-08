-- Formula PM 2.0 Missing Workflow Tables
-- Created: 2025-07-04
-- Purpose: Create missing tables needed for comprehensive workflow population

-- ============================================================================
-- PROJECT MILESTONES TABLE
-- ============================================================================

-- Milestone status types
CREATE TYPE milestone_status AS ENUM ('not_started', 'in_progress', 'completed', 'overdue', 'cancelled');

-- Milestone types  
CREATE TYPE milestone_type AS ENUM ('phase_completion', 'major_milestone', 'client_approval', 'permit_milestone', 'inspection_milestone');

-- Project milestones table
CREATE TABLE project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  milestone_date DATE NOT NULL,
  status milestone_status NOT NULL DEFAULT 'not_started',
  created_by UUID REFERENCES user_profiles(id),
  milestone_type milestone_type NOT NULL DEFAULT 'phase_completion',
  dependencies TEXT[], -- Array of scope item codes or other milestone IDs
  completion_percentage DECIMAL(5,2) DEFAULT 0.00,
  actual_completion_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_completion_percentage CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  CONSTRAINT completion_date_logic CHECK (
    (status = 'completed' AND actual_completion_date IS NOT NULL) OR
    (status != 'completed')
  )
);

-- ============================================================================
-- INDEXES FOR PROJECT MILESTONES
-- ============================================================================

CREATE INDEX idx_project_milestones_project ON project_milestones(project_id);
CREATE INDEX idx_project_milestones_status ON project_milestones(status);
CREATE INDEX idx_project_milestones_date ON project_milestones(milestone_date);
CREATE INDEX idx_project_milestones_type ON project_milestones(milestone_type);
CREATE INDEX idx_project_milestones_created_by ON project_milestones(created_by);

-- ============================================================================
-- AUTO-UPDATE TRIGGER FOR PROJECT MILESTONES
-- ============================================================================

CREATE OR REPLACE FUNCTION update_milestone_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  
  -- Set actual completion date when status changes to completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.actual_completion_date = CURRENT_DATE;
    NEW.completion_percentage = 100.00;
  ELSIF NEW.status != 'completed' AND OLD.status = 'completed' THEN
    NEW.actual_completion_date = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_milestone_timestamps_trigger
  BEFORE UPDATE ON project_milestones
  FOR EACH ROW EXECUTE PROCEDURE update_milestone_timestamps();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE project_milestones IS 'Project milestones for tracking major phases and deliverables';
COMMENT ON COLUMN project_milestones.dependencies IS 'Array of scope item codes or milestone IDs that must be completed before this milestone';
COMMENT ON COLUMN project_milestones.milestone_type IS 'Type of milestone for categorization and filtering';

-- Migration record
INSERT INTO public.migrations (version, name, executed_at) 
VALUES ('20250704000009', 'missing_workflow_tables', NOW())
ON CONFLICT (version) DO NOTHING;
-- ============================================================================
-- V3 Shop Drawings System - Complete Rebuild
-- ============================================================================
-- This migration removes the old complex shop drawing schema and implements
-- the new V3 schema as specified in the shop_drawing_approval_plan.md
-- ============================================================================

-- Drop old tables and types in correct order (reverse dependency order)
DROP TABLE IF EXISTS shop_drawing_approvals CASCADE;
DROP TABLE IF EXISTS shop_drawing_comments CASCADE;
DROP TABLE IF EXISTS shop_drawing_revisions CASCADE;
DROP TABLE IF EXISTS drawing_sets CASCADE;
DROP TABLE IF EXISTS shop_drawings CASCADE;

-- Drop old types
DROP TYPE IF EXISTS shop_drawing_status CASCADE;
DROP TYPE IF EXISTS drawing_discipline CASCADE;
DROP TYPE IF EXISTS comment_type CASCADE;

-- ============================================================================
-- V3 SHOP DRAWINGS SCHEMA
-- ============================================================================

-- Create new ENUMs for V3 schema
CREATE TYPE shop_drawing_submission_status AS ENUM (
  'pending_internal_review',
  'ready_for_client_review', 
  'pending_client_review',
  'approved',
  'approved_with_comments',
  'rejected',
  'resubmitted'
);

CREATE TYPE shop_drawing_review_type AS ENUM (
  'internal',
  'client'
);

CREATE TYPE shop_drawing_review_action AS ENUM (
  'approved',
  'approved_with_comments',
  'rejected',
  'commented'
);

-- ============================================================================
-- V3 TABLES
-- ============================================================================

-- Master record for a drawing
CREATE TABLE shop_drawings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  discipline TEXT NOT NULL, -- "Mechanical", "Architectural", "Structural", etc.
  current_submission_id UUID NULL, -- FK to shop_drawing_submissions.id
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Each version submitted for review
CREATE TABLE shop_drawing_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_drawing_id UUID REFERENCES shop_drawings(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  file_url TEXT NOT NULL, -- URL to the stored drawing file in Supabase Storage
  file_name TEXT NOT NULL,
  file_size INTEGER,
  status shop_drawing_submission_status DEFAULT 'pending_internal_review',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_by UUID REFERENCES user_profiles(id),
  internal_review_completed_at TIMESTAMPTZ NULL,
  client_review_completed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Records each review action
CREATE TABLE shop_drawing_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES shop_drawing_submissions(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES user_profiles(id),
  review_type shop_drawing_review_type NOT NULL,
  action shop_drawing_review_action NOT NULL,
  comments TEXT,
  reviewed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ADD FOREIGN KEY CONSTRAINT
-- ============================================================================
-- Add the foreign key constraint from shop_drawings to shop_drawing_submissions
ALTER TABLE shop_drawings 
ADD CONSTRAINT fk_shop_drawings_current_submission 
FOREIGN KEY (current_submission_id) REFERENCES shop_drawing_submissions(id) ON DELETE SET NULL;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Shop drawings indexes
CREATE INDEX idx_shop_drawings_project ON shop_drawings(project_id);
CREATE INDEX idx_shop_drawings_discipline ON shop_drawings(discipline);
CREATE INDEX idx_shop_drawings_created_by ON shop_drawings(created_by);
CREATE INDEX idx_shop_drawings_updated_at ON shop_drawings(updated_at);

-- Shop drawing submissions indexes
CREATE INDEX idx_shop_drawing_submissions_shop_drawing ON shop_drawing_submissions(shop_drawing_id);
CREATE INDEX idx_shop_drawing_submissions_status ON shop_drawing_submissions(status);
CREATE INDEX idx_shop_drawing_submissions_submitted_by ON shop_drawing_submissions(submitted_by);
CREATE INDEX idx_shop_drawing_submissions_version ON shop_drawing_submissions(shop_drawing_id, version_number);

-- Shop drawing reviews indexes
CREATE INDEX idx_shop_drawing_reviews_submission ON shop_drawing_reviews(submission_id);
CREATE INDEX idx_shop_drawing_reviews_reviewer ON shop_drawing_reviews(reviewer_id);
CREATE INDEX idx_shop_drawing_reviews_type ON shop_drawing_reviews(review_type);
CREATE INDEX idx_shop_drawing_reviews_action ON shop_drawing_reviews(action);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Update updated_at timestamp on shop_drawings
CREATE OR REPLACE FUNCTION update_shop_drawings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_shop_drawings_updated_at
  BEFORE UPDATE ON shop_drawings
  FOR EACH ROW
  EXECUTE FUNCTION update_shop_drawings_updated_at();

-- Update updated_at timestamp on shop_drawing_submissions
CREATE OR REPLACE FUNCTION update_shop_drawing_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_shop_drawing_submissions_updated_at
  BEFORE UPDATE ON shop_drawing_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_shop_drawing_submissions_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE shop_drawings ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_drawing_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_drawing_reviews ENABLE ROW LEVEL SECURITY;

-- Shop drawings policies
CREATE POLICY "Users can view shop drawings for their projects" ON shop_drawings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id
      AND (
        p.project_manager_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_assignments pa
          WHERE pa.project_id = p.id 
          AND pa.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Project managers can create shop drawings" ON shop_drawings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role IN ('company_owner', 'project_manager', 'general_manager', 'technical_director', 'admin')
    )
  );

CREATE POLICY "Project managers can update shop drawings" ON shop_drawings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role IN ('company_owner', 'project_manager', 'general_manager', 'technical_director', 'admin')
    )
  );

-- Shop drawing submissions policies
CREATE POLICY "Users can view submissions for accessible shop drawings" ON shop_drawing_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM shop_drawings sd
      WHERE sd.id = shop_drawing_id
      AND EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = sd.project_id
        AND (
          p.project_manager_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM project_assignments pa
            WHERE pa.project_id = p.id 
            AND pa.user_id = auth.uid()
          )
        )
      )
    )
  );

CREATE POLICY "Project managers can create submissions" ON shop_drawing_submissions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role IN ('company_owner', 'project_manager', 'general_manager', 'technical_director', 'admin')
    )
  );

CREATE POLICY "Project managers can update submissions" ON shop_drawing_submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role IN ('company_owner', 'project_manager', 'general_manager', 'technical_director', 'admin')
    )
  );

-- Shop drawing reviews policies
CREATE POLICY "Users can view reviews for accessible submissions" ON shop_drawing_reviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM shop_drawing_submissions sds
      JOIN shop_drawings sd ON sd.id = sds.shop_drawing_id
      WHERE sds.id = submission_id
      AND EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = sd.project_id
        AND (
          p.project_manager_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM project_assignments pa
            WHERE pa.project_id = p.id 
            AND pa.user_id = auth.uid()
          )
        )
      )
    )
  );

CREATE POLICY "Authorized users can create reviews" ON shop_drawing_reviews
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND (
        up.role IN ('company_owner', 'project_manager', 'general_manager', 'technical_director', 'admin', 'architect') OR
        up.role = 'client'
      )
    )
  );

-- ============================================================================
-- FUNCTIONS FOR WORKFLOW MANAGEMENT
-- ============================================================================

-- Function to update current_submission_id when a new submission is created
CREATE OR REPLACE FUNCTION update_current_submission()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the shop_drawing's current_submission_id to point to the new submission
  UPDATE shop_drawings 
  SET current_submission_id = NEW.id, updated_at = NOW()
  WHERE id = NEW.shop_drawing_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_current_submission_trigger
  AFTER INSERT ON shop_drawing_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_current_submission();

-- Function to update submission status based on reviews
CREATE OR REPLACE FUNCTION update_submission_status_from_review()
RETURNS TRIGGER AS $$
BEGIN
  -- Update submission status based on review action
  IF NEW.review_type = 'internal' THEN
    CASE NEW.action
      WHEN 'approved' THEN
        UPDATE shop_drawing_submissions 
        SET status = 'ready_for_client_review', 
            internal_review_completed_at = NOW(),
            updated_at = NOW()
        WHERE id = NEW.submission_id;
      WHEN 'rejected' THEN
        UPDATE shop_drawing_submissions 
        SET status = 'rejected',
            internal_review_completed_at = NOW(),
            updated_at = NOW()
        WHERE id = NEW.submission_id;
    END CASE;
  ELSIF NEW.review_type = 'client' THEN
    CASE NEW.action
      WHEN 'approved' THEN
        UPDATE shop_drawing_submissions 
        SET status = 'approved',
            client_review_completed_at = NOW(),
            updated_at = NOW()
        WHERE id = NEW.submission_id;
      WHEN 'approved_with_comments' THEN
        UPDATE shop_drawing_submissions 
        SET status = 'approved_with_comments',
            client_review_completed_at = NOW(),
            updated_at = NOW()
        WHERE id = NEW.submission_id;
      WHEN 'rejected' THEN
        UPDATE shop_drawing_submissions 
        SET status = 'rejected',
            client_review_completed_at = NOW(),
            updated_at = NOW()
        WHERE id = NEW.submission_id;
    END CASE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_submission_status_from_review_trigger
  AFTER INSERT ON shop_drawing_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_submission_status_from_review();

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Insert sample shop drawings (only if projects exist)
-- This will be populated by the API during actual usage

-- Migration tracking handled by Supabase automatically

-- Migration complete
SELECT 'V3 Shop Drawings System - Migration Complete' as result;
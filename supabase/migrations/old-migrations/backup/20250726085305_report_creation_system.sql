-- =====================================================
-- Report Creation System Migration
-- Implementing V3 Report Creation with new tables
-- =====================================================

-- Report Lines Table
CREATE TABLE IF NOT EXISTS report_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scope_item_id UUID REFERENCES scope_items(id) ON DELETE SET NULL,
  line_number INTEGER NOT NULL,
  description TEXT NOT NULL,
  unit VARCHAR(50) NOT NULL DEFAULT 'each',
  quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  category VARCHAR(100) NOT NULL DEFAULT 'general',
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'invoiced', 'completed')),
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Report Line Photos Table  
CREATE TABLE IF NOT EXISTS report_line_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_line_id UUID NOT NULL REFERENCES report_lines(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  description TEXT,
  taken_at TIMESTAMPTZ,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Report Summaries Table (for generated reports)
CREATE TABLE IF NOT EXISTS report_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  report_type VARCHAR(50) NOT NULL DEFAULT 'progress' CHECK (report_type IN ('progress', 'financial', 'material', 'time', 'custom')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  report_period_start DATE,
  report_period_end DATE,
  total_lines INTEGER NOT NULL DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'sent')),
  generated_by UUID NOT NULL REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  file_path TEXT, -- PDF/Excel file path
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Junction table for report summaries and lines
CREATE TABLE IF NOT EXISTS report_summary_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_summary_id UUID NOT NULL REFERENCES report_summaries(id) ON DELETE CASCADE,
  report_line_id UUID NOT NULL REFERENCES report_lines(id) ON DELETE CASCADE,
  included_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(report_summary_id, report_line_id)
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

-- Report Lines indexes
CREATE INDEX IF NOT EXISTS idx_report_lines_project_id ON report_lines(project_id);
CREATE INDEX IF NOT EXISTS idx_report_lines_scope_item_id ON report_lines(scope_item_id);
CREATE INDEX IF NOT EXISTS idx_report_lines_created_by ON report_lines(created_by);
CREATE INDEX IF NOT EXISTS idx_report_lines_status ON report_lines(status);
CREATE INDEX IF NOT EXISTS idx_report_lines_category ON report_lines(category);
CREATE INDEX IF NOT EXISTS idx_report_lines_line_number ON report_lines(project_id, line_number);

-- Report Line Photos indexes
CREATE INDEX IF NOT EXISTS idx_report_line_photos_report_line_id ON report_line_photos(report_line_id);
CREATE INDEX IF NOT EXISTS idx_report_line_photos_uploaded_by ON report_line_photos(uploaded_by);

-- Report Summaries indexes
CREATE INDEX IF NOT EXISTS idx_report_summaries_project_id ON report_summaries(project_id);
CREATE INDEX IF NOT EXISTS idx_report_summaries_generated_by ON report_summaries(generated_by);
CREATE INDEX IF NOT EXISTS idx_report_summaries_status ON report_summaries(status);
CREATE INDEX IF NOT EXISTS idx_report_summaries_report_type ON report_summaries(report_type);
CREATE INDEX IF NOT EXISTS idx_report_summaries_period ON report_summaries(report_period_start, report_period_end);

-- Report Summary Lines indexes
CREATE INDEX IF NOT EXISTS idx_report_summary_lines_summary_id ON report_summary_lines(report_summary_id);
CREATE INDEX IF NOT EXISTS idx_report_summary_lines_line_id ON report_summary_lines(report_line_id);

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS
ALTER TABLE report_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_line_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_summary_lines ENABLE ROW LEVEL SECURITY;

-- Report Lines RLS Policies (Single Optimized Policy)
CREATE POLICY "report_lines_project_access" ON report_lines
FOR ALL USING (
  project_id IN (
    SELECT p.id FROM projects p
    LEFT JOIN project_assignments pa ON p.id = pa.project_id AND pa.is_active = true
    WHERE p.project_manager_id = (SELECT auth.uid())
       OR p.client_id = (SELECT auth.uid())
       OR (pa.user_id = (SELECT auth.uid()) AND pa.is_active = true)
       OR EXISTS (
         SELECT 1 FROM user_profiles up 
         WHERE up.id = (SELECT auth.uid()) 
         AND up.role IN ('admin', 'management')
       )
  )
);

-- Report Line Photos RLS Policies (Single Optimized Policy)
CREATE POLICY "report_line_photos_project_access" ON report_line_photos
FOR ALL USING (
  report_line_id IN (
    SELECT rl.id FROM report_lines rl
    JOIN projects p ON rl.project_id = p.id
    LEFT JOIN project_assignments pa ON p.id = pa.project_id AND pa.is_active = true
    WHERE p.project_manager_id = (SELECT auth.uid())
       OR p.client_id = (SELECT auth.uid())
       OR (pa.user_id = (SELECT auth.uid()) AND pa.is_active = true)
       OR EXISTS (
         SELECT 1 FROM user_profiles up 
         WHERE up.id = (SELECT auth.uid()) 
         AND up.role IN ('admin', 'management')
       )
  )
);

-- Report Summaries RLS Policies (Single Optimized Policy)
CREATE POLICY "report_summaries_project_access" ON report_summaries
FOR ALL USING (
  project_id IN (
    SELECT p.id FROM projects p
    LEFT JOIN project_assignments pa ON p.id = pa.project_id AND pa.is_active = true
    WHERE p.project_manager_id = (SELECT auth.uid())
       OR p.client_id = (SELECT auth.uid())
       OR (pa.user_id = (SELECT auth.uid()) AND pa.is_active = true)
       OR EXISTS (
         SELECT 1 FROM user_profiles up 
         WHERE up.id = (SELECT auth.uid()) 
         AND up.role IN ('admin', 'management')
       )
  )
);

-- Report Summary Lines RLS Policies (Single Optimized Policy)
CREATE POLICY "report_summary_lines_project_access" ON report_summary_lines
FOR ALL USING (
  report_summary_id IN (
    SELECT rs.id FROM report_summaries rs
    JOIN projects p ON rs.project_id = p.id
    LEFT JOIN project_assignments pa ON p.id = pa.project_id AND pa.is_active = true
    WHERE p.project_manager_id = (SELECT auth.uid())
       OR p.client_id = (SELECT auth.uid())
       OR (pa.user_id = (SELECT auth.uid()) AND pa.is_active = true)
       OR EXISTS (
         SELECT 1 FROM user_profiles up 
         WHERE up.id = (SELECT auth.uid()) 
         AND up.role IN ('admin', 'management')
       )
  )
);

-- =====================================================
-- Triggers for Updated At
-- =====================================================

-- Report Lines trigger
CREATE OR REPLACE FUNCTION update_report_lines_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

CREATE TRIGGER update_report_lines_updated_at_trigger
  BEFORE UPDATE ON report_lines
  FOR EACH ROW
  EXECUTE FUNCTION update_report_lines_updated_at();

-- Report Summaries trigger
CREATE OR REPLACE FUNCTION update_report_summaries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

CREATE TRIGGER update_report_summaries_updated_at_trigger
  BEFORE UPDATE ON report_summaries
  FOR EACH ROW
  EXECUTE FUNCTION update_report_summaries_updated_at();

-- =====================================================
-- Summary and Verification
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE ' Report Creation System migration completed successfully';
  RAISE NOTICE '=� Tables created: report_lines, report_line_photos, report_summaries, report_summary_lines';
  RAISE NOTICE '= RLS policies applied for all report tables';
  RAISE NOTICE '� Performance indexes created for optimal query performance';
  RAISE NOTICE '= Auto-update triggers configured';
END $$;
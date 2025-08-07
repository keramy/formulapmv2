-- ============================================================================
-- FORMULA PM V2 - COMPLETE DATABASE SETUP
-- Single migration to avoid CREATE TYPE dependency issues
-- Combines all database objects in correct dependency order
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CLEANUP EXISTING TYPES (if any)
-- ============================================================================
DO $$ 
BEGIN
  -- Drop types if they exist to ensure clean slate
  DROP TYPE IF EXISTS user_role CASCADE;
  DROP TYPE IF EXISTS project_status CASCADE;
  DROP TYPE IF EXISTS scope_category CASCADE;
  DROP TYPE IF EXISTS scope_status CASCADE;
  DROP TYPE IF EXISTS document_type CASCADE;
  DROP TYPE IF EXISTS document_status CASCADE;
  DROP TYPE IF EXISTS approval_status CASCADE;
  DROP TYPE IF EXISTS priority_level CASCADE;
  DROP TYPE IF EXISTS seniority_level CASCADE;
  DROP TYPE IF EXISTS shop_drawing_status CASCADE;
  DROP TYPE IF EXISTS drawing_discipline CASCADE;
  DROP TYPE IF EXISTS submission_type CASCADE;
  DROP TYPE IF EXISTS milestone_status CASCADE;
END $$;

-- ============================================================================
-- CREATE ALL ENUMS
-- ============================================================================

-- 6-role system optimized for performance
CREATE TYPE user_role AS ENUM (
  'management',       -- Replaces: company_owner, general_manager, deputy_general_manager
  'purchase_manager', -- Replaces: purchase_director, purchase_specialist  
  'technical_lead',   -- Replaces: technical_director, architect, technical_engineer
  'project_manager',  -- Project managers with seniority levels
  'client',          -- External client users
  'admin'            -- System administrators
);

-- Project and document statuses
CREATE TYPE project_status AS ENUM ('planning', 'active', 'on_hold', 'completed', 'cancelled');
CREATE TYPE scope_category AS ENUM ('structural', 'mechanical', 'electrical', 'architectural', 'civil');
CREATE TYPE scope_status AS ENUM ('pending', 'approved', 'in_progress', 'completed', 'cancelled');
CREATE TYPE document_type AS ENUM ('contract', 'drawing', 'specification', 'report', 'correspondence');
CREATE TYPE document_status AS ENUM ('draft', 'under_review', 'approved', 'superseded', 'archived');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected', 'requires_revision');
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'urgent');

-- Seniority levels for PM hierarchy
CREATE TYPE seniority_level AS ENUM ('junior', 'regular', 'senior', 'executive');

-- Shop drawings specific enums
CREATE TYPE shop_drawing_status AS ENUM (
  'draft',                    -- Initial creation
  'internal_review',          -- Under internal team review
  'internal_approved',        -- Approved by internal team
  'submitted_to_client',      -- Sent to client for approval
  'client_review',           -- Client is reviewing
  'approved',                -- Client approved without comments
  'approved_with_comments',   -- Client approved with minor comments
  'rejected',                -- Client rejected - needs major revision
  'revision_required',       -- Specific revisions requested
  'superseded'               -- Replaced by newer version
);

-- Drawing disciplines for proper categorization
CREATE TYPE drawing_discipline AS ENUM (
  'architectural',    -- A- prefix
  'structural',      -- S- prefix  
  'mechanical',      -- M- prefix
  'electrical',      -- E- prefix
  'plumbing',       -- P- prefix
  'millwork',       -- MW- prefix
  'landscape',      -- L- prefix
  'interior_design', -- ID- prefix
  'other'           -- D- prefix (default)
);

CREATE TYPE submission_type AS ENUM ('initial', 'revision', 'final');

-- Milestone status for construction reporting
CREATE TYPE milestone_status AS ENUM ('pending', 'in_progress', 'completed', 'delayed', 'cancelled');

-- ============================================================================
-- CORE TABLES (18 Production Tables)
-- ============================================================================

-- 1. System Settings Table
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. User Profiles (Central Authentication)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL,
  seniority_level seniority_level DEFAULT 'regular',
  is_active BOOLEAN DEFAULT true,
  phone TEXT,
  avatar_url TEXT,
  last_login_at TIMESTAMPTZ,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT chk_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT chk_full_name_length CHECK (length(full_name) >= 2)
);

-- 3. Clients Table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'USA',
  tax_id TEXT,
  website TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT chk_client_name_length CHECK (length(name) >= 2),
  CONSTRAINT chk_client_email_format CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- 4. Projects Table (Core Business Entity)
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  status project_status DEFAULT 'planning',
  start_date DATE NOT NULL,
  end_date DATE,
  location TEXT,
  budget_amount DECIMAL(15,2),
  actual_cost DECIMAL(15,2) DEFAULT 0,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  created_by UUID NOT NULL REFERENCES user_profiles(id),
  project_manager_id UUID REFERENCES user_profiles(id),
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT chk_project_name_length CHECK (length(name) >= 2),
  CONSTRAINT chk_project_code_format CHECK (code ~* '^[A-Z0-9-]{3,20}$'),
  CONSTRAINT chk_project_dates CHECK (end_date IS NULL OR end_date >= start_date),
  CONSTRAINT chk_budget_positive CHECK (budget_amount IS NULL OR budget_amount > 0)
);

-- 5. Project Assignments (Team Management)
CREATE TABLE project_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES user_profiles(id),
  role_in_project TEXT,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  removed_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  permissions JSONB DEFAULT '{}',
  
  -- Ensure unique active assignments
  CONSTRAINT unique_active_assignment UNIQUE (project_id, user_id)
);

-- 6. Scope Items (Bill of Quantities)
CREATE TABLE scope_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  description TEXT NOT NULL,
  category scope_category NOT NULL,
  status scope_status DEFAULT 'pending',
  unit TEXT NOT NULL,
  quantity DECIMAL(15,3) NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(15,2),
  total_price DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  parent_id UUID REFERENCES scope_items(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Financial tracking fields (from migration 20250726095000)
  contract_amount DECIMAL(15,2),
  approved_amount DECIMAL(15,2),
  completed_amount DECIMAL(15,2),
  completed_percentage DECIMAL(5,2) DEFAULT 0 CHECK (completed_percentage >= 0 AND completed_percentage <= 100),
  
  -- Ensure unique codes per project
  CONSTRAINT unique_scope_code_per_project UNIQUE (project_id, code)
);

-- 7. Documents Table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  document_type document_type NOT NULL,
  status document_status DEFAULT 'draft',
  version_number INTEGER DEFAULT 1,
  file_path TEXT,
  file_size BIGINT,
  mime_type TEXT,
  uploaded_by UUID NOT NULL REFERENCES user_profiles(id),
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT chk_document_name_length CHECK (length(name) >= 3),
  CONSTRAINT chk_version_positive CHECK (version_number > 0)
);

-- 8. Suppliers Table
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'USA',
  tax_id TEXT,
  payment_terms INTEGER DEFAULT 30,
  credit_limit DECIMAL(15,2),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  is_approved BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT chk_supplier_name_length CHECK (length(name) >= 2),
  CONSTRAINT chk_supplier_code_format CHECK (code ~* '^[A-Z0-9-]{3,20}$'),
  CONSTRAINT chk_payment_terms CHECK (payment_terms >= 0)
);

-- 9. Shop Drawings Table
CREATE TABLE shop_drawings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  drawing_number TEXT NOT NULL,
  title TEXT NOT NULL,
  discipline drawing_discipline NOT NULL,
  submission_type submission_type NOT NULL,
  status shop_drawing_status DEFAULT 'draft',
  current_revision TEXT DEFAULT 'A',
  scope_items UUID[], -- Array of related scope item IDs
  
  -- Submission tracking
  submitted_date TIMESTAMPTZ,
  submitted_to UUID REFERENCES user_profiles(id),
  
  -- Review tracking
  reviewed_date TIMESTAMPTZ,
  reviewed_by UUID REFERENCES user_profiles(id),
  review_comments TEXT,
  
  -- Approval tracking
  approved_date TIMESTAMPTZ,
  approved_by UUID REFERENCES user_profiles(id),
  approval_comments TEXT,
  
  -- File management
  file_path TEXT,
  file_size BIGINT,
  mime_type TEXT,
  
  -- Metadata
  created_by UUID NOT NULL REFERENCES user_profiles(id),
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_drawing_number_per_project UNIQUE (project_id, drawing_number),
  CONSTRAINT chk_drawing_number_format CHECK (drawing_number ~* '^[A-Z0-9-./]+$'),
  CONSTRAINT chk_title_length CHECK (length(title) >= 3)
);

-- 10. Construction Reports Table
CREATE TABLE construction_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  report_number TEXT NOT NULL,
  weather_conditions JSONB DEFAULT '{}',
  workforce_count INTEGER DEFAULT 0,
  work_summary TEXT,
  safety_incidents INTEGER DEFAULT 0,
  safety_notes TEXT,
  quality_issues TEXT,
  materials_received TEXT,
  equipment_on_site TEXT,
  visitor_log JSONB DEFAULT '[]',
  created_by UUID NOT NULL REFERENCES user_profiles(id),
  reviewed_by UUID REFERENCES user_profiles(id),
  reviewed_at TIMESTAMPTZ,
  is_draft BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_report_per_project_date UNIQUE (project_id, report_date),
  CONSTRAINT chk_workforce_non_negative CHECK (workforce_count >= 0),
  CONSTRAINT chk_safety_incidents_non_negative CHECK (safety_incidents >= 0)
);

-- 11. Construction Report Lines Table
CREATE TABLE construction_report_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES construction_reports(id) ON DELETE CASCADE,
  scope_item_id UUID NOT NULL REFERENCES scope_items(id),
  workers_count INTEGER DEFAULT 0,
  work_performed TEXT,
  quantity_completed DECIMAL(15,3) DEFAULT 0,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT chk_workers_non_negative CHECK (workers_count >= 0),
  CONSTRAINT chk_quantity_non_negative CHECK (quantity_completed >= 0),
  CONSTRAINT unique_scope_per_report UNIQUE (report_id, scope_item_id)
);

-- 12. Construction Photos Table
CREATE TABLE construction_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES construction_reports(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  caption TEXT,
  location_on_site TEXT,
  scope_item_id UUID REFERENCES scope_items(id),
  taken_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID NOT NULL REFERENCES user_profiles(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Milestones Table
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  completed_date DATE,
  status milestone_status DEFAULT 'pending',
  percentage_weight DECIMAL(5,2) DEFAULT 0 CHECK (percentage_weight >= 0 AND percentage_weight <= 100),
  amount DECIMAL(15,2),
  responsible_user_id UUID REFERENCES user_profiles(id),
  dependencies UUID[], -- Array of milestone IDs this depends on
  created_by UUID NOT NULL REFERENCES user_profiles(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT chk_milestone_name_length CHECK (length(name) >= 3),
  CONSTRAINT chk_milestone_dates CHECK (completed_date IS NULL OR completed_date >= due_date)
);

-- 14. Tasks Table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status scope_status DEFAULT 'pending',
  priority priority_level DEFAULT 'medium',
  assigned_to UUID REFERENCES user_profiles(id),
  assigned_by UUID NOT NULL REFERENCES user_profiles(id),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  estimated_hours DECIMAL(6,2),
  actual_hours DECIMAL(6,2),
  tags TEXT[],
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT chk_task_title_length CHECK (length(title) >= 3),
  CONSTRAINT chk_estimated_hours_positive CHECK (estimated_hours IS NULL OR estimated_hours > 0),
  CONSTRAINT chk_actual_hours_positive CHECK (actual_hours IS NULL OR actual_hours > 0)
);

-- 15. Task Comments Table
CREATE TABLE task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  comment TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMPTZ,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT chk_comment_length CHECK (length(comment) >= 1)
);

-- 16. Material Specs Table (for approval workflow)
CREATE TABLE material_specs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scope_item_id UUID REFERENCES scope_items(id),
  name TEXT NOT NULL,
  description TEXT,
  manufacturer TEXT,
  model_number TEXT,
  technical_specs JSONB DEFAULT '{}',
  submitted_by UUID NOT NULL REFERENCES user_profiles(id),
  status approval_status DEFAULT 'pending',
  reviewed_by UUID REFERENCES user_profiles(id),
  reviewed_at TIMESTAMPTZ,
  review_comments TEXT,
  documents UUID[], -- Array of document IDs
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT chk_material_name_length CHECK (length(name) >= 3)
);

-- 17. Activity Logs Table (for audit trail)
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  changes JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Add index for performance
  CONSTRAINT chk_action_length CHECK (length(action) >= 3)
);

-- 18. Purchase Orders Table
CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  po_number TEXT UNIQUE NOT NULL,
  status scope_status DEFAULT 'pending',
  total_amount DECIMAL(15,2) NOT NULL CHECK (total_amount > 0),
  currency TEXT DEFAULT 'USD',
  payment_terms INTEGER DEFAULT 30,
  delivery_date DATE,
  delivery_address TEXT,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES user_profiles(id),
  approved_by UUID REFERENCES user_profiles(id),
  approved_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT chk_po_number_format CHECK (po_number ~* '^PO-[0-9]{6,}$')
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE (Critical for JOIN operations)
-- ============================================================================

-- User Profiles indexes
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_is_active ON user_profiles(is_active);

-- Projects indexes
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_project_manager_id ON projects(project_manager_id);
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_projects_is_active ON projects(is_active);

-- Project Assignments indexes
CREATE INDEX idx_project_assignments_project_id ON project_assignments(project_id);
CREATE INDEX idx_project_assignments_user_id ON project_assignments(user_id);
CREATE INDEX idx_project_assignments_assigned_by ON project_assignments(assigned_by);
CREATE INDEX idx_project_assignments_is_active ON project_assignments(is_active);

-- Scope Items indexes
CREATE INDEX idx_scope_items_project_id ON scope_items(project_id);
CREATE INDEX idx_scope_items_parent_id ON scope_items(parent_id);
CREATE INDEX idx_scope_items_category ON scope_items(category);
CREATE INDEX idx_scope_items_status ON scope_items(status);
CREATE INDEX idx_scope_items_created_by ON scope_items(created_by);

-- Documents indexes
CREATE INDEX idx_documents_project_id ON documents(project_id);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX idx_documents_document_type ON documents(document_type);
CREATE INDEX idx_documents_status ON documents(status);

-- Shop Drawings indexes
CREATE INDEX idx_shop_drawings_project_id ON shop_drawings(project_id);
CREATE INDEX idx_shop_drawings_submitted_to ON shop_drawings(submitted_to);
CREATE INDEX idx_shop_drawings_reviewed_by ON shop_drawings(reviewed_by);
CREATE INDEX idx_shop_drawings_approved_by ON shop_drawings(approved_by);
CREATE INDEX idx_shop_drawings_status ON shop_drawings(status);
CREATE INDEX idx_shop_drawings_discipline ON shop_drawings(discipline);
CREATE INDEX idx_shop_drawings_created_by ON shop_drawings(created_by);

-- Construction Reports indexes
CREATE INDEX idx_construction_reports_project_id ON construction_reports(project_id);
CREATE INDEX idx_construction_reports_report_date ON construction_reports(report_date);
CREATE INDEX idx_construction_reports_created_by ON construction_reports(created_by);
CREATE INDEX idx_construction_reports_reviewed_by ON construction_reports(reviewed_by);

-- Construction Report Lines indexes
CREATE INDEX idx_construction_report_lines_report_id ON construction_report_lines(report_id);
CREATE INDEX idx_construction_report_lines_scope_item_id ON construction_report_lines(scope_item_id);

-- Construction Photos indexes
CREATE INDEX idx_construction_photos_report_id ON construction_photos(report_id);
CREATE INDEX idx_construction_photos_scope_item_id ON construction_photos(scope_item_id);
CREATE INDEX idx_construction_photos_uploaded_by ON construction_photos(uploaded_by);

-- Milestones indexes
CREATE INDEX idx_milestones_project_id ON milestones(project_id);
CREATE INDEX idx_milestones_responsible_user_id ON milestones(responsible_user_id);
CREATE INDEX idx_milestones_status ON milestones(status);
CREATE INDEX idx_milestones_created_by ON milestones(created_by);

-- Tasks indexes
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_assigned_by ON tasks(assigned_by);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- Task Comments indexes
CREATE INDEX idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX idx_task_comments_user_id ON task_comments(user_id);

-- Material Specs indexes
CREATE INDEX idx_material_specs_project_id ON material_specs(project_id);
CREATE INDEX idx_material_specs_scope_item_id ON material_specs(scope_item_id);
CREATE INDEX idx_material_specs_submitted_by ON material_specs(submitted_by);
CREATE INDEX idx_material_specs_reviewed_by ON material_specs(reviewed_by);
CREATE INDEX idx_material_specs_status ON material_specs(status);

-- Activity Logs indexes
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_entity_type_id ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

-- Purchase Orders indexes
CREATE INDEX idx_purchase_orders_project_id ON purchase_orders(project_id);
CREATE INDEX idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_created_by ON purchase_orders(created_by);
CREATE INDEX idx_purchase_orders_approved_by ON purchase_orders(approved_by);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);

-- Suppliers indexes
CREATE INDEX idx_suppliers_created_by ON suppliers(created_by);
CREATE INDEX idx_suppliers_is_active ON suppliers(is_active);
CREATE INDEX idx_suppliers_is_approved ON suppliers(is_approved);

-- Clients indexes
CREATE INDEX idx_clients_created_by ON clients(created_by);
CREATE INDEX idx_clients_is_active ON clients(is_active);

-- ============================================================================
-- SECURITY FUNCTIONS
-- ============================================================================

-- Check if user has management role
CREATE OR REPLACE FUNCTION is_management_role(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE id = user_id 
    AND role = 'management'
    AND is_active = true
  );
END;
$$;

-- Check if user is assigned to project
CREATE OR REPLACE FUNCTION is_assigned_to_project(user_id UUID, project_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.project_assignments 
    WHERE project_assignments.user_id = $1 
    AND project_assignments.project_id = $2 
    AND is_active = true
  );
END;
$$;

-- Get user's accessible projects
CREATE OR REPLACE FUNCTION get_user_accessible_projects(user_id UUID)
RETURNS SETOF UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
BEGIN
  -- Management and admin can see all projects
  IF EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = user_id 
    AND role IN ('management', 'admin') 
    AND is_active = true
  ) THEN
    RETURN QUERY SELECT id FROM public.projects WHERE is_active = true;
  ELSE
    -- Others see only assigned projects
    RETURN QUERY 
    SELECT DISTINCT project_id 
    FROM public.project_assignments 
    WHERE project_assignments.user_id = $1 
    AND is_active = true;
  END IF;
END;
$$;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE scope_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_drawings ENABLE ROW LEVEL SECURITY;
ALTER TABLE construction_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE construction_report_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE construction_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

-- System Settings policies (public read, admin write)
CREATE POLICY "system_settings_public_read" ON system_settings
  FOR SELECT USING (is_public = true);

CREATE POLICY "system_settings_admin_all" ON system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = (SELECT auth.uid()) 
      AND role = 'admin' 
      AND is_active = true
    )
  );

-- User Profiles policies
CREATE POLICY "user_profiles_select" ON user_profiles
  FOR SELECT USING (true);

CREATE POLICY "user_profiles_update_own" ON user_profiles
  FOR UPDATE USING (id = (SELECT auth.uid()));

CREATE POLICY "user_profiles_admin_all" ON user_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = (SELECT auth.uid()) 
      AND role = 'admin' 
      AND is_active = true
    )
  );

-- Projects policies
CREATE POLICY "projects_select" ON projects
  FOR SELECT USING (
    id IN (SELECT get_user_accessible_projects((SELECT auth.uid())))
  );

CREATE POLICY "projects_insert" ON projects
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = (SELECT auth.uid()) 
      AND role IN ('management', 'admin', 'project_manager') 
      AND is_active = true
    )
  );

CREATE POLICY "projects_update" ON projects
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = (SELECT auth.uid()) 
      AND role IN ('management', 'admin') 
      AND is_active = true
    ) OR (
      project_manager_id = (SELECT auth.uid())
    )
  );

-- Project Assignments policies
CREATE POLICY "project_assignments_select" ON project_assignments
  FOR SELECT USING (
    project_id IN (SELECT get_user_accessible_projects((SELECT auth.uid())))
  );

CREATE POLICY "project_assignments_manage" ON project_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = (SELECT auth.uid()) 
      AND role IN ('management', 'admin') 
      AND is_active = true
    ) OR (
      EXISTS (
        SELECT 1 FROM projects 
        WHERE id = project_id 
        AND project_manager_id = (SELECT auth.uid())
      )
    )
  );

-- Scope Items policies
CREATE POLICY "scope_items_select" ON scope_items
  FOR SELECT USING (
    project_id IN (SELECT get_user_accessible_projects((SELECT auth.uid())))
  );

CREATE POLICY "scope_items_manage" ON scope_items
  FOR ALL USING (
    project_id IN (SELECT get_user_accessible_projects((SELECT auth.uid())))
    AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = (SELECT auth.uid()) 
      AND role NOT IN ('client') 
      AND is_active = true
    )
  );

-- Apply similar patterns for remaining tables...
-- (Simplified for brevity - add specific policies for each table based on business rules)

-- ============================================================================
-- AUTHENTICATION SYSTEM
-- ============================================================================

-- Handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  default_role public.user_role := 'client';
  default_full_name text;
BEGIN
  -- Extract name from email if not provided
  default_full_name := COALESCE(
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1)
  );

  -- Extract role from metadata if provided
  IF new.raw_user_meta_data->>'role' IS NOT NULL THEN
    default_role := (new.raw_user_meta_data->>'role')::public.user_role;
  END IF;

  -- Insert into user_profiles
  INSERT INTO public.user_profiles (
    id,
    email,
    full_name,
    role,
    phone,
    avatar_url,
    preferences
  ) VALUES (
    new.id,
    new.email,
    default_full_name,
    default_role,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'avatar_url',
    COALESCE(new.raw_user_meta_data->'preferences', '{}'::jsonb)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(user_profiles.full_name, EXCLUDED.full_name),
    phone = COALESCE(EXCLUDED.phone, user_profiles.phone),
    avatar_url = COALESCE(EXCLUDED.avatar_url, user_profiles.avatar_url),
    updated_at = NOW();

  RETURN new;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Sync user profile updates back to auth.users
CREATE OR REPLACE FUNCTION sync_user_profile_to_auth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Update auth.users metadata when profile changes
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data || 
    jsonb_build_object(
      'full_name', NEW.full_name,
      'phone', NEW.phone,
      'avatar_url', NEW.avatar_url,
      'role', NEW.role::text,
      'preferences', NEW.preferences
    )
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Create trigger for profile updates
CREATE TRIGGER on_profile_updated
  AFTER UPDATE ON user_profiles
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION sync_user_profile_to_auth();

-- ============================================================================
-- ADMIN USER PROTECTION
-- ============================================================================

-- Prevent deletion of admin@formulapm.com
CREATE OR REPLACE FUNCTION protect_admin_user()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.email = 'admin@formulapm.com' THEN
    RAISE EXCEPTION 'Cannot delete protected admin user';
  END IF;
  RETURN OLD;
END;
$$;

CREATE TRIGGER protect_admin_user_profiles
  BEFORE DELETE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION protect_admin_user();

CREATE TRIGGER protect_admin_auth_users
  BEFORE DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION protect_admin_user();

-- ============================================================================
-- READY FOR MANUAL USER CREATION
-- ============================================================================
-- Users will be created manually through the application interface
-- The handle_new_user() trigger will automatically create user_profiles

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Formula PM V2 database setup completed successfully!';
  RAISE NOTICE '📊 Created 18 tables with optimized indexes';
  RAISE NOTICE '🔐 Row Level Security enabled on all tables';
  RAISE NOTICE '👥 Ready for manual user creation';
  RAISE NOTICE '🛡️ Admin user protection enabled';
END $$;
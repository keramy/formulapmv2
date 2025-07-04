-- Formula PM 2.0 Initial Database Schema Migration
-- Created: 2025-07-02
-- Purpose: Complete foundation schema for Wave 1 implementation

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUMS AND TYPES
-- ============================================================================

-- User roles enum covering all 13 user types
CREATE TYPE user_role AS ENUM (
  'company_owner',
  'general_manager', 
  'deputy_general_manager',
  'technical_director',
  'admin',
  'project_manager',
  'architect',
  'technical_engineer',
  'purchase_director',
  'purchase_specialist', 
  'field_worker',
  'client',
  'subcontractor'
);

-- Project status types
CREATE TYPE project_status AS ENUM (
  'planning',
  'bidding', 
  'active',
  'on_hold',
  'completed',
  'cancelled'
);

-- Scope categories
CREATE TYPE scope_category AS ENUM (
  'construction',
  'millwork', 
  'electrical',
  'mechanical'
);

-- Scope status types
CREATE TYPE scope_status AS ENUM (
  'not_started',
  'in_progress',
  'review',
  'completed',
  'blocked',
  'cancelled'
);

-- Document types
CREATE TYPE document_type AS ENUM (
  'shop_drawing',
  'material_spec',
  'contract',
  'report',
  'photo',
  'other'
);

-- Document status
CREATE TYPE document_status AS ENUM (
  'draft',
  'review',
  'approved',
  'rejected',
  'revision_required'
);

-- ============================================================================
-- CORE USER MANAGEMENT
-- ============================================================================

-- Extended user profiles
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  company TEXT,
  department TEXT,
  hire_date DATE,
  is_active BOOLEAN DEFAULT true,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client-specific information
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  billing_address TEXT,
  project_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Supplier information for purchase department
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  specializations TEXT[],
  performance_rating DECIMAL(3,2) DEFAULT 0.00,
  is_approved BOOLEAN DEFAULT false,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PROJECT MANAGEMENT CORE
-- ============================================================================

-- Main projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  client_id UUID REFERENCES clients(id),
  project_manager_id UUID REFERENCES user_profiles(id),
  status project_status DEFAULT 'planning',
  start_date DATE,
  end_date DATE,
  budget DECIMAL(12,2),
  actual_cost DECIMAL(12,2) DEFAULT 0.00,
  location TEXT,
  project_type TEXT,
  priority INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project team assignments
CREATE TABLE project_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  responsibilities TEXT[],
  assigned_by UUID REFERENCES user_profiles(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(project_id, user_id, role)
);

-- ============================================================================
-- SCOPE MANAGEMENT SYSTEM
-- ============================================================================

-- Main scope items with enhanced business fields
CREATE TABLE scope_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  category scope_category NOT NULL,
  
  -- Core Required Fields (Business Requirements)
  item_no INTEGER NOT NULL, -- Auto-generated sequential number per project
  item_code TEXT, -- Client-provided code (Excel importable, nullable)
  description TEXT NOT NULL, -- Detailed item description (required)
  quantity DECIMAL(10,2) NOT NULL, -- Numeric quantity with unit validation
  unit_price DECIMAL(10,2) NOT NULL, -- Base unit pricing
  total_price DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  
  -- Cost Tracking (Technical Office + Purchasing Access Only)
  initial_cost DECIMAL(12,2), -- Original estimated cost
  actual_cost DECIMAL(12,2), -- Real incurred cost
  cost_variance DECIMAL(12,2) GENERATED ALWAYS AS (actual_cost - initial_cost) STORED,
  
  -- Legacy/Additional Fields
  title TEXT, -- For backward compatibility, auto-populated from description
  specifications TEXT,
  unit_of_measure TEXT,
  markup_percentage DECIMAL(5,2) DEFAULT 0,
  final_price DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price * (1 + markup_percentage/100)) STORED,
  
  timeline_start DATE,
  timeline_end DATE,
  duration_days INTEGER,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  status scope_status DEFAULT 'not_started',
  assigned_to UUID[] DEFAULT '{}',
  supplier_id UUID REFERENCES suppliers(id),
  dependencies UUID[] DEFAULT '{}',
  priority INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_item_no_per_project UNIQUE (project_id, item_no),
  CONSTRAINT positive_quantity CHECK (quantity > 0),
  CONSTRAINT positive_unit_price CHECK (unit_price >= 0)
);

-- Scope item dependencies
CREATE TABLE scope_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_item_id UUID REFERENCES scope_items(id) ON DELETE CASCADE,
  depends_on_id UUID REFERENCES scope_items(id) ON DELETE CASCADE,
  dependency_type TEXT DEFAULT 'blocks',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(scope_item_id, depends_on_id)
);

-- ============================================================================
-- DOCUMENT MANAGEMENT SYSTEM
-- ============================================================================

-- Main documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  scope_item_id UUID REFERENCES scope_items(id),
  document_type document_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT,
  file_size INTEGER,
  mime_type TEXT,
  version INTEGER DEFAULT 1,
  status document_status DEFAULT 'draft',
  is_client_visible BOOLEAN DEFAULT false,
  uploaded_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document approvals workflow
CREATE TABLE document_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  approver_id UUID REFERENCES user_profiles(id),
  approver_type TEXT NOT NULL, -- 'internal' or 'client'
  status TEXT NOT NULL, -- 'pending', 'approved', 'rejected'
  comments TEXT,
  approved_at TIMESTAMPTZ,
  version INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PERFORMANCE OPTIMIZATION INDEXES
-- ============================================================================

-- User profiles indexes
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_active ON user_profiles(is_active);

-- Project indexes
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_pm ON projects(project_manager_id);
CREATE INDEX idx_projects_client ON projects(client_id);
CREATE INDEX idx_projects_dates ON projects(start_date, end_date);
CREATE INDEX idx_projects_created ON projects(created_at);

-- Scope items indexes  
CREATE INDEX idx_scope_project ON scope_items(project_id);
CREATE INDEX idx_scope_category ON scope_items(category);
CREATE INDEX idx_scope_status ON scope_items(status);
CREATE INDEX idx_scope_assigned ON scope_items USING gin(assigned_to);
CREATE INDEX idx_scope_timeline ON scope_items(timeline_start, timeline_end);
-- New indexes for core business fields
CREATE INDEX idx_scope_item_no ON scope_items(project_id, item_no);
CREATE INDEX idx_scope_item_code ON scope_items(item_code) WHERE item_code IS NOT NULL;
CREATE INDEX idx_scope_costs ON scope_items(initial_cost, actual_cost) WHERE initial_cost IS NOT NULL OR actual_cost IS NOT NULL;
CREATE INDEX idx_scope_supplier ON scope_items(supplier_id);
CREATE INDEX idx_scope_created_by ON scope_items(created_by);

-- Document indexes
CREATE INDEX idx_documents_project ON documents(project_id);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_scope ON documents(scope_item_id);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX idx_documents_client_visible ON documents(is_client_visible);

-- Assignment indexes
CREATE INDEX idx_assignments_user ON project_assignments(user_id);
CREATE INDEX idx_assignments_project ON project_assignments(project_id);
CREATE INDEX idx_assignments_active ON project_assignments(is_active);

-- Client indexes
CREATE INDEX idx_clients_user ON clients(user_id);
CREATE INDEX idx_clients_company ON clients(company_name);

-- Supplier indexes
CREATE INDEX idx_suppliers_approved ON suppliers(is_approved);
CREATE INDEX idx_suppliers_rating ON suppliers(performance_rating);
CREATE INDEX idx_suppliers_created_by ON suppliers(created_by);

-- Dependencies indexes
CREATE INDEX idx_scope_deps_item ON scope_dependencies(scope_item_id);
CREATE INDEX idx_scope_deps_depends ON scope_dependencies(depends_on_id);

-- Document approvals indexes
CREATE INDEX idx_doc_approvals_document ON document_approvals(document_id);
CREATE INDEX idx_doc_approvals_approver ON document_approvals(approver_id);
CREATE INDEX idx_doc_approvals_status ON document_approvals(status);

-- ============================================================================
-- AUTO-UPDATE TRIGGERS
-- ============================================================================

-- Auto-update timestamps function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to relevant tables
CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_clients_updated_at 
  BEFORE UPDATE ON clients 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at 
  BEFORE UPDATE ON suppliers 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_projects_updated_at 
  BEFORE UPDATE ON projects 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_scope_items_updated_at 
  BEFORE UPDATE ON scope_items 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_documents_updated_at 
  BEFORE UPDATE ON documents 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================================
-- AUTO-POPULATE FUNCTIONS
-- ============================================================================

-- Function to auto-generate item_no for scope items
CREATE OR REPLACE FUNCTION generate_scope_item_no()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.item_no IS NULL THEN
    SELECT COALESCE(MAX(item_no), 0) + 1 
    INTO NEW.item_no 
    FROM scope_items 
    WHERE project_id = NEW.project_id;
  END IF;
  
  -- Auto-populate title from description if not provided
  IF NEW.title IS NULL OR NEW.title = '' THEN
    NEW.title = NEW.description;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER auto_generate_scope_item_no
  BEFORE INSERT ON scope_items
  FOR EACH ROW EXECUTE PROCEDURE generate_scope_item_no();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

-- Table comments
COMMENT ON TABLE user_profiles IS 'Extended user profile information for all 13 user types with role-based permissions';
COMMENT ON TABLE clients IS 'Client company information and project preferences';
COMMENT ON TABLE suppliers IS 'Supplier database for purchase department with performance tracking';
COMMENT ON TABLE projects IS 'Main project management table with budget tracking and timeline management';
COMMENT ON TABLE project_assignments IS 'Team member assignments to projects with role-based responsibilities';
COMMENT ON TABLE scope_items IS 'Detailed scope items with cost tracking and business logic requirements';
COMMENT ON TABLE scope_dependencies IS 'Dependency relationships between scope items for timeline management';
COMMENT ON TABLE documents IS 'Document management with version control and client visibility settings';
COMMENT ON TABLE document_approvals IS 'Approval workflow for documents with internal and client approval tracking';

-- Column comments for critical business fields
COMMENT ON COLUMN scope_items.item_no IS 'Auto-generated sequential number per project for item identification';
COMMENT ON COLUMN scope_items.item_code IS 'Client-provided code for external system integration (nullable)';
COMMENT ON COLUMN scope_items.description IS 'Required detailed description of the scope item';
COMMENT ON COLUMN scope_items.initial_cost IS 'Original estimated cost - restricted access to technical office and purchasing';
COMMENT ON COLUMN scope_items.actual_cost IS 'Real incurred cost - restricted access to technical office and purchasing';
COMMENT ON COLUMN scope_items.cost_variance IS 'Computed variance between actual and initial cost';
COMMENT ON COLUMN scope_items.assigned_to IS 'Array of user IDs assigned to work on this scope item';

-- Migration completion marker
INSERT INTO public.migrations (version, name, executed_at) 
VALUES ('20250702000001', 'initial_schema', NOW())
ON CONFLICT (version) DO NOTHING;
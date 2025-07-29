-- Formula PM 2.0 Clean Optimized Schema
-- Created: 2025-01-24
-- Purpose: Clean database schema with performance optimizations built-in
-- This migration creates 12-15 core tables with the 6-role system

-- ============================================================================
-- EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CLEAN UP ANY EXISTING SCHEMA (CAREFUL IN PRODUCTION!)
-- ============================================================================
-- Drop existing types if they exist
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS project_status CASCADE;
DROP TYPE IF EXISTS scope_category CASCADE;
DROP TYPE IF EXISTS scope_status CASCADE;
DROP TYPE IF EXISTS document_type CASCADE;
DROP TYPE IF EXISTS document_status CASCADE;
DROP TYPE IF EXISTS approval_status CASCADE;
DROP TYPE IF EXISTS priority_level CASCADE;

-- ============================================================================
-- ENUMS AND TYPES
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

-- Project status
CREATE TYPE project_status AS ENUM (
  'planning',
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
  'mechanical',
  'other'
);

-- Scope status
CREATE TYPE scope_status AS ENUM (
  'not_started',
  'in_progress',
  'completed',
  'blocked'
);

-- Document types
CREATE TYPE document_type AS ENUM (
  'shop_drawing',
  'material_spec',
  'contract',
  'report',
  'other'
);

-- Document/Approval status
CREATE TYPE approval_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'revision_required'
);

-- Priority levels
CREATE TYPE priority_level AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

-- ============================================================================
-- CORE TABLES (12-15 tables for clean architecture)
-- ============================================================================

-- 1. User profiles (extends auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role user_role NOT NULL,
  seniority TEXT CHECK (seniority IN ('executive', 'senior', 'regular')) DEFAULT 'regular',
  phone TEXT,
  company TEXT,
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Clients
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Projects
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
  location TEXT,
  priority priority_level DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Project assignments
CREATE TABLE project_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(project_id, user_id, role)
);

-- 5. Scope items (core business entity)
CREATE TABLE scope_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  item_no INTEGER NOT NULL,
  item_code TEXT,
  description TEXT NOT NULL,
  category scope_category NOT NULL,
  quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  total_price DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  unit_of_measure TEXT DEFAULT 'pcs',
  status scope_status DEFAULT 'not_started',
  assigned_to UUID REFERENCES user_profiles(id),
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_item_no_per_project UNIQUE (project_id, item_no)
);

-- 6. Material specifications
CREATE TABLE material_specs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  scope_item_id UUID REFERENCES scope_items(id),
  name TEXT NOT NULL,
  description TEXT,
  specifications JSONB DEFAULT '{}',
  status approval_status DEFAULT 'pending',
  submitted_by UUID REFERENCES user_profiles(id),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by UUID REFERENCES user_profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Suppliers
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  specializations TEXT[],
  is_approved BOOLEAN DEFAULT false,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Purchase orders
CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id),
  po_number TEXT UNIQUE NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  status TEXT DEFAULT 'draft',
  created_by UUID REFERENCES user_profiles(id),
  approved_by UUID REFERENCES user_profiles(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
  title TEXT NOT NULL,
  file_path TEXT,
  file_size INTEGER,
  version INTEGER DEFAULT 1,
  is_client_visible BOOLEAN DEFAULT false,
  uploaded_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Document approvals
CREATE TABLE document_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  approver_id UUID REFERENCES user_profiles(id),
  status approval_status DEFAULT 'pending',
  comments TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Milestones
CREATE TABLE project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  completed_date DATE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. System settings (for app configuration)
CREATE TABLE system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- AUTO-UPDATE TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scope_items_updated_at BEFORE UPDATE ON scope_items 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_material_specs_updated_at BEFORE UPDATE ON material_specs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_milestones_updated_at BEFORE UPDATE ON project_milestones 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- AUTO-GENERATE SCOPE ITEM NUMBERS
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_scope_item_no()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.item_no IS NULL THEN
    SELECT COALESCE(MAX(item_no), 0) + 1 
    INTO NEW.item_no 
    FROM scope_items 
    WHERE project_id = NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER auto_generate_scope_item_no BEFORE INSERT ON scope_items
  FOR EACH ROW EXECUTE FUNCTION generate_scope_item_no();

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================

-- User profiles
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_active ON user_profiles(is_active);

-- Projects
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_client ON projects(client_id);
CREATE INDEX idx_projects_pm ON projects(project_manager_id);

-- Project assignments
CREATE INDEX idx_assignments_project ON project_assignments(project_id);
CREATE INDEX idx_assignments_user ON project_assignments(user_id);
CREATE INDEX idx_assignments_active ON project_assignments(is_active);

-- Scope items
CREATE INDEX idx_scope_project ON scope_items(project_id);
CREATE INDEX idx_scope_category ON scope_items(category);
CREATE INDEX idx_scope_status ON scope_items(status);
CREATE INDEX idx_scope_assigned ON scope_items(assigned_to);

-- Material specs
CREATE INDEX idx_material_project ON material_specs(project_id);
CREATE INDEX idx_material_scope ON material_specs(scope_item_id);
CREATE INDEX idx_material_status ON material_specs(status);

-- Documents
CREATE INDEX idx_documents_project ON documents(project_id);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_visible ON documents(is_client_visible);

-- Purchase orders
CREATE INDEX idx_po_project ON purchase_orders(project_id);
CREATE INDEX idx_po_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_po_status ON purchase_orders(status);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE scope_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS HELPER FUNCTIONS (PERFORMANCE OPTIMIZED)
-- ============================================================================

-- Check if user has management role (using JWT to avoid recursion)
CREATE OR REPLACE FUNCTION is_management_role()
RETURNS BOOLEAN AS $$
DECLARE
  user_role text;
BEGIN
  user_role := auth.jwt() ->> 'user_role';
  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN user_role IN ('management', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has project access
CREATE OR REPLACE FUNCTION has_project_access(project_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF is_management_role() THEN
    RETURN TRUE;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM project_assignments 
    WHERE project_id = project_uuid 
    AND user_id = (SELECT auth.uid())
    AND is_active = true
  ) OR EXISTS (
    SELECT 1 FROM projects
    WHERE id = project_uuid
    AND project_manager_id = (SELECT auth.uid())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE user_profiles IS 'User profiles with 6-role system and flexible permissions';
COMMENT ON TABLE clients IS 'Client companies for projects';
COMMENT ON TABLE projects IS 'Main project management table';
COMMENT ON TABLE project_assignments IS 'Team assignments to projects';
COMMENT ON TABLE scope_items IS 'Core business entity - project scope items';
COMMENT ON TABLE material_specs IS 'Material specifications with approval workflow';
COMMENT ON TABLE suppliers IS 'Supplier/vendor management';
COMMENT ON TABLE purchase_orders IS 'Purchase order tracking';
COMMENT ON TABLE documents IS 'Document management with versioning';
COMMENT ON TABLE document_approvals IS 'Approval workflow for documents';
COMMENT ON TABLE project_milestones IS 'Project timeline milestones';
COMMENT ON TABLE system_settings IS 'Application configuration storage';
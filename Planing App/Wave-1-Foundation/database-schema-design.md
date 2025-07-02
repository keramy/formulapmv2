# Database Schema Design - Wave 1 Foundation
## Enhanced Coordinator Agent Implementation

### **🎯 OBJECTIVE**
Design and implement a comprehensive PostgreSQL database schema supporting 13 distinct user types with proper relationships, security policies, and scalability for Formula PM 2.0.

### **📋 TASK BREAKDOWN FOR COORDINATOR**

**FOUNDATION TASKS (Spawn immediately):**
1. **User Management Schema**: Core user types and roles
2. **Project Structure Schema**: Projects, assignments, and relationships
3. **Row Level Security**: Multi-user access control policies
4. **Audit & Tracking**: Change tracking and system logs

**DEPENDENT TASKS (Wait for foundation approval):**
5. **Performance Indexes**: Database optimization
6. **Migration Scripts**: Development to production migration

---

## **📊 Complete Database Schema**

### **Core User Management**
```sql
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

-- Extended user profiles
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
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
  user_id UUID REFERENCES user_profiles(id),
  company_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  billing_address TEXT,
  project_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Project Management Core**
```sql
-- Project status types
CREATE TYPE project_status AS ENUM (
  'planning',
  'bidding', 
  'active',
  'on_hold',
  'completed',
  'cancelled'
);

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
```

### **Scope Management System**
```sql
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

-- Main scope items with enhanced fields
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
  final_price DECIMAL(12,2) GENERATED ALWAYS AS (total_price * (1 + markup_percentage/100)) STORED,
  
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
```

### **Document Management System**
```sql
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
  upload_by UUID REFERENCES user_profiles(id),
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
```

---

## **🔒 Row Level Security Policies**

### **Management Level Access**
```sql
-- Enable RLS on all tables  
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE scope_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Management full access policy
CREATE POLICY "Management full access" ON projects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin')
    )
  );

-- Project manager access to assigned projects
CREATE POLICY "PM assigned projects" ON projects
  FOR ALL USING (
    project_manager_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM project_assignments 
      WHERE project_id = projects.id 
      AND user_id = auth.uid()
      AND is_active = true
    )
  );

-- Client access to their projects only
CREATE POLICY "Client project access" ON projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN clients c ON c.user_id = up.id
      WHERE up.id = auth.uid() 
      AND up.role = 'client'
      AND c.id = projects.client_id
    )
  );
```

### **Scope Items Security**
```sql
-- Scope items follow project access patterns
CREATE POLICY "Scope project access" ON scope_items
  FOR ALL USING (
    -- Management access
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin')
    ) OR
    -- Project team access
    EXISTS (
      SELECT 1 FROM project_assignments pa
      JOIN projects p ON p.id = pa.project_id
      WHERE pa.user_id = auth.uid()
      AND pa.project_id = scope_items.project_id
      AND pa.is_active = true
    ) OR
    -- Field worker access (read-only, no prices)
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN project_assignments pa ON pa.user_id = up.id
      WHERE up.id = auth.uid()
      AND up.role = 'field_worker'
      AND pa.project_id = scope_items.project_id
      AND pa.is_active = true
    )
  );
```

### **Document Security**
```sql
-- Document access based on visibility and project access
CREATE POLICY "Document access" ON documents
  FOR SELECT USING (
    -- Management access
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin')
    ) OR
    -- Project team access
    EXISTS (
      SELECT 1 FROM project_assignments 
      WHERE user_id = auth.uid()
      AND project_id = documents.project_id
      AND is_active = true
    ) OR
    -- Client access to client-visible documents
    (is_client_visible = true AND EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN clients c ON c.user_id = up.id
      JOIN projects p ON p.client_id = c.id
      WHERE up.id = auth.uid() 
      AND up.role = 'client'
      AND p.id = documents.project_id
    ))
  );
```

---

## **📈 Performance Optimization**

### **Database Indexes**
```sql
-- Project indexes
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_pm ON projects(project_manager_id);
CREATE INDEX idx_projects_client ON projects(client_id);
CREATE INDEX idx_projects_dates ON projects(start_date, end_date);

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

-- Document indexes
CREATE INDEX idx_documents_project ON documents(project_id);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_scope ON documents(scope_item_id);

-- Assignment indexes
CREATE INDEX idx_assignments_user ON project_assignments(user_id);
CREATE INDEX idx_assignments_project ON project_assignments(project_id);
CREATE INDEX idx_assignments_active ON project_assignments(is_active);
```

### **Triggers for Auto-Updates**
```sql
-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to relevant tables
CREATE TRIGGER update_projects_updated_at 
  BEFORE UPDATE ON projects 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_scope_items_updated_at 
  BEFORE UPDATE ON scope_items 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_documents_updated_at 
  BEFORE UPDATE ON documents 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
```

---

## **🔧 COORDINATOR IMPLEMENTATION INSTRUCTIONS**

### **Subagent Spawning Strategy**
```
TASK: Database Schema Implementation
OBJECTIVE: Deploy production-ready PostgreSQL schema with full RLS
CONTEXT: Foundation for entire multi-user construction PM system

REQUIRED READING:
- Patterns: @Patterns/optimized-coordinator-v1.md
- Current Plan: @Planing App/management_user_workflow.md
- Templates: @Patterns/templates/subagent-template.md

IMPLEMENTATION REQUIREMENTS:
1. Execute all SQL commands in correct dependency order
2. Verify RLS policies work for all 13 user types
3. Test database performance with sample data
4. Document any schema modifications needed

DELIVERABLES:
1. Complete database schema deployment
2. RLS policy verification report
3. Performance benchmark results
4. Migration scripts for production
```

### **Quality Gates**
- ✅ All 13 user types can authenticate successfully
- ✅ RLS policies prevent unauthorized data access
- ✅ Database supports 100+ concurrent connections
- ✅ All foreign key relationships maintain integrity
- ✅ Indexes provide <100ms query response times

### **Dependencies for Next Wave**
- Database schema must be 100% complete
- All RLS policies tested and verified
- Performance benchmarks meet requirements
- Migration scripts ready for production

---

## **🎯 SUCCESS CRITERIA**
1. **Schema Completeness**: All tables, relationships, and constraints implemented
2. **Security Validation**: RLS policies tested for all user types
3. **Performance Benchmarks**: Sub-100ms query times for standard operations
4. **Integration Ready**: Foundation supports all planned Wave 2 features

**Evaluation Score Target**: 90+ using @Patterns/templates/evaluator-prompt.md
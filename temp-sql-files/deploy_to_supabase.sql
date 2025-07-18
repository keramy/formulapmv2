-- Formula PM 2.0 - Complete Database Schema Deployment
-- Deploy this script in your Supabase SQL Editor
-- Go to: https://supabase.com/dashboard/project/xrrrtwrfadcilwkgwacs/sql

-- =================================================================
-- MIGRATION: 20250702000000_migrations_table.sql
-- =================================================================

-- Create migrations tracking table
CREATE TABLE IF NOT EXISTS public.migrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =================================================================
-- MIGRATION: 20250702000001_initial_schema.sql
-- =================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create ENUM types
CREATE TYPE user_role AS ENUM (
    'company_owner',
    'general_manager', 
    'deputy_general_manager',
    'technical_director',
    'project_manager',
    'architect',
    'technical_engineer',
    'purchase_director',
    'purchase_specialist',
    'field_worker',
    'subcontractor',
    'client',
    'admin'
);

CREATE TYPE project_status AS ENUM (
    'planning',
    'bidding', 
    'active',
    'on_hold',
    'completed',
    'cancelled'
);

CREATE TYPE scope_status AS ENUM (
    'not_started',
    'in_progress',
    'completed',
    'on_hold',
    'cancelled'
);

-- Core tables
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    company TEXT,
    department TEXT,
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    country TEXT DEFAULT 'USA',
    tax_id TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    client_id UUID REFERENCES clients(id),
    project_manager_id UUID REFERENCES user_profiles(id),
    status project_status DEFAULT 'planning',
    start_date DATE,
    end_date DATE,
    budget DECIMAL(12,2),
    actual_cost DECIMAL(12,2) DEFAULT 0,
    location TEXT,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.project_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID REFERENCES user_profiles(id),
    UNIQUE(project_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.scope_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    item_no TEXT NOT NULL,
    item_code TEXT,
    description TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2),
    total_price DECIMAL(10,2),
    initial_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    cost_variance DECIMAL(10,2),
    title TEXT,
    specifications TEXT,
    unit_of_measure TEXT,
    markup_percentage DECIMAL(5,2),
    final_price DECIMAL(10,2),
    timeline_start DATE,
    timeline_end DATE,
    duration_days INTEGER,
    progress_percentage INTEGER DEFAULT 0,
    status scope_status DEFAULT 'not_started',
    assigned_to UUID REFERENCES user_profiles(id),
    supplier_id UUID,
    dependencies TEXT[],
    priority INTEGER DEFAULT 1,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project milestones table
CREATE TYPE milestone_status AS ENUM ('upcoming', 'in_progress', 'completed', 'overdue');

CREATE TABLE IF NOT EXISTS public.project_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    target_date DATE NOT NULL,
    completed_date DATE,
    status milestone_status DEFAULT 'upcoming',
    completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    assigned_to UUID REFERENCES user_profiles(id),
    dependencies TEXT[],
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Material specifications table
CREATE TYPE material_status AS ENUM (
    'pending_approval',
    'approved',
    'rejected',
    'revision_required',
    'discontinued',
    'substitution_required'
);

CREATE TYPE material_priority AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TABLE IF NOT EXISTS public.material_specs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    subcategory TEXT,
    brand TEXT,
    model TEXT,
    specifications JSONB DEFAULT '{}',
    unit_of_measure TEXT NOT NULL,
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    quantity_required INTEGER NOT NULL DEFAULT 1,
    quantity_available INTEGER DEFAULT 0,
    minimum_stock_level INTEGER DEFAULT 0,
    status material_status DEFAULT 'pending_approval',
    priority material_priority DEFAULT 'medium',
    supplier_id UUID,
    lead_time_days INTEGER DEFAULT 0,
    delivery_date DATE,
    approved_by UUID REFERENCES user_profiles(id),
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Link material specs to scope items
CREATE TABLE IF NOT EXISTS public.material_scope_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_spec_id UUID REFERENCES material_specs(id) ON DELETE CASCADE,
    scope_item_id UUID REFERENCES scope_items(id) ON DELETE CASCADE,
    quantity_needed INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(material_spec_id, scope_item_id)
);

-- =================================================================
-- MIGRATION: 20250702000002_row_level_security.sql
-- =================================================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scope_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_scope_links ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Projects policies
CREATE POLICY "Users can view assigned projects" ON public.projects
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.project_assignments 
            WHERE project_id = id 
            AND user_id = auth.uid() 
            AND is_active = true
        )
    );

-- Scope items policies
CREATE POLICY "Users can view scope items for assigned projects" ON public.scope_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.project_assignments 
            WHERE project_id = scope_items.project_id 
            AND user_id = auth.uid() 
            AND is_active = true
        )
    );

-- Material specs policies
CREATE POLICY "Users can view material specs for assigned projects" ON public.material_specs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.project_assignments 
            WHERE project_id = material_specs.project_id 
            AND user_id = auth.uid() 
            AND is_active = true
        )
    );

-- =================================================================
-- MIGRATION: Insert record tracking
-- =================================================================

INSERT INTO public.migrations (name) VALUES 
    ('20250702000000_migrations_table'),
    ('20250702000001_initial_schema'),
    ('20250702000002_row_level_security')
ON CONFLICT (name) DO NOTHING;

-- =================================================================
-- COMPLETION MESSAGE
-- =================================================================

-- If you see this message, the deployment was successful!
SELECT 'Database schema deployed successfully!' as status;
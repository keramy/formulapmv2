-- Formula PM 2.0 - Material Specifications and Approval System
-- Created: 2025-07-09
-- Purpose: Implements material specifications with approval workflow for P1.04 Material Approval System

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Create priority level enum if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'priority_level') THEN
        CREATE TYPE priority_level AS ENUM (
            'low',
            'medium',
            'high',
            'critical'
        );
    END IF;
END $$;

-- Create material status enum
CREATE TYPE material_status AS ENUM (
    'pending_approval',
    'approved',
    'rejected',
    'revision_required',
    'discontinued',
    'substitution_required'
);

-- ============================================================================
-- TABLES
-- ============================================================================

-- Create material_specs table
CREATE TABLE material_specs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) NOT NULL,
    supplier_id UUID REFERENCES suppliers(id),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    subcategory TEXT,
    brand TEXT,
    model TEXT,
    specifications JSONB DEFAULT '{}',
    unit_of_measure TEXT NOT NULL,
    estimated_cost DECIMAL(15,2),
    actual_cost DECIMAL(15,2),
    quantity_required INTEGER DEFAULT 1,
    quantity_available INTEGER DEFAULT 0,
    minimum_stock_level INTEGER DEFAULT 0,
    status material_status DEFAULT 'pending_approval',
    priority priority_level DEFAULT 'medium',
    approval_notes TEXT,
    approved_by UUID REFERENCES user_profiles(id),
    approved_at TIMESTAMPTZ,
    rejected_by UUID REFERENCES user_profiles(id),
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    substitution_notes TEXT,
    lead_time_days INTEGER DEFAULT 0,
    delivery_date DATE,
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT ck_material_positive_costs CHECK (
        (estimated_cost IS NULL OR estimated_cost >= 0) AND
        (actual_cost IS NULL OR actual_cost >= 0)
    ),
    CONSTRAINT ck_material_positive_quantities CHECK (
        quantity_required >= 0 AND
        quantity_available >= 0 AND
        minimum_stock_level >= 0
    ),
    CONSTRAINT ck_material_lead_time CHECK (lead_time_days >= 0),
    CONSTRAINT ck_material_approval_consistency CHECK (
        (status = 'approved' AND approved_by IS NOT NULL AND approved_at IS NOT NULL) OR
        (status != 'approved' AND (approved_by IS NULL OR approved_at IS NULL))
    ),
    CONSTRAINT ck_material_rejection_consistency CHECK (
        (status = 'rejected' AND rejected_by IS NOT NULL AND rejected_at IS NOT NULL) OR
        (status != 'rejected' AND (rejected_by IS NULL OR rejected_at IS NULL))
    )
);

-- Create scope_material_links table for many-to-many relationship
CREATE TABLE scope_material_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope_item_id UUID REFERENCES scope_items(id) ON DELETE CASCADE,
    material_spec_id UUID REFERENCES material_specs(id) ON DELETE CASCADE,
    quantity_needed INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT ck_scope_material_quantity CHECK (quantity_needed > 0),
    CONSTRAINT uq_scope_material_link UNIQUE (scope_item_id, material_spec_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Performance indexes for material_specs
CREATE INDEX idx_material_specs_project_id ON material_specs (project_id);
CREATE INDEX idx_material_specs_supplier_id ON material_specs (supplier_id);
CREATE INDEX idx_material_specs_status ON material_specs (status);
CREATE INDEX idx_material_specs_category ON material_specs (category);
CREATE INDEX idx_material_specs_priority ON material_specs (priority);
CREATE INDEX idx_material_specs_project_status ON material_specs (project_id, status);
CREATE INDEX idx_material_specs_project_category ON material_specs (project_id, category);
CREATE INDEX idx_material_specs_status_priority ON material_specs (status, priority);
CREATE INDEX idx_material_specs_delivery_date ON material_specs (delivery_date);

-- Indexes for scope_material_links
CREATE INDEX idx_scope_material_links_scope_item ON scope_material_links (scope_item_id);
CREATE INDEX idx_scope_material_links_material_spec ON scope_material_links (material_spec_id);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Update updated_at column automatically for material_specs
CREATE OR REPLACE FUNCTION update_material_specs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_material_specs_updated_at
    BEFORE UPDATE ON material_specs
    FOR EACH ROW
    EXECUTE FUNCTION update_material_specs_updated_at();

-- Update updated_at column automatically for scope_material_links
CREATE OR REPLACE FUNCTION update_scope_material_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_scope_material_links_updated_at
    BEFORE UPDATE ON scope_material_links
    FOR EACH ROW
    EXECUTE FUNCTION update_scope_material_links_updated_at();

-- Function to handle material approval workflow
CREATE OR REPLACE FUNCTION handle_material_approval()
RETURNS TRIGGER AS $$
BEGIN
    -- Set approval timestamp and user when status changes to approved
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        NEW.approved_by = auth.uid();
        NEW.approved_at = NOW();
        NEW.rejected_by = NULL;
        NEW.rejected_at = NULL;
        NEW.rejection_reason = NULL;
    END IF;
    
    -- Set rejection timestamp and user when status changes to rejected
    IF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
        NEW.rejected_by = auth.uid();
        NEW.rejected_at = NOW();
        NEW.approved_by = NULL;
        NEW.approved_at = NULL;
    END IF;
    
    -- Clear approval/rejection data for other statuses
    IF NEW.status NOT IN ('approved', 'rejected') THEN
        NEW.approved_by = NULL;
        NEW.approved_at = NULL;
        NEW.rejected_by = NULL;
        NEW.rejected_at = NULL;
        NEW.rejection_reason = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_handle_material_approval
    BEFORE UPDATE ON material_specs
    FOR EACH ROW
    EXECUTE FUNCTION handle_material_approval();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS for material_specs
ALTER TABLE material_specs ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can view material specs for projects they have access to
CREATE POLICY "Users can view material specs" ON material_specs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = material_specs.project_id
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

-- Users can create material specs for projects they manage
CREATE POLICY "Project managers can create material specs" ON material_specs
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

-- Users can update material specs for projects they manage
CREATE POLICY "Project managers can update material specs" ON material_specs
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = material_specs.project_id
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

-- Users can delete material specs for projects they manage (owner role only)
CREATE POLICY "Project owners can delete material specs" ON material_specs
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = material_specs.project_id
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

-- Enable RLS for scope_material_links
ALTER TABLE scope_material_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scope_material_links - Users can view links for projects they have access to
CREATE POLICY "Users can view scope material links" ON scope_material_links
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM scope_items si
            JOIN projects p ON si.project_id = p.id
            WHERE si.id = scope_material_links.scope_item_id
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

-- Users can create scope material links for projects they manage
CREATE POLICY "Project managers can create scope material links" ON scope_material_links
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM scope_items si
            JOIN projects p ON si.project_id = p.id
            WHERE si.id = scope_item_id
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

-- Users can update scope material links for projects they manage
CREATE POLICY "Project managers can update scope material links" ON scope_material_links
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM scope_items si
            JOIN projects p ON si.project_id = p.id
            WHERE si.id = scope_material_links.scope_item_id
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

-- Users can delete scope material links for projects they manage (owner role only)
CREATE POLICY "Project owners can delete scope material links" ON scope_material_links
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM scope_items si
            JOIN projects p ON si.project_id = p.id
            WHERE si.id = scope_material_links.scope_item_id
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

COMMENT ON TABLE material_specs IS 'Material specifications with approval workflow for project materials';
COMMENT ON COLUMN material_specs.id IS 'Unique identifier for the material specification';
COMMENT ON COLUMN material_specs.project_id IS 'Reference to the associated project';
COMMENT ON COLUMN material_specs.supplier_id IS 'Reference to the supplier of this material';
COMMENT ON COLUMN material_specs.name IS 'Name of the material (e.g., "Rebar #4", "Concrete Mix")';
COMMENT ON COLUMN material_specs.description IS 'Detailed description of the material';
COMMENT ON COLUMN material_specs.category IS 'Material category (e.g., "Steel", "Concrete", "Electrical")';
COMMENT ON COLUMN material_specs.subcategory IS 'Material subcategory for more specific classification';
COMMENT ON COLUMN material_specs.brand IS 'Brand name of the material';
COMMENT ON COLUMN material_specs.model IS 'Model number or specification code';
COMMENT ON COLUMN material_specs.specifications IS 'Technical specifications stored as JSON';
COMMENT ON COLUMN material_specs.unit_of_measure IS 'Unit of measurement (e.g., "kg", "m", "pieces")';
COMMENT ON COLUMN material_specs.estimated_cost IS 'Estimated cost per unit';
COMMENT ON COLUMN material_specs.actual_cost IS 'Actual cost per unit after procurement';
COMMENT ON COLUMN material_specs.quantity_required IS 'Total quantity required for the project';
COMMENT ON COLUMN material_specs.quantity_available IS 'Quantity currently available in stock';
COMMENT ON COLUMN material_specs.minimum_stock_level IS 'Minimum stock level to maintain';
COMMENT ON COLUMN material_specs.status IS 'Approval status of the material specification';
COMMENT ON COLUMN material_specs.priority IS 'Priority level for approval and procurement';
COMMENT ON COLUMN material_specs.approval_notes IS 'Notes added during approval process';
COMMENT ON COLUMN material_specs.approved_by IS 'User who approved the material specification';
COMMENT ON COLUMN material_specs.approved_at IS 'Timestamp when material was approved';
COMMENT ON COLUMN material_specs.rejected_by IS 'User who rejected the material specification';
COMMENT ON COLUMN material_specs.rejected_at IS 'Timestamp when material was rejected';
COMMENT ON COLUMN material_specs.rejection_reason IS 'Reason for rejection';
COMMENT ON COLUMN material_specs.substitution_notes IS 'Notes about material substitution requirements';
COMMENT ON COLUMN material_specs.lead_time_days IS 'Expected lead time in days for delivery';
COMMENT ON COLUMN material_specs.delivery_date IS 'Expected or actual delivery date';
COMMENT ON COLUMN material_specs.created_by IS 'User who created the material specification';
COMMENT ON COLUMN material_specs.created_at IS 'Timestamp when material specification was created';
COMMENT ON COLUMN material_specs.updated_at IS 'Timestamp when material specification was last updated';

COMMENT ON TABLE scope_material_links IS 'Links between scope items and material specifications';
COMMENT ON COLUMN scope_material_links.id IS 'Unique identifier for the link';
COMMENT ON COLUMN scope_material_links.scope_item_id IS 'Reference to the scope item';
COMMENT ON COLUMN scope_material_links.material_spec_id IS 'Reference to the material specification';
COMMENT ON COLUMN scope_material_links.quantity_needed IS 'Quantity of this material needed for the scope item';
COMMENT ON COLUMN scope_material_links.notes IS 'Additional notes about the material usage for this scope item';
COMMENT ON COLUMN scope_material_links.created_at IS 'Timestamp when link was created';
COMMENT ON COLUMN scope_material_links.updated_at IS 'Timestamp when link was last updated';
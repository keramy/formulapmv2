-- Formula PM 2.0 Purchase Department Workflow Migration
-- Created: 2025-07-03
-- Purpose: Complete Purchase Department Workflow system implementation

-- ============================================================================
-- PURCHASE DEPARTMENT WORKFLOW ENUMS
-- ============================================================================

-- Urgency levels for purchase requests
CREATE TYPE urgency_level AS ENUM ('low', 'normal', 'high', 'emergency');

-- Purchase request status flow
CREATE TYPE request_status AS ENUM ('draft', 'pending_approval', 'approved', 'rejected', 'cancelled');

-- Purchase order status flow
CREATE TYPE po_status AS ENUM ('draft', 'sent', 'confirmed', 'delivered', 'completed', 'cancelled');

-- Approval workflow status
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected', 'delegated');

-- Delivery confirmation status
CREATE TYPE delivery_status AS ENUM ('pending', 'partial', 'completed', 'damaged', 'rejected');

-- ============================================================================
-- VENDORS TABLE (Enhanced from existing suppliers)
-- ============================================================================

CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(200) NOT NULL,
  contact_person VARCHAR(100),
  email VARCHAR(100),
  phone VARCHAR(20),
  address TEXT,
  payment_terms VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  performance_rating DECIMAL(3,2) DEFAULT 0.00,
  specializations TEXT[],
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PURCHASE REQUESTS TABLE
-- ============================================================================

CREATE TABLE purchase_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES user_profiles(id),
  request_number VARCHAR(50) UNIQUE NOT NULL,
  item_description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
  unit_of_measure VARCHAR(20) NOT NULL,
  estimated_cost DECIMAL(10,2),
  required_date DATE NOT NULL,
  urgency_level urgency_level NOT NULL DEFAULT 'normal',
  justification TEXT,
  status request_status NOT NULL DEFAULT 'draft',
  
  -- Budget tracking
  budget_code VARCHAR(50),
  cost_center VARCHAR(50),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT positive_quantity CHECK (quantity > 0),
  CONSTRAINT positive_estimated_cost CHECK (estimated_cost >= 0 OR estimated_cost IS NULL),
  CONSTRAINT future_required_date CHECK (required_date >= CURRENT_DATE)
);

-- ============================================================================
-- PURCHASE ORDERS TABLE
-- ============================================================================

CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_request_id UUID NOT NULL REFERENCES purchase_requests(id),
  po_number VARCHAR(50) UNIQUE NOT NULL,
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
  po_date DATE NOT NULL,
  expected_delivery_date DATE,
  status po_status NOT NULL DEFAULT 'draft',
  terms_conditions TEXT,
  
  -- Communication tracking
  email_sent_at TIMESTAMPTZ,
  phone_confirmed_at TIMESTAMPTZ,
  phone_confirmed_by UUID REFERENCES user_profiles(id),
  
  -- Created by
  created_by UUID NOT NULL REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT positive_total_amount CHECK (total_amount >= 0),
  CONSTRAINT future_delivery_date CHECK (expected_delivery_date >= po_date OR expected_delivery_date IS NULL)
);

-- ============================================================================
-- VENDOR RATINGS TABLE
-- ============================================================================

CREATE TABLE vendor_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  purchase_order_id UUID REFERENCES purchase_orders(id),
  rater_id UUID NOT NULL REFERENCES user_profiles(id),
  quality_score INTEGER NOT NULL CHECK (quality_score >= 1 AND quality_score <= 5),
  delivery_score INTEGER NOT NULL CHECK (delivery_score >= 1 AND delivery_score <= 5),
  communication_score INTEGER NOT NULL CHECK (communication_score >= 1 AND communication_score <= 5),
  overall_score INTEGER NOT NULL CHECK (overall_score >= 1 AND overall_score <= 5),
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(vendor_id, project_id, purchase_order_id),
  CONSTRAINT valid_scores CHECK (
    quality_score BETWEEN 1 AND 5 AND
    delivery_score BETWEEN 1 AND 5 AND
    communication_score BETWEEN 1 AND 5 AND
    overall_score BETWEEN 1 AND 5
  )
);

-- ============================================================================
-- APPROVAL WORKFLOWS TABLE
-- ============================================================================

CREATE TABLE approval_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_request_id UUID NOT NULL REFERENCES purchase_requests(id) ON DELETE CASCADE,
  approver_role user_role NOT NULL,
  approver_id UUID REFERENCES user_profiles(id),
  approval_status approval_status NOT NULL DEFAULT 'pending',
  approval_date TIMESTAMPTZ,
  comments TEXT,
  sequence_order INTEGER NOT NULL DEFAULT 1,
  
  -- Delegation support
  delegated_to UUID REFERENCES user_profiles(id),
  delegated_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(purchase_request_id, approver_role, sequence_order),
  CONSTRAINT approval_date_when_approved CHECK (
    (approval_status = 'approved' AND approval_date IS NOT NULL) OR
    (approval_status != 'approved')
  )
);

-- ============================================================================
-- DELIVERY CONFIRMATIONS TABLE
-- ============================================================================

CREATE TABLE delivery_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  confirmed_by UUID NOT NULL REFERENCES user_profiles(id),
  delivery_date DATE NOT NULL,
  quantity_received DECIMAL(10,2) NOT NULL CHECK (quantity_received >= 0),
  quantity_ordered DECIMAL(10,2) NOT NULL CHECK (quantity_ordered > 0),
  condition_notes TEXT,
  photos TEXT[], -- Array of photo URLs
  status delivery_status NOT NULL DEFAULT 'pending',
  
  -- Quality assessment
  quality_assessment TEXT,
  damage_reported BOOLEAN DEFAULT false,
  rejection_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT positive_quantities CHECK (quantity_received >= 0 AND quantity_ordered > 0),
  CONSTRAINT delivery_date_not_future CHECK (delivery_date <= CURRENT_DATE),
  CONSTRAINT rejection_reason_when_rejected CHECK (
    (status = 'rejected' AND rejection_reason IS NOT NULL) OR
    (status != 'rejected')
  )
);

-- ============================================================================
-- PERFORMANCE OPTIMIZATION INDEXES
-- ============================================================================

-- Vendors indexes
CREATE INDEX idx_vendors_active ON vendors(is_active);
CREATE INDEX idx_vendors_rating ON vendors(performance_rating);
CREATE INDEX idx_vendors_specializations ON vendors USING gin(specializations);
CREATE INDEX idx_vendors_created_by ON vendors(created_by);

-- Purchase requests indexes
CREATE INDEX idx_purchase_requests_project ON purchase_requests(project_id);
CREATE INDEX idx_purchase_requests_requester ON purchase_requests(requester_id);
CREATE INDEX idx_purchase_requests_status ON purchase_requests(status);
CREATE INDEX idx_purchase_requests_urgency ON purchase_requests(urgency_level);
CREATE INDEX idx_purchase_requests_required_date ON purchase_requests(required_date);
CREATE INDEX idx_purchase_requests_number ON purchase_requests(request_number);
CREATE INDEX idx_purchase_requests_created_at ON purchase_requests(created_at);

-- Purchase orders indexes
CREATE INDEX idx_purchase_orders_request ON purchase_orders(purchase_request_id);
CREATE INDEX idx_purchase_orders_vendor ON purchase_orders(vendor_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_purchase_orders_po_date ON purchase_orders(po_date);
CREATE INDEX idx_purchase_orders_delivery_date ON purchase_orders(expected_delivery_date);
CREATE INDEX idx_purchase_orders_number ON purchase_orders(po_number);
CREATE INDEX idx_purchase_orders_created_by ON purchase_orders(created_by);

-- Vendor ratings indexes
CREATE INDEX idx_vendor_ratings_vendor ON vendor_ratings(vendor_id);
CREATE INDEX idx_vendor_ratings_project ON vendor_ratings(project_id);
CREATE INDEX idx_vendor_ratings_rater ON vendor_ratings(rater_id);
CREATE INDEX idx_vendor_ratings_overall_score ON vendor_ratings(overall_score);

-- Approval workflows indexes
CREATE INDEX idx_approval_workflows_request ON approval_workflows(purchase_request_id);
CREATE INDEX idx_approval_workflows_approver ON approval_workflows(approver_id);
CREATE INDEX idx_approval_workflows_status ON approval_workflows(approval_status);
CREATE INDEX idx_approval_workflows_role ON approval_workflows(approver_role);
CREATE INDEX idx_approval_workflows_sequence ON approval_workflows(purchase_request_id, sequence_order);

-- Delivery confirmations indexes
CREATE INDEX idx_delivery_confirmations_order ON delivery_confirmations(purchase_order_id);
CREATE INDEX idx_delivery_confirmations_confirmed_by ON delivery_confirmations(confirmed_by);
CREATE INDEX idx_delivery_confirmations_status ON delivery_confirmations(status);
CREATE INDEX idx_delivery_confirmations_delivery_date ON delivery_confirmations(delivery_date);

-- ============================================================================
-- AUTO-UPDATE TRIGGERS
-- ============================================================================

-- Apply auto-update triggers to new tables
CREATE TRIGGER update_vendors_updated_at 
  BEFORE UPDATE ON vendors 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_purchase_requests_updated_at 
  BEFORE UPDATE ON purchase_requests 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at 
  BEFORE UPDATE ON purchase_orders 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================================
-- PURCHASE DEPARTMENT FUNCTIONS
-- ============================================================================

-- Function to generate purchase request number
CREATE OR REPLACE FUNCTION generate_purchase_request_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.request_number IS NULL THEN
    NEW.request_number = 'PR-' || TO_CHAR(NOW(), 'YYYY') || '-' || 
                         LPAD(NEXTVAL('purchase_request_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate purchase order number
CREATE OR REPLACE FUNCTION generate_purchase_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.po_number IS NULL THEN
    NEW.po_number = 'PO-' || TO_CHAR(NOW(), 'YYYY') || '-' || 
                    LPAD(NEXTVAL('purchase_order_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update vendor performance rating
CREATE OR REPLACE FUNCTION update_vendor_performance_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE vendors 
  SET performance_rating = (
    SELECT AVG(overall_score) 
    FROM vendor_ratings 
    WHERE vendor_id = NEW.vendor_id
  )
  WHERE id = NEW.vendor_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to validate approval workflow
CREATE OR REPLACE FUNCTION validate_approval_workflow()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if approver has the correct role
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = NEW.approver_id 
    AND role = NEW.approver_role
  ) THEN
    RAISE EXCEPTION 'Approver does not have the required role: %', NEW.approver_role;
  END IF;
  
  -- Set approval date when status is approved
  IF NEW.approval_status = 'approved' AND NEW.approval_date IS NULL THEN
    NEW.approval_date = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update purchase request status based on approvals
CREATE OR REPLACE FUNCTION update_purchase_request_status()
RETURNS TRIGGER AS $$
DECLARE
  total_approvals INTEGER;
  approved_count INTEGER;
  rejected_count INTEGER;
BEGIN
  -- Count approvals for this purchase request
  SELECT 
    COUNT(*),
    COUNT(CASE WHEN approval_status = 'approved' THEN 1 END),
    COUNT(CASE WHEN approval_status = 'rejected' THEN 1 END)
  INTO total_approvals, approved_count, rejected_count
  FROM approval_workflows
  WHERE purchase_request_id = NEW.purchase_request_id;
  
  -- Update purchase request status
  IF rejected_count > 0 THEN
    UPDATE purchase_requests 
    SET status = 'rejected' 
    WHERE id = NEW.purchase_request_id;
  ELSIF approved_count = total_approvals THEN
    UPDATE purchase_requests 
    SET status = 'approved' 
    WHERE id = NEW.purchase_request_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SEQUENCES FOR AUTO-NUMBERING
-- ============================================================================

CREATE SEQUENCE purchase_request_seq START 1;
CREATE SEQUENCE purchase_order_seq START 1;

-- ============================================================================
-- TRIGGER IMPLEMENTATIONS
-- ============================================================================

-- Auto-generate purchase request numbers
CREATE TRIGGER auto_generate_purchase_request_number
  BEFORE INSERT ON purchase_requests
  FOR EACH ROW EXECUTE PROCEDURE generate_purchase_request_number();

-- Auto-generate purchase order numbers
CREATE TRIGGER auto_generate_purchase_order_number
  BEFORE INSERT ON purchase_orders
  FOR EACH ROW EXECUTE PROCEDURE generate_purchase_order_number();

-- Update vendor performance rating when new rating is added
CREATE TRIGGER update_vendor_rating_trigger
  AFTER INSERT ON vendor_ratings
  FOR EACH ROW EXECUTE PROCEDURE update_vendor_performance_rating();

-- Validate approval workflow
CREATE TRIGGER validate_approval_workflow_trigger
  BEFORE INSERT OR UPDATE ON approval_workflows
  FOR EACH ROW EXECUTE PROCEDURE validate_approval_workflow();

-- Update purchase request status based on approvals
CREATE TRIGGER update_purchase_request_status_trigger
  AFTER INSERT OR UPDATE ON approval_workflows
  FOR EACH ROW EXECUTE PROCEDURE update_purchase_request_status();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

-- Table comments
COMMENT ON TABLE vendors IS 'Vendor database with performance tracking and specializations';
COMMENT ON TABLE purchase_requests IS 'Purchase requests with approval workflow and budget tracking';
COMMENT ON TABLE purchase_orders IS 'Purchase orders with vendor communication tracking';
COMMENT ON TABLE vendor_ratings IS 'Vendor performance ratings by project managers';
COMMENT ON TABLE approval_workflows IS 'Multi-step approval workflow for purchase requests';
COMMENT ON TABLE delivery_confirmations IS 'Delivery confirmation with photo documentation';

-- Critical column comments
COMMENT ON COLUMN purchase_requests.request_number IS 'Auto-generated unique request number (PR-YYYY-NNNNN)';
COMMENT ON COLUMN purchase_requests.urgency_level IS 'Request urgency affecting approval workflow';
COMMENT ON COLUMN purchase_orders.po_number IS 'Auto-generated unique purchase order number (PO-YYYY-NNNNN)';
COMMENT ON COLUMN vendor_ratings.overall_score IS 'Overall vendor performance score (1-5)';
COMMENT ON COLUMN approval_workflows.sequence_order IS 'Order of approval in workflow chain';
COMMENT ON COLUMN delivery_confirmations.photos IS 'Array of photo URLs for delivery documentation';

-- Migration completion marker
INSERT INTO public.migrations (version, name, executed_at) 
VALUES ('20250703000007', 'purchase_department_workflow', NOW())
ON CONFLICT (version) DO NOTHING;
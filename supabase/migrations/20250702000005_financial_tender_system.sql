-- Formula PM 2.0 Financial and Tender Management System
-- Created: 2025-07-02
-- Purpose: Complete financial tracking, tender management, and procurement workflows

-- ============================================================================
-- FINANCIAL ENUMS
-- ============================================================================

-- Payment status types
CREATE TYPE payment_status AS ENUM (
  'pending',
  'approved',
  'processing',
  'completed',
  'cancelled',
  'overdue'
);

-- Payment method types
CREATE TYPE payment_method AS ENUM (
  'bank_transfer',
  'check',
  'cash',
  'credit_card',
  'letter_of_credit',
  'other'
);

-- Invoice status types
CREATE TYPE invoice_status AS ENUM (
  'draft',
  'sent',
  'viewed',
  'approved',
  'paid',
  'overdue',
  'disputed',
  'cancelled'
);

-- Tender status types
CREATE TYPE tender_status AS ENUM (
  'preparation',
  'published',
  'bidding_open',
  'bidding_closed',
  'evaluation',
  'awarded',
  'cancelled',
  'completed'
);

-- ============================================================================
-- FINANCIAL TABLES
-- ============================================================================

-- Purchase orders table
CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number TEXT UNIQUE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id),
  scope_item_id UUID REFERENCES scope_items(id),
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price * tax_rate / 100) STORED,
  final_amount DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price * (1 + tax_rate / 100)) STORED,
  delivery_date DATE,
  payment_terms TEXT,
  notes TEXT,
  status payment_status DEFAULT 'pending',
  created_by UUID REFERENCES user_profiles(id),
  approved_by UUID REFERENCES user_profiles(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices table
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id),
  supplier_id UUID REFERENCES suppliers(id),
  purchase_order_id UUID REFERENCES purchase_orders(id),
  invoice_type TEXT CHECK (invoice_type IN ('client', 'supplier')),
  description TEXT NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) GENERATED ALWAYS AS (subtotal * tax_rate / 100) STORED,
  total_amount DECIMAL(12,2) GENERATED ALWAYS AS (subtotal * (1 + tax_rate / 100)) STORED,
  currency TEXT DEFAULT 'USD',
  due_date DATE NOT NULL,
  paid_amount DECIMAL(12,2) DEFAULT 0,
  status invoice_status DEFAULT 'draft',
  payment_method payment_method,
  payment_reference TEXT,
  notes TEXT,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice line items
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  scope_item_id UUID REFERENCES scope_items(id),
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_number TEXT UNIQUE NOT NULL,
  invoice_id UUID REFERENCES invoices(id),
  purchase_order_id UUID REFERENCES purchase_orders(id),
  project_id UUID REFERENCES projects(id),
  amount DECIMAL(12,2) NOT NULL,
  payment_method payment_method NOT NULL,
  payment_date DATE NOT NULL,
  reference_number TEXT,
  bank_name TEXT,
  account_number TEXT,
  notes TEXT,
  status payment_status DEFAULT 'pending',
  processed_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budget tracking table
CREATE TABLE project_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  category scope_category NOT NULL,
  allocated_amount DECIMAL(12,2) NOT NULL,
  spent_amount DECIMAL(12,2) DEFAULT 0,
  committed_amount DECIMAL(12,2) DEFAULT 0,
  remaining_amount DECIMAL(12,2) GENERATED ALWAYS AS (allocated_amount - spent_amount - committed_amount) STORED,
  notes TEXT,
  created_by UUID REFERENCES user_profiles(id),
  approved_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, category)
);

-- ============================================================================
-- TENDER MANAGEMENT TABLES
-- ============================================================================

-- Tenders table
CREATE TABLE tenders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_number TEXT UNIQUE NOT NULL,
  project_id UUID REFERENCES projects(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  scope_of_work TEXT NOT NULL,
  estimated_value DECIMAL(12,2),
  submission_deadline TIMESTAMPTZ NOT NULL,
  opening_date TIMESTAMPTZ,
  evaluation_criteria JSONB DEFAULT '{}',
  required_documents JSONB DEFAULT '[]',
  terms_conditions TEXT,
  status tender_status DEFAULT 'preparation',
  is_public BOOLEAN DEFAULT false,
  created_by UUID REFERENCES user_profiles(id),
  published_at TIMESTAMPTZ,
  awarded_to UUID REFERENCES suppliers(id),
  awarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tender items (BOQ for tender)
CREATE TABLE tender_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE,
  item_no INTEGER NOT NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_of_measure TEXT NOT NULL,
  specifications TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tender_id, item_no)
);

-- Tender submissions/bids
CREATE TABLE tender_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id),
  submission_date TIMESTAMPTZ DEFAULT NOW(),
  total_amount DECIMAL(12,2) NOT NULL,
  validity_period INTEGER, -- days
  delivery_period INTEGER, -- days
  payment_terms TEXT,
  technical_proposal TEXT,
  commercial_proposal TEXT,
  documents JSONB DEFAULT '[]',
  evaluation_score DECIMAL(5,2),
  evaluation_notes TEXT,
  is_qualified BOOLEAN,
  is_selected BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tender_id, supplier_id)
);

-- Tender submission items (supplier's BOQ response)
CREATE TABLE tender_submission_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES tender_submissions(id) ON DELETE CASCADE,
  tender_item_id UUID REFERENCES tender_items(id),
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(12,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tender evaluation criteria
CREATE TABLE tender_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES tender_submissions(id) ON DELETE CASCADE,
  evaluator_id UUID REFERENCES user_profiles(id),
  technical_score DECIMAL(5,2),
  commercial_score DECIMAL(5,2),
  compliance_score DECIMAL(5,2),
  overall_score DECIMAL(5,2),
  recommendation TEXT,
  notes TEXT,
  evaluated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(submission_id, evaluator_id)
);

-- ============================================================================
-- FINANCIAL REPORTS VIEWS
-- ============================================================================

-- Project financial summary view
CREATE OR REPLACE VIEW project_financial_summary AS
SELECT 
  p.id as project_id,
  p.name as project_name,
  p.budget as total_budget,
  p.actual_cost as actual_cost,
  COALESCE(SUM(pb.allocated_amount), 0) as allocated_budget,
  COALESCE(SUM(pb.spent_amount), 0) as total_spent,
  COALESCE(SUM(pb.committed_amount), 0) as total_committed,
  COALESCE(SUM(pb.remaining_amount), 0) as total_remaining,
  COUNT(DISTINCT po.id) as purchase_orders_count,
  COUNT(DISTINCT i.id) as invoices_count,
  COALESCE(SUM(CASE WHEN i.invoice_type = 'client' THEN i.total_amount ELSE 0 END), 0) as total_receivables,
  COALESCE(SUM(CASE WHEN i.invoice_type = 'supplier' THEN i.total_amount ELSE 0 END), 0) as total_payables
FROM projects p
LEFT JOIN project_budgets pb ON pb.project_id = p.id
LEFT JOIN purchase_orders po ON po.project_id = p.id
LEFT JOIN invoices i ON i.project_id = p.id
GROUP BY p.id, p.name, p.budget, p.actual_cost;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Purchase orders indexes
CREATE INDEX idx_purchase_orders_project ON purchase_orders(project_id);
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_scope ON purchase_orders(scope_item_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_purchase_orders_number ON purchase_orders(po_number);

-- Invoices indexes
CREATE INDEX idx_invoices_project ON invoices(project_id);
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_invoices_supplier ON invoices(supplier_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);

-- Invoice items indexes
CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_scope ON invoice_items(scope_item_id);

-- Payments indexes
CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_po ON payments(purchase_order_id);
CREATE INDEX idx_payments_project ON payments(project_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_date ON payments(payment_date);

-- Budget indexes
CREATE INDEX idx_project_budgets_project ON project_budgets(project_id);
CREATE INDEX idx_project_budgets_category ON project_budgets(category);

-- Tender indexes
CREATE INDEX idx_tenders_project ON tenders(project_id);
CREATE INDEX idx_tenders_status ON tenders(status);
CREATE INDEX idx_tenders_deadline ON tenders(submission_deadline);
CREATE INDEX idx_tenders_number ON tenders(tender_number);

-- Tender submission indexes
CREATE INDEX idx_tender_submissions_tender ON tender_submissions(tender_id);
CREATE INDEX idx_tender_submissions_supplier ON tender_submissions(supplier_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Calculate total_price for tender submission items
CREATE OR REPLACE FUNCTION calculate_tender_submission_item_total()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate total_price based on tender_item quantity and unit_price
  SELECT quantity * NEW.unit_price
  INTO NEW.total_price
  FROM tender_items
  WHERE id = NEW.tender_item_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_tender_submission_item_total
  BEFORE INSERT OR UPDATE ON tender_submission_items
  FOR EACH ROW EXECUTE PROCEDURE calculate_tender_submission_item_total();

-- Auto-generate PO numbers
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.po_number IS NULL THEN
    NEW.po_number := 'PO-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || 
                     LPAD((SELECT COUNT(*) + 1 FROM purchase_orders 
                           WHERE created_at >= DATE_TRUNC('month', NOW()))::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_generate_po_number
  BEFORE INSERT ON purchase_orders
  FOR EACH ROW EXECUTE PROCEDURE generate_po_number();

-- Auto-generate invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL THEN
    NEW.invoice_number := CASE 
      WHEN NEW.invoice_type = 'client' THEN 'INV-C-'
      ELSE 'INV-S-'
    END || TO_CHAR(NOW(), 'YYYYMM') || '-' || 
    LPAD((SELECT COUNT(*) + 1 FROM invoices 
          WHERE created_at >= DATE_TRUNC('month', NOW())
          AND invoice_type = NEW.invoice_type)::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_generate_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW EXECUTE PROCEDURE generate_invoice_number();

-- Auto-generate payment numbers
CREATE OR REPLACE FUNCTION generate_payment_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_number IS NULL THEN
    NEW.payment_number := 'PAY-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || 
                          LPAD((SELECT COUNT(*) + 1 FROM payments 
                                WHERE created_at >= DATE_TRUNC('month', NOW()))::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_generate_payment_number
  BEFORE INSERT ON payments
  FOR EACH ROW EXECUTE PROCEDURE generate_payment_number();

-- Auto-generate tender numbers
CREATE OR REPLACE FUNCTION generate_tender_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tender_number IS NULL THEN
    NEW.tender_number := 'TND-' || TO_CHAR(NOW(), 'YYYY') || '-' || 
                         LPAD((SELECT COUNT(*) + 1 FROM tenders 
                               WHERE created_at >= DATE_TRUNC('year', NOW()))::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_generate_tender_number
  BEFORE INSERT ON tenders
  FOR EACH ROW EXECUTE PROCEDURE generate_tender_number();

-- Update project actual cost when payments are made
CREATE OR REPLACE FUNCTION update_project_actual_cost()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.invoice_id IS NOT NULL THEN
    UPDATE projects p
    SET actual_cost = actual_cost + NEW.amount
    FROM invoices i
    WHERE i.id = NEW.invoice_id
    AND i.invoice_type = 'supplier'
    AND p.id = i.project_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_cost
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW EXECUTE PROCEDURE update_project_actual_cost();

-- Apply update triggers to financial tables
CREATE TRIGGER update_purchase_orders_updated_at 
  BEFORE UPDATE ON purchase_orders 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at 
  BEFORE UPDATE ON invoices 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_payments_updated_at 
  BEFORE UPDATE ON payments 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_project_budgets_updated_at 
  BEFORE UPDATE ON project_budgets 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_tenders_updated_at 
  BEFORE UPDATE ON tenders 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_tender_submissions_updated_at 
  BEFORE UPDATE ON tender_submissions 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on financial tables
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tender_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tender_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tender_submission_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tender_evaluations ENABLE ROW LEVEL SECURITY;

-- Purchase orders policies
CREATE POLICY "Management PO access" ON purchase_orders
  FOR ALL USING (is_management_role());

CREATE POLICY "Purchase team PO access" ON purchase_orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('purchase_director', 'purchase_specialist')
    )
  );

CREATE POLICY "PM PO read access" ON purchase_orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = purchase_orders.project_id
      AND p.project_manager_id = auth.uid()
    )
  );

-- Invoices policies
CREATE POLICY "Management invoice access" ON invoices
  FOR ALL USING (is_management_role());

CREATE POLICY "Finance team invoice access" ON invoices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('purchase_director', 'purchase_specialist', 'technical_engineer')
    )
  );

CREATE POLICY "PM invoice read access" ON invoices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = invoices.project_id
      AND p.project_manager_id = auth.uid()
    )
  );

CREATE POLICY "Client invoice access" ON invoices
  FOR SELECT USING (
    invoice_type = 'client' AND
    EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = invoices.client_id
      AND c.user_id = auth.uid()
    )
  );

-- Invoice items follow invoice access
CREATE POLICY "Invoice items access follows invoice" ON invoice_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM invoices i
      WHERE i.id = invoice_items.invoice_id
      AND (
        is_management_role() OR
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE id = auth.uid()
          AND role IN ('purchase_director', 'purchase_specialist', 'technical_engineer')
        ) OR
        EXISTS (
          SELECT 1 FROM projects p
          WHERE p.id = i.project_id
          AND p.project_manager_id = auth.uid()
        )
      )
    )
  );

-- Payments policies
CREATE POLICY "Management payment access" ON payments
  FOR ALL USING (is_management_role());

CREATE POLICY "Finance payment access" ON payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('purchase_director', 'purchase_specialist')
    )
  );

-- Budget policies
CREATE POLICY "Management budget access" ON project_budgets
  FOR ALL USING (is_management_role());

CREATE POLICY "PM budget read access" ON project_budgets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_budgets.project_id
      AND p.project_manager_id = auth.uid()
    )
  );

CREATE POLICY "Technical budget access" ON project_budgets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('technical_engineer', 'technical_director')
    )
  );

-- Tender policies
CREATE POLICY "Management tender access" ON tenders
  FOR ALL USING (is_management_role());

CREATE POLICY "Technical tender access" ON tenders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('technical_director', 'technical_engineer')
    )
  );

CREATE POLICY "Public tender read" ON tenders
  FOR SELECT USING (is_public = true AND status IN ('published', 'bidding_open'));

-- Tender items follow tender access
CREATE POLICY "Tender items access follows tender" ON tender_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tenders t
      WHERE t.id = tender_items.tender_id
      AND (
        is_management_role() OR
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE id = auth.uid()
          AND role IN ('technical_director', 'technical_engineer')
        ) OR
        (t.is_public = true AND t.status IN ('published', 'bidding_open'))
      )
    )
  );

-- Tender submissions policies
CREATE POLICY "Management submission access" ON tender_submissions
  FOR ALL USING (is_management_role());

CREATE POLICY "Technical submission access" ON tender_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('technical_director', 'technical_engineer')
    )
  );

CREATE POLICY "Supplier own submission" ON tender_submissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM suppliers s
      WHERE s.id = tender_submissions.supplier_id
      AND s.created_by = auth.uid()
    )
  );

-- Insert migration record
INSERT INTO public.migrations (version, name, executed_at) 
VALUES ('20250702000005', 'financial_tender_system', NOW())
ON CONFLICT (version) DO NOTHING;
-- Add missing columns to existing suppliers table
ALTER TABLE suppliers 
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS total_projects INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_payments DECIMAL(15,2) DEFAULT 0.0;

-- Rename columns to match new schema (only if needed)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'specializations') THEN
    ALTER TABLE suppliers RENAME COLUMN specializations TO specialties;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'performance_rating') THEN
    ALTER TABLE suppliers RENAME COLUMN performance_rating TO rating;
  END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_specialties ON suppliers USING GIN(specialties);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);

-- Add RLS policies
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view active suppliers
CREATE POLICY "Users can view active suppliers" ON suppliers
  FOR SELECT USING (status = 'active');

-- Policy: Only project managers and admins can manage suppliers
CREATE POLICY "Project managers can manage suppliers" ON suppliers
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM user_profiles 
      WHERE role IN ('company_owner', 'general_manager', 'deputy_general_manager', 'project_manager')
    )
  );

-- Add supplier assignment to scope items (if scope_items table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'scope_items') THEN
    -- Add supplier_id column to scope_items if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'scope_items' AND column_name = 'supplier_id') THEN
      ALTER TABLE scope_items ADD COLUMN supplier_id UUID REFERENCES suppliers(id);
      CREATE INDEX IF NOT EXISTS idx_scope_items_supplier_id ON scope_items(supplier_id);
    END IF;
  END IF;
END $$;

-- Update function for suppliers
CREATE OR REPLACE FUNCTION update_suppliers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS suppliers_updated_at_trigger ON suppliers;
CREATE TRIGGER suppliers_updated_at_trigger
  BEFORE UPDATE ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_suppliers_updated_at();
-- =====================================================
-- Add Financial Fields to Scope Items Table
-- V3 Requirement: Track initial_cost, sell_price, actual_cost
-- =====================================================

-- Add the financial fields to scope_items table
ALTER TABLE scope_items 
  ADD COLUMN IF NOT EXISTS initial_cost DECIMAL(12,2) DEFAULT 0 CHECK (initial_cost >= 0),
  ADD COLUMN IF NOT EXISTS sell_price DECIMAL(12,2) DEFAULT 0 CHECK (sell_price >= 0),
  ADD COLUMN IF NOT EXISTS actual_cost DECIMAL(12,2) CHECK (actual_cost >= 0);

-- Add a profit margin calculation as a generated column
ALTER TABLE scope_items 
  ADD COLUMN IF NOT EXISTS profit_margin DECIMAL(12,2) 
  GENERATED ALWAYS AS (sell_price - initial_cost) STORED;

-- Add a profit percentage calculation as a generated column
ALTER TABLE scope_items 
  ADD COLUMN IF NOT EXISTS profit_percentage DECIMAL(5,2) 
  GENERATED ALWAYS AS (
    CASE 
      WHEN initial_cost > 0 THEN ((sell_price - initial_cost) / initial_cost * 100)
      ELSE 0 
    END
  ) STORED;

-- Add group progress percentage for manual tracking
ALTER TABLE scope_items 
  ADD COLUMN IF NOT EXISTS group_progress_percentage DECIMAL(5,2) DEFAULT 0 
  CHECK (group_progress_percentage >= 0 AND group_progress_percentage <= 100);

-- =====================================================
-- Performance Indexes for Financial Queries
-- =====================================================

-- Indexes for financial reporting and analysis
CREATE INDEX IF NOT EXISTS idx_scope_items_initial_cost ON scope_items(initial_cost);
CREATE INDEX IF NOT EXISTS idx_scope_items_sell_price ON scope_items(sell_price);
CREATE INDEX IF NOT EXISTS idx_scope_items_actual_cost ON scope_items(actual_cost);
CREATE INDEX IF NOT EXISTS idx_scope_items_profit_margin ON scope_items(profit_margin);

-- Composite indexes for financial reporting by project and category
CREATE INDEX IF NOT EXISTS idx_scope_items_project_category_financial 
  ON scope_items(project_id, category, initial_cost, sell_price, actual_cost);

-- Index for group progress tracking
CREATE INDEX IF NOT EXISTS idx_scope_items_category_progress 
  ON scope_items(category, group_progress_percentage);

-- =====================================================
-- Update Comments and Documentation
-- =====================================================

COMMENT ON COLUMN scope_items.initial_cost IS 'Estimated initial cost for budgeting (maps to estimatedCost in V3)';
COMMENT ON COLUMN scope_items.sell_price IS 'Client selling price for this scope item';
COMMENT ON COLUMN scope_items.actual_cost IS 'Actual cost incurred (optional, filled as expenses occur)';
COMMENT ON COLUMN scope_items.profit_margin IS 'Calculated profit margin (sell_price - initial_cost)';
COMMENT ON COLUMN scope_items.profit_percentage IS 'Calculated profit percentage ((sell_price - initial_cost) / initial_cost * 100)';
COMMENT ON COLUMN scope_items.group_progress_percentage IS 'Manual group-level progress tracking for categories';

-- =====================================================
-- Verification and Summary
-- =====================================================

DO $$
DECLARE
  financial_columns_count INTEGER;
  new_indexes_count INTEGER;
BEGIN
  RAISE NOTICE 'SCOPE ITEMS FINANCIAL ENHANCEMENT COMPLETE';
  RAISE NOTICE '==========================================';
  RAISE NOTICE '';
  
  -- Check financial columns were added
  SELECT COUNT(*) INTO financial_columns_count
  FROM information_schema.columns 
  WHERE table_name = 'scope_items' 
  AND column_name IN ('initial_cost', 'sell_price', 'actual_cost', 'profit_margin', 'profit_percentage', 'group_progress_percentage');
  
  RAISE NOTICE 'FINANCIAL FIELDS ADDED: %', financial_columns_count;
  
  -- Check new indexes were created
  SELECT COUNT(*) INTO new_indexes_count
  FROM pg_indexes 
  WHERE tablename = 'scope_items' 
  AND indexname LIKE '%financial%' OR indexname LIKE '%cost%' OR indexname LIKE '%progress%';
  
  RAISE NOTICE 'FINANCIAL INDEXES CREATED: %', new_indexes_count;
  RAISE NOTICE '';
  RAISE NOTICE 'NEW FINANCIAL CAPABILITIES:';
  RAISE NOTICE '  ✅ Track initial cost estimates';
  RAISE NOTICE '  ✅ Track client selling prices';
  RAISE NOTICE '  ✅ Track actual costs incurred';
  RAISE NOTICE '  ✅ Automatic profit calculations';
  RAISE NOTICE '  ✅ Manual group progress tracking';
  RAISE NOTICE '  ✅ Financial reporting optimized with indexes';
  RAISE NOTICE '';
  RAISE NOTICE 'V3 SCOPE LIST FINANCIAL REQUIREMENTS: COMPLETE';
END $$;
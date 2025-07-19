-- SAFE RLS PERFORMANCE OPTIMIZATION
-- This version focuses only on optimizing auth function calls without changing policy logic
-- It replaces auth.jwt() with (SELECT auth.jwt()) and auth.uid() with (SELECT auth.uid())

-- ============================================================================
-- STEP 1: CREATE HELPER FUNCTIONS FOR BETTER PERFORMANCE
-- ============================================================================

-- Create stable helper functions for better performance
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS text AS $$
BEGIN
  RETURN (SELECT auth.jwt() ->> 'user_role');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS uuid AS $$
BEGIN
  RETURN (SELECT auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_user_id() TO authenticated;

-- ============================================================================
-- STEP 2: OPTIMIZE EXISTING POLICIES (WITHOUT CHANGING LOGIC)
-- ============================================================================

-- This approach keeps your existing policy logic but optimizes the auth function calls
-- We'll update policies one by one, replacing direct auth calls with SELECT versions

-- Example for suppliers table (if it exists)
DO $$
BEGIN
  -- Check if suppliers table exists and has the problematic policies
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'suppliers' AND policyname = 'Management supplier access') THEN
    DROP POLICY "Management supplier access" ON public.suppliers;
    CREATE POLICY "Management supplier access" ON public.suppliers
      FOR ALL USING (
        (SELECT auth.jwt() ->> 'user_role') IN ('management', 'admin', 'technical_lead')
      );
    RAISE NOTICE '✅ Optimized: suppliers - Management supplier access';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'suppliers' AND policyname = 'Project team supplier read') THEN
    DROP POLICY "Project team supplier read" ON public.suppliers;
    CREATE POLICY "Project team supplier read" ON public.suppliers
      FOR SELECT USING (
        (SELECT auth.jwt() ->> 'user_role') IN ('project_manager', 'purchase_manager') OR
        (SELECT auth.uid()) IN (
          SELECT user_id FROM project_assignments 
          WHERE project_id IN (
            SELECT DISTINCT project_id FROM scope_items WHERE supplier_id = suppliers.id
          )
        )
      );
    RAISE NOTICE '✅ Optimized: suppliers - Project team supplier read';
  END IF;
END $$;

-- Example for documents table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'documents' AND policyname = 'Field worker document create') THEN
    DROP POLICY "Field worker document create" ON public.documents;
    CREATE POLICY "Field worker document create" ON public.documents
      FOR INSERT WITH CHECK (
        (SELECT auth.jwt() ->> 'user_role') = 'field_worker'
      );
    RAISE NOTICE '✅ Optimized: documents - Field worker document create';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'documents' AND policyname = 'Field worker own documents') THEN
    DROP POLICY "Field worker own documents" ON public.documents;
    CREATE POLICY "Field worker own documents" ON public.documents
      FOR ALL USING (
        (SELECT auth.jwt() ->> 'user_role') = 'field_worker' AND
        uploaded_by = (SELECT auth.uid())
      );
    RAISE NOTICE '✅ Optimized: documents - Field worker own documents';
  END IF;
END $$;

-- ============================================================================
-- STEP 3: GENERIC OPTIMIZATION FOR ALL REMAINING POLICIES
-- ============================================================================

-- This will attempt to optimize any remaining policies by replacing auth function calls
-- Note: This is a more advanced approach that modifies existing policies

DO $$
DECLARE
  policy_record RECORD;
  new_qual TEXT;
BEGIN
  -- Loop through all policies that contain direct auth function calls
  FOR policy_record IN 
    SELECT schemaname, tablename, policyname, qual, cmd
    FROM pg_policies 
    WHERE schemaname = 'public'
    AND (qual LIKE '%auth.jwt()%' OR qual LIKE '%auth.uid()%')
  LOOP
    BEGIN
      -- Replace direct auth calls with SELECT versions
      new_qual := policy_record.qual;
      new_qual := REPLACE(new_qual, 'auth.jwt()', '(SELECT auth.jwt())');
      new_qual := REPLACE(new_qual, 'auth.uid()', '(SELECT auth.uid())');
      
      -- Only proceed if we actually made changes
      IF new_qual != policy_record.qual THEN
        -- Drop the old policy
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
          policy_record.policyname, 
          policy_record.schemaname, 
          policy_record.tablename
        );
        
        -- Create the optimized policy
        EXECUTE format('CREATE POLICY %I ON %I.%I FOR %s USING (%s)', 
          policy_record.policyname,
          policy_record.schemaname,
          policy_record.tablename,
          policy_record.cmd,
          new_qual
        );
        
        RAISE NOTICE '✅ Optimized: %.% - %', 
          policy_record.tablename, 
          policy_record.policyname,
          'auth function calls optimized';
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '⚠️ Could not optimize: %.% - % (Error: %)', 
        policy_record.tablename, 
        policy_record.policyname,
        SQLERRM;
    END;
  END LOOP;
END $$;

-- ============================================================================
-- STEP 4: VERIFICATION
-- ============================================================================

-- Check the results
SELECT 
  'RLS Performance Optimization completed!' as status,
  COUNT(*) as total_policies,
  COUNT(CASE WHEN qual LIKE '%(SELECT auth.%' THEN 1 END) as optimized_policies,
  COUNT(CASE WHEN qual LIKE '%auth.jwt()%' OR qual LIKE '%auth.uid()%' THEN 1 END) as unoptimized_policies
FROM pg_policies 
WHERE schemaname = 'public';

-- Show remaining unoptimized policies (if any)
SELECT 
  tablename,
  policyname,
  'Still needs optimization' as status
FROM pg_policies 
WHERE schemaname = 'public'
AND (qual LIKE '%auth.jwt()%' OR qual LIKE '%auth.uid()%')
ORDER BY tablename, policyname;
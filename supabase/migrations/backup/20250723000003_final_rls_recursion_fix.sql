-- Final RLS Recursion Fix
-- Removes the remaining problematic policies causing infinite recursion

-- Drop the problematic policies that still use direct auth.uid() calls
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;

-- Verify no more problematic policies exist
DO $$
DECLARE
    policy_rec RECORD;
    problem_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Checking for remaining problematic RLS policies...';
    
    FOR policy_rec IN 
        SELECT policyname, qual 
        FROM pg_policies 
        WHERE tablename = 'user_profiles' 
          AND schemaname = 'public'
          AND qual LIKE '%auth.uid()%'
    LOOP
        RAISE NOTICE 'WARNING: Problematic policy found: % - %', policy_rec.policyname, policy_rec.qual;
        problem_count := problem_count + 1;
    END LOOP;
    
    IF problem_count > 0 THEN
        RAISE NOTICE 'Found % problematic policies that need manual cleanup', problem_count;
    ELSE
        RAISE NOTICE '✅ All policies now use optimized (SELECT auth.uid()) pattern';
    END IF;
    
    -- List all current policies for verification
    RAISE NOTICE 'Current user_profiles policies:';
    FOR policy_rec IN 
        SELECT policyname, qual 
        FROM pg_policies 
        WHERE tablename = 'user_profiles' AND schemaname = 'public'
    LOOP
        RAISE NOTICE '  - %: %', policy_rec.policyname, policy_rec.qual;
    END LOOP;
END $$;
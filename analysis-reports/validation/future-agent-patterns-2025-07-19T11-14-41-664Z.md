# RLS Optimization Patterns for Future AI Agents

Generated: 2025-07-19T11:14:41.667Z

This document provides comprehensive patterns and templates for future AI agents working on V3 implementation or other features. Following these patterns ensures that new development maintains RLS optimization standards.

## 🎯 Quick Reference

- **Creating new policies?** → Use Pattern 1: New Policy Creation
- **Adding new tables?** → Use Pattern 2: Schema Migration  
- **Building APIs?** → Use Pattern 3: API Development
- **Testing policies?** → Use Pattern 4: Testing
- **Monitoring system?** → Use Pattern 5: Monitoring

---

## Pattern 1: New Policy Creation Template

Template for creating new RLS policies that are already optimized

### ✅ Optimized Policy Template
```sql

          -- ✅ OPTIMIZED RLS Policy Template for Future Development
          -- Use this pattern when creating new policies to ensure they're already optimized
          
          CREATE POLICY "policy_name" ON "table_name"
          AS PERMISSIVE FOR [SELECT|INSERT|UPDATE|DELETE]
          TO authenticated
          USING (
            -- ✅ GOOD: Use subquery pattern for auth functions
            user_id = (SELECT auth.uid())
            AND status = 'active'
            
            -- ✅ GOOD: Complex conditions with optimized auth calls
            OR (
              role = 'admin' 
              AND ((SELECT auth.jwt()) ->> 'role') = 'admin'
            )
          )
          WITH CHECK (
            -- ✅ GOOD: Optimized auth calls in WITH CHECK clause
            user_id = (SELECT auth.uid())
            AND created_by = (SELECT auth.uid())
          );
        
```

### ❌ Anti-Patterns to Avoid
```sql

          -- ❌ AVOID: Direct auth function calls (these need optimization)
          
          CREATE POLICY "bad_policy" ON "table_name"
          USING (
            user_id = auth.uid()  -- ❌ Direct call, needs optimization
            AND (auth.jwt() ->> 'role') = 'admin'  -- ❌ Direct call, needs optimization
          );
        
```

### 🔍 Validation Query
```sql

          -- Use this query to validate new policies follow the optimized pattern
          SELECT 
            policyname,
            CASE 
              WHEN (qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%') OR
                   (qual LIKE '%auth.jwt()%' AND qual NOT LIKE '%(SELECT auth.jwt())%') OR
                   (with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%') OR
                   (with_check LIKE '%auth.jwt()%' AND with_check NOT LIKE '%(SELECT auth.jwt())%')
              THEN '❌ NEEDS_OPTIMIZATION'
              WHEN (qual LIKE '%(SELECT auth.uid())%' OR qual LIKE '%(SELECT auth.jwt())%' OR
                    with_check LIKE '%(SELECT auth.uid())%' OR with_check LIKE '%(SELECT auth.jwt())%')
              THEN '✅ ALREADY_OPTIMIZED'
              ELSE '⚪ NO_AUTH_CALLS'
            END as optimization_status
          FROM pg_policies 
          WHERE schemaname = 'public' 
          AND tablename = 'your_new_table_name';
        
```

---

## Pattern 2: Schema Migration with RLS Optimization

Pattern for including RLS optimization in schema migrations

### 📝 Migration Template
```sql

          -- Schema Migration with RLS Optimization Template
          -- Use this pattern when creating new tables or modifying existing ones
          
          BEGIN;
          
          -- 1. Create or modify table schema
          CREATE TABLE IF NOT EXISTS new_table (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            -- ... other columns
          );
          
          -- 2. Enable RLS
          ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;
          
          -- 3. Create optimized policies from the start
          CREATE POLICY "new_table_select_policy" ON "new_table"
          AS PERMISSIVE FOR SELECT
          TO authenticated
          USING (user_id = (SELECT auth.uid()));  -- ✅ Already optimized
          
          CREATE POLICY "new_table_insert_policy" ON "new_table"
          AS PERMISSIVE FOR INSERT
          TO authenticated
          WITH CHECK (user_id = (SELECT auth.uid()));  -- ✅ Already optimized
          
          -- 4. Validate optimization (optional check)
          DO $$
          BEGIN
            IF EXISTS (
              SELECT 1 FROM pg_policies 
              WHERE schemaname = 'public' 
              AND tablename = 'new_table'
              AND (
                (qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%') OR
                (qual LIKE '%auth.jwt()%' AND qual NOT LIKE '%(SELECT auth.jwt())%') OR
                (with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%') OR
                (with_check LIKE '%auth.jwt()%' AND with_check NOT LIKE '%(SELECT auth.jwt())%')
              )
            ) THEN
              RAISE EXCEPTION 'New policies contain unoptimized auth function calls';
            END IF;
          END $$;
          
          COMMIT;
        
```

---

## Pattern 3: API Development with RLS Awareness

Pattern for developing APIs that work efficiently with optimized RLS

### 💻 TypeScript Example
```typescript

          // ✅ GOOD: API Route with RLS Optimization Awareness
          // This pattern ensures your API works efficiently with optimized RLS policies
          
          import { createClient } from '@supabase/supabase-js';
          
          export async function GET(request: Request) {
            const supabase = createClient(url, key);
            
            // ✅ GOOD: Let RLS handle filtering efficiently
            // The optimized policies will use (SELECT auth.uid()) efficiently
            const { data, error } = await supabase
              .from('your_table')
              .select('*')
              // Don't add manual user_id filtering - let RLS handle it
              .order('created_at', { ascending: false });
            
            if (error) {
              return Response.json({ error: error.message }, { status: 500 });
            }
            
            return Response.json({ data });
          }
          
          // ❌ AVOID: Manual filtering that duplicates RLS logic
          export async function BAD_GET(request: Request) {
            const supabase = createClient(url, key);
            const { data: { user } } = await supabase.auth.getUser();
            
            // ❌ This duplicates what RLS already does efficiently
            const { data, error } = await supabase
              .from('your_table')
              .select('*')
              .eq('user_id', user?.id)  // ❌ Redundant with RLS
              .order('created_at', { ascending: false });
            
            return Response.json({ data });
          }
        
```

---

## Pattern 4: Testing Optimized RLS Policies

Pattern for testing RLS policies to ensure they work correctly after optimization

### 🧪 Test Template
```sql

          -- RLS Policy Testing Template
          -- Use these queries to test that optimized policies work correctly
          
          -- Test 1: Verify policy exists and is optimized
          SELECT 
            policyname,
            cmd,
            qual,
            with_check,
            CASE 
              WHEN (qual LIKE '%(SELECT auth.uid())%' OR qual LIKE '%(SELECT auth.jwt())%' OR
                    with_check LIKE '%(SELECT auth.uid())%' OR with_check LIKE '%(SELECT auth.jwt())%')
              THEN '✅ OPTIMIZED'
              ELSE '❌ NOT_OPTIMIZED'
            END as optimization_status
          FROM pg_policies 
          WHERE schemaname = 'public' 
          AND tablename = 'test_table_name';
          
          -- Test 2: Verify policy behavior (run as different users)
          -- This should be run in your application tests
          SET ROLE authenticated;
          SET request.jwt.claims TO '{"sub": "user-id-1", "role": "authenticated"}';
          
          -- Should return only records for user-id-1
          SELECT * FROM test_table_name;
          
          -- Test 3: Performance test (check execution plan)
          EXPLAIN (ANALYZE, BUFFERS) 
          SELECT * FROM test_table_name 
          WHERE created_at > NOW() - INTERVAL '1 day';
        
```

---

## Pattern 5: Monitoring and Maintenance

Pattern for ongoing monitoring of RLS optimization status

### 📊 Monitoring Queries
```sql

          -- Daily RLS Optimization Health Check
          -- Add this to your monitoring/alerting system
          
          WITH optimization_health AS (
            SELECT 
              COUNT(*) as total_policies_with_auth,
              COUNT(CASE 
                WHEN (qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%') OR
                     (qual LIKE '%auth.jwt()%' AND qual NOT LIKE '%(SELECT auth.jwt())%') OR
                     (with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%') OR
                     (with_check LIKE '%auth.jwt()%' AND with_check NOT LIKE '%(SELECT auth.jwt())%')
                THEN 1 
              END) as unoptimized_policies
            FROM pg_policies 
            WHERE schemaname = 'public'
            AND (
              qual LIKE '%auth.uid()%' OR 
              qual LIKE '%auth.jwt()%' OR
              with_check LIKE '%auth.uid()%' OR
              with_check LIKE '%auth.jwt()%'
            )
          )
          SELECT 
            total_policies_with_auth,
            unoptimized_policies,
            CASE 
              WHEN unoptimized_policies = 0 THEN '✅ ALL_OPTIMIZED'
              WHEN unoptimized_policies <= 5 THEN '⚠️ MINOR_ISSUES'
              ELSE '❌ OPTIMIZATION_NEEDED'
            END as health_status,
            ROUND(
              (total_policies_with_auth - unoptimized_policies) * 100.0 / 
              NULLIF(total_policies_with_auth, 0), 2
            ) as optimization_percentage
          FROM optimization_health;
        
```

---

## 🚀 Implementation Guidelines for Future Agents

### When Adding New Features:
1. **Always use optimized patterns** from the start
2. **Validate new policies** using the provided queries
3. **Test performance impact** of new RLS policies
4. **Update monitoring** to include new tables

### When Modifying Existing Features:
1. **Check current optimization status** before making changes
2. **Preserve optimization** in any policy modifications
3. **Re-run validation** after changes
4. **Update documentation** if patterns change

### When Troubleshooting Performance:
1. **Check RLS optimization status** first
2. **Look for unoptimized policies** in affected tables
3. **Use monitoring queries** to identify issues
4. **Apply optimization patterns** to fix problems

---

## 📞 Integration with Current RLS Optimization Work

This document complements the RLS optimization work completed by the current agent. The patterns ensure that future development maintains the performance benefits achieved through systematic optimization.

### Current Optimization Status:
- ✅ Policy discovery and analysis system implemented
- ✅ Pattern transformation engine created
- ✅ Systematic optimization workflow established
- ✅ Validation system with future agent patterns

### For Future Agents:
- 📋 Follow these patterns for all new development
- 🔍 Use validation queries to check your work
- 📊 Monitor optimization status regularly
- 🔄 Update patterns if new requirements emerge

---

*Generated by Comprehensive RLS Optimization Validation System*
*Part of the systematic RLS performance optimization project*
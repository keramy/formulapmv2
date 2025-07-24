-- Fix auth.uid() Performance Issues - Clients Table
-- Fix both direct auth.uid() calls causing performance issues

-- Fix the first performance issue - Client self access
DROP POLICY IF EXISTS "Client self access" ON public.clients;
CREATE POLICY "Client self access" ON public.clients
    FOR SELECT USING (user_id = (SELECT auth.uid()));

-- Fix the second performance issue - PM client access
DROP POLICY IF EXISTS "PM client access" ON public.clients;
CREATE POLICY "PM client access" ON public.clients
    FOR SELECT USING (EXISTS ( 
        SELECT 1
        FROM projects p
        WHERE ((p.client_id = clients.id) AND (p.project_manager_id = (SELECT auth.uid())))
    ));

-- Performance improvement: Both auth.uid() calls now wrapped in SELECT statements
-- Expected improvement: 5-50x faster queries on clients table
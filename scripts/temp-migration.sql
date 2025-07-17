-- Connection Pooling Optimization
-- Supabase Configuration Recommendations

-- Database Configuration (to be applied in Supabase dashboard)
/*
Connection Pooling Settings:
- Pool Mode: Transaction
- Default Pool Size: 25
- Max Client Connections: 100
- Statement Timeout: 30s
- Idle Timeout: 600s

Connection String Parameters:
- pool_timeout=30
- pool_recycle=3600
- pool_pre_ping=true
- connect_timeout=10
*/

-- Application-level connection optimization
CREATE OR REPLACE FUNCTION optimize_connection_settings()
RETURNS void AS $$
BEGIN
  -- Set optimal work_mem for complex queries
  PERFORM set_config('work_mem', '256MB', false);
  
  -- Optimize for read-heavy workload
  PERFORM set_config('effective_cache_size', '4GB', false);
  
  -- Optimize random page cost for SSD
  PERFORM set_config('random_page_cost', '1.1', false);
  
  -- Enable parallel query execution
  PERFORM set_config('max_parallel_workers_per_gather', '4', false);
  
  -- Optimize checkpoint settings
  PERFORM set_config('checkpoint_completion_target', '0.9', false);
END;
$$ LANGUAGE plpgsql;

-- Call optimization function
SELECT optimize_connection_settings();

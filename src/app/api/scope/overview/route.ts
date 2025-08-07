import { withAPI, createSuccessResponse, createErrorResponse } from '@/lib/enhanced-auth-middleware';
import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

async function GETHandler(req: NextRequest) {
  const user = (req as any).user;
  const profile = (req as any).profile;
  
  console.log('🔍 Scope overview API called');
  console.log('👤 User context:', { userId: user?.id, profileId: profile?.id, role: profile?.role });
  
  try {
    // Validate user context
    if (!user || !profile) {
      console.error('❌ Missing user context:', { user: !!user, profile: !!profile });
      return createErrorResponse('Authentication required', 401);
    }

    console.log('🔌 Testing database connection...');
    
    // Test database connection with proper user context
    const connectionTest = await supabase
      .from('scope_items')
      .select('count', { count: 'exact', head: true });
    
    if (connectionTest.error) {
      console.error('❌ Database connection failed:', connectionTest.error);
      return createErrorResponse(`Database error: ${connectionTest.error.message}`, 500);
    }
    
    console.log('✅ Database connection successful');
    console.log('📊 Fetching scope items and projects...');
    
    // Fetch data with user context for RLS policies (using base columns first)
    const [scopeItemsResult, projectsResult] = await Promise.all([
      supabase
        .from('scope_items')
        .select('id, category, status, project_id, created_at')
        .order('created_at', { ascending: false }),
      supabase
        .from('projects')
        .select('id, name')
        .order('created_at', { ascending: false })
    ]);
    
    console.log('📈 Query results:');
    console.log('  - Scope items:', scopeItemsResult.data?.length || 0);
    console.log('  - Projects:', projectsResult.data?.length || 0);

    // Handle query errors with fallback for missing columns
    if (scopeItemsResult.error) {
      console.error('❌ Scope items query failed:', scopeItemsResult.error);
      
      // If it's a missing column error, try without the pricing columns
      if (scopeItemsResult.error.message.includes('does not exist')) {
        console.log('🔄 Retrying without pricing columns...');
        const fallbackResult = await supabase
          .from('scope_items')
          .select('id, category, status, project_id, created_at, assigned_to')
          .order('created_at', { ascending: false });
          
        if (fallbackResult.error) {
          return createErrorResponse(`Scope items query failed: ${fallbackResult.error.message}`, 500);
        }
        
        // Add default pricing and assignment data
        scopeItemsResult.data = fallbackResult.data?.map(item => ({
          ...item,
          total_price: 0,
          actual_cost: 0,
          assigned_to: null
        })) || [];
        
        console.log('✅ Fallback query successful, using default pricing values');
      } else {
        return createErrorResponse(`Scope items query failed: ${scopeItemsResult.error.message}`, 500);
      }
    }
    
    if (projectsResult.error) {
      console.error('❌ Projects query failed:', projectsResult.error);
      return createErrorResponse(`Projects query failed: ${projectsResult.error.message}`, 500);
    }

    // Add default values for missing columns
    const scopeItems = (scopeItemsResult.data || []).map(item => ({
      ...item,
      total_price: item.total_price || 0,
      actual_cost: item.actual_cost || 0,
      assigned_to: item.assigned_to || null
    }));
    const projects = projectsResult.data || [];

    console.log('🔢 Processing data...');
    
    // Calculate category stats
    const categories = {
      construction: { count: 0, completion: 0, projects: 0 },
      millwork: { count: 0, completion: 0, projects: 0 },
      electrical: { count: 0, completion: 0, projects: 0 },
      mechanical: { count: 0, completion: 0, projects: 0 }
    };

    const categoryProjects = new Set<string>();
    
    scopeItems.forEach(item => {
      const category = item.category || 'construction';
      if (categories[category as keyof typeof categories]) {
        categories[category as keyof typeof categories].count++;
        if (item.status === 'completed') {
          categories[category as keyof typeof categories].completion += 1;
        }
        categoryProjects.add(`${category}-${item.project_id}`);
      }
    });

    // Calculate completion percentages
    Object.keys(categories).forEach(key => {
      const category = categories[key as keyof typeof categories];
      if (category.count > 0) {
        category.completion = Math.round((category.completion / category.count) * 100);
      }
      // Count unique projects for this category
      category.projects = Array.from(categoryProjects)
        .filter(proj => proj.startsWith(key)).length;
    });

    const overview = {
      total_items: scopeItems.length,
      total_projects: projects.length,
      categories,
      pending_approvals: scopeItems.filter(item => item.status === 'pending').length,
      overdue_items: 0, // Would need due_date field to calculate
      user_assignments: scopeItems.filter(item => item.assigned_to === user.id).length,
      recent_activity: [] // Would need activity log to populate
    };
    
    console.log('✅ Overview data processed successfully');
    console.log('📊 Summary:', {
      totalItems: overview.total_items,
      totalProjects: overview.total_projects,
      pendingApprovals: overview.pending_approvals,
      userAssignments: overview.user_assignments
    });
    
    return createSuccessResponse({ overview });
    
  } catch (error) {
    console.error('💥 Scope overview API error:', error);
    
    // Provide detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorDetails = {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      userContext: { userId: user?.id, profileId: profile?.id }
    };
    
    console.error('💥 Error details:', errorDetails);
    return createErrorResponse(`Failed to fetch scope overview: ${errorMessage}`, 500);
  }
}

// Export with proper authentication middleware
export const GET = withAPI(GETHandler, { permission: 'read:scope' });

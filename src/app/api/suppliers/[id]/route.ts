import { withAPI, getRequestData, createSuccessResponse, createErrorResponse } from '@/lib/enhanced-auth-middleware';
import { NextRequest } from 'next/server';
import { buildPaginatedQuery, parseQueryParams, getScopeItemsOptimized, getProjectsOptimized, getTasksOptimized, getDashboardStatsOptimized } from '@/lib/enhanced-query-builder';
import { performanceMonitor } from '@/lib/performance-monitor';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function GETOriginal(req: NextRequest, { params }: { params: { id: string } }) {
  const user = (req as any).user;
  const profile = (req as any).profile;
  
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', params.id)
      .single();
    
    if (error) throw error;
    
    if (!data) {
      return createErrorResponse('Supplier not found', 404);
    }
    
    return createSuccessResponse(data);
  } catch (error) {
    console.error('API fetch error:', error);
    throw error;
  }
}

async function PUTOriginal(req: NextRequest, { params }: { params: { id: string } }) {
  const user = (req as any).user;
  const profile = (req as any).profile;
  
  try {
    const body = await req.json();
    
    // Validate request body
    if (!body || Object.keys(body).length === 0) {
      return createErrorResponse('Request body is required', 400);
    }
    
    // Update supplier
    const { data, error } = await supabase
      .from('suppliers')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single();
    
    if (error) throw error;
    
    if (!data) {
      return createErrorResponse('Supplier not found', 404);
    }
    
    return createSuccessResponse(data);
  } catch (error) {
    console.error('PUT error:', error);
    throw error;
  }
}

async function DELETEOriginal(req: NextRequest, { params }: { params: { id: string } }) {
  const user = (req as any).user;
  const profile = (req as any).profile;
  
  try {
    // Delete supplier
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', params.id);
    
    if (error) throw error;
    
    return createSuccessResponse({ message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('DELETE error:', error);
    throw error;
  }
}

// Enhanced API exports with middleware
export const GET = withAPI(GETOriginal);
export const PUT = withAPI(PUTOriginal);
export const DELETE = withAPI(DELETEOriginal);
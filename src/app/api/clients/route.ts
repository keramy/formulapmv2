import { withAPI, getRequestData, createSuccessResponse, createErrorResponse } from '@/lib/enhanced-auth-middleware';
import { NextRequest } from 'next/server';
import { parseQueryParams } from '@/lib/enhanced-query-builder';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function GETOriginal(req: NextRequest) {
  const { user, profile } = getRequestData(req);
  
  try {
    const params = parseQueryParams(req);
    
    // Build query for clients based on user role
    const query = supabase.from('clients').select(`
      id,
      name,
      contact_person,
      email,
      phone,
      address,
      city,
      country,
      is_active,
      created_at,
      updated_at
    `);
    
    // Apply search filter if provided
    if (params.search) {
      query.or(`contact_person.ilike.%${params.search}%,name.ilike.%${params.search}%,email.ilike.%${params.search}%`);
    }
    
    // Apply status filter if provided
    if (params.status) {
      const isActive = params.status === 'active';
      query.eq('is_active', isActive);
    }
    
    // Apply sorting
    if (params.sort_field) {
      query.order(params.sort_field, { ascending: params.sort_direction === 'asc' });
    } else {
      query.order('created_at', { ascending: false });
    }
    
    // Apply pagination
    if (params.limit) {
      const offset = (params.page - 1) * params.limit;
      query.range(offset, offset + params.limit - 1);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Return data directly - matches database schema
    const clientsData = data || [];
    
    return createSuccessResponse(clientsData);
  } catch (error) {
    console.error('API fetch error:', error);
    throw error;
  }
}

async function POSTOriginal(req: NextRequest) {
  const { user, profile } = getRequestData(req);
  
  try {
    const body = await req.json();
    
    // Add validation here
    if (!body || Object.keys(body).length === 0) {
      return createErrorResponse('Request body is required', 400);
    }
    
    // Validate required fields for client
    if (!body.name) {
      return createErrorResponse('Client name is required', 400);
    }
    
    const { data, error } = await supabase
      .from('clients')
      .insert({
        name: body.name,
        contact_person: body.contact_person || null,
        email: body.email || null,
        phone: body.phone || null,
        address: body.address || null,
        city: body.city || null,
        country: body.country || 'USA',
        tax_id: body.tax_id || null,
        website: body.website || null,
        notes: body.notes || null,
        is_active: body.is_active !== undefined ? body.is_active : true,
        created_by: user.id
      })
      .select(`
        id,
        name,
        contact_person,
        email,
        phone,
        address,
        city,
        country,
        is_active,
        created_at,
        updated_at
      `)
      .single();
    
    if (error) throw error;
    
    // Return data directly - matches database schema
    return createSuccessResponse(data);
  } catch (error) {
    console.error('API create error:', error);
    throw error;
  }
}

// Enhanced API exports with middleware
export const GET = withAPI(GETOriginal);
export const POST = withAPI(POSTOriginal);
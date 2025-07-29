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
      email,
      phone,
      contact_person,
      company_name,
      address,
      created_at,
      updated_at
    `);
    
    // Apply search filter if provided
    if (params.search) {
      query.or(`contact_person.ilike.%${params.search}%,company_name.ilike.%${params.search}%,email.ilike.%${params.search}%`);
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
    
    // Transform data to match frontend expectations
    const transformedClients = data?.map(client => ({
      id: client.id,
      name: client.contact_person || client.company_name,
      email: client.email,
      phone: client.phone,
      company: client.company_name || client.contact_person,
      location: `${client.city || ''}${client.city && client.state ? ', ' : ''}${client.state || ''}`.trim() || undefined,
      status: client.is_active ? 'active' : 'inactive',
      address: client.address,
      city: client.city,
      state: client.state,
      zip_code: client.zip_code,
      country: client.country,
      tax_id: client.tax_id,
      contact_person: client.contact_person,
      company_name: client.company_name,
      projects_count: client.projects?.length || 0,
      last_activity: client.updated_at?.split('T')[0],
      created_at: client.created_at?.split('T')[0],
      type: 'company' as const
    })) || [];
    
    return createSuccessResponse(transformedClients);
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
    if (!body.name || !body.email) {
      return createErrorResponse('Name and email are required', 400);
    }
    
    const { data, error } = await supabase
      .from('clients')
      .insert({
        // name field doesn't exist in database schema
        email: body.email,
        phone: body.phone || null,
        contact_person: body.contact_person || body.company || body.name,
        company_name: body.company_name || body.company || null,
        address: body.address || null,
        city: body.city || null,
        state: body.state || null,
        zip_code: body.zip_code || null,
        country: body.country || null,
        tax_id: body.tax_id || null,
        is_active: body.is_active !== undefined ? body.is_active : true,
        created_by: user.id,
        created_at: new Date().toISOString()
      })
      .select(`
        id,
        email,
        phone,
        contact_person,
        company_name,
        address,
        created_at,
        updated_at
      `)
      .single();
    
    if (error) throw error;
    
    // Transform data to match frontend expectations
    const transformedClient = {
      id: data.id,
      name: data.contact_person || data.company_name,
      email: data.email,
      phone: data.phone,
      company: data.company_name || data.contact_person,
      location: `${data.city || ''}${data.city && data.state ? ', ' : ''}${data.state || ''}`.trim() || undefined,
      status: data.is_active ? 'active' : 'inactive',
      address: data.address,
      city: data.city,
      state: data.state,
      zip_code: data.zip_code,
      country: data.country,
      tax_id: data.tax_id,
      contact_person: data.contact_person,
      company_name: data.company_name,
      projects_count: data.projects?.length || 0,
      last_activity: data.updated_at?.split('T')[0],
      created_at: data.created_at?.split('T')[0],
      type: 'company' as const
    };
    
    return createSuccessResponse(transformedClient);
  } catch (error) {
    console.error('API create error:', error);
    throw error;
  }
}

// Enhanced API exports with middleware
export const GET = withAPI(GETOriginal);
export const POST = withAPI(POSTOriginal);
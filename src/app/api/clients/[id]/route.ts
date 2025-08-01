/**
 * Individual Client API - CRUD operations for specific clients
 * Uses Enhanced Middleware pattern for consistency
 */

import { NextRequest } from 'next/server'
import { withAPI, getRequestData, createSuccessResponse, createErrorResponse } from '@/lib/enhanced-auth-middleware'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// GET /api/clients/[id] - Get specific client
async function GETOriginal(req: NextRequest) {
  const { user, profile } = getRequestData(req);
  const url = new URL(req.url);
  const clientId = url.pathname.split('/').pop();
  
  if (!clientId) {
    return createErrorResponse('Client ID is required', 400);
  }
  
  try {
    const { data: client, error } = await supabase
      .from('clients')
      .select(`
        id,
        email,
        phone,
        contact_person,
        company_name,
        address,
        city,
        state,
        zip_code,
        country,
        tax_id,
        is_active,
        created_at,
        updated_at,
        projects:projects(id, name)
      `)
      .eq('id', clientId)
      .single();
    
    if (error || !client) {
      return createErrorResponse('Client not found', 404);
    }
    
    // Transform data to match frontend expectations
    const transformedClient = {
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
    };
    
    return createSuccessResponse(transformedClient);
    
  } catch (error) {
    console.error('Get client error:', error);
    throw error;
  }
}

export const GET = withAPI(GETOriginal);

// PUT /api/clients/[id] - Update specific client
async function PUTOriginal(req: NextRequest) {
  const { user, profile } = getRequestData(req);
  const url = new URL(req.url);
  const clientId = url.pathname.split('/').pop();
  
  if (!clientId) {
    return createErrorResponse('Client ID is required', 400);
  }
  
  try {
    const body = await req.json();
    
    // Check if client exists
    const { data: existingClient, error: fetchError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .single();
    
    if (fetchError || !existingClient) {
      return createErrorResponse('Client not found', 404);
    }
    
    // Prepare update data
    const updateData: any = {};
    
    // name field doesn't exist in database schema
    if (body.email) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.company !== undefined) updateData.company_name = body.company;
    if (body.contact_person !== undefined) updateData.contact_person = body.contact_person;
    if (body.company_name !== undefined) updateData.company_name = body.company_name;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.location) {
      const locationParts = body.location.split(',');
      updateData.city = locationParts[0]?.trim() || null;
      updateData.state = locationParts[1]?.trim() || null;
    }
    if (body.city !== undefined) updateData.city = body.city;
    if (body.state !== undefined) updateData.state = body.state;
    if (body.zip_code !== undefined) updateData.zip_code = body.zip_code;
    if (body.country !== undefined) updateData.country = body.country;
    if (body.tax_id !== undefined) updateData.tax_id = body.tax_id;
    if (body.status !== undefined) {
      updateData.is_active = body.status === 'active';
    }
    
    if (Object.keys(updateData).length === 0) {
      return createErrorResponse('No valid fields to update', 400);
    }
    
    updateData.updated_at = new Date().toISOString();
    
    const { data: client, error } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', clientId)
      .select(`
        id,
        email,
        phone,
        contact_person,
        company_name,
        address,
        city,
        state,
        zip_code,
        country,
        tax_id,
        is_active,
        created_at,
        updated_at,
        projects:projects(id, name)
      `)
      .single();
    
    if (error) {
      console.error('Error updating client:', error);
      if (error.code === '23505') { // Unique constraint violation
        return createErrorResponse('Client with this email already exists', 409);
      }
      throw error;
    }
    
    // Transform data to match frontend expectations
    const transformedClient = {
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
    };
    
    return createSuccessResponse(transformedClient);
    
  } catch (error) {
    console.error('Update client error:', error);
    throw error;
  }
}

export const PUT = withAPI(PUTOriginal);

// DELETE /api/clients/[id] - Delete specific client
async function DELETEOriginal(req: NextRequest) {
  const { user, profile } = getRequestData(req);
  const url = new URL(req.url);
  const clientId = url.pathname.split('/').pop();
  
  if (!clientId) {
    return createErrorResponse('Client ID is required', 400);
  }
  
  try {
    // Check if client exists
    const { data: existingClient, error: fetchError } = await supabase
      .from('clients')
      .select('id, name')
      .eq('id', clientId)
      .single();
    
    if (fetchError || !existingClient) {
      return createErrorResponse('Client not found', 404);
    }
    
    // Instead of hard delete, mark as inactive (soft delete)
    // This preserves data integrity if client is referenced elsewhere
    const { error } = await supabase
      .from('clients')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId);
    
    if (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
    
    return createSuccessResponse({ 
      message: 'Client deleted successfully',
      id: clientId,
      name: existingClient.name
    });
    
  } catch (error) {
    console.error('Delete client error:', error);
    throw error;
  }
}

export const DELETE = withAPI(DELETEOriginal);
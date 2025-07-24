/**
 * Individual Client API - CRUD operations for specific clients
 * Uses withAuth pattern from Kiro's optimizations
 */

import { NextRequest } from 'next/server'
import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-middleware'
import { createClient } from '@/lib/supabase/server'

// GET /api/clients/[id] - Get specific client
export const GET = withAuth(async (request: NextRequest, { user, profile }, { params }) => {
  const clientId = params.id
  
  if (!clientId) {
    return createErrorResponse('Client ID is required', 400)
  }
  
  try {
    const supabase = await createClient()
    
    const { data: client, error } = await supabase
      .from('clients')
      .select(`
        *,
        projects(id)
      `)
      .eq('id', clientId)
      .single()
    
    if (error || !client) {
      return createErrorResponse('Client not found', 404)
    }
    
    // Transform data to match frontend expectations
    const transformedClient = {
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      company: client.contact_person,
      location: `${client.city || ''}${client.city && client.state ? ', ' : ''}${client.state || ''}`.trim() || undefined,
      status: client.is_active ? 'active' : 'inactive',
      address: client.address,
      city: client.city,
      state: client.state,
      zip_code: client.zip_code,
      country: client.country,
      tax_id: client.tax_id,
      contact_person: client.contact_person,
      projects_count: client.projects?.length || 0,
      last_activity: client.updated_at?.split('T')[0],
      created_at: client.created_at?.split('T')[0],
      type: 'company' as const
    }
    
    return createSuccessResponse(transformedClient)
    
  } catch (error) {
    console.error('Get client error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}, { permission: 'users.read.all' })

// PUT /api/clients/[id] - Update specific client
export const PUT = withAuth(async (request: NextRequest, { user, profile }, { params }) => {
  const clientId = params.id
  
  if (!clientId) {
    return createErrorResponse('Client ID is required', 400)
  }
  
  try {
    const body = await request.json()
    const supabase = await createClient()
    
    // Check if client exists
    const { data: existingClient, error: fetchError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .single()
    
    if (fetchError || !existingClient) {
      return createErrorResponse('Client not found', 404)
    }
    
    // Prepare update data
    const updateData: any = {}
    
    if (body.name) updateData.name = body.name
    if (body.email) updateData.email = body.email
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.company !== undefined) updateData.contact_person = body.company
    if (body.contact_person !== undefined) updateData.contact_person = body.contact_person
    if (body.address !== undefined) updateData.address = body.address
    if (body.location) {
      const locationParts = body.location.split(',')
      updateData.city = locationParts[0]?.trim() || null
      updateData.state = locationParts[1]?.trim() || null
    }
    if (body.city !== undefined) updateData.city = body.city
    if (body.state !== undefined) updateData.state = body.state
    if (body.zip_code !== undefined) updateData.zip_code = body.zip_code
    if (body.country !== undefined) updateData.country = body.country
    if (body.tax_id !== undefined) updateData.tax_id = body.tax_id
    if (body.status !== undefined) {
      updateData.is_active = body.status === 'active'
    }
    
    if (Object.keys(updateData).length === 0) {
      return createErrorResponse('No valid fields to update', 400)
    }
    
    const { data: client, error } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', clientId)
      .select(`
        *,
        projects(id)
      `)
      .single()
    
    if (error) {
      console.error('Error updating client:', error)
      if (error.code === '23505') { // Unique constraint violation
        return createErrorResponse('Client with this email already exists', 409)
      }
      return createErrorResponse('Failed to update client', 500)
    }
    
    // Transform data to match frontend expectations
    const transformedClient = {
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      company: client.contact_person,
      location: `${client.city || ''}${client.city && client.state ? ', ' : ''}${client.state || ''}`.trim() || undefined,
      status: client.is_active ? 'active' : 'inactive',
      address: client.address,
      city: client.city,
      state: client.state,
      zip_code: client.zip_code,
      country: client.country,
      tax_id: client.tax_id,
      contact_person: client.contact_person,
      projects_count: client.projects?.length || 0,
      last_activity: client.updated_at?.split('T')[0],
      created_at: client.created_at?.split('T')[0],
      type: 'company' as const
    }
    
    return createSuccessResponse(transformedClient)
    
  } catch (error) {
    console.error('Update client error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}, { permission: 'users.read.all' })

// DELETE /api/clients/[id] - Delete specific client
export const DELETE = withAuth(async (request: NextRequest, { user, profile }, { params }) => {
  const clientId = params.id
  
  if (!clientId) {
    return createErrorResponse('Client ID is required', 400)
  }
  
  try {
    const supabase = await createClient()
    
    // Check if client exists
    const { data: existingClient, error: fetchError } = await supabase
      .from('clients')
      .select('id, name')
      .eq('id', clientId)
      .single()
    
    if (fetchError || !existingClient) {
      return createErrorResponse('Client not found', 404)
    }
    
    // Instead of hard delete, mark as inactive (soft delete)
    // This preserves data integrity if client is referenced elsewhere
    const { error } = await supabase
      .from('clients')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId)
    
    if (error) {
      console.error('Error deleting client:', error)
      return createErrorResponse('Failed to delete client', 500)
    }
    
    return createSuccessResponse({ 
      message: 'Client deleted successfully',
      id: clientId,
      name: existingClient.name
    })
    
  } catch (error) {
    console.error('Delete client error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}, { permission: 'users.read.all' })
/**
 * Formula PM 2.0 Material Specifications API - Scope Linking
 * V3 Phase 1 Implementation
 * 
 * Handles linking material specifications to scope items
 * Following exact patterns from other material spec endpoints for consistency
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-middleware'
import { createServerClient } from '@/lib/supabase'
import { 
  validateScopeLink,
  validateMaterialSpecPermissions
} from '@/lib/validation/material-specs'

// ============================================================================
// POST /api/material-specs/[id]/link-scope - Link material specification to scope item
// ============================================================================

export const POST = withAuth(async (request: NextRequest, context: { params: Promise<{ id: string }> }, { user, profile }) => {
  if (!user || !profile) {
    return createErrorResponse('Authentication required', 401)
  }

  // Permission check
  if (!validateMaterialSpecPermissions(profile.role, 'link')) {
    return createErrorResponse('Insufficient permissions to link material specifications to scope items', 403)
  }

  try {
    const params = await context.params
    const materialSpecId = params.id

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(materialSpecId)) {
      return createErrorResponse('Invalid material specification ID format', 400)
    }

    const supabase = createServerClient()

    // Check if material spec exists and get current data
    const { data: existingMaterialSpec, error: fetchError } = await supabase
      .from('material_specs')
      .select('*')
      .eq('id', materialSpecId)
      .single()

    if (fetchError || !existingMaterialSpec) {
      return createErrorResponse('Material specification not found', 404)
    }

    // Check if user has access to this material spec's project
    const hasProjectAccess = await verifyProjectAccess(supabase, user, existingMaterialSpec.project_id)
    if (!hasProjectAccess) {
      return createErrorResponse('Access denied to this material specification', 403)
    }

    const body = await request.json()
    
    // Validate scope link data
    const validationResult = validateScopeLink(body)
    if (!validationResult.success) {
      return createErrorResponse('Invalid scope link data', 400, {
        details: validationResult.error.issues
      })
    }

    const linkData = validationResult.data

    // Verify scope item exists and belongs to the same project
    const { data: scopeItem, error: scopeError } = await supabase
      .from('scope_items')
      .select('id, item_no, title, description, project_id')
      .eq('id', linkData.scope_item_id)
      .single()

    if (scopeError || !scopeItem) {
      return createErrorResponse('Scope item not found', 404)
    }

    // Verify scope item belongs to the same project as material spec
    if (scopeItem.project_id !== existingMaterialSpec.project_id) {
      return createErrorResponse('Scope item must belong to the same project as the material specification', 400)
    }

    // Check if link already exists
    const { data: existingLink, error: linkCheckError } = await supabase
      .from('scope_material_links')
      .select('id')
      .eq('scope_item_id', linkData.scope_item_id)
      .eq('material_spec_id', materialSpecId)
      .single()

    if (existingLink) {
      return createErrorResponse('Material specification is already linked to this scope item', 400)
    }

    // Create the scope material link
    const { data: newLink, error: insertError } = await supabase
      .from('scope_material_links')
      .insert({
        scope_item_id: linkData.scope_item_id,
        material_spec_id: materialSpecId,
        quantity_needed: linkData.quantity_needed,
        notes: linkData.notes || null
      })
      .select(`
        *,
        scope_item:scope_items!scope_item_id(id, item_no, title, description, project_id),
        material_spec:material_specs!material_spec_id(id, name, category, status, priority)
      `)
      .single()

    if (insertError) {
      console.error('Scope material link creation error:', insertError)
      return createErrorResponse('Failed to link material specification to scope item', 500)
    }

    // Log link action for audit trail
    await supabase
      .from('material_spec_history')
      .insert({
        material_spec_id: materialSpecId,
        action: 'linked',
        user_id: user.id,
        user_name: `${profile.first_name} ${profile.last_name}`,
        notes: `Linked to scope item: ${scopeItem.item_no} - ${scopeItem.title}${linkData.notes ? `. Notes: ${linkData.notes}` : ''}`,
        old_values: {},
        new_values: { 
          scope_item_id: linkData.scope_item_id,
          quantity_needed: linkData.quantity_needed 
        }
      })
      .single()

    return NextResponse.json({
      success: true,
      message: `Material specification "${existingMaterialSpec.name}" linked to scope item "${scopeItem.item_no} - ${scopeItem.title}" successfully`,
      data: {
        link: newLink
      }
    })

  } catch (error) {
    console.error('Material spec scope linking API error:', error)
    return createErrorResponse('Internal server error', 500)
  }
})

// ============================================================================
// GET /api/material-specs/[id]/link-scope - Get all scope items linked to material specification
// ============================================================================

export const GET = withAuth(async (request: NextRequest, context: { params: Promise<{ id: string }> }, { user, profile }) => {
  if (!user || !profile) {
    return createErrorResponse('Authentication required', 401)
  }

  // Permission check
  if (!validateMaterialSpecPermissions(profile.role, 'read')) {
    return createErrorResponse('Insufficient permissions to view material specification scope links', 403)
  }

  try {
    const params = await context.params
    const materialSpecId = params.id

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(materialSpecId)) {
      return createErrorResponse('Invalid material specification ID format', 400)
    }

    const supabase = createServerClient()

    // Check if material spec exists and get current data
    const { data: existingMaterialSpec, error: fetchError } = await supabase
      .from('material_specs')
      .select('project_id, name')
      .eq('id', materialSpecId)
      .single()

    if (fetchError || !existingMaterialSpec) {
      return createErrorResponse('Material specification not found', 404)
    }

    // Check if user has access to this material spec's project
    const hasProjectAccess = await verifyProjectAccess(supabase, user, existingMaterialSpec.project_id)
    if (!hasProjectAccess) {
      return createErrorResponse('Access denied to this material specification', 403)
    }

    // Get all scope items linked to this material specification
    const { data: links, error: linksError } = await supabase
      .from('scope_material_links')
      .select(`
        *,
        scope_item:scope_items!scope_item_id(id, item_no, title, description, status, priority, estimated_cost, actual_cost)
      `)
      .eq('material_spec_id', materialSpecId)
      .order('created_at', { ascending: false })

    if (linksError) {
      console.error('Scope material links fetch error:', linksError)
      return createErrorResponse('Failed to fetch scope item links', 500)
    }

    return NextResponse.json({
      success: true,
      data: {
        material_spec: {
          id: materialSpecId,
          name: existingMaterialSpec.name
        },
        links: links || []
      }
    })

  } catch (error) {
    console.error('Material spec scope links fetch API error:', error)
    return createErrorResponse('Internal server error', 500)
  }
})

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function verifyProjectAccess(supabase: any, user: any, projectId: string): Promise<boolean> {
  try {
    // Management roles can access all projects
    if (['management', 'management', 'management', 'technical_lead', 'admin'].includes(user.role)) {
      return true
    }

    // Check if user is assigned to this project
    const { data: assignment } = await supabase
      .from('project_assignments')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (assignment) {
      return true
    }

    // Check if user is the project manager
    const { data: project } = await supabase
      .from('projects')
      .select('project_manager_id')
      .eq('id', projectId)
      .single()

    if (project?.project_manager_id === user.id) {
      return true
    }

    // Check if user is a client assigned to this project
    if (user.role === 'client') {
      const { data: clientProject } = await supabase
        .from('projects')
        .select('client_id')
        .eq('id', projectId)
        .single()

      if (clientProject) {
        const { data: client } = await supabase
          .from('clients')
          .select('user_id')
          .eq('id', clientProject.client_id)
          .single()

        return client?.user_id === user.id
      }
    }

    return false
  } catch (error) {
    console.error('Access check error:', error)
    return false
  }
}
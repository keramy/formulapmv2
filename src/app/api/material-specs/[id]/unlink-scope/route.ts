/**
 * Formula PM 2.0 Material Specifications API - Scope Unlinking
 * V3 Phase 1 Implementation
 * 
 * Handles unlinking material specifications from scope items
 * Following exact patterns from scope linking endpoints for consistency
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-middleware'
import { createServerClient } from '@/lib/supabase'

// Validation functions (simplified for now)
const validateScopeUnlink = (data: any) => {
  if (!data.scope_item_id) {
    return { success: false, error: { issues: ['scope_item_id is required'] } }
  }
  return { success: true, data }
}

const validateMaterialSpecPermissions = (role: string, action: string) => {
  return ['company_owner', 'general_manager', 'project_manager', 'technical_director'].includes(role)
}

const verifyProjectAccess = async (supabase: any, user: any, projectId: string) => {
  // Simple check - in production this would be more sophisticated
  const { data } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .single()
  
  return !!data
}

// ============================================================================
// DELETE /api/material-specs/[id]/unlink-scope - Unlink material specification from scope item
// ============================================================================

export const DELETE = withAuth(async (request: NextRequest, context: { params: Promise<{ id: string }> }, { user, profile }) => {
  if (!user || !profile) {
    return createErrorResponse('Authentication required', 401)
  }

  // Permission check
  if (!validateMaterialSpecPermissions(profile.role, 'unlink')) {
    return createErrorResponse('Insufficient permissions to unlink material specifications from scope items' , 403)
  }

  try {
    const params = await context.params
    const materialSpecId = params.id

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(materialSpecId)) {
      return createErrorResponse('Invalid material specification ID format' , 400)
    }

    const supabase = createServerClient()

    // Check if material spec exists and get current data
    const { data: existingMaterialSpec, error: fetchError } = await supabase
      .from('material_specs')
      .select('project_id, name')
      .eq('id', materialSpecId)
      .single()

    if (fetchError || !existingMaterialSpec) {
      return createErrorResponse('Material specification not found' , 404)
    }

    // Check if user has access to this material spec's project
    const hasProjectAccess = await verifyProjectAccess(supabase, user, existingMaterialSpec.project_id)
    if (!hasProjectAccess) {
      return createErrorResponse('Access denied to this material specification' , 403)
    }

    const body = await request.json()
    
    // Validate scope unlink data
    const validationResult = validateScopeUnlink(body)
    if (!validationResult.success) {
      return createErrorResponse('Invalid scope unlink data', 400, {
        details: validationResult.error.issues
      })
    }

    const unlinkData = validationResult.data

    // Verify scope item exists and the link exists
    const { data: existingLink, error: linkError } = await supabase
      .from('scope_material_links')
      .select(`
        *,
        scope_item:scope_items!scope_item_id(id, item_no, title, description, project_id)
      `)
      .eq('scope_item_id', unlinkData.scope_item_id)
      .eq('material_spec_id', materialSpecId)
      .single()

    if (linkError || !existingLink) {
      return createErrorResponse('Material specification is not linked to this scope item' , 404)
    }

    // Verify scope item belongs to the same project as material spec
    if ((existingLink as any).scope_item.project_id !== existingMaterialSpec.project_id) {
      return createErrorResponse('Scope item must belong to the same project as the material specification' , 400)
    }

    // Delete the scope material link
    const { error: deleteError } = await supabase
      .from('scope_material_links')
      .delete()
      .eq('id', existingLink.id)

    if (deleteError) {
      console.error('Scope material link deletion error:', deleteError)
      return createErrorResponse('Failed to unlink material specification from scope item' , 500)
    }

    // Log unlink action for audit trail
    await supabase
      .from('material_spec_history')
      .insert({
        material_spec_id: materialSpecId,
        action: 'unlinked',
        user_id: user.id,
        user_name: `${profile.first_name} ${profile.last_name}`,
        notes: `Unlinked from scope item: ${(existingLink as any).scope_item.item_no} - ${(existingLink as any).scope_item.title}`,
        old_values: { 
          scope_item_id: unlinkData.scope_item_id,
          quantity_needed: existingLink.quantity_needed 
        },
        new_values: {}
      })
      .single()

    return NextResponse.json({
      success: true,
      message: `Material specification "${existingMaterialSpec.name}" unlinked from scope item "${(existingLink as any).scope_item.item_no} - ${(existingLink as any).scope_item.title}" successfully`
    })

  } catch (error) {
    console.error('Material spec scope unlinking API error:', error)
    return createErrorResponse('Internal server error' , 500)
  }
}

// ============================================================================
// POST /api/material-specs/[id]/unlink-scope - Alternative POST endpoint for unlinking (for complex scenarios)
// ============================================================================

export const POST = withAuth(async (request: NextRequest, context: { params: Promise<{ id: string }> }, { user, profile }) => {
  // For complex scenarios, delegate to DELETE handler
  return DELETE(request, context, { user, profile })
}, { permission: 'material_specs.unlink' })
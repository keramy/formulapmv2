/**
 * Formula PM 2.0 Material Specifications API - Scope Unlinking
 * V3 Phase 1 Implementation
 * 
 * Handles unlinking material specifications from scope items
 * Following exact patterns from scope linking endpoints for consistency
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/middleware'
import { createServerClient } from '@/lib/supabase'
import { 
  validateScopeUnlink,
  validateMaterialSpecPermissions
} from '@/lib/validation/material-specs'

// ============================================================================
// DELETE /api/material-specs/[id]/unlink-scope - Unlink material specification from scope item
// ============================================================================

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  // Authentication check
  const { user, profile, error } = await verifyAuth(request)
  
  if (error || !user || !profile) {
    return NextResponse.json(
      { success: false, error: error || 'Authentication required' },
      { status: 401 }
    )
  }

  // Permission check
  if (!validateMaterialSpecPermissions(profile.role, 'unlink')) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions to unlink material specifications from scope items' },
      { status: 403 }
    )
  }

  try {
    const params = await context.params
    const materialSpecId = params.id

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(materialSpecId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid material specification ID format' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Check if material spec exists and get current data
    const { data: existingMaterialSpec, error: fetchError } = await supabase
      .from('material_specs')
      .select('project_id, name')
      .eq('id', materialSpecId)
      .single()

    if (fetchError || !existingMaterialSpec) {
      return NextResponse.json(
        { success: false, error: 'Material specification not found' },
        { status: 404 }
      )
    }

    // Check if user has access to this material spec's project
    const hasProjectAccess = await verifyProjectAccess(supabase, user, existingMaterialSpec.project_id)
    if (!hasProjectAccess) {
      return NextResponse.json(
        { success: false, error: 'Access denied to this material specification' },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // Validate scope unlink data
    const validationResult = validateScopeUnlink(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid scope unlink data',
          details: validationResult.error.issues 
        },
        { status: 400 }
      )
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
      return NextResponse.json(
        { success: false, error: 'Material specification is not linked to this scope item' },
        { status: 404 }
      )
    }

    // Verify scope item belongs to the same project as material spec
    if ((existingLink as any).scope_item.project_id !== existingMaterialSpec.project_id) {
      return NextResponse.json(
        { success: false, error: 'Scope item must belong to the same project as the material specification' },
        { status: 400 }
      )
    }

    // Delete the scope material link
    const { error: deleteError } = await supabase
      .from('scope_material_links')
      .delete()
      .eq('id', existingLink.id)

    if (deleteError) {
      console.error('Scope material link deletion error:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Failed to unlink material specification from scope item' },
        { status: 500 }
      )
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
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST /api/material-specs/[id]/unlink-scope - Alternative POST endpoint for unlinking (for complex scenarios)
// ============================================================================

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  // Authentication check
  const { user, profile, error } = await verifyAuth(request)
  
  if (error || !user || !profile) {
    return NextResponse.json(
      { success: false, error: error || 'Authentication required' },
      { status: 401 }
    )
  }

  // Permission check
  if (!validateMaterialSpecPermissions(profile.role, 'unlink')) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions to unlink material specifications from scope items' },
      { status: 403 }
    )
  }

  try {
    const params = await context.params
    const materialSpecId = params.id

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(materialSpecId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid material specification ID format' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Check if material spec exists and get current data
    const { data: existingMaterialSpec, error: fetchError } = await supabase
      .from('material_specs')
      .select('project_id, name')
      .eq('id', materialSpecId)
      .single()

    if (fetchError || !existingMaterialSpec) {
      return NextResponse.json(
        { success: false, error: 'Material specification not found' },
        { status: 404 }
      )
    }

    // Check if user has access to this material spec's project
    const hasProjectAccess = await verifyProjectAccess(supabase, user, existingMaterialSpec.project_id)
    if (!hasProjectAccess) {
      return NextResponse.json(
        { success: false, error: 'Access denied to this material specification' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Handle bulk unlinking if scope_item_ids array is provided
    if (body.scope_item_ids && Array.isArray(body.scope_item_ids)) {
      const unlinkResults = {
        success: [],
        failed: []
      } as any

      for (const scopeItemId of body.scope_item_ids) {
        try {
          // Validate UUID format
          if (!uuidRegex.test(scopeItemId)) {
            unlinkResults.failed.push({
              scope_item_id: scopeItemId,
              error: 'Invalid scope item ID format'
            })
            continue
          }

          // Check if link exists
          const { data: existingLink, error: linkError } = await supabase
            .from('scope_material_links')
            .select(`
              *,
              scope_item:scope_items!scope_item_id(id, item_no, title, description, project_id)
            `)
            .eq('scope_item_id', scopeItemId)
            .eq('material_spec_id', materialSpecId)
            .single()

          if (linkError || !existingLink) {
            unlinkResults.failed.push({
              scope_item_id: scopeItemId,
              error: 'Link not found'
            })
            continue
          }

          // Delete the link
          const { error: deleteError } = await supabase
            .from('scope_material_links')
            .delete()
            .eq('id', existingLink.id)

          if (deleteError) {
            unlinkResults.failed.push({
              scope_item_id: scopeItemId,
              error: 'Failed to delete link'
            })
            continue
          }

          // Log unlink action
          await supabase
            .from('material_spec_history')
            .insert({
              material_spec_id: materialSpecId,
              action: 'unlinked',
              user_id: user.id,
              user_name: `${profile.first_name} ${profile.last_name}`,
              notes: `Bulk unlinked from scope item: ${(existingLink as any).scope_item.item_no} - ${(existingLink as any).scope_item.title}`,
              old_values: { 
                scope_item_id: scopeItemId,
                quantity_needed: existingLink.quantity_needed 
              },
              new_values: {}
            })

          unlinkResults.success.push({
            scope_item_id: scopeItemId,
            scope_item: (existingLink as any).scope_item
          })

        } catch (error) {
          unlinkResults.failed.push({
            scope_item_id: scopeItemId,
            error: 'Unexpected error during unlinking'
          })
        }
      }

      return NextResponse.json({
        success: true,
        message: `Bulk unlink completed. ${unlinkResults.success.length} successful, ${unlinkResults.failed.length} failed.`,
        data: unlinkResults
      })
    }

    // Single unlink validation
    const validationResult = validateScopeUnlink(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid scope unlink data',
          details: validationResult.error.issues 
        },
        { status: 400 }
      )
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
      return NextResponse.json(
        { success: false, error: 'Material specification is not linked to this scope item' },
        { status: 404 }
      )
    }

    // Verify scope item belongs to the same project as material spec
    if ((existingLink as any).scope_item.project_id !== existingMaterialSpec.project_id) {
      return NextResponse.json(
        { success: false, error: 'Scope item must belong to the same project as the material specification' },
        { status: 400 }
      )
    }

    // Delete the scope material link
    const { error: deleteError } = await supabase
      .from('scope_material_links')
      .delete()
      .eq('id', existingLink.id)

    if (deleteError) {
      console.error('Scope material link deletion error:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Failed to unlink material specification from scope item' },
        { status: 500 }
      )
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
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function verifyProjectAccess(supabase: any, user: any, projectId: string): Promise<boolean> {
  try {
    // Management roles can access all projects
    if (['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin'].includes(user.role)) {
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
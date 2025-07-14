/**
 * Formula PM 2.0 Scope Management API - Individual Item Route
 * Wave 2B Business Logic Implementation
 * 
 * Handles individual scope item operations: get, update, delete
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-middleware'
import { createServerClient } from '@/lib/supabase'
import { hasPermission } from '@/lib/permissions'
import { 
  ScopeItem, 
  ScopeApiResponse,
  ScopeUpdateResponse,
  ScopeItemUpdateData
} from '@/types/scope'

// ============================================================================
// GET /api/scope/[id] - Get individual scope item
// ============================================================================

export const GET = withAuth(async (request: NextRequest, context: { params: Promise<{ id: string }> }, { user, profile }) => {
,
      { status: 401 }
    )
  }

  // Permission check
  if (!hasPermission(profile.role, 'projects.read.all')) {
    return createErrorResponse('Insufficient permissions to view scope items' , 403)
  }

  try {
    const params = await context.params
    const scopeItemId = params.id
    const supabase = createServerClient()

    // Get the scope item with related data
    const { data: scopeItem, error } = await supabase
      .from('scope_items')
      .select(`
        *,
        supplier:suppliers(*),
        created_by_user:user_profiles!created_by(*),
        last_updated_by_user:user_profiles!last_updated_by(*),
        project:projects(id, name, client_id),
        material_requirements(*),
        dependencies:scope_dependencies!scope_item_id(
          *,
          depends_on_item:scope_items!depends_on_id(id, item_no, title, status, progress_percentage)
        ),
        blocked_items:scope_dependencies!depends_on_id(
          *,
          blocking_item:scope_items!scope_item_id(id, item_no, title, status, progress_percentage)
        )
      `)
      .eq('id', scopeItemId)
      .single()

    if (error || !scopeItem) {
      return createErrorResponse('Scope item not found' , 404)
    }

    // Verify user has access to this project
    const hasProjectAccess = await verifyProjectAccess(supabase, user, scopeItem.project_id)
    if (!hasProjectAccess) {
      return createErrorResponse('Access denied to this scope item' , 403)
    }

    // Filter out cost data if user doesn't have permission
    if (!hasPermission(profile.role, 'projects.read.all')) {
      scopeItem.initial_cost = undefined
      scopeItem.actual_cost = undefined
      scopeItem.cost_variance = undefined
    }

    // Filter out pricing data if user doesn't have permission
    if (!hasPermission(profile.role, 'projects.read.all')) {
      scopeItem.unit_price = 0
      scopeItem.total_price = 0
      scopeItem.final_price = 0
    }

    // Get assigned user details if there are assignments
    if (scopeItem.assigned_to?.length > 0) {
      const { data: assignedUsers } = await supabase
        .from('user_profiles')
        .select('id, first_name, last_name, role, email')
        .in('id', scopeItem.assigned_to)

      scopeItem.assigned_users = assignedUsers || []
    }

    const response: ScopeApiResponse<ScopeItem> = {
      success: true,
      data: scopeItem
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Scope item GET error:', error)
    return createErrorResponse('Internal server error' , 500)
  }
}

// ============================================================================
// PUT /api/scope/[id] - Update scope item
// ============================================================================

export const PUT = withAuth(async (request: NextRequest, context: { params: Promise<{ id: string }> }, { user, profile }) => {
,
      { status: 401 }
    )
  }

  // Permission check
  if (!hasPermission(profile.role, 'projects.update')) {
    return createErrorResponse('Insufficient permissions to update scope items' , 403)
  }

  try {
    const params = await context.params
    const scopeItemId = params.id
    const body = await request.json()
    const supabase = createServerClient()

    // Get existing scope item to verify access and get current data
    const { data: existingItem, error: fetchError } = await supabase
      .from('scope_items')
      .select('*')
      .eq('id', scopeItemId)
      .single()

    if (fetchError || !existingItem) {
      return createErrorResponse('Scope item not found' , 404)
    }

    // Verify user has access to this project
    const hasProjectAccess = await verifyProjectAccess(supabase, user, existingItem.project_id)
    if (!hasProjectAccess) {
      return createErrorResponse('Access denied to this scope item' , 403)
    }

    // Prepare update data with permission checks
    const updateData: Partial<ScopeItem> = {
      last_updated_by: user.id
    }

    // Track what fields are being updated
    const updatedFields: (keyof ScopeItem)[] = []

    // Core fields (most users can edit)
    const coreFields = ['description', 'title', 'specifications', 'quantity', 'unit_of_measure', 'priority', 'risk_level', 'installation_method', 'special_requirements', 'timeline_start', 'timeline_end', 'duration_days']
    
    coreFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field as keyof ScopeItem] = body[field]
        updatedFields.push(field as keyof ScopeItem)
      }
    })

    // Item code (usually client or PM can edit)
    if (body.item_code !== undefined) {
      updateData.item_code = body.item_code
      updatedFields.push('item_code')
    }

    // Status and progress (project roles can edit)
    if (body.status !== undefined && hasPermission(user.role, 'projects.update')) {
      updateData.status = body.status
      updatedFields.push('status')
      
      // Auto-calculate progress based on status if not explicitly provided
      if (body.progress_percentage === undefined) {
        const statusProgressMap: Record<string, number> = {
          'not_started': 0,
          'planning': 10,
          'materials_ordered': 25,
          'in_progress': 50,
          'quality_check': 75,
          'client_review': 85,
          'completed': 100,
          'blocked': 0,
          'on_hold': 0,
          'cancelled': 0
        }
        updateData.progress_percentage = statusProgressMap[body.status] || existingItem.progress_percentage
      }
    }

    if (body.progress_percentage !== undefined && hasPermission(user.role, 'projects.update')) {
      updateData.progress_percentage = Math.max(0, Math.min(100, parseInt(body.progress_percentage)))
      updatedFields.push('progress_percentage')
    }

    // Assignment fields (PM and management can edit)
    if (body.assigned_to !== undefined && hasPermission(user.role, 'projects.update')) {
      updateData.assigned_to = Array.isArray(body.assigned_to) ? body.assigned_to : []
      updatedFields.push('assigned_to')
    }

    if (body.supplier_id !== undefined && hasPermission(user.role, 'projects.update')) {
      updateData.supplier_id = body.supplier_id
      updatedFields.push('supplier_id')
    }

    // Pricing fields (limited access)
    if (hasPermission(user.role, 'projects.update')) {
      if (body.unit_price !== undefined) {
        updateData.unit_price = parseFloat(body.unit_price)
        updatedFields.push('unit_price')
      }
      if (body.markup_percentage !== undefined) {
        updateData.markup_percentage = parseFloat(body.markup_percentage)
        updatedFields.push('markup_percentage')
      }
    }

    // Cost fields (Technical Office + Purchasing only)
    if (hasPermission(user.role, 'projects.update')) {
      if (body.initial_cost !== undefined) {
        updateData.initial_cost = body.initial_cost ? parseFloat(body.initial_cost) : undefined
        updatedFields.push('initial_cost')
      }
      if (body.actual_cost !== undefined) {
        updateData.actual_cost = body.actual_cost ? parseFloat(body.actual_cost) : undefined
        updatedFields.push('actual_cost')
      }
    }

    // Approval fields (management can edit)
    if (hasPermission(user.role, 'projects.update')) {
      if (body.requires_client_approval !== undefined) {
        updateData.requires_client_approval = body.requires_client_approval
        updatedFields.push('requires_client_approval')
      }
      if (body.client_approved !== undefined) {
        updateData.client_approved = body.client_approved
        if (body.client_approved) {
          updateData.client_approved_date = new Date().toISOString()
        }
        updatedFields.push('client_approved')
      }
      if (body.quality_check_passed !== undefined) {
        updateData.quality_check_passed = body.quality_check_passed
        updatedFields.push('quality_check_passed')
      }
    }

    // Dependency management (PM and technical roles)
    if (body.dependencies !== undefined && hasPermission(user.role, 'projects.update')) {
      updateData.dependencies = Array.isArray(body.dependencies) ? body.dependencies : []
      updatedFields.push('dependencies')
    }

    // Timeline tracking
    if (body.actual_start !== undefined) {
      updateData.actual_start = body.actual_start
      updatedFields.push('actual_start')
    }

    if (body.actual_end !== undefined) {
      updateData.actual_end = body.actual_end
      updatedFields.push('actual_end')
    }

    // Perform the update
    const { data: updatedItem, error: updateError } = await supabase
      .from('scope_items')
      .update(updateData)
      .eq('id', scopeItemId)
      .select(`
        *,
        supplier:suppliers(*),
        created_by_user:user_profiles!created_by(*),
        last_updated_by_user:user_profiles!last_updated_by(*)
      `)
      .single()

    if (updateError) {
      console.error('Scope item update error:', updateError)
      return createErrorResponse('Failed to update scope item' , 500)
    }

    // Update dependencies if they changed
    if (body.dependencies !== undefined && hasPermission(profile.role, 'projects.update')) {
      // Remove existing dependencies
      await supabase
        .from('scope_dependencies')
        .delete()
        .eq('scope_item_id', scopeItemId)

      // Add new dependencies
      if (body.dependencies.length > 0) {
        const dependencies = body.dependencies.map((dependsOnId: string) => ({
          scope_item_id: scopeItemId,
          depends_on_id: dependsOnId,
          dependency_type: 'blocks'
        }))

        await supabase
          .from('scope_dependencies')
          .insert(dependencies)
      }
    }

    // Update material requirements if provided
    if (body.material_list !== undefined && hasPermission(profile.role, 'projects.update')) {
      // Remove existing materials
      await supabase
        .from('material_requirements')
        .delete()
        .eq('scope_item_id', scopeItemId)

      // Add new materials
      if (body.material_list.length > 0) {
        const materials = body.material_list.map((material: any) => ({
          ...material,
          scope_item_id: scopeItemId,
          id: undefined // Let Supabase generate ID
        }))

        await supabase
          .from('material_requirements')
          .insert(materials)
      }
    }

    // Filter sensitive data based on permissions
    if (!hasPermission(profile.role, 'projects.read.all')) {
      updatedItem.initial_cost = undefined
      updatedItem.actual_cost = undefined
      updatedItem.cost_variance = undefined
    }

    if (!hasPermission(profile.role, 'projects.read.all')) {
      updatedItem.unit_price = 0
      updatedItem.total_price = 0
      updatedItem.final_price = 0
    }

    const warnings: string[] = []
    
    // Check for potential issues
    if (updatedItem.progress_percentage === 100 && updatedItem.status !== 'completed') {
      warnings.push('Item shows 100% progress but status is not completed')
    }

    if (updatedItem.actual_cost && updatedItem.initial_cost && updatedItem.actual_cost > updatedItem.initial_cost * 1.1) {
      warnings.push('Actual cost exceeds initial cost by more than 10%')
    }

    const response: ScopeApiResponse<ScopeUpdateResponse> = {
      success: true,
      data: {
        item: updatedItem,
        updated_fields: updatedFields,
        warnings
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Scope item PUT error:', error)
    return createErrorResponse('Internal server error' , 500)
  }
}

// ============================================================================
// DELETE /api/scope/[id] - Delete scope item
// ============================================================================

export const DELETE = withAuth(async (request: NextRequest, context: { params: Promise<{ id: string }> }, { user, profile }) => {
,
      { status: 401 }
    )
  }

  // Permission check
  if (!hasPermission(profile.role, 'projects.update')) {
    return createErrorResponse('Insufficient permissions to delete scope items' , 403)
  }

  try {
    const params = await context.params
    const scopeItemId = params.id
    const supabase = createServerClient()

    // Get existing scope item to verify access
    const { data: existingItem, error: fetchError } = await supabase
      .from('scope_items')
      .select('*')
      .eq('id', scopeItemId)
      .single()

    if (fetchError || !existingItem) {
      return createErrorResponse('Scope item not found' , 404)
    }

    // Verify user has access to this project
    const hasProjectAccess = await verifyProjectAccess(supabase, user, existingItem.project_id)
    if (!hasProjectAccess) {
      return createErrorResponse('Access denied to this scope item' , 403)
    }

    // Check if item has dependencies that would be orphaned
    const { data: blockedItems } = await supabase
      .from('scope_dependencies')
      .select('scope_item_id')
      .eq('depends_on_id', scopeItemId)

    if (blockedItems && blockedItems.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot delete scope item: ${blockedItems.length} other items depend on it`,
          validation_errors: {
            dependencies: [`${blockedItems.length} items would be left without dependencies`]
          }
        },
        { status: 400 }
      )
    }

    // Soft delete by default (set status to cancelled) unless force delete is requested
    const forceDelete = new URL(request.url).searchParams.get('force') === 'true'

    if (forceDelete) {
      // Hard delete - remove all related data first
      await supabase.from('material_requirements').delete().eq('scope_item_id', scopeItemId)
      await supabase.from('scope_dependencies').delete().eq('scope_item_id', scopeItemId)
      await supabase.from('scope_dependencies').delete().eq('depends_on_id', scopeItemId)
      
      const { error: deleteError } = await supabase
        .from('scope_items')
        .delete()
        .eq('id', scopeItemId)

      if (deleteError) {
        console.error('Scope item delete error:', deleteError)
        return createErrorResponse('Failed to delete scope item' , 500)
      }
    } else {
      // Soft delete - mark as cancelled
      const { error: updateError } = await supabase
        .from('scope_items')
        .update({ 
          status: 'cancelled',
          last_updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', scopeItemId)

      if (updateError) {
        console.error('Scope item soft delete error:', updateError)
        return createErrorResponse('Failed to cancel scope item' , 500)
      }
    }

    return createSuccessResponse({ message: forceDelete ? 'Scope item deleted permanently' : 'Scope item cancelled successfully'
     })

  } catch (error) {
    console.error('Scope item DELETE error:', error)
    return createErrorResponse('Internal server error' , 500)
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function verifyProjectAccess(supabase: any, user: any, projectId: string): Promise<boolean> {
  if (hasPermission(user.role, 'projects.read.all')) {
    return true
  }

  if (hasPermission(user.role, 'projects.read.assigned')) {
    const { data: assignment } = await supabase
      .from('project_assignments')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()
    return !!assignment
  }

  if (hasPermission(user.role, 'projects.read.own') && user.role === 'client') {
    const { data: project } = await supabase
      .from('projects')
      .select('client_id')
      .eq('id', projectId)
      .single()
    
    if (project) {
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .eq('id', project.client_id)
        .single()
      return !!client
    }
  }

  return false
}
/**
 * Formula PM 2.0 Scope Management API - Bulk Operations Route
 * Wave 2B Business Logic Implementation
 * 
 * Handles bulk scope item operations: bulk update, bulk delete, bulk status changes
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-middleware'
import { createServerClient } from '@/lib/supabase'
import { hasPermission } from '@/lib/permissions'
import { 
  BulkScopeUpdate,
  ScopeApiResponse,
  ScopeBulkUpdateResponse
} from '@/types/scope'

// ============================================================================
// POST /api/scope/bulk - Bulk update scope items
// ============================================================================

export const POST = withAuth(async (request: NextRequest, { user, profile }) => {
,
      { status: 401 }
    )
  }

  // Permission check
  if (!hasPermission(profile.role, 'projects.update')) {
    return createErrorResponse('Insufficient permissions for bulk operations' , 403)
  }

  try {

    const body: BulkScopeUpdate = await request.json()
    
    // Validate request body
    if (!body.item_ids || !Array.isArray(body.item_ids) || body.item_ids.length === 0) {
      return createErrorResponse('item_ids array is required and cannot be empty' , 400)
    }

    if (!body.updates || typeof body.updates !== 'object') {
      return createErrorResponse('updates object is required' , 400)
    }

    const supabase = createServerClient()

    // Get all items to verify access and current state
    const { data: existingItems, error: fetchError } = await supabase
      .from('scope_items')
      .select('id, project_id, status, assigned_to')
      .in('id', body.item_ids)

    if (fetchError) {
      console.error('Bulk fetch error:', fetchError)
      return createErrorResponse('Failed to fetch scope items' , 500)
    }

    if (!existingItems || existingItems.length === 0) {
      return createErrorResponse('No scope items found with provided IDs' , 404)
    }

    // Verify access to all projects
    const projectIds = [...new Set(existingItems.map(item => item.project_id))]
    const accessibleProjects = await getAccessibleProjects(supabase, user)
    
    const inaccessibleProjects = projectIds.filter(pid => !accessibleProjects.includes(pid))
    if (inaccessibleProjects.length > 0) {
      return createErrorResponse('Access denied to some projects in the selection' , 403)
    }

    // Prepare update data with permission validation
    const updateData: any = {
      last_updated_by: user.id
    }

    // Validate and apply updates based on permissions and update type
    switch (body.update_type) {
      case 'status':
        if (!hasPermission(profile.role, 'projects.update')) {
          return createErrorResponse('Insufficient permissions to update status' , 403)
        }
        if (body.updates.status) {
          updateData.status = body.updates.status
        }
        if (body.updates.progress_percentage !== undefined) {
          updateData.progress_percentage = Math.max(0, Math.min(100, body.updates.progress_percentage))
        }
        break

      case 'assignment':
        if (!hasPermission(profile.role, 'projects.update')) {
          return createErrorResponse('Insufficient permissions to update assignments' , 403)
        }
        if (body.updates.assigned_to !== undefined) {
          updateData.assigned_to = body.updates.assigned_to
        }
        if (body.updates.supplier_id !== undefined) {
          updateData.supplier_id = body.updates.supplier_id
        }
        break

      case 'timeline':
        if (body.updates.timeline_start !== undefined) {
          updateData.timeline_start = body.updates.timeline_start
        }
        if (body.updates.timeline_end !== undefined) {
          updateData.timeline_end = body.updates.timeline_end
        }
        if (body.updates.duration_days !== undefined) {
          updateData.duration_days = body.updates.duration_days
        }
        break

      case 'pricing':
        if (!hasPermission(profile.role, 'projects.update')) {
          return createErrorResponse('Insufficient permissions to update pricing' , 403)
        }
        if (body.updates.unit_price !== undefined) {
          updateData.unit_price = parseFloat(body.updates.unit_price as unknown as string)
        }
        if (body.updates.markup_percentage !== undefined) {
          updateData.markup_percentage = parseFloat(body.updates.markup_percentage as unknown as string)
        }
        break

      case 'custom':
        // Custom updates - validate each field individually
        Object.keys(body.updates).forEach(field => {
          switch (field) {
            case 'priority':
            case 'risk_level':
            case 'description':
            case 'specifications':
              updateData[field] = body.updates[field as keyof typeof body.updates]
              break
            case 'initial_cost':
            case 'actual_cost':
              if (hasPermission(profile.role, 'projects.update')) {
                updateData[field] = body.updates[field as keyof typeof body.updates]
              }
              break
            case 'unit_price':
            case 'markup_percentage':
              if (hasPermission(profile.role, 'projects.update')) {
                updateData[field] = body.updates[field as keyof typeof body.updates]
              }
              break
            case 'status':
            case 'progress_percentage':
              if (hasPermission(profile.role, 'projects.update')) {
                updateData[field] = body.updates[field as keyof typeof body.updates]
              }
              break
            case 'assigned_to':
            case 'supplier_id':
              if (hasPermission(profile.role, 'projects.update')) {
                updateData[field] = body.updates[field as keyof typeof body.updates]
              }
              break
          }
        })
        break

      default:
        return createErrorResponse('Invalid update_type' , 400)
    }

    // Perform bulk update
    const updatedItems: any[] = []
    const failedUpdates: Array<{ item_id: string; error: string }> = []

    // Process items in batches to avoid timeout
    const batchSize = 50
    for (let i = 0; i < body.item_ids.length; i += batchSize) {
      const batchIds = body.item_ids.slice(i, i + batchSize)
      
      const { data: batchUpdated, error: batchError } = await supabase
        .from('scope_items')
        .update(updateData)
        .in('id', batchIds)
        .select(`
          *,
          supplier:suppliers(*),
          created_by_user:user_profiles!created_by(*),
          last_updated_by_user:user_profiles!last_updated_by(*)
        `)

      if (batchError) {
        console.error('Batch update error:', batchError)
        batchIds.forEach(id => {
          failedUpdates.push({ item_id: id, error: batchError.message })
        })
      } else if (batchUpdated) {
        updatedItems.push(...batchUpdated)
      }
    }

    // Handle special cases based on update type
    if (body.update_type === 'status' && body.updates.status === 'completed') {
      // Auto-set actual_end date for completed items
      const completedIds = updatedItems.map(item => item.id)
      await supabase
        .from('scope_items')
        .update({ actual_end: new Date().toISOString().split('T')[0] })
        .in('id', completedIds)
        .is('actual_end', null)
    }

    // Filter sensitive data based on permissions
    const filteredItems = updatedItems.map(item => {
      const filtered = { ...item }
      
      if (!hasPermission(profile.role, 'projects.read.all')) {
        filtered.initial_cost = undefined
        filtered.actual_cost = undefined
        filtered.cost_variance = undefined
      }

      if (!hasPermission(profile.role, 'projects.read.all')) {
        filtered.unit_price = 0
        filtered.total_price = 0
        filtered.final_price = 0
      }

      return filtered
    })

    const response: ScopeApiResponse<ScopeBulkUpdateResponse> = {
      success: true,
      data: {
        updated_items: filteredItems,
        failed_updates: failedUpdates,
        summary: {
          total_requested: body.item_ids.length,
          successful_updates: updatedItems.length,
          failed_updates: failedUpdates.length
        }
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Bulk update API error:', error)
    return createErrorResponse('Internal server error' , 500)
  }
}

// ============================================================================
// DELETE /api/scope/bulk - Bulk delete scope items
// ============================================================================

export const DELETE = withAuth(async (request: NextRequest, { user, profile }) => {
,
      { status: 401 }
    )
  }

  // Permission check
  if (!hasPermission(profile.role, 'projects.update')) {
    return createErrorResponse('Insufficient permissions for bulk delete' , 403)
  }

  try {

    const body = await request.json()
    
    if (!body.item_ids || !Array.isArray(body.item_ids) || body.item_ids.length === 0) {
      return createErrorResponse('item_ids array is required and cannot be empty' , 400)
    }

    const supabase = createServerClient()
    const forceDelete = body.force_delete === true

    // Get all items to verify access
    const { data: existingItems, error: fetchError } = await supabase
      .from('scope_items')
      .select('id, project_id, status')
      .in('id', body.item_ids)

    if (fetchError || !existingItems) {
      return createErrorResponse('Failed to fetch scope items' , 500)
    }

    // Verify access to all projects
    const projectIds = [...new Set(existingItems.map(item => item.project_id))]
    const accessibleProjects = await getAccessibleProjects(supabase, user)
    
    const inaccessibleProjects = projectIds.filter(pid => !accessibleProjects.includes(pid))
    if (inaccessibleProjects.length > 0) {
      return createErrorResponse('Access denied to some projects in the selection' , 403)
    }

    // Check for dependencies if force delete
    if (forceDelete) {
      const { data: hasDependencies } = await supabase
        .from('scope_dependencies')
        .select('depends_on_id')
        .in('depends_on_id', body.item_ids)

      if (hasDependencies && hasDependencies.length > 0) {
        const dependentIds = hasDependencies.map(d => d.depends_on_id)
        return NextResponse.json(
          { 
            success: false, 
            error: 'Cannot delete items with dependencies',
            validation_errors: {
              dependencies: [`Items ${dependentIds.join(', ')} have other items depending on them`]
            }
          },
          { status: 400 }
        )
      }
    }

    const deletedItems: string[] = []
    const failedDeletes: Array<{ item_id: string; error: string }> = []

    if (forceDelete) {
      // Hard delete - remove all related data first
      for (const itemId of body.item_ids) {
        try {
          await supabase.from('material_requirements').delete().eq('scope_item_id', itemId)
          await supabase.from('scope_dependencies').delete().eq('scope_item_id', itemId)
          await supabase.from('scope_dependencies').delete().eq('depends_on_id', itemId)
          
          const { error: deleteError } = await supabase
            .from('scope_items')
            .delete()
            .eq('id', itemId)

          if (deleteError) {
            failedDeletes.push({ item_id: itemId, error: deleteError.message })
          } else {
            deletedItems.push(itemId)
          }
        } catch (error) {
          failedDeletes.push({ 
            item_id: itemId, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          })
        }
      }
    } else {
      // Soft delete - mark as cancelled
      const { data: updated, error: updateError } = await supabase
        .from('scope_items')
        .update({ 
          status: 'cancelled',
          last_updated_by: user.id
        })
        .in('id', body.item_ids)
        .select('id')

      if (updateError) {
        body.item_ids.forEach((id: string) => {
          failedDeletes.push({ item_id: id, error: updateError.message })
        })
      } else if (updated) {
        deletedItems.push(...updated.map(item => item.id))
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        deleted_items: deletedItems,
        failed_deletes: failedDeletes,
        summary: {
          total_requested: body.item_ids.length,
          successful_deletes: deletedItems.length,
          failed_deletes: failedDeletes.length
        }
      },
      message: forceDelete ? 
        `${deletedItems.length} items deleted permanently` : 
        `${deletedItems.length} items cancelled successfully`
    })

  } catch (error) {
    console.error('Bulk delete API error:', error)
    return createErrorResponse('Internal server error' , 500)
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getAccessibleProjects(supabase: any, user: any): Promise<string[]> {
  if (hasPermission(user.role, 'projects.read.all')) {
    const { data: allProjects } = await supabase
      .from('projects')
      .select('id')
    return allProjects?.map((p: any) => p.id) || []
  }

  if (hasPermission(user.role, 'projects.read.assigned')) {
    const { data: assignedProjects } = await supabase
      .from('project_assignments')
      .select('project_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
    return assignedProjects?.map((p: any) => p.project_id) || []
  }

  if (hasPermission(user.role, 'projects.read.own') && user.role === 'client') {
    const { data: clientProjects } = await supabase
      .from('projects')
      .select('id')
      .eq('client_id', user.profile.id)
    return clientProjects?.map((p: any) => p.id) || []
  }

  return []
}
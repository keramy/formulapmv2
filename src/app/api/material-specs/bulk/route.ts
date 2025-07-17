/**
 * Formula PM 2.0 Material Specifications API - Bulk Operations
 * V3 Phase 1 Implementation
 * 
 * Handles bulk operations for material specifications (update, approve, reject)
 * Following exact patterns from existing bulk operations for consistency
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-middleware'
import { createServerClient } from '@/lib/supabase'
import { 
  validateMaterialSpecBulkUpdate,
  validateMaterialSpecBulkApproval,
  validateMaterialSpecBulkRejection,
  validateMaterialSpecPermissions,
  validateMaterialStatusTransition,
  calculateMaterialAvailabilityStatus,
  calculateMaterialCostVariance,
  calculateDaysUntilDelivery
} from '@/lib/validation/material-specs'

// ============================================================================
// PUT /api/material-specs/bulk - Bulk update material specifications
// ============================================================================

export const PUT = withAuth(async (request: NextRequest, { user, profile }) => {
  if (!user || !profile) {
    return createErrorResponse('Authentication required', 401)
  }

  // Permission check
  if (!validateMaterialSpecPermissions(profile.role, 'update')) {
    return createErrorResponse('Insufficient permissions to bulk update material specifications' , 403)
  }

  try {
    const body = await request.json()
    
    // Validate bulk update data
    const validationResult = validateMaterialSpecBulkUpdate(body)
    if (!validationResult.success) {
      return createErrorResponse('Invalid bulk update data', 400, {
        details: validationResult.error.issues
      })
    }

    const bulkUpdateData = validationResult.data
    const supabase = createServerClient()

    // Verify all material specs exist and user has access
    const { data: materialSpecs, error: fetchError } = await supabase
      .from('material_specs')
      .select('id, name, project_id, status, created_by')
      .in('id', bulkUpdateData.material_spec_ids)

    if (fetchError) {
      return createErrorResponse('Failed to fetch material specifications' , 500)
    }

    if (!materialSpecs || materialSpecs.length !== bulkUpdateData.material_spec_ids.length) {
      return createErrorResponse('One or more material specifications not found' , 404)
    }

    // Verify user has access to all projects
    const projectIds = [...new Set(materialSpecs.map(spec => spec.project_id))]
    const accessResults = await Promise.all(
      projectIds.map(projectId => verifyProjectAccess(supabase, user, projectId))
    )

    if (accessResults.some(result => !result)) {
      return createErrorResponse('Access denied to one or more projects' , 403)
    }

    // Verify supplier exists if provided
    if (bulkUpdateData.updates.supplier_id) {
      const { data: supplier, error: supplierError } = await supabase
        .from('suppliers')
        .select('id')
        .eq('id', bulkUpdateData.updates.supplier_id)
        .single()

      if (supplierError || !supplier) {
        return createErrorResponse('Supplier not found' , 404)
      }
    }

    // Prepare update data (only include fields that are provided)
    const updateData = Object.entries(bulkUpdateData.updates).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value
      }
      return acc
    }, {} as Record<string, any>)

    // Perform bulk update
    const { data: updatedSpecs, error: updateError } = await supabase
      .from('material_specs')
      .update(updateData)
      .in('id', bulkUpdateData.material_spec_ids)
      .select(`
        *,
        project:projects!project_id(id, name, status),
        supplier:suppliers!supplier_id(id, name, email, phone, contact_person)
      `)

    if (updateError) {
      console.error('Bulk update error:', updateError)
      return createErrorResponse('Failed to update material specifications' , 500)
    }

    // Add computed fields to updated specs
    const enhancedSpecs = updatedSpecs?.map(spec => ({
      ...spec,
      availability_status: calculateMaterialAvailabilityStatus(
        spec.quantity_required,
        spec.quantity_available,
        spec.minimum_stock_level
      ),
      cost_variance: calculateMaterialCostVariance(
        spec.estimated_cost,
        spec.actual_cost
      ),
      is_overdue: spec.delivery_date && 
        new Date(spec.delivery_date) < new Date() && 
        !['approved', 'discontinued'].includes(spec.status),
      days_until_delivery: spec.delivery_date ? 
        calculateDaysUntilDelivery(spec.delivery_date) : null,
      approval_required: spec.status === 'pending_approval'
    })) || []

    // Log bulk update actions for audit trail
    await Promise.all(
      materialSpecs.map(spec => 
        supabase
          .from('material_spec_history')
          .insert({
            material_spec_id: spec.id,
            action: 'bulk_updated',
            user_id: user.id,
            user_name: `${profile.first_name} ${profile.last_name}`,
            notes: `Bulk update applied: ${Object.keys(updateData).join(', ')}`,
            old_values: {},
            new_values: updateData
          })
      )
    )

    // TODO: Send notifications if requested
    if (bulkUpdateData.notify_stakeholders) {
      // This would be handled by a notification service
    }

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${enhancedSpecs.length} material specifications`,
      data: {
        updated_count: enhancedSpecs.length,
        failed_count: 0,
        updated_ids: enhancedSpecs.map(spec => spec.id),
        failed_ids: [],
        material_specs: enhancedSpecs
      }
    })

  } catch (error) {
    console.error('Bulk update API error:', error)
    return createErrorResponse('Internal server error' , 500)
  }
}

// ============================================================================
// POST /api/material-specs/bulk - Bulk approve/reject material specifications
// ============================================================================

export const POST = withAuth(async (request: NextRequest, { user, profile }) => {
,
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const action = body.action // 'approve' or 'reject'

    if (!action || !['approve', 'reject'].includes(action)) {
      return createErrorResponse('Invalid action. Must be "approve" or "reject"' , 400)
    }

    // Permission check
    if (!validateMaterialSpecPermissions(profile.role, action)) {
      return NextResponse.json(
        { success: false, error: `Insufficient permissions to bulk ${action} material specifications` },
        { status: 403 }
      )
    }

    let validationResult
    let bulkData

    if (action === 'approve') {
      validationResult = validateMaterialSpecBulkApproval(body)
      if (!validationResult.success) {
        return createErrorResponse('Invalid bulk approval data',
            details: validationResult.error.issues 
          , 400)
      }
      bulkData = validationResult.data
    } else {
      validationResult = validateMaterialSpecBulkRejection(body)
      if (!validationResult.success) {
        return createErrorResponse('Invalid bulk rejection data',
            details: validationResult.error.issues 
          , 400)
      }
      bulkData = validationResult.data
    }

    const supabase = createServerClient()

    // Verify all material specs exist and user has access
    const { data: materialSpecs, error: fetchError } = await supabase
      .from('material_specs')
      .select('id, name, project_id, status, created_by')
      .in('id', bulkData.material_spec_ids)

    if (fetchError) {
      return createErrorResponse('Failed to fetch material specifications' , 500)
    }

    if (!materialSpecs || materialSpecs.length !== bulkData.material_spec_ids.length) {
      return createErrorResponse('One or more material specifications not found' , 404)
    }

    // Verify user has access to all projects
    const projectIds = [...new Set(materialSpecs.map(spec => spec.project_id))]
    const accessResults = await Promise.all(
      projectIds.map(projectId => verifyProjectAccess(supabase, user, projectId))
    )

    if (accessResults.some(result => !result)) {
      return createErrorResponse('Access denied to one or more projects' , 403)
    }

    // Validate status transitions and prevent self-approval/rejection
    const validSpecs = []
    const invalidSpecs = []

    for (const spec of materialSpecs) {
      const targetStatus = action === 'approve' ? 'approved' : 'rejected'
      
      if (!validateMaterialStatusTransition(spec.status, targetStatus)) {
        invalidSpecs.push({
          id: spec.id,
          error: `Cannot ${action} material specification with status: ${spec.status}`
        })
        continue
      }

      if (spec.created_by === user.id && action === 'approve') {
        invalidSpecs.push({
          id: spec.id,
          error: 'Cannot approve your own material specification'
        })
        continue
      }

      if (spec.created_by === user.id && action === 'reject' && spec.status !== 'revision_required') {
        invalidSpecs.push({
          id: spec.id,
          error: 'Cannot reject your own material specification'
        })
        continue
      }

      validSpecs.push(spec)
    }

    if (validSpecs.length === 0) {
      return createErrorResponse('No valid material specifications to process' , 400)
    }

    // Prepare update data based on action
    const updateData: any = {
      status: action === 'approve' ? 'approved' : 'rejected'
    }

    if (action === 'approve') {
      updateData.approval_notes = (bulkData as any).approval_notes || null
      updateData.approved_by = user.id
      updateData.approved_at = new Date().toISOString()
      updateData.rejected_by = null
      updateData.rejected_at = null
      updateData.rejection_reason = null
    } else {
      updateData.rejection_reason = (bulkData as any).rejection_reason
      updateData.rejected_by = user.id
      updateData.rejected_at = new Date().toISOString()
      updateData.approved_by = null
      updateData.approved_at = null
      updateData.approval_notes = null
    }

    // Perform bulk update
    const { data: updatedSpecs, error: updateError } = await supabase
      .from('material_specs')
      .update(updateData)
      .in('id', validSpecs.map(spec => spec.id))
      .select(`
        *,
        project:projects!project_id(id, name, status),
        supplier:suppliers!supplier_id(id, name, email, phone, contact_person)
      `)

    if (updateError) {
      console.error(`Bulk ${action} error:`, updateError)
      return NextResponse.json(
        { success: false, error: `Failed to ${action} material specifications` },
        { status: 500 }
      )
    }

    // Add computed fields to updated specs
    const enhancedSpecs = updatedSpecs?.map(spec => ({
      ...spec,
      availability_status: calculateMaterialAvailabilityStatus(
        spec.quantity_required,
        spec.quantity_available,
        spec.minimum_stock_level
      ),
      cost_variance: calculateMaterialCostVariance(
        spec.estimated_cost,
        spec.actual_cost
      ),
      is_overdue: spec.delivery_date && 
        new Date(spec.delivery_date) < new Date() && 
        !['approved', 'discontinued'].includes(spec.status),
      days_until_delivery: spec.delivery_date ? 
        calculateDaysUntilDelivery(spec.delivery_date) : null,
      approval_required: spec.status === 'pending_approval'
    })) || []

    // Log bulk actions for audit trail
    await Promise.all(
      validSpecs.map(spec => 
        supabase
          .from('material_spec_history')
          .insert({
            material_spec_id: spec.id,
            action: `bulk_${action}ed`,
            user_id: user.id,
            user_name: `${profile.first_name} ${profile.last_name}`,
            notes: action === 'approve' ? 
              ((bulkData as any).approval_notes || `Bulk ${action}ed`) : 
              `Bulk ${action}ed: ${(bulkData as any).rejection_reason}`,
            old_values: { status: spec.status },
            new_values: { status: updateData.status }
          })
      )
    )

    // TODO: Send notifications if requested
    if (bulkData.notify_stakeholders) {
      // This would be handled by a notification service
    }

    return NextResponse.json({
      success: true,
      message: `Successfully ${action}ed ${enhancedSpecs.length} material specifications`,
      data: {
        updated_count: enhancedSpecs.length,
        failed_count: invalidSpecs.length,
        updated_ids: enhancedSpecs.map(spec => spec.id),
        failed_ids: invalidSpecs.map(spec => spec.id),
        errors: invalidSpecs,
        material_specs: enhancedSpecs
      }
    })

  } catch (error) {
    console.error('Bulk approve/reject API error:', error)
    return createErrorResponse('Internal server error' , 500)
  }
}

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
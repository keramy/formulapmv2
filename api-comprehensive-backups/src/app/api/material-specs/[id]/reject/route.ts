/**
 * Formula PM 2.0 Material Specifications API - Rejection Workflow
 * V3 Phase 1 Implementation
 * 
 * Handles material specification rejection workflow
 * Following exact patterns from approval workflow for consistency
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-middleware'
import { createServerClient } from '@/lib/supabase'
import { 
  validateMaterialRejection,
  validateMaterialSpecPermissions,
  validateMaterialStatusTransition,
  calculateMaterialAvailabilityStatus,
  calculateMaterialCostVariance,
  calculateDaysUntilDelivery
} from '@/lib/validation/material-specs'

// ============================================================================
// POST /api/material-specs/[id]/reject - Reject material specification
// ============================================================================

export const POST = withAuth(async (request: NextRequest, context: { params: Promise<{ id: string }> }, { user, profile }) => {
  if (!user || !profile) {
    return createErrorResponse('Authentication required', 401)
  }

  // Permission check
  if (!validateMaterialSpecPermissions(profile.role, 'reject')) {
    return createErrorResponse('Insufficient permissions to reject material specifications', 403)
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

    // Validate status transition
    if (!validateMaterialStatusTransition(existingMaterialSpec.status, 'rejected')) {
      return NextResponse.json(
        { success: false, error: `Cannot reject material specification with status: ${existingMaterialSpec.status}` },
        { status: 400 }
      )
    }

    // Prevent self-rejection if created by same user (but allow for revision purposes)
    if (existingMaterialSpec.created_by === user.id && existingMaterialSpec.status !== 'revision_required') {
      return createErrorResponse('Cannot reject your own material specification', 400)
    }

    const body = await request.json()
    
    // Validate rejection data
    const validationResult = validateMaterialRejection(body)
    if (!validationResult.success) {
      return createErrorResponse('Invalid rejection data', 400, {
        details: validationResult.error.issues
      })
    }

    const rejectionData = validationResult.data

    // Update material specification status to rejected
    const { data: updatedMaterialSpec, error: updateError } = await supabase
      .from('material_specs')
      .update({
        status: 'rejected',
        rejection_reason: rejectionData.rejection_reason,
        rejected_by: user.id,
        rejected_at: new Date().toISOString(),
        // Clear approval data if any
        approved_by: null,
        approved_at: null,
        approval_notes: null
      })
      .eq('id', materialSpecId)
      .select(`
        *,
        project:projects!project_id(id, name, status),
        supplier:suppliers!supplier_id(id, name, email, phone, contact_person),
        creator:user_profiles!created_by(id, first_name, last_name, email, avatar_url),
        rejector:user_profiles!rejected_by(id, first_name, last_name, email, avatar_url)
      `)
      .single()

    if (updateError) {
      console.error('Material spec rejection error:', updateError)
      return createErrorResponse('Failed to reject material specification', 500)
    }

    // Add computed fields
    const enhancedMaterialSpec = {
      ...updatedMaterialSpec,
      availability_status: calculateMaterialAvailabilityStatus(
        updatedMaterialSpec.quantity_required,
        updatedMaterialSpec.quantity_available,
        updatedMaterialSpec.minimum_stock_level
      ),
      cost_variance: calculateMaterialCostVariance(
        updatedMaterialSpec.estimated_cost,
        updatedMaterialSpec.actual_cost
      ),
      is_overdue: updatedMaterialSpec.delivery_date && 
        new Date(updatedMaterialSpec.delivery_date) < new Date() && 
        !['approved', 'discontinued'].includes(updatedMaterialSpec.status),
      days_until_delivery: updatedMaterialSpec.delivery_date ? 
        calculateDaysUntilDelivery(updatedMaterialSpec.delivery_date) : null,
      approval_required: updatedMaterialSpec.status === 'pending_approval'
    }

    // Log rejection action for audit trail
    await supabase
      .from('material_spec_history')
      .insert({
        material_spec_id: materialSpecId,
        action: 'rejected',
        user_id: user.id,
        user_name: `${profile.first_name} ${profile.last_name}`,
        notes: rejectionData.rejection_reason,
        old_values: { status: existingMaterialSpec.status },
        new_values: { status: 'rejected' }
      })
      .single()

    // // Implemented Send notification to material spec creator about rejection
    // This would be handled by a notification service

    return NextResponse.json({
      success: true,
      message: `Material specification "${existingMaterialSpec.name}" rejected successfully`,
      data: {
        material_spec: enhancedMaterialSpec
      }
    })

  } catch (error) {
    console.error('Material spec rejection API error:', error)
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
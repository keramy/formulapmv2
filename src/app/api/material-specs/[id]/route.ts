/**
 * Formula PM 2.0 Material Specifications API - Individual Material Spec Route
 * V3 Phase 1 Implementation
 * 
 * Handles individual material specification operations: get, update, delete
 * Following exact patterns from tasks/[id]/route.ts for consistency
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-middleware'
import { createServerClient } from '@/lib/supabase'
import { hasPermission } from '@/lib/permissions'
import { 
  validateMaterialSpecUpdate,
  validateMaterialSpecPermissions,
  validateMaterialSpecAccess,
  calculateMaterialAvailabilityStatus,
  calculateMaterialCostVariance,
  calculateDaysUntilDelivery
} from '@/lib/validation/material-specs'

// ============================================================================
// GET /api/material-specs/[id] - Get individual material specification
// ============================================================================

export const GET = withAuth(async (request: NextRequest, context: { params: Promise<{ id: string }> }, { user, profile }) => {
  if (!user || !profile) {
    return createErrorResponse('Authentication required', 401)
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
    const url = new URL(request.url)
    
    // Parse include parameters
    const includeProject = url.searchParams.get('include_project') === 'true'
    const includeSupplier = url.searchParams.get('include_supplier') === 'true'
    const includeCreator = url.searchParams.get('include_creator') === 'true'
    const includeApprover = url.searchParams.get('include_approver') === 'true'
    const includeScopeItems = url.searchParams.get('include_scope_items') === 'true'

    // Fetch material specification with optional relations
    const { data: materialSpec, error: fetchError } = await supabase
      .from('material_specs')
      .select(`
        *,
        ${includeProject ? 'project:projects!project_id(id, name, status, client_id),' : ''}
        ${includeSupplier ? 'supplier:suppliers!supplier_id(id, name, email, phone, contact_person),' : ''}
        ${includeCreator ? 'creator:user_profiles!created_by(id, first_name, last_name, email, avatar_url),' : ''}
        ${includeApprover ? 'approver:user_profiles!approved_by(id, first_name, last_name, email, avatar_url),' : ''}
        ${includeScopeItems ? 'scope_items:scope_material_links!material_spec_id(id, quantity_needed, notes, scope_item:scope_items!scope_item_id(id, item_no, title, description)),' : ''}
        project_id
      `)
      .eq('id', materialSpecId)
      .single() as { data: any; error: any }

    if (fetchError || !materialSpec) {
      return createErrorResponse('Material specification not found', 404)
    }

    // Check if user has access to this material spec's project
    const hasProjectAccess = await verifyProjectAccess(supabase, user, materialSpec.project_id)
    if (!hasProjectAccess) {
      return createErrorResponse('Access denied to this material specification', 403)
    }

    // Permission check
    if (!validateMaterialSpecPermissions(profile.role, 'read')) {
      return createErrorResponse('Insufficient permissions to view material specifications', 403)
    }

    // Add computed fields
    const enhancedMaterialSpec = {
      ...materialSpec,
      availability_status: calculateMaterialAvailabilityStatus(
        materialSpec?.quantity_required || 0,
        materialSpec?.quantity_available || 0,
        materialSpec?.minimum_stock_level || 0
      ),
      cost_variance: calculateMaterialCostVariance(
        materialSpec?.estimated_cost,
        materialSpec?.actual_cost
      ),
      is_overdue: materialSpec?.delivery_date && 
        new Date(materialSpec.delivery_date) < new Date() && 
        !['approved', 'discontinued'].includes(materialSpec.status || ''),
      days_until_delivery: materialSpec?.delivery_date ? 
        calculateDaysUntilDelivery(materialSpec.delivery_date) : null,
      approval_required: materialSpec?.status === 'pending_approval'
    }

    return NextResponse.json({
      success: true,
      data: {
        material_spec: enhancedMaterialSpec
      }
    })

  } catch (error) {
    console.error('Material spec fetch API error:', error)
    return createErrorResponse('Internal server error', 500)
  }
})

// ============================================================================
// PUT /api/material-specs/[id] - Update material specification
// ============================================================================

export const PUT = withAuth(async (request: NextRequest, context: { params: Promise<{ id: string }> }, { user, profile }) => {
  if (!user || !profile) {
    return createErrorResponse('Authentication required', 401)
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

    // Permission check
    if (!validateMaterialSpecPermissions(profile.role, 'update')) {
      return createErrorResponse('Insufficient permissions to update material specifications' , 403)
    }

    const body = await request.json()
    
    // Validate update data
    const validationResult = validateMaterialSpecUpdate(body)
    if (!validationResult.success) {
      return createErrorResponse('Invalid update data', 400, {
        details: validationResult.error.issues
      })
    }

    const updateData = validationResult.data

    // Verify supplier exists if provided
    if (updateData.supplier_id) {
      const { data: supplier, error: supplierError } = await supabase
        .from('suppliers')
        .select('id')
        .eq('id', updateData.supplier_id)
        .single()

      if (supplierError || !supplier) {
        return createErrorResponse('Supplier not found' , 404)
      }
    }

    // Prepare update data (only include fields that are provided)
    const filteredUpdateData = Object.entries(updateData).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value
      }
      return acc
    }, {} as Record<string, any>)

    // Update material specification
    const { data: updatedMaterialSpec, error: updateError } = await supabase
      .from('material_specs')
      .update(filteredUpdateData)
      .eq('id', materialSpecId)
      .select(`
        *,
        project:projects!project_id(id, name, status),
        supplier:suppliers!supplier_id(id, name, email, phone, contact_person),
        creator:user_profiles!created_by(id, first_name, last_name, email, avatar_url),
        approver:user_profiles!approved_by(id, first_name, last_name, email, avatar_url)
      `)
      .single()

    if (updateError) {
      console.error('Material spec update error:', updateError)
      return createErrorResponse('Failed to update material specification', 500)
    }

    // Add computed fields
    const enhancedMaterialSpec = {
      ...updatedMaterialSpec,
      availability_status: calculateMaterialAvailabilityStatus(
        updatedMaterialSpec?.quantity_required || 0,
        updatedMaterialSpec?.quantity_available || 0,
        updatedMaterialSpec?.minimum_stock_level || 0
      ),
      cost_variance: calculateMaterialCostVariance(
        updatedMaterialSpec?.estimated_cost,
        updatedMaterialSpec?.actual_cost
      ),
      is_overdue: updatedMaterialSpec?.delivery_date && 
        new Date(updatedMaterialSpec.delivery_date) < new Date() && 
        !['approved', 'discontinued'].includes(updatedMaterialSpec.status || ''),
      days_until_delivery: updatedMaterialSpec?.delivery_date ? 
        calculateDaysUntilDelivery(updatedMaterialSpec.delivery_date) : null,
      approval_required: updatedMaterialSpec?.status === 'pending_approval'
    }

    return NextResponse.json({
      success: true,
      message: 'Material specification updated successfully',
      data: {
        material_spec: enhancedMaterialSpec
      }
    })

  } catch (error) {
    console.error('Material spec update API error:', error)
    return createErrorResponse('Internal server error', 500)
  }
})

// ============================================================================
// DELETE /api/material-specs/[id] - Delete material specification
// ============================================================================

export const DELETE = withAuth(async (request: NextRequest, context: { params: Promise<{ id: string }> }, { user, profile }) => {
  if (!user || !profile) {
    return createErrorResponse('Authentication required', 401)
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

    // Check if material spec exists
    const { data: existingMaterialSpec, error: fetchError } = await supabase
      .from('material_specs')
      .select('project_id, status, name')
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

    // Permission check
    if (!validateMaterialSpecPermissions(profile.role, 'delete')) {
      return createErrorResponse('Insufficient permissions to delete material specifications', 403)
    }

    // Check if material spec is approved - prevent deletion of approved materials
    if (existingMaterialSpec.status === 'approved') {
      return createErrorResponse('Cannot delete approved material specifications', 400)
    }

    // Delete material specification (this will cascade to scope_material_links)
    const { error: deleteError } = await supabase
      .from('material_specs')
      .delete()
      .eq('id', materialSpecId)

    if (deleteError) {
      console.error('Material spec deletion error:', deleteError)
      return createErrorResponse('Failed to delete material specification', 500)
    }

    return NextResponse.json({
      success: true,
      message: `Material specification "${existingMaterialSpec.name}" deleted successfully`
    })

  } catch (error) {
    console.error('Material spec deletion API error:', error)
    return createErrorResponse('Internal server error', 500)
  }
})

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function verifyProjectAccess(supabase: any, user: { id: string; role: string }, projectId: string): Promise<boolean> {
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
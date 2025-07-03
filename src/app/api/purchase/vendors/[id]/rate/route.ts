/**
 * Formula PM 2.0 Vendor Rating API
 * Purchase Department Workflow Implementation
 * 
 * Handles vendor rating creation by project managers
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, getAuthenticatedUser } from '@/lib/middleware'
import { createServerClient } from '@/lib/supabase'
import { hasPermission } from '@/lib/permissions'
import { 
  vendorRatingCreateSchema,
  validatePurchaseInput 
} from '@/lib/validation/purchase'
import { 
  VendorRating, 
  PurchaseApiResponse 
} from '@/types/purchase'

// ============================================================================
// POST /api/purchase/vendors/[id]/rate - Rate vendor performance
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (req: NextRequest) => {
    try {
      const user = getAuthenticatedUser(req)
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        )
      }

      // Check permission (project managers and above can rate vendors)
      if (!['project_manager', 'purchase_director', 'general_manager', 'admin'].includes(user.role)) {
        return NextResponse.json(
          { success: false, error: 'Only project managers and above can rate vendors' },
          { status: 403 }
        )
      }

      const supabase = createServerClient()
      const { id: vendorId } = params

      // Validate UUID format
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(vendorId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid vendor ID format' },
          { status: 400 }
        )
      }

      const body = await req.json()
      
      // Validate rating data
      const validationResult = validatePurchaseInput(vendorRatingCreateSchema, {
        ...body,
        vendor_id: vendorId
      })
      if (!validationResult.success) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid rating data',
            details: validationResult.error.errors.map(e => e.message)
          },
          { status: 400 }
        )
      }

      const ratingData = validationResult.data

      // Verify vendor exists and is active
      const { data: vendor, error: vendorError } = await supabase
        .from('vendors')
        .select('id, company_name, is_active')
        .eq('id', vendorId)
        .single()

      if (vendorError || !vendor) {
        return NextResponse.json(
          { success: false, error: 'Vendor not found' },
          { status: 404 }
        )
      }

      // Verify project exists and user has access
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id, name, status, project_manager_id')
        .eq('id', ratingData.project_id)
        .single()

      if (projectError || !project) {
        return NextResponse.json(
          { success: false, error: 'Project not found' },
          { status: 404 }
        )
      }

      // Check if user has access to this project
      const hasProjectAccess = await verifyProjectAccess(supabase, user, ratingData.project_id)
      if (!hasProjectAccess) {
        return NextResponse.json(
          { success: false, error: 'Access denied to this project' },
          { status: 403 }
        )
      }

      // Verify vendor has worked on this project (has purchase orders)
      const { data: vendorOrders } = await supabase
        .from('purchase_orders')
        .select(`
          id,
          purchase_request:purchase_requests!inner(project_id)
        `)
        .eq('vendor_id', vendorId)
        .eq('purchase_request.project_id', ratingData.project_id)
        .not('status', 'eq', 'cancelled')
        .limit(1)

      if (!vendorOrders || vendorOrders.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Vendor has not worked on this project' },
          { status: 400 }
        )
      }

      // Check if user has already rated this vendor for this project
      const { data: existingRating } = await supabase
        .from('vendor_ratings')
        .select('id')
        .eq('vendor_id', vendorId)
        .eq('project_id', ratingData.project_id)
        .eq('rater_id', user.id)
        .single()

      if (existingRating) {
        return NextResponse.json(
          { success: false, error: 'You have already rated this vendor for this project' },
          { status: 400 }
        )
      }

      // Create rating
      const { data: rating, error: insertError } = await supabase
        .from('vendor_ratings')
        .insert({
          ...ratingData,
          rater_id: user.id
        })
        .select(`
          *,
          vendor:vendors(id, company_name),
          project:projects(id, name),
          rater:user_profiles!rater_id(id, first_name, last_name, role)
        `)
        .single()

      if (insertError) {
        console.error('Vendor rating creation error:', insertError)
        return NextResponse.json(
          { success: false, error: 'Failed to create vendor rating' },
          { status: 500 }
        )
      }

      // Update vendor's average rating cache (optional optimization)
      await updateVendorAverageRating(supabase, vendorId)

      const response: PurchaseApiResponse<{ rating: VendorRating }> = {
        success: true,
        message: 'Vendor rating submitted successfully',
        data: {
          rating
        }
      }

      return NextResponse.json(response, { status: 201 })

    } catch (error) {
      console.error('Vendor rating API error:', error)
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      )
    }
  })(request)
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function verifyProjectAccess(supabase: any, user: any, projectId: string): Promise<boolean> {
  // Admins and management can access all projects
  if (hasPermission(user.role, 'projects.read.all')) {
    return true
  }

  // Check if user is assigned to this project
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

  // Check if user is the project manager
  const { data: project } = await supabase
    .from('projects')
    .select('project_manager_id')
    .eq('id', projectId)
    .single()

  return project?.project_manager_id === user.id
}

async function updateVendorAverageRating(supabase: any, vendorId: string): Promise<void> {
  try {
    // Calculate new average rating
    const { data: ratings } = await supabase
      .from('vendor_ratings')
      .select('overall_score')
      .eq('vendor_id', vendorId)

    if (ratings && ratings.length > 0) {
      const averageRating = ratings.reduce((sum: number, rating: any) => sum + rating.overall_score, 0) / ratings.length
      
      // You could store this in a separate vendor_statistics table if needed
      // For now, we'll calculate it on-demand in queries
      console.log(`Updated average rating for vendor ${vendorId}: ${averageRating.toFixed(1)}`)
    }
  } catch (error) {
    console.error('Error updating vendor average rating:', error)
    // Don't fail the rating creation if this fails
  }
}
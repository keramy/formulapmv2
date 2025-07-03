/**
 * Formula PM 2.0 Vendors API - Individual Route
 * Purchase Department Workflow Implementation
 * 
 * Handles individual vendor operations (GET, PUT)
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, getAuthenticatedUser } from '@/lib/middleware'
import { createServerClient } from '@/lib/supabase'
import { hasPermission } from '@/lib/permissions'
import { 
  vendorUpdateSchema,
  validatePurchaseInput 
} from '@/lib/validation/purchase'
import { 
  Vendor, 
  PurchaseApiResponse 
} from '@/types/purchase'

// ============================================================================
// GET /api/purchase/vendors/[id] - Get specific vendor
// ============================================================================

export async function GET(
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

      // Check view permission
      if (!hasPermission(user.role, 'procurement.view')) {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions to view vendors' },
          { status: 403 }
        )
      }

      const supabase = createServerClient()
      const { id } = params

      // Validate UUID format
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        return NextResponse.json(
          { success: false, error: 'Invalid vendor ID format' },
          { status: 400 }
        )
      }

      // Fetch vendor with detailed relations
      const { data: vendor, error } = await supabase
        .from('vendors')
        .select(`
          *,
          purchase_orders(
            id, po_number, status, total_amount, po_date, expected_delivery_date,
            purchase_request:purchase_requests(
              id, request_number, item_description, quantity,
              project:projects(id, name, status)
            )
          ),
          ratings:vendor_ratings(
            id, quality_score, delivery_score, communication_score, overall_score, 
            comments, created_at,
            project:projects(id, name),
            rater:user_profiles!rater_id(id, first_name, last_name, role)
          )
        `)
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json(
            { success: false, error: 'Vendor not found' },
            { status: 404 }
          )
        }
        console.error('Vendor fetch error:', error)
        return NextResponse.json(
          { success: false, error: 'Failed to fetch vendor' },
          { status: 500 }
        )
      }

      // Calculate detailed statistics
      const orders = vendor.purchase_orders || []
      const ratings = vendor.ratings || []

      // Order statistics
      const totalOrders = orders.length
      const totalSpent = orders.reduce((sum: number, order: any) => sum + order.total_amount, 0)
      const activeOrders = orders.filter((order: any) => 
        ['sent', 'confirmed', 'delivered'].includes(order.status)
      ).length
      const completedOrders = orders.filter((order: any) => order.status === 'completed').length

      // Rating statistics
      let averageRating = 0
      let averageQuality = 0
      let averageDelivery = 0
      let averageCommunication = 0

      if (ratings.length > 0) {
        averageRating = Number((ratings.reduce((sum: number, r: any) => sum + r.overall_score, 0) / ratings.length).toFixed(1))
        averageQuality = Number((ratings.reduce((sum: number, r: any) => sum + r.quality_score, 0) / ratings.length).toFixed(1))
        averageDelivery = Number((ratings.reduce((sum: number, r: any) => sum + r.delivery_score, 0) / ratings.length).toFixed(1))
        averageCommunication = Number((ratings.reduce((sum: number, r: any) => sum + r.communication_score, 0) / ratings.length).toFixed(1))
      }

      const enhancedVendor = {
        ...vendor,
        statistics: {
          total_orders: totalOrders,
          active_orders: activeOrders,
          completed_orders: completedOrders,
          total_spent: totalSpent,
          average_order_value: totalOrders > 0 ? Number((totalSpent / totalOrders).toFixed(2)) : 0,
          ratings_count: ratings.length,
          average_rating: averageRating,
          average_quality: averageQuality,
          average_delivery: averageDelivery,
          average_communication: averageCommunication
        }
      }

      const response: PurchaseApiResponse<{ vendor: Vendor }> = {
        success: true,
        data: {
          vendor: enhancedVendor
        }
      }

      return NextResponse.json(response)

    } catch (error) {
      console.error('Vendor fetch API error:', error)
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      )
    }
  })(request)
}

// ============================================================================
// PUT /api/purchase/vendors/[id] - Update vendor
// ============================================================================

export async function PUT(
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

      // Check edit permission (only purchase department and above)
      if (!hasPermission(user.role, 'procurement.edit') || 
          !['purchase_director', 'purchase_specialist', 'general_manager', 'admin'].includes(user.role)) {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions to edit vendors' },
          { status: 403 }
        )
      }

      const supabase = createServerClient()
      const { id } = params

      // Validate UUID format
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        return NextResponse.json(
          { success: false, error: 'Invalid vendor ID format' },
          { status: 400 }
        )
      }

      // Check if vendor exists
      const { data: existingVendor, error: fetchError } = await supabase
        .from('vendors')
        .select('id, company_name, email, is_active')
        .eq('id', id)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          return NextResponse.json(
            { success: false, error: 'Vendor not found' },
            { status: 404 }
          )
        }
        console.error('Vendor fetch error:', fetchError)
        return NextResponse.json(
          { success: false, error: 'Failed to fetch vendor' },
          { status: 500 }
        )
      }

      const body = await req.json()
      
      // Validate update data
      const validationResult = validatePurchaseInput(vendorUpdateSchema, body)
      if (!validationResult.success) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid update data',
            details: validationResult.error.errors.map(e => e.message)
          },
          { status: 400 }
        )
      }

      const updateData = validationResult.data

      // Check for duplicate company name or email (excluding current vendor)
      if (updateData.company_name || updateData.email) {
        const conditions = []
        if (updateData.company_name && updateData.company_name !== existingVendor.company_name) {
          conditions.push(`company_name.ilike.${updateData.company_name}`)
        }
        if (updateData.email && updateData.email !== existingVendor.email) {
          conditions.push(`email.eq.${updateData.email}`)
        }

        if (conditions.length > 0) {
          const { data: duplicateVendor } = await supabase
            .from('vendors')
            .select('id, company_name, email')
            .neq('id', id)
            .or(conditions.join(','))
            .limit(1)
            .single()

          if (duplicateVendor) {
            let errorMessage = 'Vendor already exists'
            if (duplicateVendor.company_name?.toLowerCase() === updateData.company_name?.toLowerCase()) {
              errorMessage = 'A vendor with this company name already exists'
            } else if (duplicateVendor.email === updateData.email) {
              errorMessage = 'A vendor with this email already exists'
            }
            
            return NextResponse.json(
              { success: false, error: errorMessage },
              { status: 400 }
            )
          }
        }
      }

      // If deactivating vendor, check for active orders
      if (updateData.is_active === false && existingVendor.is_active === true) {
        const { data: activeOrders } = await supabase
          .from('purchase_orders')
          .select('id')
          .eq('vendor_id', id)
          .in('status', ['sent', 'confirmed'])
          .limit(1)

        if (activeOrders && activeOrders.length > 0) {
          return NextResponse.json(
            { success: false, error: 'Cannot deactivate vendor with active purchase orders' },
            { status: 400 }
          )
        }
      }

      // Update vendor
      const { data: updatedVendor, error: updateError } = await supabase
        .from('vendors')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          purchase_orders(id, status, total_amount),
          ratings:vendor_ratings(id, overall_score)
        `)
        .single()

      if (updateError) {
        console.error('Vendor update error:', updateError)
        return NextResponse.json(
          { success: false, error: 'Failed to update vendor' },
          { status: 500 }
        )
      }

      // Calculate statistics for response
      const orders = updatedVendor.purchase_orders || []
      const ratings = updatedVendor.ratings || []
      
      const totalOrders = orders.length
      const totalSpent = orders.reduce((sum: number, order: any) => sum + order.total_amount, 0)
      const activeOrders = orders.filter((order: any) => 
        ['sent', 'confirmed', 'delivered'].includes(order.status)
      ).length

      let averageRating = 0
      if (ratings.length > 0) {
        averageRating = Number((ratings.reduce((sum: number, r: any) => sum + r.overall_score, 0) / ratings.length).toFixed(1))
      }

      const enhancedVendor = {
        ...updatedVendor,
        average_rating: averageRating,
        total_orders: totalOrders,
        total_spent: totalSpent,
        active_orders: activeOrders,
        ratings_count: ratings.length
      }

      const response: PurchaseApiResponse<{ vendor: Vendor }> = {
        success: true,
        message: 'Vendor updated successfully',
        data: {
          vendor: enhancedVendor
        }
      }

      return NextResponse.json(response)

    } catch (error) {
      console.error('Vendor update API error:', error)
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      )
    }
  })(request)
}
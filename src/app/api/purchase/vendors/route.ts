/**
 * Formula PM 2.0 Vendors API - Main Route
 * Purchase Department Workflow Implementation
 * 
 * Handles vendor listing and creation with role-based access control
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, getAuthenticatedUser } from '@/lib/middleware'
import { createServerClient } from '@/lib/supabase'
import { hasPermission } from '@/lib/permissions'
import { 
  vendorCreateSchema,
  vendorListParamsSchema,
  validatePurchaseInput,
  validatePurchaseListParams 
} from '@/lib/validation/purchase'
import { 
  Vendor, 
  PurchaseApiResponse, 
  PurchaseListResponse 
} from '@/types/purchase'

// ============================================================================
// GET /api/purchase/vendors - List vendors with filtering and pagination
// ============================================================================

export const GET = withAuth(async (request: NextRequest) => {
  try {
    const user = getAuthenticatedUser(request)
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

    const url = new URL(request.url)
    const queryParams = Object.fromEntries(url.searchParams.entries())
    
    // Validate parameters
    const validationResult = validatePurchaseListParams(vendorListParamsSchema, queryParams)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid parameters',
          details: validationResult.error.errors.map(e => e.message)
        },
        { status: 400 }
      )
    }

    const params = validationResult.data
    const supabase = createServerClient()

    // Build query with relations and ratings
    let query = supabase
      .from('vendors')
      .select(`
        *,
        purchase_orders(id, status, total_amount, created_at),
        ratings:vendor_ratings(
          id, quality_score, delivery_score, communication_score, overall_score,
          project:projects(id, name),
          rater:user_profiles!rater_id(id, first_name, last_name, role)
        )
      `, { count: 'exact' })

    // Apply filters
    if (params.is_active !== undefined) {
      query = query.eq('is_active', params.is_active)
    }

    if (params.search) {
      query = query.or(`company_name.ilike.%${params.search}%,contact_person.ilike.%${params.search}%,email.ilike.%${params.search}%`)
    }

    // Apply sorting
    if (params.sort_field === 'average_rating') {
      // For average rating sort, we'll need to handle it after fetching data
      query = query.order('company_name', { ascending: params.sort_direction === 'asc' })
    } else {
      query = query.order(params.sort_field, { ascending: params.sort_direction === 'asc' })
    }

    // Apply pagination
    const from = (params.page - 1) * params.limit
    const to = from + params.limit - 1
    query = query.range(from, to)

    const { data: vendors, error, count } = await query

    if (error) {
      console.error('Vendors fetch error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch vendors' },
        { status: 500 }
      )
    }

    // Calculate average ratings and enhance vendor data
    const enhancedVendors = vendors?.map(vendor => {
      const ratings = vendor.ratings || []
      
      let averageRating = 0
      if (ratings.length > 0) {
        const totalScore = ratings.reduce((sum: number, rating: any) => sum + rating.overall_score, 0)
        averageRating = Number((totalScore / ratings.length).toFixed(1))
      }

      // Calculate order statistics
      const orders = vendor.purchase_orders || []
      const totalOrders = orders.length
      const totalSpent = orders.reduce((sum: number, order: any) => sum + order.total_amount, 0)
      const activeOrders = orders.filter((order: any) => 
        ['sent', 'confirmed', 'delivered'].includes(order.status)
      ).length

      return {
        ...vendor,
        average_rating: averageRating,
        total_orders: totalOrders,
        total_spent: totalSpent,
        active_orders: activeOrders,
        ratings_count: ratings.length
      }
    }) || []

    // Apply rating filter if specified
    let filteredVendors = enhancedVendors
    if (params.rating_min !== undefined) {
      filteredVendors = enhancedVendors.filter(vendor => 
        vendor.average_rating >= params.rating_min!
      )
    }

    // Sort by average rating if requested
    if (params.sort_field === 'average_rating') {
      filteredVendors.sort((a, b) => {
        const order = params.sort_direction === 'asc' ? 1 : -1
        return (a.average_rating - b.average_rating) * order
      })
    }

    const response: PurchaseApiResponse<PurchaseListResponse<Vendor>> = {
      success: true,
      data: {
        vendors: filteredVendors
      },
      pagination: {
        page: params.page,
        limit: params.limit,
        total: count || 0,
        has_more: params.page * params.limit < (count || 0)
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Vendors API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// ============================================================================
// POST /api/purchase/vendors - Create new vendor
// ============================================================================

export const POST = withAuth(async (request: NextRequest) => {
  try {
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check create permission (only purchase department and above)
    if (!hasPermission(user.role, 'procurement.create') || 
        !['purchase_director', 'purchase_specialist', 'general_manager', 'admin'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to create vendors' },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // Validate vendor data
    const validationResult = validatePurchaseInput(vendorCreateSchema, body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid vendor data',
          details: validationResult.error.errors.map(e => e.message)
        },
        { status: 400 }
      )
    }

    const vendorData = validationResult.data
    const supabase = createServerClient()

    // Check for duplicate vendor (by company name or email)
    const { data: existingVendor } = await supabase
      .from('vendors')
      .select('id, company_name, email')
      .or(`company_name.ilike.${vendorData.company_name},email.eq.${vendorData.email}`)
      .limit(1)
      .single()

    if (existingVendor) {
      let errorMessage = 'Vendor already exists'
      if (existingVendor.company_name.toLowerCase() === vendorData.company_name.toLowerCase()) {
        errorMessage = 'A vendor with this company name already exists'
      } else if (existingVendor.email === vendorData.email) {
        errorMessage = 'A vendor with this email already exists'
      }
      
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      )
    }

    // Create vendor
    const { data: vendor, error: insertError } = await supabase
      .from('vendors')
      .insert({
        ...vendorData,
        is_active: true
      })
      .select(`
        *,
        purchase_orders(id, status, total_amount),
        ratings:vendor_ratings(id, overall_score)
      `)
      .single()

    if (insertError) {
      console.error('Vendor creation error:', insertError)
      return NextResponse.json(
        { success: false, error: 'Failed to create vendor' },
        { status: 500 }
      )
    }

    // Calculate initial statistics
    const enhancedVendor = {
      ...vendor,
      average_rating: 0,
      total_orders: 0,
      total_spent: 0,
      active_orders: 0,
      ratings_count: 0
    }

    const response: PurchaseApiResponse<{ vendor: Vendor }> = {
      success: true,
      message: 'Vendor created successfully',
      data: {
        vendor: enhancedVendor
      }
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('Vendor creation API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
})
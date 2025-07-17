/**
 * Formula PM 2.0 Excel Export API Endpoint
 * Wave 2B Business Logic Implementation
 * 
 * Handles Excel file export with role-based data filtering
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-middleware'
import { createServerClient } from '@/lib/supabase'
import { hasPermission } from '@/lib/permissions'
import * as XLSX from 'xlsx'
import { ScopeFilters } from '@/types/scope'

// ============================================================================
// GET /api/scope/excel/export - Export scope items to Excel
// ============================================================================

export const GET = withAuth(async (request: NextRequest, { user, profile }) => {
,
      { status: 401 }
    )
  }

  // Permission check
  if (!hasPermission(profile.role, 'projects.read.all')) {
    return createErrorResponse('Insufficient permissions to export Excel files' , 403)
  }

  try {

    const url = new URL(request.url)
    const projectId = url.searchParams.get('project_id')

    if (!projectId) {
      return createErrorResponse('project_id is required' , 400)
    }

    const supabase = createServerClient()

    // Verify user has access to the project
    const hasProjectAccess = await verifyProjectAccess(supabase, user, projectId)
    if (!hasProjectAccess) {
      return createErrorResponse('Access denied to this project' , 403)
    }

    // Parse filters from query parameters
    const filters: ScopeFilters = {
      category: url.searchParams.get('category') as any || undefined,
      status: url.searchParams.get('status')?.split(',') as any || undefined,
      assigned_to: url.searchParams.get('assigned_to')?.split(','),
      supplier_id: url.searchParams.get('supplier_id') || undefined,
      search_term: url.searchParams.get('search') || undefined
    }

    // Build query for scope items
    let query = supabase
      .from('scope_items')
      .select(`
        *,
        supplier:suppliers(name),
        created_by_user:user_profiles!created_by(first_name, last_name),
        project:projects(name)
      `)
      .eq('project_id', projectId)
      .order('category, item_no')

    // Apply filters
    if (filters.category && filters.category !== 'all') {
      query = query.eq('category', filters.category)
    }

    if (filters.status?.length) {
      query = query.in('status', filters.status)
    }

    if (filters.assigned_to?.length) {
      query = query.overlaps('assigned_to', filters.assigned_to)
    }

    if (filters.supplier_id) {
      query = query.eq('supplier_id', filters.supplier_id)
    }

    if (filters.search_term) {
      // Sanitize search input to prevent SQL injection
      const sanitizedSearch = filters.search_term.replace(/[%_\\]/g, '\\$&').substring(0, 100)
        query = query.or(`title.ilike.%${sanitizedSearch}%,description.ilike.%${sanitizedSearch}%,item_code.ilike.%${sanitizedSearch}%`)
    }

    const { data: scopeItems, error } = await query

    if (error) {
      console.error('Scope items fetch error:', error)
      return createErrorResponse('Failed to fetch scope items' , 500)
    }

    if (!scopeItems || scopeItems.length === 0) {
      return createErrorResponse('No scope items found for export' , 404)
    }

    // Determine what data to include based on permissions
    const canViewPricing = hasPermission(user.role, 'projects.read.all')
    const canViewCosts = hasPermission(user.role, 'projects.read.all')

    // Create Excel workbook
    const workbook = XLSX.utils.book_new()

    // Prepare headers based on permissions
    const headers = [
      'Item No',
      'Item Code',
      'Category',
      'Title',
      'Description',
      'Specifications',
      'Quantity',
      'Unit of Measure'
    ]

    if (canViewPricing) {
      headers.push('Unit Price', 'Markup %', 'Total Price', 'Final Price')
    }

    if (canViewCosts) {
      headers.push('Initial Cost', 'Actual Cost', 'Cost Variance')
    }

    headers.push(
      'Status',
      'Progress %',
      'Timeline Start',
      'Timeline End',
      'Duration Days',
      'Priority',
      'Risk Level',
      'Installation Method',
      'Drawing Reference',
      'Supplier',
      'Requires Client Approval',
      'Quality Check Required',
      'Client Approved',
      'Quality Check Passed',
      'Created By',
      'Created Date',
      'Updated Date'
    )

    // Prepare data rows
    const dataRows = scopeItems.map(item => {
      const row = [
        item.item_no,
        item.item_code || '',
        item.category,
        item.title,
        item.description,
        item.specifications || '',
        item.quantity,
        item.unit_of_measure
      ]

      if (canViewPricing) {
        row.push(
          item.unit_price || 0,
          item.markup_percentage || 0,
          item.total_price || (item.quantity * (item.unit_price || 0)),
          item.final_price || ((item.quantity * (item.unit_price || 0)) * (1 + (item.markup_percentage || 0) / 100))
        )
      }

      if (canViewCosts) {
        row.push(
          item.initial_cost || '',
          item.actual_cost || '',
          item.cost_variance || ''
        )
      }

      row.push(
        item.status,
        item.progress_percentage,
        item.timeline_start || '',
        item.timeline_end || '',
        item.duration_days || '',
        item.priority,
        item.risk_level,
        item.installation_method || '',
        item.drawing_reference || '',
        item.supplier?.name || '',
        item.requires_client_approval ? 'Yes' : 'No',
        item.quality_check_required ? 'Yes' : 'No',
        item.client_approved ? 'Yes' : 'No',
        item.quality_check_passed ? 'Yes' : 'No',
        item.created_by_user ? `${item.created_by_user.first_name} ${item.created_by_user.last_name}` : '',
        item.created_at ? new Date(item.created_at).toLocaleDateString() : '',
        item.updated_at ? new Date(item.updated_at).toLocaleDateString() : ''
      )

      return row
    })

    // Combine headers and data
    const worksheetData = [headers, ...dataRows]

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

    // Set column widths
    const colWidths = [
      { width: 8 },   // Item No
      { width: 12 },  // Item Code
      { width: 12 },  // Category
      { width: 30 },  // Title
      { width: 40 },  // Description
      { width: 30 },  // Specifications
      { width: 10 },  // Quantity
      { width: 12 }   // Unit of Measure
    ]

    if (canViewPricing) {
      colWidths.push(
        { width: 12 }, // Unit Price
        { width: 10 }, // Markup %
        { width: 12 }, // Total Price
        { width: 12 }  // Final Price
      )
    }

    if (canViewCosts) {
      colWidths.push(
        { width: 12 }, // Initial Cost
        { width: 12 }, // Actual Cost
        { width: 12 }  // Cost Variance
      )
    }

    colWidths.push(
      { width: 15 }, // Status
      { width: 10 }, // Progress %
      { width: 12 }, // Timeline Start
      { width: 12 }, // Timeline End
      { width: 10 }, // Duration Days
      { width: 8 },  // Priority
      { width: 10 }, // Risk Level
      { width: 20 }, // Installation Method
      { width: 15 }, // Drawing Reference
      { width: 20 }, // Supplier
      { width: 15 }, // Requires Client Approval
      { width: 15 }, // Quality Check Required
      { width: 12 }, // Client Approved
      { width: 15 }, // Quality Check Passed
      { width: 20 }, // Created By
      { width: 12 }, // Created Date
      { width: 12 }  // Updated Date
    )

    worksheet['!cols'] = colWidths

    // Style the header row
    const headerRange = XLSX.utils.decode_range(worksheet['!ref']!)
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
      if (!worksheet[cellAddress]) continue
      
      worksheet[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "E7E6E6" } },
        alignment: { horizontal: "center" }
      }
    }

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Scope Items')

    // Create summary worksheet if multiple categories
    const categories = [...new Set(scopeItems.map(item => item.category))]
    if (categories.length > 1) {
      const summaryData = [
        ['Category', 'Total Items', 'Completed', 'In Progress', 'Blocked', 'Completion %']
      ]

      categories.forEach(category => {
        const categoryItems = scopeItems.filter(item => item.category === category)
        const completed = categoryItems.filter(item => item.status === 'completed').length
        const inProgress = categoryItems.filter(item => item.status === 'in_progress').length
        const blocked = categoryItems.filter(item => item.status === 'blocked').length
        const completionPercent = categoryItems.length > 0 ? Math.round((completed / categoryItems.length) * 100) : 0

        summaryData.push([
          category.charAt(0).toUpperCase() + category.slice(1),
          categoryItems.length,
          completed,
          inProgress,
          blocked,
          `${completionPercent}%`
        ])
      })

      const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData)
      summaryWorksheet['!cols'] = [
        { width: 15 }, // Category
        { width: 12 }, // Total Items
        { width: 12 }, // Completed
        { width: 12 }, // In Progress
        { width: 10 }, // Blocked
        { width: 12 }  // Completion %
      ]

      XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary')
    }

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx',
      compression: true
    })

    // Generate filename
    const projectName = scopeItems[0]?.project?.name || 'project'
    const categoryFilter = filters.category && filters.category !== 'all' ? `-${filters.category}` : ''
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `scope-items-${projectName}${categoryFilter}-${timestamp}.xlsx`

    // Return Excel file
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': excelBuffer.length.toString()
      }
    })

  } catch (error) {
    console.error('Excel export API error:', error)
    return createErrorResponse('Internal server error during export' , 500)
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
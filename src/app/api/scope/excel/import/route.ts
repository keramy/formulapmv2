/**
 * Formula PM 2.0 Excel Import API Endpoint
 * Wave 2B Business Logic Implementation
 * 
 * Handles Excel file import with validation and error reporting
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, getAuthenticatedUser } from '@/lib/middleware'
import { createServerClient } from '@/lib/supabase'
import { hasPermission } from '@/lib/permissions'
import * as XLSX from 'xlsx'
import { 
  ExcelImportBatch,
  ExcelValidationError,
  ScopeItem,
  ScopeApiResponse
} from '@/types/scope'

// ============================================================================
// POST /api/scope/excel/import - Import scope items from Excel
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

    // Check import permission
    if (!hasPermission(user.role, 'scope.import_excel')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to import Excel files' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const projectId = formData.get('project_id') as string

    if (!file || !projectId) {
      return NextResponse.json(
        { success: false, error: 'File and project_id are required' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Please upload an Excel file (.xlsx or .xls)' },
        { status: 400 }
      )
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size too large. Maximum size is 10MB' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Verify user has access to the project
    const hasProjectAccess = await verifyProjectAccess(supabase, user, projectId)
    if (!hasProjectAccess) {
      return NextResponse.json(
        { success: false, error: 'Access denied to this project' },
        { status: 403 }
      )
    }

    // Process Excel file
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

    if (rawData.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Excel file must contain at least a header row and one data row' },
        { status: 400 }
      )
    }

    // Create import batch record
    const batchId = crypto.randomUUID()
    const batch: ExcelImportBatch = {
      id: batchId,
      project_id: projectId,
      filename: file.name,
      imported_by: user.id,
      import_date: new Date().toISOString(),
      total_rows: rawData.length - 1, // Exclude header
      successful_imports: 0,
      failed_imports: 0,
      validation_errors: []
    }

    // Parse header row to map columns
    const headers = rawData[0] as string[]
    const columnMapping = mapExcelColumns(headers)

    // Process data rows
    const processedItems: Partial<ScopeItem>[] = []
    const validationErrors: ExcelValidationError[] = []

    // Get next item number for this project
    const { data: maxItemNo } = await supabase
      .from('scope_items')
      .select('item_no')
      .eq('project_id', projectId)
      .order('item_no', { ascending: false })
      .limit(1)
      .single()

    let nextItemNo = (maxItemNo?.item_no || 0) + 1

    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i] as any[]
      const rowNumber = i + 1

      try {
        const scopeData = mapRowToScopeItem(row, columnMapping, nextItemNo, projectId, user.id)
        const validationResult = validateScopeItem(scopeData, rowNumber)

        if (validationResult.errors.length > 0) {
          validationErrors.push(...validationResult.errors)
          batch.failed_imports++
        } else {
          processedItems.push(scopeData)
          batch.successful_imports++
          nextItemNo++
        }
      } catch (error) {
        batch.failed_imports++
        validationErrors.push({
          row_number: rowNumber,
          column: 'general',
          error_message: error instanceof Error ? error.message : 'Unknown error processing row',
          error_type: 'invalid_format'
        })
      }
    }

    batch.validation_errors = validationErrors

    // Insert successful items into database
    if (processedItems.length > 0) {
      const { error: insertError } = await supabase
        .from('scope_items')
        .insert(processedItems)

      if (insertError) {
        console.error('Scope items insert error:', insertError)
        return NextResponse.json(
          { success: false, error: 'Failed to save scope items to database' },
          { status: 500 }
        )
      }
    }

    // Save import batch record
    const { error: batchError } = await supabase
      .from('excel_import_batches')
      .insert(batch)

    if (batchError) {
      console.error('Import batch insert error:', batchError)
      // Don't fail the whole operation for this
    }

    const response: ScopeApiResponse<ExcelImportBatch> = {
      success: true,
      data: batch
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Excel import API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error during import' },
      { status: 500 }
    )
  }
})

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function mapExcelColumns(headers: string[]): Record<string, number> {
  const mapping: Record<string, number> = {}
  
  headers.forEach((header, index) => {
    const normalized = header.toLowerCase().trim()
    
    // Map common column names
    if (normalized.includes('category')) mapping.category = index
    if (normalized.includes('item') && normalized.includes('code')) mapping.item_code = index
    if (normalized.includes('description')) mapping.description = index
    if (normalized.includes('title')) mapping.title = index
    if (normalized.includes('spec')) mapping.specifications = index
    if (normalized.includes('quantity') || normalized.includes('qty')) mapping.quantity = index
    if (normalized.includes('unit') && !normalized.includes('price')) mapping.unit_of_measure = index
    if (normalized.includes('unit') && normalized.includes('price')) mapping.unit_price = index
    if (normalized.includes('price') && !normalized.includes('unit')) mapping.unit_price = index
    if (normalized.includes('markup')) mapping.markup_percentage = index
    if (normalized.includes('initial') && normalized.includes('cost')) mapping.initial_cost = index
    if (normalized.includes('actual') && normalized.includes('cost')) mapping.actual_cost = index
    if (normalized.includes('start')) mapping.timeline_start = index
    if (normalized.includes('end')) mapping.timeline_end = index
    if (normalized.includes('priority')) mapping.priority = index
    if (normalized.includes('risk')) mapping.risk_level = index
    if (normalized.includes('installation')) mapping.installation_method = index
    if (normalized.includes('drawing') || normalized.includes('reference')) mapping.drawing_reference = index
  })
  
  return mapping
}

function mapRowToScopeItem(
  row: any[], 
  columnMapping: Record<string, number>, 
  itemNo: number,
  projectId: string,
  userId: string
): Partial<ScopeItem> {
  const getValue = (key: string) => {
    const index = columnMapping[key]
    return index !== undefined ? row[index] : undefined
  }

  const item: Partial<ScopeItem> = {
    project_id: projectId,
    item_no: itemNo,
    category: normalizeCategory(getValue('category')),
    item_code: getValue('item_code')?.toString() || null,
    description: getValue('description')?.toString() || '',
    title: getValue('title')?.toString() || getValue('description')?.toString() || '',
    specifications: getValue('specifications')?.toString() || '',
    quantity: parseFloat(getValue('quantity')) || 1,
    unit_of_measure: getValue('unit_of_measure')?.toString() || 'pcs',
    unit_price: parseFloat(getValue('unit_price')) || 0,
    markup_percentage: parseFloat(getValue('markup_percentage')) || 0,
    initial_cost: getValue('initial_cost') ? parseFloat(getValue('initial_cost')) : null,
    actual_cost: getValue('actual_cost') ? parseFloat(getValue('actual_cost')) : null,
    timeline_start: parseDate(getValue('timeline_start')),
    timeline_end: parseDate(getValue('timeline_end')),
    priority: parseInt(getValue('priority')) || 1,
    risk_level: normalizeRiskLevel(getValue('risk_level')),
    installation_method: getValue('installation_method')?.toString() || null,
    drawing_reference: getValue('drawing_reference')?.toString() || null,
    status: 'not_started',
    progress_percentage: 0,
    assigned_to: [],
    dependencies: [],
    special_requirements: [],
    requires_client_approval: false,
    client_approved: false,
    quality_check_required: true,
    quality_check_passed: false,
    created_by: userId,
    last_updated_by: userId,
    validation_errors: []
  }

  return item
}

function normalizeCategory(value: any): string {
  if (!value) return 'construction'
  
  const normalized = value.toString().toLowerCase().trim()
  
  if (normalized.includes('construct')) return 'construction'
  if (normalized.includes('mill') || normalized.includes('wood')) return 'millwork'
  if (normalized.includes('electric') || normalized.includes('power')) return 'electrical'
  if (normalized.includes('mechan') || normalized.includes('hvac')) return 'mechanical'
  
  // If it matches exactly
  if (['construction', 'millwork', 'electrical', 'mechanical'].includes(normalized)) {
    return normalized
  }
  
  return 'construction' // Default fallback
}

function normalizeRiskLevel(value: any): string {
  if (!value) return 'medium'
  
  const normalized = value.toString().toLowerCase().trim()
  
  if (['low', 'medium', 'high'].includes(normalized)) {
    return normalized
  }
  
  return 'medium' // Default fallback
}

function parseDate(value: any): string | null {
  if (!value) return null
  
  if (value instanceof Date) {
    return value.toISOString().split('T')[0]
  }
  
  if (typeof value === 'string') {
    const date = new Date(value)
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]
    }
  }
  
  // Try to parse Excel date number
  if (typeof value === 'number') {
    const date = new Date((value - 25569) * 86400 * 1000)
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]
    }
  }
  
  return null
}

function validateScopeItem(item: Partial<ScopeItem>, rowNumber: number): { 
  errors: ExcelValidationError[] 
} {
  const errors: ExcelValidationError[] = []

  // Required field validations
  if (!item.description || item.description.trim() === '') {
    errors.push({
      row_number: rowNumber,
      column: 'description',
      error_message: 'Description is required',
      error_type: 'required',
      suggested_fix: 'Add a description for this scope item'
    })
  }

  if (!item.category || !['construction', 'millwork', 'electrical', 'mechanical'].includes(item.category)) {
    errors.push({
      row_number: rowNumber,
      column: 'category',
      error_message: 'Category must be one of: construction, millwork, electrical, mechanical',
      error_type: 'invalid_format',
      suggested_fix: 'Use one of the valid category values'
    })
  }

  if (!item.quantity || item.quantity <= 0) {
    errors.push({
      row_number: rowNumber,
      column: 'quantity',
      error_message: 'Quantity must be a positive number',
      error_type: 'invalid_format',
      suggested_fix: 'Enter a positive number for quantity'
    })
  }

  if (item.unit_price !== undefined && item.unit_price < 0) {
    errors.push({
      row_number: rowNumber,
      column: 'unit_price',
      error_message: 'Unit price cannot be negative',
      error_type: 'invalid_format',
      suggested_fix: 'Enter a positive number or leave blank'
    })
  }

  if (item.markup_percentage !== undefined && (item.markup_percentage < 0 || item.markup_percentage > 100)) {
    errors.push({
      row_number: rowNumber,
      column: 'markup_percentage',
      error_message: 'Markup percentage must be between 0 and 100',
      error_type: 'invalid_format',
      suggested_fix: 'Enter a percentage between 0 and 100'
    })
  }

  if (item.priority !== undefined && (item.priority < 1 || item.priority > 10)) {
    errors.push({
      row_number: rowNumber,
      column: 'priority',
      error_message: 'Priority must be between 1 and 10',
      error_type: 'invalid_format',
      suggested_fix: 'Enter a number between 1 and 10'
    })
  }

  return { errors }
}

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
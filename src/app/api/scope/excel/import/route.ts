import { withAPI, getRequestData, createSuccessResponse, createErrorResponse } from '@/lib/enhanced-auth-middleware';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as ExcelJS from 'exceljs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Define valid enum values
const VALID_CATEGORIES = ['structural', 'mechanical', 'electrical', 'architectural', 'civil'];
const VALID_STATUSES = ['pending', 'approved', 'in_progress', 'completed', 'cancelled'];

// Excel column mapping
const EXCEL_COLUMNS = {
  itemNo: 'A',
  category: 'B', 
  itemCode: 'C',
  itemName: 'D',
  unit: 'E',
  quantity: 'F',
  specification: 'G',
  location: 'H',
  supplier: 'I',
  description: 'J',
  status: 'K',
  update: 'L'
};

interface ExcelRowData {
  itemNo?: number;
  category: string;
  itemCode?: string;
  itemName: string;
  unit: string;
  quantity: number;
  specification?: string;
  location?: string;
  supplier?: string;
  description: string;
  status: string;
  update?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
  value?: any;
}

interface ImportResult {
  success: boolean;
  imported: number;
  errors: ValidationError[];
  warnings: string[];
  suppliers: { [key: string]: string }; // supplier name -> id mapping
}

async function POSTOriginal(req: NextRequest) {
  const { user, profile } = getRequestData(req);
  
  try {
    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;
    
    if (!file) {
      return createErrorResponse('No file provided', 400);
    }
    
    if (!projectId) {
      return createErrorResponse('Project ID is required', 400);
    }
    
    // Validate file type
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      return createErrorResponse('Invalid file type. Please upload Excel files only (.xlsx, .xls)', 400);
    }
    
    // Verify project access
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .single();
      
    if (projectError || !project) {
      return createErrorResponse('Project not found or access denied', 403);
    }
    
    // Parse Excel file
    const buffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    
    const worksheet = workbook.getWorksheet(1); // Get first worksheet
    if (!worksheet) {
      return createErrorResponse('No worksheets found in the Excel file', 400);
    }
    
    // Process Excel data
    const result = await processExcelData(worksheet, projectId, user.id);
    
    if (result.success) {
      return createSuccessResponse({
        message: `Successfully imported ${result.imported} scope items`,
        imported: result.imported,
        errors: result.errors,
        warnings: result.warnings,
        suppliers: result.suppliers
      });
    } else {
      return createErrorResponse('Import failed with validation errors', 400, {
        errors: result.errors,
        warnings: result.warnings
      });
    }
    
  } catch (error) {
    console.error('Excel import error:', error);
    return createErrorResponse(
      'Failed to process Excel file: ' + (error instanceof Error ? error.message : 'Unknown error'),
      500
    );
  }
}

async function processExcelData(
  worksheet: ExcelJS.Worksheet, 
  projectId: string, 
  userId: string
): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    imported: 0,
    errors: [],
    warnings: [],
    suppliers: {}
  };
  
  const validRows: ExcelRowData[] = [];
  const rowCount = worksheet.rowCount;
  
  // Skip header row, start from row 2
  for (let rowNumber = 2; rowNumber <= rowCount; rowNumber++) {
    const row = worksheet.getRow(rowNumber);
    
    // Skip empty rows
    if (isEmptyRow(row)) continue;
    
    try {
      const rowData = parseExcelRow(row, rowNumber);
      const validation = validateRowData(rowData, rowNumber);
      
      if (validation.errors.length > 0) {
        result.errors.push(...validation.errors);
        continue;
      }
      
      if (validation.warnings.length > 0) {
        result.warnings.push(...validation.warnings);
      }
      
      validRows.push(rowData);
      
    } catch (error) {
      result.errors.push({
        row: rowNumber,
        field: 'general',
        message: `Error parsing row: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }
  
  // If there are validation errors, don't proceed
  if (result.errors.length > 0) {
    return result;
  }
  
  // Get supplier mappings
  const supplierMappings = await getSupplierMappings(validRows);
  result.suppliers = supplierMappings;
  
  // Get next item_no for the project
  const nextItemNo = await getNextItemNo(projectId);
  
  // Insert data using transaction
  try {
    const insertedItems = await insertScopeItems(validRows, projectId, userId, supplierMappings, nextItemNo);
    result.imported = insertedItems;
    result.success = true;
  } catch (error) {
    result.errors.push({
      row: 0,
      field: 'database',
      message: `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
  
  return result;
}

function isEmptyRow(row: ExcelJS.Row): boolean {
  return !row.hasValues || (row.values as any[]).every(value => !value || value.toString().trim() === '');
}

function parseExcelRow(row: ExcelJS.Row, rowNumber: number): ExcelRowData {
  const getValue = (column: string): any => {
    const cell = row.getCell(column);
    return cell.value;
  };
  
  return {
    itemNo: getValue(EXCEL_COLUMNS.itemNo) || undefined,
    category: getValue(EXCEL_COLUMNS.category)?.toString()?.trim() || '',
    itemCode: getValue(EXCEL_COLUMNS.itemCode)?.toString()?.trim() || undefined,
    itemName: getValue(EXCEL_COLUMNS.itemName)?.toString()?.trim() || '',
    unit: getValue(EXCEL_COLUMNS.unit)?.toString()?.trim() || '',
    quantity: parseFloat(getValue(EXCEL_COLUMNS.quantity)) || 0,
    specification: getValue(EXCEL_COLUMNS.specification)?.toString()?.trim() || undefined,
    location: getValue(EXCEL_COLUMNS.location)?.toString()?.trim() || undefined,
    supplier: getValue(EXCEL_COLUMNS.supplier)?.toString()?.trim() || undefined,
    description: getValue(EXCEL_COLUMNS.description)?.toString()?.trim() || '',
    status: getValue(EXCEL_COLUMNS.status)?.toString()?.trim()?.toLowerCase() || 'pending',
    update: getValue(EXCEL_COLUMNS.update)?.toString()?.trim() || undefined
  };
}

function validateRowData(data: ExcelRowData, rowNumber: number): {
  errors: ValidationError[];
  warnings: string[];
} {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];
  
  // Required fields validation
  if (!data.category) {
    errors.push({
      row: rowNumber,
      field: 'category',
      message: 'Category is required'
    });
  } else if (!VALID_CATEGORIES.includes(data.category.toLowerCase())) {
    errors.push({
      row: rowNumber,
      field: 'category',
      message: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
      value: data.category
    });
  }
  
  if (!data.itemName) {
    errors.push({
      row: rowNumber,
      field: 'itemName',
      message: 'Item Name is required'
    });
  }
  
  if (!data.unit) {
    errors.push({
      row: rowNumber,
      field: 'unit',
      message: 'Unit is required'
    });
  }
  
  if (!data.quantity || data.quantity <= 0) {
    errors.push({
      row: rowNumber,
      field: 'quantity',
      message: 'Quantity must be greater than 0',
      value: data.quantity
    });
  }
  
  if (!data.description) {
    errors.push({
      row: rowNumber,
      field: 'description', 
      message: 'Description is required'
    });
  }
  
  // Status validation
  if (data.status && !VALID_STATUSES.includes(data.status.toLowerCase())) {
    errors.push({
      row: rowNumber,
      field: 'status',
      message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
      value: data.status
    });
  }
  
  // Warnings
  if (!data.itemCode) {
    warnings.push(`Row ${rowNumber}: Item Code not provided, will use auto-generated code`);
  }
  
  if (!data.specification) {
    warnings.push(`Row ${rowNumber}: Specification not provided`);
  }
  
  return { errors, warnings };
}

async function getSupplierMappings(rows: ExcelRowData[]): Promise<{[key: string]: string}> {
  const supplierNamesSet = new Set(
    rows
      .map(row => row.supplier)
      .filter(name => name && name.trim() !== '')
  );
  const supplierNames = Array.from(supplierNamesSet);
  
  if (supplierNames.length === 0) {
    return {};
  }
  
  const { data: suppliers, error } = await supabase
    .from('suppliers')
    .select('id, name')
    .in('name', supplierNames);
    
  if (error) {
    console.error('Error fetching suppliers:', error);
    return {};
  }
  
  const mappings: {[key: string]: string} = {};
  suppliers?.forEach(supplier => {
    mappings[supplier.name] = supplier.id;
  });
  
  return mappings;
}

async function getNextItemNo(projectId: string): Promise<number> {
  const { data, error } = await supabase
    .from('scope_items')
    .select('item_no')
    .eq('project_id', projectId)
    .not('item_no', 'is', null)
    .order('item_no', { ascending: false })
    .limit(1);
    
  if (error) {
    console.error('Error getting next item number:', error);
    return 1;
  }
  
  return data && data.length > 0 ? (data[0].item_no || 0) + 1 : 1;
}

async function insertScopeItems(
  rows: ExcelRowData[],
  projectId: string,
  userId: string,
  supplierMappings: {[key: string]: string},
  startingItemNo: number
): Promise<number> {
  const itemsToInsert = rows.map((row, index) => {
    const supplierId = row.supplier ? supplierMappings[row.supplier] : undefined;
    
    return {
      project_id: projectId,
      item_no: row.itemNo || (startingItemNo + index),
      code: row.itemCode || `ITEM-${String(row.itemNo || (startingItemNo + index)).padStart(4, '0')}`,
      item_name: row.itemName,
      description: row.description,
      category: row.category.toLowerCase(),
      status: row.status.toLowerCase(),
      unit: row.unit,
      quantity: row.quantity,
      specification: row.specification,
      location: row.location,
      update_notes: row.update,
      created_by: userId,
      // Add supplier info to metadata if found
      metadata: supplierId ? { supplier_id: supplierId, supplier_name: row.supplier } : {}
    };
  });
  
  const { data, error } = await supabase
    .from('scope_items')
    .insert(itemsToInsert)
    .select('id');
    
  if (error) {
    console.error('Database insert error:', error);
    throw new Error(`Failed to insert scope items: ${error.message}`);
  }
  
  return data?.length || 0;
}

// Enhanced API exports with middleware
export const POST = withAPI(POSTOriginal, {
  roles: ['management', 'project_manager', 'technical_lead', 'purchase_manager']
});

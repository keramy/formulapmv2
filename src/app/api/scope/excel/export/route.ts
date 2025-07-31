import { withAuth } from '@/lib/api-middleware';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import ExcelJS from 'exceljs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Excel export implementation
async function exportScopeItemsToExcel(request: NextRequest, { user, profile }: any) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const location = searchParams.get('location');

    // Build query with filters
    let query = supabase
      .from('scope_items')
      .select(`
        *,
        project:projects(name, location),
        created_by_profile:user_profiles!created_by(full_name)
      `);

    // Apply filters
    if (projectId) {
      query = query.eq('project_id', projectId);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (category) {
      query = query.eq('category', category);
    }
    if (location) {
      query = query.eq('location', location);
    }

    // Order by project and item number
    query = query.order('created_at', { ascending: true });

    const { data: scopeItems, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ success: false, error: 'Failed to fetch scope items' }, { status: 500 });
    }

    if (!scopeItems || scopeItems.length === 0) {
      return NextResponse.json({ success: false, error: 'No scope items found' }, { status: 404 });
    }

    // Get project name for filename
    const projectName = scopeItems[0]?.project?.name || 'All Projects';
    const cleanProjectName = projectName.replace(/[^a-zA-Z0-9-_]/g, '_');
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `Scope_Items_${cleanProjectName}_${timestamp}.xlsx`;

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Formula PM';
    workbook.lastModifiedBy = profile.full_name || profile.email;
    workbook.created = new Date();
    workbook.modified = new Date();

    // Create main worksheet
    const worksheet = workbook.addWorksheet('Scope Items');

    // Define column headers and structure
    const columns = [
      { header: 'Item No', key: 'item_no', width: 12 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Item Code', key: 'code', width: 15 },
      { header: 'Item Name', key: 'item_name', width: 25 },
      { header: 'Unit', key: 'unit', width: 10 },
      { header: 'Qty', key: 'quantity', width: 12 },
      { header: 'Specification', key: 'specification', width: 30 },
      { header: 'Location', key: 'location', width: 20 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Unit Price', key: 'unit_price', width: 15 },
      { header: 'Total Price', key: 'total_price', width: 15 },
      { header: 'Update Notes', key: 'update_notes', width: 30 }
    ];

    worksheet.columns = columns;

    // Style the header row
    const headerRow = worksheet.getRow(1);
    headerRow.height = 25;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' } // Blue background
      };
      cell.font = {
        name: 'Calibri',
        size: 11,
        bold: true,
        color: { argb: 'FFFFFFFF' } // White text
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center'
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Add data rows
    let rowIndex = 2;
    scopeItems.forEach((item, index) => {
      const row = worksheet.getRow(rowIndex);
      
      // Set cell values
      row.getCell(1).value = item.item_no || (index + 1); // Auto-number if item_no is null
      row.getCell(2).value = item.category?.replace(/_/g, ' ').toUpperCase() || '';
      row.getCell(3).value = item.code || '';
      row.getCell(4).value = item.item_name || '';
      row.getCell(5).value = item.unit || '';
      row.getCell(6).value = parseFloat(item.quantity) || 0;
      row.getCell(7).value = item.specification || '';
      row.getCell(8).value = item.location || '';
      row.getCell(9).value = item.description || '';
      row.getCell(10).value = item.status?.replace(/_/g, ' ').toUpperCase() || '';
      row.getCell(11).value = parseFloat(item.unit_price) || 0;
      row.getCell(12).value = parseFloat(item.total_price) || 0;
      row.getCell(13).value = item.update_notes || '';

      // Apply formatting to data rows
      row.height = 20;
      row.eachCell((cell, colNumber) => {
        cell.font = {
          name: 'Calibri',
          size: 10
        };
        cell.alignment = {
          vertical: 'middle',
          wrapText: true
        };
        
        // Currency formatting for price columns
        if (colNumber === 11 || colNumber === 12) {
          cell.numFmt = '$#,##0.00';
          cell.alignment.horizontal = 'right';
        }
        
        // Quantity formatting
        if (colNumber === 6) {
          cell.numFmt = '#,##0.000';
          cell.alignment.horizontal = 'right';
        }
        
        // Center alignment for status and category
        if (colNumber === 2 || colNumber === 10) {
          cell.alignment.horizontal = 'center';
        }
        
        // Add borders
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        
        // Alternating row colors
        if (index % 2 === 1) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF2F2F2' } // Light gray
          };
        }
      });
      
      rowIndex++;
    });

    // Add summary sheet
    const summarySheet = workbook.addWorksheet('Summary');
    
    // Summary sheet headers
    summarySheet.getCell('A1').value = 'Project Summary';
    summarySheet.getCell('A1').font = { size: 16, bold: true };
    summarySheet.getCell('A1').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    summarySheet.getCell('A1').font.color = { argb: 'FFFFFFFF' };
    
    // Summary data
    let summaryRow = 3;
    summarySheet.getCell(`A${summaryRow}`).value = 'Export Date:';
    summarySheet.getCell(`B${summaryRow}`).value = new Date().toLocaleDateString();
    summaryRow++;
    
    summarySheet.getCell(`A${summaryRow}`).value = 'Exported By:';
    summarySheet.getCell(`B${summaryRow}`).value = profile.full_name || profile.email;
    summaryRow++;
    
    summarySheet.getCell(`A${summaryRow}`).value = 'Total Items:';
    summarySheet.getCell(`B${summaryRow}`).value = scopeItems.length;
    summaryRow++;
    
    summarySheet.getCell(`A${summaryRow}`).value = 'Project:';
    summarySheet.getCell(`B${summaryRow}`).value = projectName;
    summaryRow++;
    
    // Calculate totals
    const totalValue = scopeItems.reduce((sum, item) => sum + (parseFloat(item.total_price) || 0), 0);
    summarySheet.getCell(`A${summaryRow}`).value = 'Total Value:';
    summarySheet.getCell(`B${summaryRow}`).value = totalValue;
    summarySheet.getCell(`B${summaryRow}`).numFmt = '$#,##0.00';
    summaryRow++;
    
    // Status breakdown
    const statusCounts = scopeItems.reduce((acc, item) => {
      const status = item.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    summaryRow++;
    summarySheet.getCell(`A${summaryRow}`).value = 'Status Breakdown:';
    summarySheet.getCell(`A${summaryRow}`).font = { bold: true };
    summaryRow++;
    
    Object.entries(statusCounts).forEach(([status, count]) => {
      summarySheet.getCell(`A${summaryRow}`).value = `  ${status.replace(/_/g, ' ').toUpperCase()}:`;
      summarySheet.getCell(`B${summaryRow}`).value = count;
      summaryRow++;
    });
    
    // Style summary sheet
    summarySheet.columns = [
      { width: 20 },
      { width: 25 }
    ];

    // Generate Excel buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Return Excel file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.byteLength.toString()
      }
    });
    
  } catch (error) {
    console.error('Excel export error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to generate Excel export',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Export with authentication
export const GET = withAuth(exportScopeItemsToExcel, { permission: 'scope.read.full' });
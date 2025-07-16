// ============================================================================
// V3 Reports API - PDF Generation Route
// ============================================================================
// Built with optimization patterns: withAuth, createSuccessResponse, createErrorResponse
// Implements server-side PDF generation for reports
// ============================================================================

import { NextRequest } from 'next/server'
import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-middleware'
import { createServerClient } from '@/lib/supabase'

// ============================================================================
// POST /api/reports/[id]/generate-pdf - Generate PDF for report
// ============================================================================

export const POST = withAuth(async (request: NextRequest, context: { params: Promise<{ id: string }> }, { user, profile }) => {
  try {
    const params = await context.params
    const reportId = params.id

    const supabase = createServerClient()

    // Verify report exists and user has access
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select(`
        id,
        name,
        type,
        status,
        generated_by,
        generated_at,
        summary,
        report_period,
        project:projects!project_id (
          id,
          name,
          project_manager_id,
          location,
          client:clients!client_id (
            id,
            name
          )
        ),
        generated_by_profile:user_profiles!generated_by (
          id,
          full_name,
          email,
          role
        ),
        report_lines!report_lines_report_id_fkey (
          id,
          line_number,
          title,
          description,
          report_line_photos!report_line_photos_report_line_id_fkey (
            id,
            photo_url,
            caption
          )
        )
      `)
      .eq('id', reportId)
      .single()

    if (reportError || !report) {
      return createErrorResponse('Report not found or access denied', 404)
    }

    // Check if user can generate PDFs for this report
    if (report.generated_by !== user.id && 
        !['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin'].includes(profile.role)) {
      return createErrorResponse('Insufficient permissions to generate PDF', 403)
    }

    // Sort report lines by line_number
    if (report.report_lines) {
      report.report_lines.sort((a: any, b: any) => a.line_number - b.line_number)
    }

    try {
      // Generate PDF using PDFKit or similar library
      const pdfBuffer = await generateReportPDF(report)
      
      // Upload PDF to Supabase Storage
      const fileName = `report-${reportId}-${Date.now()}.pdf`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('report-pdfs')
        .upload(fileName, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true
        })

      if (uploadError) {
        console.error('Error uploading PDF:', uploadError)
        return createErrorResponse('Failed to upload PDF', 500)
      }

      // Get public URL for the PDF
      const { data: urlData } = supabase.storage
        .from('report-pdfs')
        .getPublicUrl(fileName)

      const pdfUrl = urlData.publicUrl

      // Update report with PDF URL
      const { data: updatedReport, error: updateError } = await supabase
        .from('reports')
        .update({ 
          pdf_url: pdfUrl,
          status: report.status === 'draft' ? 'pending_review' : report.status 
        })
        .eq('id', reportId)
        .select(`
          id,
          name,
          type,
          status,
          pdf_url,
          generated_by,
          generated_at,
          updated_at
        `)
        .single()

      if (updateError) {
        console.error('Error updating report with PDF URL:', updateError)
        return createErrorResponse('PDF generated but failed to update report', 500)
      }

      return createSuccessResponse({
        data: {
          report: updatedReport,
          pdf_url: pdfUrl
        },
        message: 'PDF generated successfully'
      })

    } catch (pdfError) {
      console.error('PDF generation error:', pdfError)
      return createErrorResponse('Failed to generate PDF', 500)
    }

  } catch (error) {
    console.error('Generate PDF error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}, {
  permission: 'reports.generate_pdf'
})

// ============================================================================
// PDF GENERATION FUNCTION
// ============================================================================

async function generateReportPDF(report: any): Promise<Buffer> {
  // TODO: Implement actual PDF generation using PDFKit or similar
  // For now, return a mock PDF buffer
  
  // This is a placeholder implementation
  // In a real implementation, you would:
  // 1. Install PDFKit: npm install pdfkit @types/pdfkit
  // 2. Create a proper PDF document with:
  //    - Header with company logo and report info
  //    - Table of contents
  //    - Each report line as a section
  //    - Photos embedded inline
  //    - Footer with page numbers
  
  const mockPDFContent = `
PDF Report: ${report.name}
Project: ${report.project?.name}
Generated by: ${report.generated_by_profile?.full_name}
Date: ${new Date(report.generated_at).toLocaleDateString()}

${report.summary ? `Summary: ${report.summary}` : ''}

Report Lines:
${report.report_lines?.map((line: any, index: number) => `
${index + 1}. ${line.title}
${line.description}
${line.report_line_photos?.length ? `Photos: ${line.report_line_photos.length} attached` : ''}
`).join('\n') || 'No content lines'}

Generated on ${new Date().toLocaleString()}
  `.trim()

  // Create a minimal PDF buffer (this is just for testing)
  // In production, use PDFKit to create a proper PDF
  return Buffer.from(mockPDFContent, 'utf-8')
}

// ============================================================================
// EXAMPLE REAL PDF GENERATION (commented out)
// ============================================================================

/*
import PDFDocument from 'pdfkit'

async function generateReportPDF(report: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument()
    const chunks: Buffer[] = []

    doc.on('data', chunk => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    // Header
    doc.fontSize(20).text(report.name, 50, 50)
    doc.fontSize(12).text(`Project: ${report.project?.name}`, 50, 80)
    doc.text(`Generated by: ${report.generated_by_profile?.full_name}`, 50, 95)
    doc.text(`Date: ${new Date(report.generated_at).toLocaleDateString()}`, 50, 110)

    let yPosition = 150

    // Summary
    if (report.summary) {
      doc.fontSize(14).text('Summary:', 50, yPosition)
      yPosition += 20
      doc.fontSize(11).text(report.summary, 50, yPosition, { width: 500 })
      yPosition += doc.heightOfString(report.summary, { width: 500 }) + 20
    }

    // Report Lines
    doc.fontSize(14).text('Report Details:', 50, yPosition)
    yPosition += 30

    report.report_lines?.forEach((line: any, index: number) => {
      // Check if we need a new page
      if (yPosition > 700) {
        doc.addPage()
        yPosition = 50
      }

      doc.fontSize(12).text(`${index + 1}. ${line.title}`, 50, yPosition)
      yPosition += 20
      
      doc.fontSize(10).text(line.description, 70, yPosition, { width: 450 })
      yPosition += doc.heightOfString(line.description, { width: 450 }) + 10

      // Add photo placeholders
      if (line.report_line_photos?.length > 0) {
        doc.fontSize(9).text(`Photos: ${line.report_line_photos.length} attached`, 70, yPosition)
        yPosition += 15
      }

      yPosition += 10
    })

    doc.end()
  })
}
*/
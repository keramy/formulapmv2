import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { supabase } from '@/lib/supabase'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, async (user) => {
    try {
      const { searchParams } = new URL(request.url)
      const version = searchParams.get('version')
      const download = searchParams.get('download') === 'true'

      // Get drawing information
      let query = supabase
        .from('shop_drawings')
        .select(`
          id,
          drawing_number,
          drawing_title,
          pdf_file_path,
          pdf_file_size,
          current_version,
          project_id,
          projects!inner(id, name)
        `)
        .eq('id', params.id)
        .single()

      const { data: drawing, error } = await query

      if (error || !drawing) {
        return NextResponse.json({ error: 'Shop drawing not found' }, { status: 404 })
      }

      let pdfPath = drawing.pdf_file_path
      let fileSize = drawing.pdf_file_size

      // If specific version requested, get that version's PDF
      if (version) {
        const { data: versionData, error: versionError } = await supabase
          .from('shop_drawing_versions')
          .select('pdf_file_path, pdf_file_size')
          .eq('shop_drawing_id', params.id)
          .eq('version_number', version)
          .single()

        if (versionError || !versionData) {
          return NextResponse.json({ error: 'Drawing version not found' }, { status: 404 })
        }

        pdfPath = versionData.pdf_file_path
        fileSize = versionData.pdf_file_size
      }

      if (!pdfPath) {
        return NextResponse.json({ error: 'PDF file not available' }, { status: 404 })
      }

      // Log access for analytics
      const isMobile = request.headers.get('user-agent')?.toLowerCase().includes('mobile') || false
      
      await supabase
        .from('shop_drawing_access_logs')
        .insert({
          shop_drawing_id: params.id,
          user_id: user.id,
          access_type: download ? 'download' : 'view',
          is_mobile_access: isMobile,
          device_type: isMobile ? 'mobile' : 'desktop',
          user_agent: request.headers.get('user-agent'),
          ip_address: request.ip,
          bandwidth_used: fileSize || 0
        })

      // Update download count if downloading
      if (download) {
        await supabase
          .from('shop_drawings')
          .update({ 
            download_count: (drawing as any).download_count + 1,
            last_accessed_at: new Date().toISOString()
          })
          .eq('id', params.id)
      }

      try {
        // In production, this would be served from cloud storage (S3, etc.)
        // For now, simulate serving from local storage
        const fullPath = join(process.cwd(), 'storage', pdfPath)
        const fileBuffer = await readFile(fullPath)

        const headers = new Headers({
          'Content-Type': 'application/pdf',
          'Content-Length': fileSize?.toString() || fileBuffer.length.toString(),
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
          'X-Drawing-Number': drawing.drawing_number,
          'X-Drawing-Title': drawing.drawing_title
        })

        // Set download headers if requested
        if (download) {
          const filename = `${drawing.drawing_number}_${drawing.drawing_title}.pdf`
            .replace(/[^a-zA-Z0-9._-]/g, '_')
          headers.set('Content-Disposition', `attachment; filename="${filename}"`)
        } else {
          headers.set('Content-Disposition', 'inline')
        }

        // For mobile optimization, add mobile-specific headers
        if (isMobile) {
          headers.set('X-Mobile-Optimized', 'true')
          headers.set('Vary', 'User-Agent')
        }

        return new Response(fileBuffer, {
          status: 200,
          headers
        })

      } catch (fileError) {
        console.error('Error reading PDF file:', fileError)
        
        // If file not found locally, try to get from Supabase storage
        const { data: fileData, error: storageError } = await supabase.storage
          .from('shop-drawings')
          .download(pdfPath)

        if (storageError || !fileData) {
          return NextResponse.json({ error: 'PDF file not accessible' }, { status: 404 })
        }

        const arrayBuffer = await fileData.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const headers = new Headers({
          'Content-Type': 'application/pdf',
          'Content-Length': buffer.length.toString(),
          'Cache-Control': 'public, max-age=3600',
          'X-Drawing-Number': drawing.drawing_number,
          'X-Drawing-Title': drawing.drawing_title
        })

        if (download) {
          const filename = `${drawing.drawing_number}_${drawing.drawing_title}.pdf`
            .replace(/[^a-zA-Z0-9._-]/g, '_')
          headers.set('Content-Disposition', `attachment; filename="${filename}"`)
        } else {
          headers.set('Content-Disposition', 'inline')
        }

        if (isMobile) {
          headers.set('X-Mobile-Optimized', 'true')
          headers.set('Vary', 'User-Agent')
        }

        return new Response(buffer, {
          status: 200,
          headers
        })
      }

    } catch (error) {
      console.error('Unexpected error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }, { requiredPermission: 'shop_drawings.view' })
}
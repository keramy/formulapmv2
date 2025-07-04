/**
 * Subcontractor Reports API Route
 * GET /api/subcontractor/reports - View own reports
 * POST /api/subcontractor/reports - Submit new report
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSubcontractorAuth, logSubcontractorActivity } from '@/lib/middleware/subcontractor-auth'

export async function GET(request: NextRequest) {
  try {
    // Get subcontractor authentication
    const subcontractorAuth = await getSubcontractorAuth(request)
    
    if (!subcontractorAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const projectId = searchParams.get('project_id')
    const status = searchParams.get('status')
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('subcontractor_reports')
      .select(`
        *,
        projects (
          id,
          name,
          status
        )
      `)
      .eq('subcontractor_id', subcontractorAuth.user.id)
      .order('created_at', { ascending: false })

    // Add filters
    if (projectId) {
      query = query.eq('project_id', projectId)
    }
    
    if (status) {
      query = query.eq('status', status)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: reports, error: reportsError } = await query

    if (reportsError) {
      console.error('Error fetching reports:', reportsError)
      return NextResponse.json(
        { error: 'Failed to fetch reports' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('subcontractor_reports')
      .select('*', { count: 'exact', head: true })
      .eq('subcontractor_id', subcontractorAuth.user.id)

    if (projectId) {
      countQuery = countQuery.eq('project_id', projectId)
    }
    
    if (status) {
      countQuery = countQuery.eq('status', status)
    }

    const { count } = await countQuery

    return NextResponse.json({
      reports: reports || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Reports GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get subcontractor authentication
    const subcontractorAuth = await getSubcontractorAuth(request)
    
    if (!subcontractorAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const projectId = formData.get('project_id') as string
    const reportDate = formData.get('report_date') as string
    const description = formData.get('description') as string
    const photos = formData.getAll('photos') as File[]

    // Basic validation
    if (!projectId || !reportDate || !description) {
      return NextResponse.json(
        { error: 'Project ID, report date, and description are required' },
        { status: 400 }
      )
    }

    // Validate that subcontractor has access to this project
    if (!subcontractorAuth.user.assigned_projects.includes(projectId)) {
      return NextResponse.json(
        { error: 'Access denied to this project' },
        { status: 403 }
      )
    }

    const supabase = createClient()

    // Upload photos if provided
    const photoUrls: string[] = []
    if (photos && photos.length > 0) {
      for (const photo of photos) {
        if (photo.size > 5 * 1024 * 1024) { // 5MB limit
          return NextResponse.json(
            { error: 'Photo size must be less than 5MB' },
            { status: 400 }
          )
        }

        const fileName = `${subcontractorAuth.user.id}/${Date.now()}-${photo.name}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('subcontractor-reports')
          .upload(fileName, photo)

        if (uploadError) {
          console.error('Photo upload error:', uploadError)
          return NextResponse.json(
            { error: 'Failed to upload photo' },
            { status: 500 }
          )
        }

        const { data: { publicUrl } } = supabase.storage
          .from('subcontractor-reports')
          .getPublicUrl(fileName)

        photoUrls.push(publicUrl)
      }
    }

    // Create report
    const { data: reportData, error: reportError } = await supabase
      .from('subcontractor_reports')
      .insert({
        subcontractor_id: subcontractorAuth.user.id,
        project_id: projectId,
        report_date: reportDate,
        description: description,
        photos: photoUrls,
        status: 'submitted'
      })
      .select(`
        *,
        projects (
          id,
          name,
          status
        )
      `)
      .single()

    if (reportError) {
      console.error('Report creation error:', reportError)
      return NextResponse.json(
        { error: 'Failed to create report' },
        { status: 500 }
      )
    }

    // Log activity
    await logSubcontractorActivity(
      subcontractorAuth.user.id,
      'report_submitted',
      { 
        report_id: reportData.id, 
        project_id: projectId,
        photos_count: photoUrls.length 
      },
      request.ip,
      request.headers.get('user-agent') || undefined
    )

    return NextResponse.json({
      success: true,
      report: reportData
    })

  } catch (error) {
    console.error('Report POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
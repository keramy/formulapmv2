import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

const CreateProgressPhotoSchema = z.object({
  photoFilePath: z.string().min(1),
  photoFileSize: z.number().positive(),
  thumbnailPath: z.string().optional(),
  description: z.string().max(500).optional(),
  locationNotes: z.string().max(255).optional(),
  isIssuePhoto: z.boolean().default(false),
  issueDescription: z.string().max(1000).optional(),
  issueSeverity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  photoSequence: z.number().positive().optional(),
  tags: z.array(z.string()).optional(),
  gpsCoordinates: z.object({
    latitude: z.number(),
    longitude: z.number()
  }).optional(),
  cameraInfo: z.object({
    make: z.string().optional(),
    model: z.string().optional(),
    settings: z.record(z.any()).optional()
  }).optional()
})

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, async (user) => {
    const { searchParams } = new URL(request.url)
    const issuesOnly = searchParams.get('issues') === 'true'
    const resolved = searchParams.get('resolved')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    try {
      // Verify drawing exists and user has access
      const { data: drawing, error: drawingError } = await supabase
        .from('shop_drawings')
        .select('id, drawing_number, drawing_title, project_id')
        .eq('id', params.id)
        .single()

      if (drawingError || !drawing) {
        return NextResponse.json({ error: 'Shop drawing not found' }, { status: 404 })
      }

      let query = supabase
        .from('shop_drawing_progress_photos')
        .select(`
          *,
          taken_by_user:user_profiles!shop_drawing_progress_photos_taken_by_fkey(user_id, email, full_name),
          resolved_by_user:user_profiles!shop_drawing_progress_photos_resolved_by_fkey(user_id, email, full_name)
        `)
        .eq('shop_drawing_id', params.id)
        .order('photo_sequence', { ascending: true })
        .order('taken_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (issuesOnly) {
        query = query.eq('is_issue_photo', true)
      }

      if (resolved !== null) {
        query = query.eq('issue_resolved', resolved === 'true')
      }

      const { data: photos, error, count } = await query

      if (error) {
        console.error('Error fetching progress photos:', error)
        return NextResponse.json({ error: 'Failed to fetch progress photos' }, { status: 500 })
      }

      // Get photo statistics
      const { data: stats, error: statsError } = await supabase
        .from('shop_drawing_progress_photos')
        .select('is_issue_photo, issue_resolved, issue_severity')
        .eq('shop_drawing_id', params.id)

      let photoStats = {
        total: 0,
        issues: 0,
        resolved: 0,
        severityBreakdown: { low: 0, medium: 0, high: 0, critical: 0 }
      }

      if (stats) {
        photoStats.total = stats.length
        photoStats.issues = stats.filter(s => s.is_issue_photo).length
        photoStats.resolved = stats.filter(s => s.is_issue_photo && s.issue_resolved).length
        
        photoStats.severityBreakdown = stats
          .filter(s => s.is_issue_photo && s.issue_severity)
          .reduce((acc, item) => {
            acc[item.issue_severity as keyof typeof acc] = (acc[item.issue_severity as keyof typeof acc] || 0) + 1
            return acc
          }, photoStats.severityBreakdown)
      }

      const totalPages = Math.ceil((count || 0) / limit)

      return NextResponse.json({
        photos,
        drawing: {
          id: drawing.id,
          drawing_number: drawing.drawing_number,
          drawing_title: drawing.drawing_title
        },
        pagination: {
          page,
          limit,
          total: count,
          totalPages
        },
        statistics: photoStats
      })

    } catch (error) {
      console.error('Unexpected error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }, { requiredPermission: 'shop_drawings.view' })
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, async (user) => {
    try {
      const body = await request.json()
      const validatedData = CreateProgressPhotoSchema.parse(body)

      // Verify drawing exists and user has access
      const { data: drawing, error: drawingError } = await supabase
        .from('shop_drawings')
        .select('id, drawing_number, drawing_title, project_id')
        .eq('id', params.id)
        .single()

      if (drawingError || !drawing) {
        return NextResponse.json({ error: 'Shop drawing not found' }, { status: 404 })
      }

      // Validate issue requirements
      if (validatedData.isIssuePhoto && !validatedData.issueDescription) {
        return NextResponse.json({ 
          error: 'Issue description is required for issue photos' 
        }, { status: 400 })
      }

      // Get next sequence number if not provided
      let photoSequence = validatedData.photoSequence
      if (!photoSequence) {
        const { data: lastPhoto, error: sequenceError } = await supabase
          .from('shop_drawing_progress_photos')
          .select('photo_sequence')
          .eq('shop_drawing_id', params.id)
          .order('photo_sequence', { ascending: false })
          .limit(1)
          .single()

        photoSequence = lastPhoto ? (lastPhoto.photo_sequence || 0) + 1 : 1
      }

      // Convert GPS coordinates to PostgreSQL POINT format
      let gpsPoint = null
      if (validatedData.gpsCoordinates) {
        gpsPoint = `(${validatedData.gpsCoordinates.longitude},${validatedData.gpsCoordinates.latitude})`
      }

      const { data: photo, error } = await supabase
        .from('shop_drawing_progress_photos')
        .insert({
          shop_drawing_id: params.id,
          photo_file_path: validatedData.photoFilePath,
          photo_file_size: validatedData.photoFileSize,
          thumbnail_path: validatedData.thumbnailPath,
          description: validatedData.description,
          location_notes: validatedData.locationNotes,
          taken_by: user.id,
          taken_at: new Date().toISOString(),
          is_issue_photo: validatedData.isIssuePhoto,
          issue_description: validatedData.issueDescription,
          issue_severity: validatedData.issueSeverity,
          photo_sequence: photoSequence,
          tags: validatedData.tags || [],
          gps_coordinates: gpsPoint,
          camera_info: validatedData.cameraInfo || {}
        })
        .select(`
          *,
          taken_by_user:user_profiles!shop_drawing_progress_photos_taken_by_fkey(user_id, email, full_name)
        `)
        .single()

      if (error) {
        console.error('Error creating progress photo:', error)
        return NextResponse.json({ error: 'Failed to upload progress photo' }, { status: 500 })
      }

      // Send notification if this is an issue photo
      if (validatedData.isIssuePhoto) {
        // Notify project team about the issue
        const { data: projectTeam, error: teamError } = await supabase
          .from('project_assignments')
          .select('user_id')
          .eq('project_id', drawing.project_id)
          .in('role', ['project_manager', 'general_manager', 'technical_director'])

        if (projectTeam && !teamError) {
          const notificationPromises = projectTeam.map(member => 
            supabase
              .from('notifications')
              .insert({
                user_id: member.user_id,
                type: 'shop_drawing_issue',
                title: 'Issue Reported on Shop Drawing',
                message: `Issue reported on drawing "${drawing.drawing_number}" - ${validatedData.issueDescription}`,
                metadata: {
                  drawing_id: params.id,
                  drawing_number: drawing.drawing_number,
                  photo_id: photo.id,
                  issue_severity: validatedData.issueSeverity || 'medium',
                  reported_by: user.id
                }
              })
          )
          await Promise.all(notificationPromises)
        }
      }

      return NextResponse.json(photo, { status: 201 })

    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 })
      }
      console.error('Unexpected error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }, { requiredPermission: 'shop_drawings.view' })
}
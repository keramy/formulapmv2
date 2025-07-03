import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { supabase } from '@/lib/supabase'
import { cache, CacheKeys } from '@/lib/cache'
import { z } from 'zod'

const CreateShopDrawingSchema = z.object({
  projectId: z.string().uuid(),
  drawingNumber: z.string().min(1).max(50),
  drawingTitle: z.string().min(1).max(255),
  drawingCategory: z.enum(['structural', 'mechanical', 'electrical', 'plumbing', 'architectural', 'general']),
  description: z.string().optional(),
  assignedTo: z.string().uuid().optional(),
  targetApprovalDate: z.string().datetime().optional(),
  pdfFilePath: z.string().optional(),
  pdfFileSize: z.number().optional(),
  thumbnailPath: z.string().optional()
})

const UpdateShopDrawingSchema = CreateShopDrawingSchema.partial()

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const assignedTo = searchParams.get('assignedTo')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Generate cache key
    const cacheKey = `shop_drawings:${user.id}:${projectId || 'all'}:${category || 'all'}:${status || 'all'}:${assignedTo || 'all'}:${page}:${limit}`
    
    // Try cache first
    const cached = cache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    try {
      let query = supabase
        .from('shop_drawings')
        .select(`
          *,
          projects!inner(id, name),
          created_by_user:user_profiles!shop_drawings_created_by_fkey(user_id, email, full_name),
          assigned_user:user_profiles!shop_drawings_assigned_to_fkey(user_id, email, full_name),
          current_approvals:shop_drawing_approvals(
            id,
            approver_role,
            approval_status,
            approval_date,
            comments,
            approver_user:user_profiles!shop_drawing_approvals_approver_user_id_fkey(user_id, email, full_name)
          ),
          progress_photos:shop_drawing_progress_photos(
            id,
            thumbnail_path,
            description,
            is_issue_photo,
            taken_at
          )
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (projectId) {
        query = query.eq('project_id', projectId)
      }

      if (category) {
        query = query.eq('drawing_category', category)
      }

      if (status) {
        query = query.eq('current_status', status)
      }

      if (assignedTo) {
        query = query.eq('assigned_to', assignedTo)
      }

      const { data: drawings, error, count } = await query

      if (error) {
        console.error('Error fetching shop drawings:', error)
        return NextResponse.json({ error: 'Failed to fetch shop drawings' }, { status: 500 })
      }

      // Get statistics
      const { data: stats, error: statsError } = await supabase
        .from('shop_drawings')
        .select('current_status, drawing_category')
        .eq('project_id', projectId || drawings?.[0]?.project_id)

      let statusStats = { draft: 0, submitted: 0, under_review: 0, approved: 0, rejected: 0, revision_required: 0 }
      let categoryStats = { structural: 0, mechanical: 0, electrical: 0, plumbing: 0, architectural: 0, general: 0 }

      if (stats) {
        statusStats = stats.reduce((acc, item) => {
          acc[item.current_status as keyof typeof acc] = (acc[item.current_status as keyof typeof acc] || 0) + 1
          return acc
        }, statusStats)

        categoryStats = stats.reduce((acc, item) => {
          acc[item.drawing_category as keyof typeof acc] = (acc[item.drawing_category as keyof typeof acc] || 0) + 1
          return acc
        }, categoryStats)
      }

      const totalPages = Math.ceil((count || 0) / limit)

      const result = {
        drawings,
        pagination: {
          page,
          limit,
          total: count,
          totalPages
        },
        statistics: {
          statusBreakdown: statusStats,
          categoryBreakdown: categoryStats,
          totalDrawings: count || 0
        }
      }

      // Cache for 3 minutes
      cache.set(cacheKey, result, 3 * 60 * 1000)

      return NextResponse.json(result)
    } catch (error) {
      console.error('Unexpected error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }, { requiredPermission: 'shop_drawings.view' })
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const body = await request.json()
      const validatedData = CreateShopDrawingSchema.parse(body)

      // Check if drawing number already exists in project
      const { data: existingDrawing, error: checkError } = await supabase
        .from('shop_drawings')
        .select('id')
        .eq('project_id', validatedData.projectId)
        .eq('drawing_number', validatedData.drawingNumber)
        .single()

      if (existingDrawing) {
        return NextResponse.json({ 
          error: 'Drawing number already exists in this project' 
        }, { status: 409 })
      }

      const { data: drawing, error } = await supabase
        .from('shop_drawings')
        .insert({
          project_id: validatedData.projectId,
          drawing_number: validatedData.drawingNumber,
          drawing_title: validatedData.drawingTitle,
          drawing_category: validatedData.drawingCategory,
          description: validatedData.description,
          assigned_to: validatedData.assignedTo,
          target_approval_date: validatedData.targetApprovalDate,
          pdf_file_path: validatedData.pdfFilePath,
          pdf_file_size: validatedData.pdfFileSize,
          thumbnail_path: validatedData.thumbnailPath,
          created_by: user.id
        })
        .select(`
          *,
          projects!inner(id, name),
          created_by_user:user_profiles!shop_drawings_created_by_fkey(user_id, email, full_name),
          assigned_user:user_profiles!shop_drawings_assigned_to_fkey(user_id, email, full_name)
        `)
        .single()

      if (error) {
        console.error('Error creating shop drawing:', error)
        return NextResponse.json({ error: 'Failed to create shop drawing' }, { status: 500 })
      }

      // Invalidate cache
      const patterns = [
        `shop_drawings:${user.id}:${validatedData.projectId}`,
        `shop_drawings:${user.id}:all`
      ]
      patterns.forEach(pattern => {
        const stats = cache.getStats()
        stats.keys.forEach(key => {
          if (key.startsWith(pattern)) {
            cache.delete(key)
          }
        })
      })

      return NextResponse.json(drawing, { status: 201 })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 })
      }
      console.error('Unexpected error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }, { requiredPermission: 'shop_drawings.create' })
}
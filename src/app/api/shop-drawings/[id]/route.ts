import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { supabase } from '@/lib/supabase'
import { InvalidateCache } from '@/lib/cache'
import { z } from 'zod'

const UpdateShopDrawingSchema = z.object({
  drawingTitle: z.string().min(1).max(255).optional(),
  drawingCategory: z.enum(['structural', 'mechanical', 'electrical', 'plumbing', 'architectural', 'general']).optional(),
  description: z.string().optional(),
  assignedTo: z.string().uuid().optional(),
  targetApprovalDate: z.string().datetime().optional(),
  currentStatus: z.enum(['draft', 'submitted', 'under_review', 'approved', 'rejected', 'revision_required']).optional()
})

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, async (user) => {
    try {
      const { data: drawing, error } = await supabase
        .from('shop_drawings')
        .select(`
          *,
          projects!inner(id, name),
          created_by_user:user_profiles!shop_drawings_created_by_fkey(user_id, email, full_name),
          assigned_user:user_profiles!shop_drawings_assigned_to_fkey(user_id, email, full_name),
          versions:shop_drawing_versions(
            id,
            version_number,
            pdf_file_path,
            pdf_file_size,
            thumbnail_path,
            revision_notes,
            is_current_version,
            created_at,
            created_by_user:user_profiles!shop_drawing_versions_created_by_fkey(user_id, email, full_name)
          ),
          approvals:shop_drawing_approvals(
            id,
            version_number,
            approver_role,
            approval_status,
            approval_date,
            comments,
            revision_requests,
            signature_data,
            approved_from_mobile,
            created_at,
            approver_user:user_profiles!shop_drawing_approvals_approver_user_id_fkey(user_id, email, full_name)
          ),
          progress_photos:shop_drawing_progress_photos(
            id,
            photo_file_path,
            thumbnail_path,
            description,
            location_notes,
            is_issue_photo,
            issue_description,
            issue_severity,
            issue_resolved,
            taken_at,
            photo_sequence,
            tags,
            taken_by_user:user_profiles!shop_drawing_progress_photos_taken_by_fkey(user_id, email, full_name)
          )
        `)
        .eq('id', params.id)
        .single()

      if (error) {
        console.error('Error fetching shop drawing:', error)
        if (error.code === 'PGRST116') {
          return NextResponse.json({ error: 'Shop drawing not found' }, { status: 404 })
        }
        return NextResponse.json({ error: 'Failed to fetch shop drawing' }, { status: 500 })
      }

      // Log access for analytics
      await supabase
        .from('shop_drawing_access_logs')
        .insert({
          shop_drawing_id: params.id,
          user_id: user.id,
          access_type: 'view',
          is_mobile_access: request.headers.get('user-agent')?.toLowerCase().includes('mobile') || false,
          device_type: request.headers.get('user-agent')?.toLowerCase().includes('mobile') ? 'mobile' : 'desktop',
          user_agent: request.headers.get('user-agent'),
          ip_address: request.ip
        })

      // Update last accessed timestamp
      await supabase
        .from('shop_drawings')
        .update({ last_accessed_at: new Date().toISOString() })
        .eq('id', params.id)

      return NextResponse.json(drawing)
    } catch (error) {
      console.error('Unexpected error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }, { requiredPermission: 'shop_drawings.view' })
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, async (user) => {
    try {
      const body = await request.json()
      const validatedData = UpdateShopDrawingSchema.parse(body)

      // Check if drawing exists and user has permission
      const { data: existingDrawing, error: checkError } = await supabase
        .from('shop_drawings')
        .select('id, created_by, project_id')
        .eq('id', params.id)
        .single()

      if (checkError || !existingDrawing) {
        return NextResponse.json({ error: 'Shop drawing not found' }, { status: 404 })
      }

      const { data: drawing, error } = await supabase
        .from('shop_drawings')
        .update({
          drawing_title: validatedData.drawingTitle,
          drawing_category: validatedData.drawingCategory,
          description: validatedData.description,
          assigned_to: validatedData.assignedTo,
          target_approval_date: validatedData.targetApprovalDate,
          current_status: validatedData.currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)
        .select(`
          *,
          projects!inner(id, name),
          created_by_user:user_profiles!shop_drawings_created_by_fkey(user_id, email, full_name),
          assigned_user:user_profiles!shop_drawings_assigned_to_fkey(user_id, email, full_name)
        `)
        .single()

      if (error) {
        console.error('Error updating shop drawing:', error)
        return NextResponse.json({ error: 'Failed to update shop drawing' }, { status: 500 })
      }

      // Invalidate cache
      InvalidateCache.project(existingDrawing.project_id)

      return NextResponse.json(drawing)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 })
      }
      console.error('Unexpected error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }, { requiredPermission: 'shop_drawings.edit' })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, async (user) => {
    try {
      // Check if drawing exists and user has permission
      const { data: drawing, error: checkError } = await supabase
        .from('shop_drawings')
        .select('id, created_by, project_id, current_status')
        .eq('id', params.id)
        .single()

      if (checkError || !drawing) {
        return NextResponse.json({ error: 'Shop drawing not found' }, { status: 404 })
      }

      // Only allow deletion if drawing is in draft status
      if (drawing.current_status !== 'draft') {
        return NextResponse.json({ 
          error: 'Can only delete drawings in draft status' 
        }, { status: 400 })
      }

      // Check if user is creator or has management permissions
      if (drawing.created_by !== user.id) {
        return NextResponse.json({ 
          error: 'You do not have permission to delete this drawing' 
        }, { status: 403 })
      }

      const { error } = await supabase
        .from('shop_drawings')
        .delete()
        .eq('id', params.id)

      if (error) {
        console.error('Error deleting shop drawing:', error)
        return NextResponse.json({ error: 'Failed to delete shop drawing' }, { status: 500 })
      }

      // Invalidate cache
      InvalidateCache.project(drawing.project_id)

      return NextResponse.json({ message: 'Shop drawing deleted successfully' })
    } catch (error) {
      console.error('Unexpected error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }, { requiredPermission: 'shop_drawings.delete' })
}
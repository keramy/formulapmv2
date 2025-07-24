/**
 * Notifications API - Real database integration
 * Uses withAuth pattern from Kiro's optimizations
 * Connected to notifications table in database
 */

import { NextRequest } from 'next/server'
import { withAuth, createSuccessResponse, createErrorResponse, parseQueryParams, createPagination } from '@/lib/api-middleware'
import { createClient } from '@/lib/supabase/server'

interface Notification {
  id: string
  type: string
  category: string
  title: string
  message: string
  timestamp: string
  read: boolean
  actionUrl?: string
  actionText?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  from?: {
    name: string
    role: string
  }
}

// Helper functions to map database values to frontend expectations
const mapNotificationTypeToCategory = (type: string): string => {
  const typeMap: Record<string, string> = {
    'task_assigned': 'info',
    'document_approval_required': 'warning',
    'document_approved': 'success',
    'document_rejected': 'error',
    'project_update': 'info',
    'milestone_completed': 'success',
    'system_maintenance': 'info',
    'mention': 'info'
  }
  return typeMap[type] || 'info'
}

const mapEntityTypeToCategory = (entityType: string | null): string => {
  const entityMap: Record<string, string> = {
    'project': 'project',
    'task': 'task',
    'document': 'approval',
    'user': 'system',
    'client': 'client'
  }
  return entityMap[entityType || ''] || 'system'
}

// GET /api/notifications - List user notifications
export const GET = withAuth(async (request: NextRequest, { user, profile }) => {
  const { page, limit, search, filters } = parseQueryParams(request)
  
  try {
    const supabase = await createClient()
    
    // Build query for user notifications
    let query = supabase
      .from('notifications')
      .select(`
        id,
        type,
        priority,
        title,
        message,
        entity_type,
        entity_id,
        action_url,
        is_read,
        read_at,
        metadata,
        created_at
      `, { count: 'exact' })
      .eq('user_id', profile.id)
    
    // Apply read status filter
    if (filters.read !== undefined) {
      const readFilter = filters.read === 'true'
      query = query.eq('is_read', readFilter)
    }
    
    // Apply search filter
    if (search) {
      query = query.or(`title.ilike.%${search}%,message.ilike.%${search}%`)
    }
    
    // Apply sorting (newest first)
    query = query.order('created_at', { ascending: false })
    
    // Apply pagination
    const from = (page - 1) * limit
    query = query.range(from, from + limit - 1)
    
    const { data: notifications, error, count } = await query
    
    if (error) {
      console.error('Error fetching notifications:', error)
      return createErrorResponse('Failed to fetch notifications', 500)
    }
    
    // Transform data to match frontend expectations
    const transformedNotifications = notifications?.map(notification => ({
      id: notification.id,
      type: mapNotificationTypeToCategory(notification.type),
      category: mapEntityTypeToCategory(notification.entity_type),
      title: notification.title,
      message: notification.message,
      timestamp: notification.created_at,
      read: notification.is_read,
      actionUrl: notification.action_url,
      actionText: notification.action_url ? 'View Details' : undefined,
      priority: notification.priority,
      from: {
        name: 'System',
        role: 'Automated'
      }
    })) || []
    
    return createSuccessResponse(
      transformedNotifications,
      createPagination(page, limit, count || 0)
    )
    
  } catch (error) {
    console.error('Notifications API error:', error)
    return createErrorResponse('Internal server error', 500)
  }
})

// PATCH /api/notifications - Mark multiple notifications as read/unread
export const PATCH = withAuth(async (request: NextRequest, { user, profile }) => {
  try {
    const body = await request.json()
    const { ids, read } = body
    
    if (typeof read !== 'boolean') {
      return createErrorResponse('Read status must be a boolean', 400)
    }
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return createErrorResponse('IDs array is required', 400)
    }
    
    const supabase = await createClient()
    
    // Update multiple notifications
    const { error } = await supabase
      .from('notifications')
      .update({ 
        is_read: read,
        read_at: read ? new Date().toISOString() : null
      })
      .in('id', ids)
      .eq('user_id', profile.id) // Ensure user can only update their own notifications
    
    if (error) {
      console.error('Error updating notifications:', error)
      return createErrorResponse('Failed to update notifications', 500)
    }
    
    return createSuccessResponse({ 
      message: `${ids.length} notification(s) marked as ${read ? 'read' : 'unread'}`,
      updated_count: ids.length
    })
    
  } catch (error) {
    console.error('Notification update error:', error)
    return createErrorResponse('Internal server error', 500)
  }
})

// POST /api/notifications - Create new notification (system/admin use)
export const POST = withAuth(async (request: NextRequest, { user, profile }) => {
  try {
    const body = await request.json()
    
    // Validate required fields
    const requiredFields = ['user_id', 'type', 'title', 'message', 'priority']
    for (const field of requiredFields) {
      if (!body[field]) {
        return createErrorResponse(`${field} is required`, 400)
      }
    }
    
    const supabase = await createClient()
    
    // Create notification record
    const notificationData = {
      user_id: body.user_id,
      type: body.type,
      priority: body.priority,
      title: body.title,
      message: body.message,
      entity_type: body.entity_type || null,
      entity_id: body.entity_id || null,
      action_url: body.action_url || null,
      metadata: body.metadata || {}
    }
    
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating notification:', error)
      return createErrorResponse('Failed to create notification', 500)
    }
    
    // Transform to frontend format
    const transformedNotification = {
      id: notification.id,
      type: mapNotificationTypeToCategory(notification.type),
      category: mapEntityTypeToCategory(notification.entity_type),
      title: notification.title,
      message: notification.message,
      timestamp: notification.created_at,
      read: notification.is_read,
      actionUrl: notification.action_url,
      actionText: notification.action_url ? 'View Details' : undefined,
      priority: notification.priority,
      from: {
        name: profile.first_name + ' ' + profile.last_name,
        role: profile.role
      }
    }
    
    return createSuccessResponse(transformedNotification)
    
  } catch (error) {
    console.error('Notification creation error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}, { permission: 'system.admin' })
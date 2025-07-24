/**
 * Individual Notification API - CRUD operations for specific notifications
 * Uses withAuth pattern from Kiro's optimizations
 */

import { NextRequest } from 'next/server'
import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-middleware'
import { createClient } from '@/lib/supabase/server'

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

// GET /api/notifications/[id] - Get specific notification
export const GET = withAuth(async (request: NextRequest, { user, profile }, { params }) => {
  const notificationId = params.id
  
  if (!notificationId) {
    return createErrorResponse('Notification ID is required', 400)
  }
  
  try {
    const supabase = await createClient()
    
    const { data: notification, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .eq('user_id', profile.id) // Ensure user can only access their own notifications
      .single()
    
    if (error || !notification) {
      return createErrorResponse('Notification not found', 404)
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
        name: 'System',
        role: 'Automated'
      }
    }
    
    return createSuccessResponse(transformedNotification)
    
  } catch (error) {
    console.error('Get notification error:', error)
    return createErrorResponse('Internal server error', 500)
  }
})

// PUT /api/notifications/[id] - Update specific notification
export const PUT = withAuth(async (request: NextRequest, { user, profile }, { params }) => {
  const notificationId = params.id
  
  if (!notificationId) {
    return createErrorResponse('Notification ID is required', 400)
  }
  
  try {
    const body = await request.json()
    const supabase = await createClient()
    
    // Check if notification exists and belongs to user
    const { data: existingNotification, error: fetchError } = await supabase
      .from('notifications')
      .select('id')
      .eq('id', notificationId)
      .eq('user_id', profile.id)
      .single()
    
    if (fetchError || !existingNotification) {
      return createErrorResponse('Notification not found', 404)
    }
    
    // Prepare update data (only allow updating specific fields)
    const updateData: any = {}
    
    if (typeof body.is_read === 'boolean') {
      updateData.is_read = body.is_read
      updateData.read_at = body.is_read ? new Date().toISOString() : null
    }
    
    if (body.metadata) {
      updateData.metadata = body.metadata
    }
    
    if (Object.keys(updateData).length === 0) {
      return createErrorResponse('No valid fields to update', 400)
    }
    
    const { data: notification, error } = await supabase
      .from('notifications')
      .update(updateData)
      .eq('id', notificationId)
      .eq('user_id', profile.id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating notification:', error)
      return createErrorResponse('Failed to update notification', 500)
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
        name: 'System',
        role: 'Automated'
      }
    }
    
    return createSuccessResponse(transformedNotification)
    
  } catch (error) {
    console.error('Update notification error:', error)
    return createErrorResponse('Internal server error', 500)
  }
})

// PATCH /api/notifications/[id] - Mark notification as read/unread
export const PATCH = withAuth(async (request: NextRequest, { user, profile }, { params }) => {
  const notificationId = params.id
  
  if (!notificationId) {
    return createErrorResponse('Notification ID is required', 400)
  }
  
  try {
    const body = await request.json()
    const supabase = await createClient()
    
    // Check if notification exists and belongs to user
    const { data: existingNotification, error: fetchError } = await supabase
      .from('notifications')
      .select('id')
      .eq('id', notificationId)
      .eq('user_id', profile.id)
      .single()
    
    if (fetchError || !existingNotification) {
      return createErrorResponse('Notification not found', 404)
    }
    
    // Prepare update data - accept both 'read' and 'is_read' for flexibility
    const isRead = body.read !== undefined ? body.read : body.is_read
    
    if (typeof isRead !== 'boolean') {
      return createErrorResponse('read field must be a boolean', 400)
    }
    
    const updateData = {
      is_read: isRead,
      read_at: isRead ? new Date().toISOString() : null
    }
    
    const { data: notification, error } = await supabase
      .from('notifications')
      .update(updateData)
      .eq('id', notificationId)
      .eq('user_id', profile.id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating notification:', error)
      return createErrorResponse('Failed to update notification', 500)
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
        name: 'System',
        role: 'Automated'
      }
    }
    
    return createSuccessResponse(transformedNotification)
    
  } catch (error) {
    console.error('Update notification read status error:', error)
    return createErrorResponse('Internal server error', 500)
  }
})

// DELETE /api/notifications/[id] - Delete specific notification
export const DELETE = withAuth(async (request: NextRequest, { user, profile }, { params }) => {
  const notificationId = params.id
  
  if (!notificationId) {
    return createErrorResponse('Notification ID is required', 400)
  }
  
  try {
    const supabase = await createClient()
    
    // Delete notification (only if it belongs to the user)
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', profile.id)
    
    if (error) {
      console.error('Error deleting notification:', error)
      return createErrorResponse('Failed to delete notification', 500)
    }
    
    return createSuccessResponse({ 
      message: 'Notification deleted successfully',
      id: notificationId
    })
    
  } catch (error) {
    console.error('Delete notification error:', error)
    return createErrorResponse('Internal server error', 500)
  }
})
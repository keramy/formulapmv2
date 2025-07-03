/**
 * Formula PM 2.0 Task Comments Component
 * Threaded comment system with @mention support and real-time updates
 */

'use client'

import React, { useState } from 'react'
import { Task, TaskComment } from '@/types/tasks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  MessageCircle, 
  Reply, 
  MoreHorizontal, 
  Heart, 
  ThumbsUp,
  Edit,
  Trash,
  Paperclip,
  Send
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { useTaskComments } from '@/hooks/useTasks'
import { MentionEditor } from './MentionEditor'

interface TaskCommentsProps {
  task: Task
  projectId: string
}

interface CommentItemProps {
  comment: TaskComment
  taskId: string
  projectId: string
  onReply: (commentId: string) => void
  onEdit: (comment: TaskComment) => void
  onDelete: (comment: TaskComment) => void
  level?: number
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  taskId,
  projectId,
  onReply,
  onEdit,
  onDelete,
  level = 0
}) => {
  const { profile } = useAuth()
  const [showActions, setShowActions] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)

  const canEdit = comment.user_id === profile?.id
  const canDelete = comment.user_id === profile?.id

  const handleEdit = () => {
    setIsEditing(true)
    setEditContent(comment.content)
  }

  const handleSaveEdit = () => {
    // TODO: Implement comment editing
    onEdit({ ...comment, content: editContent })
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditContent(comment.content)
  }

  return (
    <div className={`${level > 0 ? 'ml-8 border-l-2 border-gray-100 pl-4' : ''}`}>
      <div className="flex space-x-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback>
            {comment.user?.first_name?.[0]}{comment.user?.last_name?.[0]}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="bg-gray-50 rounded-lg px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-sm text-gray-900">
                  {comment.user?.first_name} {comment.user?.last_name}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </span>
                {comment.is_edited && (
                  <Badge variant="outline" className="text-xs">
                    edited
                  </Badge>
                )}
              </div>

              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowActions(!showActions)}
                  className="h-6 w-6 p-0"
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>

                {showActions && (
                  <div className="absolute right-0 top-6 z-10 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-32">
                    <button
                      onClick={() => {
                        onReply(comment.id)
                        setShowActions(false)
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <Reply className="h-4 w-4" />
                      <span>Reply</span>
                    </button>

                    {canEdit && (
                      <button
                        onClick={() => {
                          handleEdit()
                          setShowActions(false)
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <Edit className="h-4 w-4" />
                        <span>Edit</span>
                      </button>
                    )}

                    {canDelete && (
                      <button
                        onClick={() => {
                          onDelete(comment)
                          setShowActions(false)
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 text-red-600 flex items-center space-x-2"
                      >
                        <Trash className="h-4 w-4" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-3">
                <MentionEditor
                  value={editContent}
                  onChange={setEditContent}
                  projectId={projectId}
                  placeholder="Edit your comment..."
                  className="text-sm"
                />
                <div className="flex space-x-2">
                  <Button size="sm" onClick={handleSaveEdit}>
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-700 whitespace-pre-wrap">
                {comment.content}
              </div>
            )}

            {/* Comment attachments */}
            {comment.attachments && comment.attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {comment.attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center space-x-2 text-sm">
                    <Paperclip className="h-4 w-4 text-gray-400" />
                    <a 
                      href={attachment.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {attachment.filename}
                    </a>
                    <span className="text-gray-500">
                      ({Math.round((attachment.file_size || 0) / 1024)}KB)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Comment reactions */}
          {comment.reactions && comment.reactions.length > 0 && (
            <div className="mt-2 flex items-center space-x-2">
              <div className="flex space-x-1">
                {comment.reactions.map((reaction) => (
                  <button
                    key={reaction.id}
                    className="flex items-center space-x-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs"
                  >
                    <span>{getReactionEmoji(reaction.reaction_type)}</span>
                    <span>1</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reply action */}
          <div className="mt-2 flex items-center space-x-4">
            <button
              onClick={() => onReply(comment.id)}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1"
            >
              <Reply className="h-4 w-4" />
              <span>Reply</span>
            </button>

            <button className="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1">
              <ThumbsUp className="h-4 w-4" />
              <span>Like</span>
            </button>
          </div>

          {/* Nested replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-4">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  taskId={taskId}
                  projectId={projectId}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  level={level + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export const TaskComments: React.FC<TaskCommentsProps> = ({ task, projectId }) => {
  const { profile } = useAuth()
  const { canComment } = usePermissions()
  const { comments, loading, createComment } = useTaskComments(task.id)
  
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !profile) return

    setIsSubmitting(true)
    try {
      await createComment({
        content: newComment,
        parent_comment_id: replyingTo
      })
      
      setNewComment('')
      setReplyingTo(null)
    } catch (error) {
      console.error('Failed to create comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReply = (commentId: string) => {
    setReplyingTo(commentId)
  }

  const handleEditComment = (comment: TaskComment) => {
    // TODO: Implement comment editing
    console.log('Edit comment:', comment)
  }

  const handleDeleteComment = (comment: TaskComment) => {
    // TODO: Implement comment deletion
    console.log('Delete comment:', comment)
  }

  if (!canComment()) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          You don't have permission to view comments on this task.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageCircle className="h-5 w-5" />
          <span>Comments</span>
          <Badge variant="secondary">{task.comments_count}</Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* New Comment Editor */}
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {profile?.first_name?.[0]}{profile?.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <MentionEditor
                value={newComment}
                onChange={setNewComment}
                placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
                projectId={projectId}
                className="min-h-[80px]"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Paperclip className="h-4 w-4 mr-2" />
                Attach File
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              {replyingTo && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyingTo(null)}
                >
                  Cancel Reply
                </Button>
              )}
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmitting}
                size="sm"
              >
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Posting...' : replyingTo ? 'Reply' : 'Comment'}
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        {/* Comments List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="flex space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                taskId={task.id}
                projectId={projectId}
                onReply={handleReply}
                onEdit={handleEditComment}
                onDelete={handleDeleteComment}
              />
            ))}
            
            {comments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No comments yet. Be the first to start the discussion!</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Helper function to get emoji for reaction type
function getReactionEmoji(reactionType: string): string {
  const emojis = {
    like: '👍',
    love: '❤️',
    thumbs_up: '👍',
    thumbs_down: '👎',
    celebrate: '🎉',
    confused: '😕'
  }
  return emojis[reactionType as keyof typeof emojis] || '👍'
}
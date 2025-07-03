/**
 * Client Communication Hub Component
 * Central messaging interface for client-team communication
 * Mobile-first responsive design with real-time updates
 */

'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  MessageSquare, 
  Send, 
  Plus, 
  Search, 
  Filter,
  Paperclip,
  MoreHorizontal,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
  Calendar
} from 'lucide-react'
import { 
  ClientCommunicationThread, 
  ClientMessage, 
  ClientThreadType, 
  ClientThreadStatus,
  ClientPriority
} from '@/types/client-portal'
import { useClientCommunications } from '@/hooks/useClientPortal'
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface ClientCommunicationHubProps {
  projectId?: string
  onThreadSelect?: (threadId: string) => void
  mobileOptimized?: boolean
}

export const ClientCommunicationHub: React.FC<ClientCommunicationHubProps> = ({
  projectId,
  onThreadSelect,
  mobileOptimized = true
}) => {
  const {
    threads,
    loading,
    error,
    fetchThreads,
    createThread,
    sendMessage,
    markThreadAsRead
  } = useClientCommunications(projectId)

  const [selectedThread, setSelectedThread] = useState<ClientCommunicationThread | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<ClientThreadStatus | 'all'>('all')
  const [filterType, setFilterType] = useState<ClientThreadType | 'all'>('all')
  const [newThreadDialogOpen, setNewThreadDialogOpen] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [newThreadData, setNewThreadData] = useState({
    subject: '',
    thread_type: 'general' as ClientThreadType,
    priority: 'medium' as ClientPriority,
    message_body: ''
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Thread type configurations
  const threadTypeConfig: Record<ClientThreadType, {
    icon: React.ReactNode
    color: string
    bgColor: string
    label: string
  }> = {
    general: {
      icon: <MessageSquare className="w-4 h-4" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      label: 'General'
    },
    technical: {
      icon: <Users className="w-4 h-4" />,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      label: 'Technical'
    },
    commercial: {
      icon: <Calendar className="w-4 h-4" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      label: 'Commercial'
    },
    quality: {
      icon: <CheckCircle className="w-4 h-4" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      label: 'Quality'
    },
    schedule: {
      icon: <Clock className="w-4 h-4" />,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      label: 'Schedule'
    },
    support: {
      icon: <Phone className="w-4 h-4" />,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      label: 'Support'
    }
  }

  // Priority configurations
  const priorityConfig: Record<ClientPriority, {
    color: string
    bgColor: string
    label: string
  }> = {
    low: { color: 'text-gray-600', bgColor: 'bg-gray-100', label: 'Low' },
    medium: { color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'Medium' },
    high: { color: 'text-orange-600', bgColor: 'bg-orange-100', label: 'High' },
    urgent: { color: 'text-red-600', bgColor: 'bg-red-100', label: 'Urgent' }
  }

  // Status configurations
  const statusConfig: Record<ClientThreadStatus, {
    color: string
    bgColor: string
    label: string
  }> = {
    open: { color: 'text-green-600', bgColor: 'bg-green-100', label: 'Open' },
    pending_response: { color: 'text-yellow-600', bgColor: 'bg-yellow-100', label: 'Pending Response' },
    resolved: { color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'Resolved' },
    closed: { color: 'text-gray-600', bgColor: 'bg-gray-100', label: 'Closed' }
  }

  // Filter threads
  const filteredThreads = threads.filter(thread => {
    const matchesSearch = !searchTerm || 
      thread.subject.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || thread.status === filterStatus
    const matchesType = filterType === 'all' || thread.thread_type === filterType
    return matchesSearch && matchesStatus && matchesType
  })

  // Handle thread selection
  const handleThreadSelect = useCallback((thread: ClientCommunicationThread) => {
    setSelectedThread(thread)
    markThreadAsRead(thread.id)
    onThreadSelect?.(thread.id)
    
    // Scroll to bottom of messages
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }, [markThreadAsRead, onThreadSelect])

  // Handle new thread creation
  const handleCreateThread = useCallback(async () => {
    if (!newThreadData.subject.trim() || !newThreadData.message_body.trim()) return

    try {
      const result = await createThread({
        project_id: projectId || '',
        ...newThreadData
      })

      if (result.success && result.data) {
        setNewThreadDialogOpen(false)
        setNewThreadData({
          subject: '',
          thread_type: 'general',
          priority: 'medium',
          message_body: ''
        })
        handleThreadSelect(result.data)
      }
    } catch (error) {
      console.error('Failed to create thread:', error)
    }
  }, [newThreadData, projectId, createThread, handleThreadSelect])

  // Handle send message
  const handleSendMessage = useCallback(async () => {
    if (!selectedThread || !messageText.trim()) return

    try {
      const result = await sendMessage(selectedThread.id, messageText.trim())
      
      if (result.success) {
        setMessageText('')
        // Scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }, [selectedThread, messageText, sendMessage])

  // Get message time label
  const getMessageTimeLabel = (date: Date) => {
    if (isToday(date)) return format(date, 'h:mm a')
    if (isYesterday(date)) return `Yesterday ${format(date, 'h:mm a')}`
    return format(date, 'MMM d, h:mm a')
  }

  // Auto-select first thread if none selected
  useEffect(() => {
    if (!selectedThread && filteredThreads.length > 0) {
      handleThreadSelect(filteredThreads[0])
    }
  }, [filteredThreads, selectedThread, handleThreadSelect])

  if (loading && threads.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Communications
            </CardTitle>
            
            <Dialog open={newThreadDialogOpen} onOpenChange={setNewThreadDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Thread
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Start New Thread</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      placeholder="Enter thread subject..."
                      value={newThreadData.subject}
                      onChange={(e) => setNewThreadData(prev => ({ ...prev, subject: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Type</Label>
                      <Select
                        value={newThreadData.thread_type}
                        onValueChange={(value) => setNewThreadData(prev => ({ ...prev, thread_type: value as ClientThreadType }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(threadTypeConfig).map(([type, config]) => (
                            <SelectItem key={type} value={type}>
                              <div className="flex items-center gap-2">
                                {config.icon}
                                {config.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select
                        value={newThreadData.priority}
                        onValueChange={(value) => setNewThreadData(prev => ({ ...prev, priority: value as ClientPriority }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(priorityConfig).map(([priority, config]) => (
                            <SelectItem key={priority} value={priority}>
                              {config.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Initial Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Type your message..."
                      value={newThreadData.message_body}
                      onChange={(e) => setNewThreadData(prev => ({ ...prev, message_body: e.target.value }))}
                      rows={4}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={handleCreateThread}
                      disabled={!newThreadData.subject.trim() || !newThreadData.message_body.trim()}
                      className="flex-1"
                    >
                      Create Thread
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setNewThreadDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        {/* Search and Filters */}
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search threads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as any)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {Object.entries(statusConfig).map(([status, config]) => (
                    <SelectItem key={status} value={status}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={(value) => setFilterType(value as any)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(threadTypeConfig).map(([type, config]) => (
                    <SelectItem key={type} value={type}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Communication Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[600px]">
        {/* Thread List */}
        <Card className="lg:col-span-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Threads ({filteredThreads.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-0 max-h-[500px] overflow-y-auto">
              {filteredThreads.map((thread) => {
                const typeConfig = threadTypeConfig[thread.thread_type]
                const statusConfig_ = statusConfig[thread.status]
                const priorityConfig_ = priorityConfig[thread.priority]
                const isSelected = selectedThread?.id === thread.id

                return (
                  <div
                    key={thread.id}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                      isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => handleThreadSelect(thread)}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm text-gray-900 line-clamp-2">
                          {thread.subject}
                        </h4>
                        <time className="text-xs text-gray-500 whitespace-nowrap">
                          {formatDistanceToNow(new Date(thread.last_message_at), { addSuffix: true })}
                        </time>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`${typeConfig.bgColor} ${typeConfig.color} border-0 text-xs`}>
                          {typeConfig.icon}
                          <span className="ml-1">{typeConfig.label}</span>
                        </Badge>
                        
                        <Badge className={`${statusConfig_.bgColor} ${statusConfig_.color} border-0 text-xs`}>
                          {statusConfig_.label}
                        </Badge>

                        {thread.priority !== 'medium' && (
                          <Badge className={`${priorityConfig_.bgColor} ${priorityConfig_.color} border-0 text-xs`}>
                            {priorityConfig_.label}
                          </Badge>
                        )}
                      </div>

                      {thread.requires_response && (
                        <div className="flex items-center gap-1 text-xs text-orange-600">
                          <AlertCircle className="w-3 h-3" />
                          Response Required
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}

              {filteredThreads.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Threads Found</h3>
                  <p className="text-gray-600 text-sm">
                    {searchTerm || filterStatus !== 'all' || filterType !== 'all'
                      ? 'No threads match your search criteria.'
                      : 'Start a new thread to begin communicating.'
                    }
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Messages Area */}
        <Card className="lg:col-span-8">
          {selectedThread ? (
            <>
              {/* Thread Header */}
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">
                      {selectedThread.subject}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge className={`${threadTypeConfig[selectedThread.thread_type].bgColor} ${threadTypeConfig[selectedThread.thread_type].color} border-0 text-xs`}>
                        {threadTypeConfig[selectedThread.thread_type].label}
                      </Badge>
                      <Badge className={`${statusConfig[selectedThread.status].bgColor} ${statusConfig[selectedThread.status].color} border-0 text-xs`}>
                        {statusConfig[selectedThread.status].label}
                      </Badge>
                      {selectedThread.priority !== 'medium' && (
                        <Badge className={`${priorityConfig[selectedThread.priority].bgColor} ${priorityConfig[selectedThread.priority].color} border-0 text-xs`}>
                          {priorityConfig[selectedThread.priority].label}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Users className="w-4 h-4 mr-2" />
                        View Participants
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Mail className="w-4 h-4 mr-2" />
                        Email Thread
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark as Resolved
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto max-h-[350px] space-y-4">
                {selectedThread.messages?.map((message) => (
                  <div key={message.id} className="flex gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>
                        {message.sender?.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-gray-900">
                          {message.sender?.email || 'Unknown User'}
                        </span>
                        <time className="text-xs text-gray-500">
                          {getMessageTimeLabel(new Date(message.created_at))}
                        </time>
                      </div>
                      
                      <div className="text-sm text-gray-700 whitespace-pre-wrap">
                        {message.message_body}
                      </div>
                      
                      {message.attachments?.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {message.attachments.map((attachment, index) => (
                            <div key={index} className="flex items-center gap-2 text-xs text-blue-600">
                              <Paperclip className="w-3 h-3" />
                              <span>{attachment.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </CardContent>

              {/* Message Input */}
              <CardContent className="border-t pt-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Textarea
                      placeholder="Type your message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      rows={2}
                      className="resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      onClick={handleSendMessage}
                      disabled={!messageText.trim()}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Paperclip className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Thread</h3>
              <p className="text-gray-600">
                Choose a thread from the list to view and reply to messages.
              </p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}
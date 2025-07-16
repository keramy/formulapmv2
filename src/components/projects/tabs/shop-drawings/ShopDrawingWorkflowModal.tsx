'use client'

import React, { useState } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { DataStateWrapper } from '@/components/ui/loading-states'
import { 
  FileImage, 
  Upload, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  User,
  Calendar,
  MessageSquare
} from 'lucide-react'
import { useShopDrawing } from '@/hooks/useShopDrawings'
import { useShopDrawingWorkflow } from '@/hooks/useShopDrawingWorkflow'
import { useAuth } from '@/hooks/useAuth'
import { formatDate } from '@/lib/utils'

interface ShopDrawingWorkflowModalProps {
  drawingId: string
  onClose: () => void
  onComplete: () => void
}

export const ShopDrawingWorkflowModal: React.FC<ShopDrawingWorkflowModalProps> = ({
  drawingId,
  onClose,
  onComplete
}) => {
  const { profile } = useAuth()
  const { toast } = useToast()
  const { data: drawing, loading, error } = useShopDrawing(drawingId)
  const { 
    getAvailableActions, 
    executeWorkflowAction, 
    getWorkflowHistory,
    getStatusColor,
    getStatusLabel,
    getStatusIcon,
    validateActionData,
    loading: workflowLoading
  } = useShopDrawingWorkflow()

  const [selectedAction, setSelectedAction] = useState<string>('')
  const [comments, setComments] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  if (!drawing) return null

  const availableActions = getAvailableActions(drawing.status, profile?.role || '')
  const workflowHistory = getWorkflowHistory(drawing.current_submission ? [drawing.current_submission] : [])

  const handleActionChange = (actionId: string) => {
    setSelectedAction(actionId)
    setComments('')
    setFile(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  const handleSubmit = async () => {
    if (!selectedAction || !drawing.current_submission_id) return

    const actionData = {
      action: selectedAction,
      comments: comments || undefined,
      file: file || undefined
    }

    const validation = validateActionData(drawing.status, selectedAction, actionData)
    if (!validation.valid) {
      toast({
        title: "Validation Error",
        description: validation.errors.join('\n'),
        variant: "destructive"
      })
      return
    }

    try {
      await executeWorkflowAction(
        drawing.id,
        drawing.current_submission_id,
        actionData
      )
      toast({
        title: "Success",
        description: "Workflow action completed successfully",
        variant: "default"
      })
      onComplete()
    } catch (error) {
      console.error('Workflow action failed:', error)
      toast({
        title: "Error",
        description: "Failed to execute workflow action",
        variant: "destructive"
      })
    }
  }

  const selectedActionData = availableActions.find(a => a.id === selectedAction)

  const getStatusIconComponent = (status: string) => {
    const iconName = getStatusIcon(status)
    const color = getStatusColor(status)
    
    switch (iconName) {
      case 'CheckCircle':
        return <CheckCircle className={`h-4 w-4 text-${color}-500`} />
      case 'XCircle':
        return <XCircle className={`h-4 w-4 text-${color}-500`} />
      case 'Clock':
        return <Clock className={`h-4 w-4 text-${color}-500`} />
      case 'AlertCircle':
        return <AlertCircle className={`h-4 w-4 text-${color}-500`} />
      default:
        return <FileImage className={`h-4 w-4 text-${color}-500`} />
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileImage className="h-5 w-5" />
            <span>Shop Drawing Workflow</span>
          </DialogTitle>
        </DialogHeader>

        <DataStateWrapper
          loading={loading}
          error={error}
          data={drawing}
          onRetry={() => {}}
          emptyMessage="Drawing not found"
        >
          <div className="space-y-6">
            {/* Current Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{drawing.title}</span>
                  <Badge variant="outline" className="flex items-center space-x-1">
                    {getStatusIconComponent(drawing.status)}
                    <span>{getStatusLabel(drawing.status)}</span>
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Created By</Label>
                    <p className="text-sm">{drawing.created_by_user?.name || 'Unknown'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Created Date</Label>
                    <p className="text-sm">{formatDate(drawing.created_at)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Description</Label>
                    <p className="text-sm">{drawing.description || 'No description'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Current File</Label>
                    <p className="text-sm">
                      {drawing.file_path ? (
                        <a 
                          href={drawing.file_path} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {drawing.file_type?.toUpperCase() || 'FILE'}
                        </a>
                      ) : (
                        'No file uploaded'
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Available Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Available Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {availableActions.length === 0 ? (
                    <p className="text-sm text-gray-600">No actions available for current status</p>
                  ) : (
                    <>
                      <div>
                        <Label htmlFor="action-select">Select Action</Label>
                        <Select value={selectedAction} onValueChange={handleActionChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose an action" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableActions.map((action) => (
                              <SelectItem key={action.id} value={action.id}>
                                {action.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedActionData && (
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <h4 className="font-medium text-sm mb-2">{selectedActionData.label}</h4>
                          <p className="text-sm text-gray-600">{selectedActionData.description}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Next Status: {getStatusLabel(selectedActionData.nextStatus)}
                          </p>
                        </div>
                      )}

                      {selectedActionData?.requiresComments && (
                        <div>
                          <Label htmlFor="comments">
                            Comments <span className="text-red-500">*</span>
                          </Label>
                          <Textarea
                            id="comments"
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            placeholder="Enter your comments..."
                            rows={3}
                          />
                        </div>
                      )}

                      {selectedActionData?.requiresFile && (
                        <div>
                          <Label htmlFor="file">
                            File Upload <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="file"
                            type="file"
                            onChange={handleFileChange}
                            accept=".pdf,.dwg,.dxf,.jpg,.jpeg,.png"
                          />
                          {file && (
                            <p className="text-sm text-gray-600 mt-1">
                              Selected: {file.name} ({Math.round(file.size / 1024)} KB)
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Workflow History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Workflow History</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowHistory(!showHistory)}
                  >
                    {showHistory ? 'Hide' : 'Show'} History
                  </Button>
                </CardTitle>
              </CardHeader>
              {showHistory && (
                <CardContent>
                  <div className="space-y-4">
                    {workflowHistory.length === 0 ? (
                      <p className="text-sm text-gray-600">No workflow history available</p>
                    ) : (
                      workflowHistory.map((item, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                          <div className="flex-shrink-0 mt-1">
                            {getStatusIconComponent(item.status)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm capitalize">
                                {item.action.replace('_', ' ')}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatDate(item.date)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              by {item.user}
                            </p>
                            {item.comments && (
                              <p className="text-sm text-gray-800 mt-2 p-2 bg-gray-50 rounded">
                                {item.comments}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </DataStateWrapper>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {selectedAction && (
            <Button
              onClick={handleSubmit}
              disabled={workflowLoading}
              className="flex items-center space-x-2"
            >
              {workflowLoading ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Execute {selectedActionData?.label}</span>
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
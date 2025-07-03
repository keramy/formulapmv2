/**
 * Client Document Approval Interface Component
 * Allows external clients to review and approve documents
 * Mobile-optimized approval workflow
 */

'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  FileText,
  MessageSquare,
  Download,
  Eye,
  Calendar,
  User,
  Building,
  Clock,
  Signature
} from 'lucide-react'
import { 
  ClientDocumentApproval, 
  ClientApprovalDecision,
  ClientDocumentAccess 
} from '@/types/client-portal'
import { format, formatDistanceToNow } from 'date-fns'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

interface ClientDocumentApprovalInterfaceProps {
  document: ClientDocumentAccess & {
    document: {
      id: string
      document_name: string
      document_type: string
      document_number?: string
      version: string
      created_at: string
      status: string
      requires_approval: boolean
      uploaded_by?: {
        name: string
        email: string
      }
      project?: {
        id: string
        name: string
      }
    }
  }
  onApproval?: (approval: Omit<ClientDocumentApproval, 'id' | 'client_user_id'>) => Promise<{ success: boolean; error?: string }>
  onCancel?: () => void
  onDownload?: () => void
  onViewDocument?: () => void
  loading?: boolean
  mobileOptimized?: boolean
}

export const ClientDocumentApprovalInterface: React.FC<ClientDocumentApprovalInterfaceProps> = ({
  document,
  onApproval,
  onCancel,
  onDownload,
  onViewDocument,
  loading = false,
  mobileOptimized = true
}) => {
  const [approvalDecision, setApprovalDecision] = useState<ClientApprovalDecision | null>(null)
  const [approvalComments, setApprovalComments] = useState('')
  const [approvalConditions, setApprovalConditions] = useState<string[]>([])
  const [customCondition, setCustomCondition] = useState('')
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Predefined approval conditions
  const predefinedConditions = [
    'Subject to final engineering review',
    'Requires coordination with other trades',
    'Must comply with local building codes',
    'Pending material specifications',
    'Subject to client approval',
    'Requires cost verification',
    'Must address safety concerns',
    'Pending structural engineer approval'
  ]

  // Decision configurations
  const decisionConfig: Record<ClientApprovalDecision, {
    icon: React.ReactNode
    color: string
    bgColor: string
    label: string
    description: string
  }> = {
    approved: {
      icon: <CheckCircle className="w-5 h-5" />,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      label: 'Approve',
      description: 'Accept the document as submitted'
    },
    approved_with_conditions: {
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      label: 'Approve with Conditions',
      description: 'Accept with specified conditions'
    },
    rejected: {
      icon: <XCircle className="w-5 h-5" />,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      label: 'Reject',
      description: 'Require revisions before resubmission'
    },
    requires_revision: {
      icon: <MessageSquare className="w-5 h-5" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      label: 'Request Revisions',
      description: 'Minor changes needed'
    }
  }

  // Handle condition toggle
  const handleConditionToggle = useCallback((condition: string, checked: boolean) => {
    setApprovalConditions(prev => 
      checked 
        ? [...prev, condition]
        : prev.filter(c => c !== condition)
    )
  }, [])

  // Add custom condition
  const handleAddCustomCondition = useCallback(() => {
    if (customCondition.trim() && !approvalConditions.includes(customCondition.trim())) {
      setApprovalConditions(prev => [...prev, customCondition.trim()])
      setCustomCondition('')
    }
  }, [customCondition, approvalConditions])

  // Handle approval submission
  const handleSubmitApproval = useCallback(async () => {
    if (!approvalDecision) return

    setSubmitting(true)
    try {
      const approvalData: Omit<ClientDocumentApproval, 'id' | 'client_user_id'> = {
        document_id: document.document_id,
        approval_decision: approvalDecision,
        approval_comments: approvalComments.trim() || undefined,
        approval_conditions: approvalConditions,
        document_version: parseInt(document.document.version) || 1,
        revision_letter: undefined, // Will be set by backend if needed
        is_final: true,
        superseded_by: undefined,
        ip_address: undefined, // Will be set by backend
        user_agent: undefined, // Will be set by backend
        session_id: undefined, // Will be set by backend
        approval_date: new Date(),
        digital_signature: {
          timestamp: new Date().toISOString(),
          decision: approvalDecision,
          document_id: document.document_id,
          document_version: document.document.version
        }
      }

      const result = await onApproval?.(approvalData)
      
      if (result?.success) {
        setConfirmDialogOpen(false)
      }
    } catch (error) {
      console.error('Approval submission failed:', error)
    } finally {
      setSubmitting(false)
    }
  }, [approvalDecision, approvalComments, approvalConditions, document, onApproval])

  // Validate form
  const isFormValid = approvalDecision && 
    (approvalDecision !== 'approved_with_conditions' || approvalConditions.length > 0) &&
    (approvalDecision === 'approved' || approvalComments.trim().length > 0)

  const selectedConfig = approvalDecision ? decisionConfig[approvalDecision] : null

  return (
    <div className="space-y-6">
      {/* Document Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {document.document.document_name}
              </CardTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline">
                  Version {document.document.version}
                </Badge>
                <Badge variant="outline">
                  {document.document.document_type}
                </Badge>
                {document.document.document_number && (
                  <Badge variant="outline">
                    {document.document.document_number}
                  </Badge>
                )}
                <Badge className="bg-yellow-100 text-yellow-800">
                  Pending Approval
                </Badge>
              </div>
              
              {document.document.project && (
                <p className="text-sm text-gray-600 mt-2 flex items-center gap-1">
                  <Building className="w-4 h-4" />
                  {document.document.project.name}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onViewDocument}>
                <Eye className="w-4 h-4 mr-2" />
                View
              </Button>
              {document.can_download && (
                <Button variant="outline" onClick={onDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4" />
              <div>
                <div className="font-medium">Uploaded</div>
                <div>{format(new Date(document.document.created_at), 'MMM d, yyyy')}</div>
              </div>
            </div>
            
            {document.document.uploaded_by && (
              <div className="flex items-center gap-2 text-gray-600">
                <User className="w-4 h-4" />
                <div>
                  <div className="font-medium">Uploaded by</div>
                  <div>{document.document.uploaded_by.name}</div>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4" />
              <div>
                <div className="font-medium">Available since</div>
                <div>{formatDistanceToNow(new Date(document.granted_at), { addSuffix: true })}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Approval Decision */}
      <Card>
        <CardHeader>
          <CardTitle>Approval Decision</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(decisionConfig).map(([decision, config]) => (
              <div
                key={decision}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  approvalDecision === decision
                    ? `${config.bgColor} border-current ${config.color}`
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setApprovalDecision(decision as ClientApprovalDecision)}
              >
                <div className="flex items-center gap-3">
                  <div className={approvalDecision === decision ? config.color : 'text-gray-400'}>
                    {config.icon}
                  </div>
                  <div>
                    <div className="font-medium">{config.label}</div>
                    <div className="text-sm text-gray-600">{config.description}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedConfig && (
            <Alert className={`${selectedConfig.bgColor} border-current`}>
              <div className={selectedConfig.color}>
                {selectedConfig.icon}
              </div>
              <AlertDescription className={selectedConfig.color}>
                You have selected: <strong>{selectedConfig.label}</strong>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Approval Conditions (for conditional approval) */}
      {approvalDecision === 'approved_with_conditions' && (
        <Card>
          <CardHeader>
            <CardTitle>Approval Conditions</CardTitle>
            <p className="text-sm text-gray-600">
              Select the conditions that must be met for this approval
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {predefinedConditions.map((condition) => (
                <div key={condition} className="flex items-center space-x-2">
                  <Checkbox
                    id={condition}
                    checked={approvalConditions.includes(condition)}
                    onCheckedChange={(checked) => handleConditionToggle(condition, checked as boolean)}
                  />
                  <Label htmlFor={condition} className="text-sm">
                    {condition}
                  </Label>
                </div>
              ))}
            </div>

            {/* Custom Condition */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Add Custom Condition</Label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter custom condition..."
                  value={customCondition}
                  onChange={(e) => setCustomCondition(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCustomCondition()}
                />
                <Button
                  size="sm"
                  onClick={handleAddCustomCondition}
                  disabled={!customCondition.trim()}
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Selected Conditions */}
            {approvalConditions.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Selected Conditions:</Label>
                <div className="space-y-1">
                  {approvalConditions.map((condition, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-yellow-50 rounded text-sm">
                      <span>{condition}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleConditionToggle(condition, false)}
                        className="h-6 w-6 p-0"
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Comments */}
      {approvalDecision && approvalDecision !== 'approved' && (
        <Card>
          <CardHeader>
            <CardTitle>
              {approvalDecision === 'approved_with_conditions' ? 'Additional Comments' : 'Comments'}
              <span className="text-red-500 ml-1">*</span>
            </CardTitle>
            <p className="text-sm text-gray-600">
              {approvalDecision === 'rejected' 
                ? 'Please explain what needs to be changed for resubmission'
                : approvalDecision === 'requires_revision'
                ? 'Describe the revisions needed'
                : 'Add any additional comments or clarifications'
              }
            </p>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder={
                approvalDecision === 'rejected'
                  ? 'Explain the issues that need to be addressed...'
                  : approvalDecision === 'requires_revision'
                  ? 'Describe the revisions needed...'
                  : 'Add your comments...'
              }
              value={approvalComments}
              onChange={(e) => setApprovalComments(e.target.value)}
              rows={4}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-2">
              {approvalComments.length}/1000 characters
            </p>
          </CardContent>
        </Card>
      )}

      {/* Optional Comments for Approval */}
      {approvalDecision === 'approved' && (
        <Card>
          <CardHeader>
            <CardTitle>Comments (Optional)</CardTitle>
            <p className="text-sm text-gray-600">
              Add any additional comments about this approval
            </p>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Add optional comments about this approval..."
              value={approvalComments}
              onChange={(e) => setApprovalComments(e.target.value)}
              rows={3}
              className="w-full"
            />
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardContent className="flex flex-col sm:flex-row gap-4 pt-6">
          <Button
            onClick={() => setConfirmDialogOpen(true)}
            disabled={!isFormValid || loading}
            className="flex-1"
          >
            <Signature className="w-4 h-4 mr-2" />
            Submit {selectedConfig?.label}
          </Button>
          
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedConfig?.icon}
              Confirm {selectedConfig?.label}
            </DialogTitle>
            <DialogDescription>
              Please review your decision before submitting. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <div className="text-sm">
                <strong>Document:</strong> {document.document.document_name}
              </div>
              <div className="text-sm">
                <strong>Decision:</strong> {selectedConfig?.label}
              </div>
              {approvalConditions.length > 0 && (
                <div className="text-sm">
                  <strong>Conditions:</strong> {approvalConditions.length}
                </div>
              )}
              {approvalComments.trim() && (
                <div className="text-sm">
                  <strong>Comments:</strong> {approvalComments.length} characters
                </div>
              )}
            </div>

            <Alert>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                Your approval will be recorded with a digital signature and timestamp. 
                This decision will be binding and cannot be modified.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button
                onClick={handleSubmitApproval}
                disabled={submitting}
                className="flex-1"
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Signature className="w-4 h-4" />
                    Confirm {selectedConfig?.label}
                  </div>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setConfirmDialogOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
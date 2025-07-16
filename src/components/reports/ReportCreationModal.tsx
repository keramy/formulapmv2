'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { FileText, Plus, CheckCircle, AlertCircle } from 'lucide-react'
import { useReports, useReportTemplates } from '@/hooks/useReports'
import { useAuth } from '@/hooks/useAuth'
import { FormBuilder } from '@/components/forms/FormBuilder'
import { z } from 'zod'

interface ReportCreationModalProps {
  projectId: string
  onClose: () => void
  onSuccess: () => void
}

// Zod schema for validation
const reportCreationSchema = z.object({
  title: z.string()
    .min(1, 'Report title is required')
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters'),
  description: z.string().optional(),
  type: z.enum(['progress', 'financial', 'compliance', 'quality', 'custom'], {
    required_error: 'Report type is required'
  }),
  template_id: z.string().optional()
})

export const ReportCreationModal: React.FC<ReportCreationModalProps> = ({
  projectId,
  onClose,
  onSuccess
}) => {
  const { profile } = useAuth()
  const { createReport } = useReports()
  const { data: templates, loading: templatesLoading } = useReportTemplates()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Create New Report</span>
          </DialogTitle>
        </DialogHeader>

        <DataStateWrapper
          loading={templatesLoading}
          error={error}
          data={templates}
          onRetry={() => window.location.reload()}
          loadingComponent={
            <div className="py-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading report templates...</p>
            </div>
          }
        >
          <FormBuilder
            schema={reportCreationSchema}
            onSubmit={async (data) => {
              try {
                setLoading(true)
                setError(null)

                await createReport({
                  title: data.title,
                  description: data.description || undefined,
                  project_id: projectId,
                  type: data.type,
                  template_id: data.template_id || undefined,
                  content: {}
                })

                onSuccess()
              } catch (err) {
                console.error('Failed to create report:', err)
                setError(err instanceof Error ? err.message : 'Failed to create report')
              } finally {
                setLoading(false)
              }
            }}
            defaultValues={{
              title: '',
              description: '',
              type: 'progress',
              template_id: ''
            }}
            fields={[
              {
                name: 'title',
                label: 'Report Title',
                type: 'text',
                placeholder: 'Enter report title...',
                required: true,
                disabled: loading
              },
              {
                name: 'description',
                label: 'Description',
                type: 'textarea',
                placeholder: 'Enter report description...',
                disabled: loading,
                rows: 3
              },
              {
                name: 'type',
                label: 'Report Type',
                type: 'select',
                required: true,
                disabled: loading,
                options: [
                  { value: 'progress', label: 'Progress Report' },
                  { value: 'financial', label: 'Financial Report' },
                  { value: 'compliance', label: 'Compliance Report' },
                  { value: 'quality', label: 'Quality Report' },
                  { value: 'custom', label: 'Custom Report' }
                ]
              },
              {
                name: 'template_id',
                label: 'Template (Optional)',
                type: 'select',
                disabled: loading,
                options: templates?.map(template => ({
                  value: template.id,
                  label: template.name
                })) || []
              }
            ]}
            submitButton={{
              text: loading ? 'Creating...' : 'Create Report',
              icon: Plus,
              disabled: loading,
              loading: loading
            }}
            cancelButton={{
              text: 'Cancel',
              onClick: onClose,
              disabled: loading
            }}
        </DataStateWrapper>
      </DialogContent>
    </Dialog>
  )
}
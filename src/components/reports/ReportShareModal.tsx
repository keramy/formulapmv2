'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Share2, User, Mail, AlertCircle } from 'lucide-react'
import { useReports } from '@/hooks/useReports'

interface ReportShareModalProps {
  reportId: string
  onClose: () => void
  onComplete: () => void
}

export const ReportShareModal: React.FC<ReportShareModalProps> = ({
  reportId,
  onClose,
  onComplete
}) => {
  const { shareReport } = useReports()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    access_level: 'view' as 'view' | 'edit',
    message: ''
  })

  const handleShare = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!formData.email.trim()) {
        setError('Email is required')
        return
      }

      await shareReport(reportId, {
        email: formData.email,
        access_level: formData.access_level,
        message: formData.message || undefined
      })

      onComplete()
    } catch (error) {
      console.error('Failed to share report:', error)
      setError(error instanceof Error ? error.message : 'Failed to share report')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Share2 className="h-5 w-5" />
            <span>Share Report</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="email" className="flex items-center space-x-1">
              <Mail className="h-4 w-4" />
              <span>Email Address</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Enter email address..."
              className={error && !formData.email.trim() ? 'border-red-500' : ''}
            />
          </div>

          <div>
            <Label htmlFor="access_level" className="flex items-center space-x-1">
              <User className="h-4 w-4" />
              <span>Access Level</span>
            </Label>
            <Select 
              value={formData.access_level} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, access_level: value as 'view' | 'edit' }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select access level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="view">View Only</SelectItem>
                <SelectItem value="edit">View & Edit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="message">Message (Optional)</Label>
            <Input
              id="message"
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Add a message..."
            />
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleShare} disabled={loading}>
            {loading ? 'Sharing...' : 'Share Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
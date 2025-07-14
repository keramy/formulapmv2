/**
 * Formula PM 2.0 Excel Import Dialog Component
 * Wave 2B Business Logic Implementation
 * 
 * Excel import dialog with validation preview and error handling
 */

'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  X,
  Download,
  Info
} from 'lucide-react'
import { ExcelImportBatch } from '@/types/scope'
import { validateData } from '@/lib/form-validation' // For future form validation enhancements

interface ExcelImportDialogProps {
  projectId: string
  onImport: (file: File) => Promise<ExcelImportBatch>
  onClose: () => void
  importing: boolean
}

export const ExcelImportDialog: React.FC<ExcelImportDialogProps> = ({
  projectId,
  onImport,
  onClose,
  importing
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [importResult, setImportResult] = useState<ExcelImportBatch | null>(null)
  const [step, setStep] = useState<'select' | 'preview' | 'importing' | 'complete'>('select')

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setSelectedFile(file)
      setStep('preview')
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false,
    disabled: importing
  })

  const handleImport = async () => {
    if (!selectedFile) return

    setStep('importing')
    
    try {
      const result = await onImport(selectedFile)
      setImportResult(result)
      setStep('complete')
    } catch (error) {
      setStep('preview') // Go back to preview on error
    }
  }

  const handleDownloadTemplate = () => {
    // Create a simple template
    const template = `Category,Item Code,Description,Quantity,Unit of Measure,Unit Price,Markup %,Timeline Start,Timeline End,Priority,Risk Level,Specifications
construction,C001,Foundation work,1,pcs,5000,10,2025-01-01,2025-01-15,5,medium,Concrete foundation as per drawings
millwork,M001,Custom cabinets,10,units,800,15,2025-01-10,2025-01-25,3,low,Oak cabinets with soft-close hinges
electrical,E001,Main panel installation,1,pcs,1200,12,2025-01-05,2025-01-10,8,high,200A main electrical panel
mechanical,H001,HVAC system,1,system,15000,8,2025-01-20,2025-02-10,7,medium,Complete HVAC system with controls`

    const blob = new Blob([template], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'scope-import-template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const resetDialog = () => {
    setSelectedFile(null)
    setImportResult(null)
    setStep('select')
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileSpreadsheet className="h-5 w-5" />
            <span>Import Scope Items from Excel</span>
          </DialogTitle>
          <DialogDescription>
            Upload an Excel file to bulk import scope items for this project
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: File Selection */}
          {step === 'select' && (
            <div className="space-y-4">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input {...getInputProps()} />
                <div className="space-y-4">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div>
                    <h3 className="text-lg font-medium">
                      {isDragActive ? 'Drop the file here' : 'Drag & drop an Excel file here'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      or click to select a file
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Supports .xlsx and .xls files (max 10MB)
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <Button
                  variant="outline"
                  onClick={handleDownloadTemplate}
                  className="flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Template</span>
                </Button>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Excel Format Requirements:</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• First row should contain column headers</li>
                    <li>• Required columns: Category, Description, Quantity</li>
                    <li>• Category must be: construction, millwork, electrical, or mechanical</li>
                    <li>• Quantity must be a positive number</li>
                    <li>• Unit Price should be numeric (optional)</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Step 2: File Preview */}
          {step === 'preview' && selectedFile && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Selected File</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileSpreadsheet className="h-8 w-8 text-green-600" />
                      <div>
                        <div className="font-medium">{selectedFile.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetDialog}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Import Notes:</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• Duplicate item codes will be skipped</li>
                    <li>• Invalid rows will be reported but won't stop the import</li>
                    <li>• Item numbers will be auto-generated</li>
                    <li>• All items will start with "Not Started" status</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="flex items-center justify-end space-x-2">
                <Button variant="outline" onClick={resetDialog}>
                  Change File
                </Button>
                <Button onClick={handleImport} disabled={importing}>
                  {importing ? 'Importing...' : 'Start Import'}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Importing */}
          {step === 'importing' && (
            <div className="space-y-4 text-center">
              <div className="space-y-2">
                <div className="mx-auto w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                <h3 className="text-lg font-medium">Importing Scope Items</h3>
                <p className="text-sm text-muted-foreground">
                  Please wait while we process your Excel file...
                </p>
              </div>
              
              <div className="space-y-2">
                <Progress value={undefined} className="w-full" />
                <p className="text-xs text-muted-foreground">
                  Validating data and creating scope items
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Import Complete */}
          {step === 'complete' && importResult && (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
                <h3 className="text-lg font-medium">Import Complete!</h3>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-green-600">
                    {importResult.successful_imports}
                  </div>
                  <p className="text-sm text-muted-foreground">Successful</p>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-red-600">
                    {importResult.failed_imports}
                  </div>
                  <p className="text-sm text-muted-foreground">Failed</p>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold">
                    {importResult.total_rows}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Rows</p>
                </div>
              </div>

              {importResult.validation_errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Validation Errors:</h4>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {importResult.validation_errors.slice(0, 5).map((error, index) => (
                      <Alert key={index} className="py-2">
                        <AlertDescription className="text-xs">
                          <strong>Row {error.row_number}:</strong> {error.error_message}
                          {error.suggested_fix && (
                            <span className="text-blue-600"> - {error.suggested_fix}</span>
                          )}
                        </AlertDescription>
                      </Alert>
                    ))}
                    {importResult.validation_errors.length > 5 && (
                      <p className="text-xs text-muted-foreground text-center">
                        ... and {importResult.validation_errors.length - 5} more errors
                      </p>
                    )}
                  </div>
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-end space-x-2">
                <Button variant="outline" onClick={resetDialog}>
                  Import Another File
                </Button>
                <Button onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
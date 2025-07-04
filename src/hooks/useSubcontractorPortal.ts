/**
 * Subcontractor Portal Hook
 * Manages subcontractor authentication and portal functionality
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  SubcontractorUser, 
  SubcontractorLoginForm, 
  SubcontractorReportForm,
  SubcontractorReport,
  SubcontractorDocumentResponse,
  SubcontractorContextType,
  SubcontractorProfileResponse
} from '@/types/subcontractor'

interface UseSubcontractorPortalReturn extends SubcontractorContextType {
  profile: SubcontractorProfileResponse | null
  reports: SubcontractorReport[]
  documents: SubcontractorDocumentResponse[]
  isLoadingProfile: boolean
  isLoadingReports: boolean
  isLoadingDocuments: boolean
  error: string | null
  loginError: string | null
  reportError: string | null
  refreshProfile: () => Promise<void>
  refreshReports: () => Promise<void>
  refreshDocuments: () => Promise<void>
  downloadDocument: (documentId: string) => Promise<void>
  clearError: () => void
}

export function useSubcontractorPortal(): UseSubcontractorPortalReturn {
  const router = useRouter()
  
  // State
  const [user, setUser] = useState<SubcontractorUser | null>(null)
  const [profile, setProfile] = useState<SubcontractorProfileResponse | null>(null)
  const [reports, setReports] = useState<SubcontractorReport[]>([])
  const [documents, setDocuments] = useState<SubcontractorDocumentResponse[]>([])
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [isLoadingReports, setIsLoadingReports] = useState(false)
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false)
  
  // Error states
  const [error, setError] = useState<string | null>(null)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [reportError, setReportError] = useState<string | null>(null)

  // Computed properties
  const isAuthenticated = user !== null

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
    setLoginError(null)
    setReportError(null)
  }, [])

  // Check authentication status
  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/subcontractor/profile', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const profileData = await response.json()
        setUser(profileData.user)
        setProfile(profileData)
      } else {
        setUser(null)
        setProfile(null)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setUser(null)
      setProfile(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Login function
  const login = useCallback(async (credentials: SubcontractorLoginForm) => {
    try {
      setLoginError(null)
      setIsLoading(true)
      
      const response = await fetch('/api/subcontractor/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        
        // Refresh profile after login
        await refreshProfile()
        
        router.push('/subcontractor')
      } else {
        const errorData = await response.json()
        setLoginError(errorData.error || 'Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      setLoginError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [router])

  // Logout function
  const logout = useCallback(async () => {
    try {
      await fetch('/api/subcontractor/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setProfile(null)
      setReports([])
      setDocuments([])
      router.push('/subcontractor/login')
    }
  }, [router])

  // Refresh profile
  const refreshProfile = useCallback(async () => {
    try {
      setIsLoadingProfile(true)
      setError(null)
      
      const response = await fetch('/api/subcontractor/profile', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const profileData = await response.json()
        setUser(profileData.user)
        setProfile(profileData)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to load profile')
      }
    } catch (error) {
      console.error('Profile refresh error:', error)
      setError('Network error. Please try again.')
    } finally {
      setIsLoadingProfile(false)
    }
  }, [])

  // Refresh reports
  const refreshReports = useCallback(async () => {
    try {
      setIsLoadingReports(true)
      setError(null)
      
      const response = await fetch('/api/subcontractor/reports', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setReports(data.reports)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to load reports')
      }
    } catch (error) {
      console.error('Reports refresh error:', error)
      setError('Network error. Please try again.')
    } finally {
      setIsLoadingReports(false)
    }
  }, [])

  // Refresh documents
  const refreshDocuments = useCallback(async () => {
    try {
      setIsLoadingDocuments(true)
      setError(null)
      
      const response = await fetch('/api/subcontractor/documents', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to load documents')
      }
    } catch (error) {
      console.error('Documents refresh error:', error)
      setError('Network error. Please try again.')
    } finally {
      setIsLoadingDocuments(false)
    }
  }, [])

  // Submit report
  const submitReport = useCallback(async (reportData: SubcontractorReportForm) => {
    try {
      setReportError(null)
      
      const formData = new FormData()
      formData.append('project_id', reportData.project_id || '')
      formData.append('report_date', reportData.report_date)
      formData.append('description', reportData.description)
      
      reportData.photos.forEach((photo, index) => {
        formData.append('photos', photo)
      })
      
      const response = await fetch('/api/subcontractor/reports', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })
      
      if (response.ok) {
        // Refresh reports after successful submission
        await refreshReports()
      } else {
        const errorData = await response.json()
        setReportError(errorData.error || 'Failed to submit report')
        throw new Error(errorData.error || 'Failed to submit report')
      }
    } catch (error) {
      console.error('Report submission error:', error)
      if (!reportError) {
        setReportError('Network error. Please try again.')
      }
      throw error
    }
  }, [reportError, refreshReports])

  // Get documents (for compatibility with context type)
  const getDocuments = useCallback(async (): Promise<SubcontractorDocumentResponse[]> => {
    await refreshDocuments()
    return documents
  }, [documents, refreshDocuments])

  // Get reports (for compatibility with context type)
  const getReports = useCallback(async (): Promise<SubcontractorReport[]> => {
    await refreshReports()
    return reports
  }, [reports, refreshReports])

  // Download document
  const downloadDocument = useCallback(async (documentId: string) => {
    try {
      const response = await fetch(`/api/subcontractor/documents/${documentId}?download=true`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        // The API redirects to the file URL
        window.location.href = response.url
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to download document')
      }
    } catch (error) {
      console.error('Document download error:', error)
      setError('Network error. Please try again.')
    }
  }, [])

  // Initialize hook
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Auto-refresh data when authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      refreshReports()
      refreshDocuments()
    }
  }, [isAuthenticated, isLoading, refreshReports, refreshDocuments])

  return {
    // Context interface
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    submitReport,
    getDocuments,
    getReports,
    
    // Additional state
    profile,
    reports,
    documents,
    isLoadingProfile,
    isLoadingReports,
    isLoadingDocuments,
    error,
    loginError,
    reportError,
    
    // Additional functions
    refreshProfile,
    refreshReports,
    refreshDocuments,
    downloadDocument,
    clearError
  }
}
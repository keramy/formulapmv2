/**
 * Client Portal Session Manager Component
 * Handles session timeouts, activity tracking, and security
 * Mobile-optimized session management
 */

'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useClientAuth } from '@/hooks/useClientPortal'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Clock, Shield, LogOut, RotateCcw } from 'lucide-react'

interface ClientSessionManagerProps {
  children: React.ReactNode
  sessionTimeout?: number // in milliseconds (default: 30 minutes)
  warningTime?: number // in milliseconds (default: 5 minutes before timeout)
  activityEvents?: string[] // events to track for activity
  onSessionExpired?: () => void
  enableInactivityWarning?: boolean
}

export const ClientSessionManager: React.FC<ClientSessionManagerProps> = ({
  children,
  sessionTimeout = 30 * 60 * 1000, // 30 minutes
  warningTime = 5 * 60 * 1000, // 5 minutes
  activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'],
  onSessionExpired,
  enableInactivityWarning = true
}) => {
  const { user, isAuthenticated, logout, checkAuth } = useClientAuth()
  const [showWarning, setShowWarning] = useState(false)
  const [showExpiredDialog, setShowExpiredDialog] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isExtending, setIsExtending] = useState(false)

  // Refs for timers
  const activityTimerRef = useRef<NodeJS.Timeout | null>(null)
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null)
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<number>(Date.now())

  // Clear all timers
  const clearAllTimers = useCallback(() => {
    if (activityTimerRef.current) {
      clearTimeout(activityTimerRef.current)
      activityTimerRef.current = null
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current)
      warningTimerRef.current = null
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current)
      countdownTimerRef.current = null
    }
  }, [])

  // Start countdown timer
  const startCountdown = useCallback(() => {
    setTimeRemaining(warningTime)
    
    countdownTimerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1000) {
          // Session expired
          setShowWarning(false)
          setShowExpiredDialog(true)
          clearAllTimers()
          onSessionExpired?.()
          return 0
        }
        return prev - 1000
      })
    }, 1000)
  }, [warningTime, clearAllTimers, onSessionExpired])

  // Reset session timer
  const resetSessionTimer = useCallback(() => {
    lastActivityRef.current = Date.now()
    setShowWarning(false)
    clearAllTimers()

    if (!isAuthenticated) return

    // Set timer for warning
    if (enableInactivityWarning) {
      warningTimerRef.current = setTimeout(() => {
        setShowWarning(true)
        startCountdown()
      }, sessionTimeout - warningTime)
    }

    // Set timer for automatic logout
    activityTimerRef.current = setTimeout(() => {
      if (!showWarning) {
        setShowExpiredDialog(true)
        onSessionExpired?.()
      }
    }, sessionTimeout)
  }, [isAuthenticated, sessionTimeout, warningTime, enableInactivityWarning, showWarning, startCountdown, clearAllTimers, onSessionExpired])

  // Handle user activity
  const handleActivity = useCallback(() => {
    const now = Date.now()
    const timeSinceLastActivity = now - lastActivityRef.current

    // Only reset if significant time has passed (prevent excessive resets)
    if (timeSinceLastActivity > 10000) { // 10 seconds
      resetSessionTimer()
    }
  }, [resetSessionTimer])

  // Extend session
  const extendSession = useCallback(async () => {
    setIsExtending(true)
    
    try {
      // Verify session is still valid
      await checkAuth()
      
      // Reset timers
      resetSessionTimer()
      setShowWarning(false)
    } catch (error) {
      console.error('Failed to extend session:', error)
      setShowExpiredDialog(true)
    } finally {
      setIsExtending(false)
    }
  }, [checkAuth, resetSessionTimer])

  // Handle logout
  const handleLogout = useCallback(async () => {
    clearAllTimers()
    setShowWarning(false)
    setShowExpiredDialog(false)
    await logout()
  }, [logout, clearAllTimers])

  // Handle session expired dialog close
  const handleExpiredDialogClose = useCallback(() => {
    setShowExpiredDialog(false)
    handleLogout()
  }, [handleLogout])

  // Setup activity listeners
  useEffect(() => {
    if (!isAuthenticated) {
      clearAllTimers()
      return
    }

    // Add activity event listeners
    const addEventListeners = () => {
      activityEvents.forEach(event => {
        document.addEventListener(event, handleActivity, { passive: true })
      })
    }

    // Remove activity event listeners
    const removeEventListeners = () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity)
      })
    }

    addEventListeners()
    resetSessionTimer()

    return () => {
      removeEventListeners()
      clearAllTimers()
    }
  }, [isAuthenticated, activityEvents, handleActivity, resetSessionTimer, clearAllTimers])

  // Check session validity periodically
  useEffect(() => {
    if (!isAuthenticated) return

    const checkSessionInterval = setInterval(async () => {
      try {
        await checkAuth()
      } catch (error) {
        console.error('Session check failed:', error)
        setShowExpiredDialog(true)
      }
    }, 5 * 60 * 1000) // Check every 5 minutes

    return () => clearInterval(checkSessionInterval)
  }, [isAuthenticated, checkAuth])

  // Format time remaining
  const formatTimeRemaining = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (!isAuthenticated) {
    return <>{children}</>
  }

  return (
    <>
      {children}

      {/* Inactivity Warning Dialog */}
      <Dialog open={showWarning} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" hideCloseButton>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              Session Timeout Warning
            </DialogTitle>
            <DialogDescription>
              Your session will expire soon due to inactivity.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert className="border-amber-200 bg-amber-50">
              <AlertDescription className="text-amber-800">
                Your session will expire in{' '}
                <span className="font-mono font-bold">
                  {formatTimeRemaining(timeRemaining)}
                </span>
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button
                onClick={extendSession}
                disabled={isExtending}
                className="flex-1"
              >
                {isExtending ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Extending...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4" />
                    Stay Logged In
                  </div>
                )}
              </Button>
              
              <Button
                onClick={handleLogout}
                variant="outline"
                disabled={isExtending}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Session Expired Dialog */}
      <Dialog open={showExpiredDialog} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" hideCloseButton>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-600" />
              Session Expired
            </DialogTitle>
            <DialogDescription>
              Your session has expired for security reasons.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                You have been automatically logged out due to inactivity. Please log in again to continue.
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleExpiredDialogClose}
              className="w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Return to Login
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
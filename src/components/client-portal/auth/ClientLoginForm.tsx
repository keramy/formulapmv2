/**
 * Client Portal Login Form Component
 * External client authentication interface
 * Mobile-first responsive design for client access
 */

'use client'

import { useState, useCallback } from 'react'
import { Eye, EyeOff, Building2, Mail, Lock, LogIn, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { useClientAuth } from '@/hooks/useClientPortal'

interface ClientLoginFormProps {
  onLoginSuccess?: () => void
  onForgotPassword?: (email: string, companyCode?: string) => void
  companyBranding?: {
    logo_url?: string
    brand_colors?: Record<string, string>
    company_name?: string
  }
  mobileOptimized?: boolean
}

export const ClientLoginForm: React.FC<ClientLoginFormProps> = ({
  onLoginSuccess,
  onForgotPassword,
  companyBranding,
  mobileOptimized = true
}) => {
  const { login, resetPassword, loading, error } = useClientAuth()
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    companyCode: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [resetEmailSent, setResetEmailSent] = useState(false)

  // Form validation
  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {}

    if (!formData.email) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address'
    }

    if (!showForgotPassword && !formData.password) {
      errors.password = 'Password is required'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }, [formData, showForgotPassword])

  // Handle login
  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      const result = await login(formData.email, formData.password, formData.companyCode || undefined)
      
      if (result.success) {
        onLoginSuccess?.()
      }
    } catch (err) {
      console.error('Login error:', err)
    }
  }, [formData, validateForm, login, onLoginSuccess])

  // Handle password reset
  const handlePasswordReset = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email) {
      setFormErrors({ email: 'Email is required for password reset' })
      return
    }

    try {
      const result = await resetPassword(formData.email, formData.companyCode || undefined)
      
      if (result.success) {
        setResetEmailSent(true)
        onForgotPassword?.(formData.email, formData.companyCode || undefined)
      }
    } catch (err) {
      console.error('Password reset error:', err)
    }
  }, [formData.email, formData.companyCode, resetPassword, onForgotPassword])

  // Handle input changes
  const handleInputChange = useCallback((field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }))
    }
  }, [formErrors])

  // Toggle password visibility
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev)
  }, [])

  // Toggle forgot password mode
  const toggleForgotPassword = useCallback(() => {
    setShowForgotPassword(prev => !prev)
    setFormErrors({})
    setResetEmailSent(false)
  }, [])

  const cardClassName = mobileOptimized 
    ? "w-full max-w-md mx-auto shadow-lg border-0 bg-white/95 backdrop-blur-sm"
    : "w-full max-w-md mx-auto shadow-lg"

  const inputClassName = mobileOptimized
    ? "h-12 text-base" // Larger inputs for mobile
    : "h-10"

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className={cardClassName} style={{
        borderColor: companyBranding?.brand_colors?.primary,
        background: companyBranding?.brand_colors?.background
      }}>
        <CardHeader className="space-y-4 text-center">
          {/* Company Logo */}
          {companyBranding?.logo_url && (
            <div className="flex justify-center">
              <img
                src={companyBranding.logo_url}
                alt={`${companyBranding.company_name} Logo`}
                className="h-12 w-auto max-w-[200px] object-contain"
              />
            </div>
          )}
          
          {/* Title */}
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              {showForgotPassword ? 'Reset Password' : 'Client Portal'}
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              {showForgotPassword
                ? 'Enter your email to receive reset instructions'
                : companyBranding?.company_name
                  ? `Welcome to ${companyBranding.company_name} Project Portal`
                  : 'Access your projects and documents'
              }
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Success Message for Password Reset */}
          {resetEmailSent && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">
                Password reset instructions have been sent to your email address.
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Login/Reset Form */}
          <form onSubmit={showForgotPassword ? handlePasswordReset : handleLogin} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`${inputClassName} pl-10`}
                  disabled={loading}
                  autoComplete="email"
                  autoFocus
                />
              </div>
              {formErrors.email && (
                <p className="text-sm text-red-600">{formErrors.email}</p>
              )}
            </div>

            {/* Password Field (only for login) */}
            {!showForgotPassword && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`${inputClassName} pl-10 pr-10`}
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {formErrors.password && (
                  <p className="text-sm text-red-600">{formErrors.password}</p>
                )}
              </div>
            )}

            {/* Company Code Field (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="companyCode" className="text-sm font-medium text-gray-700">
                Company Code <span className="text-gray-400">(Optional)</span>
              </Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="companyCode"
                  type="text"
                  placeholder="Enter company code if provided"
                  value={formData.companyCode}
                  onChange={(e) => handleInputChange('companyCode', e.target.value)}
                  className={`${inputClassName} pl-10`}
                  disabled={loading}
                  autoComplete="organization"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className={`w-full ${mobileOptimized ? 'h-12 text-base' : 'h-10'} font-medium`}
              disabled={loading}
              style={{ backgroundColor: companyBranding?.brand_colors?.primary }}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {showForgotPassword ? 'Sending...' : 'Signing in...'}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {showForgotPassword ? (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      Send Reset Link
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      Sign In
                    </>
                  )}
                </div>
              )}
            </Button>
          </form>

          {/* Footer Actions */}
          <div className="space-y-4">
            <Separator />
            
            <div className="text-center">
              <button
                type="button"
                onClick={toggleForgotPassword}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                disabled={loading}
              >
                {showForgotPassword ? 'Back to Sign In' : 'Forgot your password?'}
              </button>
            </div>

            {/* Help Text */}
            <div className="text-center">
              <p className="text-xs text-gray-500">
                Need help accessing your account?{' '}
                <a 
                  href="mailto:support@formulapm.com" 
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Contact Support
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Input from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { login } from '@/app/auth/actions'
import Link from 'next/link'

interface LoginFormProps {
  showSignupLink?: boolean
  showForgotPassword?: boolean
}

const LoginForm = ({ 
  showSignupLink = false,
  showForgotPassword = true
}: LoginFormProps) => {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const searchParams = useSearchParams()
  
  const error = searchParams.get('error')
  const message = searchParams.get('message')

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    try {
      await login(formData)
    } catch (error) {
      console.error('Login error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getErrorMessage = (error: string) => {
    switch (error) {
      case 'missing-credentials':
        return 'Email and password are required'
      case 'Invalid login credentials':
        return 'Invalid email or password. Please try again.'
      case 'logout-failed':
        return 'Failed to logout. Please try again.'
      default:
        return decodeURIComponent(error)
    }
  }

  const getSuccessMessage = (message: string) => {
    switch (message) {
      case 'check-email':
        return 'Please check your email and click the confirmation link.'
      default:
        return decodeURIComponent(message)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <form action={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="your@email.com"
            required
            disabled={isLoading}
            autoComplete="email"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              required
              disabled={isLoading}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {getErrorMessage(error)}
            </AlertDescription>
          </Alert>
        )}

        {/* Success message display */}
        {message && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {getSuccessMessage(message)}
            </AlertDescription>
          </Alert>
        )}

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isLoading}
        >
          {isLoading && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {isLoading ? 'Signing In...' : 'Sign In'}
        </Button>

        {showForgotPassword && (
          <div className="text-center">
            <Button 
              type="button" 
              variant="link" 
              className="text-sm text-muted-foreground hover:text-primary"
              disabled={isLoading}
            >
              Forgot your password?
            </Button>
          </div>
        )}

        {showSignupLink && (
          <div className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/auth/register" className="text-primary hover:underline">
              Contact your administrator
            </Link>
          </div>
        )}
      </form>

      {/* Development helper */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-4 border border-dashed rounded-lg bg-gray-50">
          <div className="text-sm font-medium text-gray-700 mb-2">
            Test Accounts (password: testpass123):
          </div>
          <div className="text-xs text-gray-600 space-y-1">
            <div>Admin: admin.test@formulapm.com</div>
            <div>PM: pm.test@formulapm.com</div>
            <div>GM: gm.test@formulapm.com</div>
            <div>Architect: architect.test@formulapm.com</div>
            <div>Client: client.test@formulapm.com</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LoginForm
export { LoginForm }
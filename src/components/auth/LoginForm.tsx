'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Input from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
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
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
      setError('Email and password are required')
      setIsLoading(false)
      return
    }

    try {
      console.log('🔐 [LoginForm] Attempting login for:', email)
      await signIn(email, password)
      
      console.log('🔐 [LoginForm] Login successful, redirecting to dashboard')
      router.push('/dashboard')
    } catch (error: any) {
      console.error('🔐 [LoginForm] Login failed:', error.message)
      setError(error.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
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
              {error}
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
            Test Accounts (working credentials):
          </div>
          <div className="text-xs text-gray-600 space-y-1">
            <div>✅ admin@formulapm.com / admin123 (Admin)</div>
            <div>✅ owner.test@formulapm.com / testpass123 (Management)</div>
            <div>✅ pm.working@formulapm.com / testpass123 (Project Manager)</div>
            <div>✅ admin.working@formulapm.com / testpass123 (Admin)</div>
            <div>✅ client.working@formulapm.com / testpass123 (Client)</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LoginForm
export { LoginForm }
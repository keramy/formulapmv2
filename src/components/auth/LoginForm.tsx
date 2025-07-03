'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface LoginFormProps {
  redirectTo?: string
  showSignupLink?: boolean
  showForgotPassword?: boolean
}

export const LoginForm = ({ 
  redirectTo = '/dashboard',
  showSignupLink = false,
  showForgotPassword = true
}: LoginFormProps) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { signIn } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Basic validation
    if (!email.trim()) {
      setError('Email is required')
      setLoading(false)
      return
    }

    if (!password) {
      setError('Password is required')
      setLoading(false)
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address')
      setLoading(false)
      return
    }

    try {
      await signIn(email.trim().toLowerCase(), password)
      // Redirect on successful login
      router.push(redirectTo)
    } catch (error: any) {
      console.error('Login error:', error)
      
      // Handle different error types
      if (error.message?.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please try again.')
      } else if (error.message?.includes('Email not confirmed')) {
        setError('Please check your email and click the confirmation link.')
      } else if (error.message?.includes('Too many requests')) {
        setError('Too many login attempts. Please wait a moment and try again.')
      } else if (error.message?.includes('deactivated')) {
        setError('Your account has been deactivated. Please contact administrator.')
      } else {
        setError(error.message || 'Login failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Please enter your email address first')
      return
    }

    try {
      const { resetPassword } = useAuth()
      await resetPassword(email.trim().toLowerCase())
      setError(null)
      alert('Password reset link sent to your email!')
    } catch (error: any) {
      setError('Failed to send reset link. Please try again.')
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome to Formula PM</CardTitle>
          <CardDescription>
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
                autoFocus
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>

            {showForgotPassword && (
              <div className="text-center">
                <Button 
                  type="button" 
                  variant="link" 
                  className="text-sm text-muted-foreground hover:text-primary"
                  onClick={handleForgotPassword}
                  disabled={loading}
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
        </CardContent>
      </Card>

      {/* Development helper */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="mt-4 border-dashed">
          <CardHeader>
            <CardTitle className="text-sm">Development Helper</CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2">
            <div>
              <strong>Test Accounts:</strong>
            </div>
            <div>Admin: admin@formulapm.com / password123</div>
            <div>PM: pm@formulapm.com / password123</div>
            <div>Architect: architect@formulapm.com / password123</div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
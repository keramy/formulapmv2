# Formula PM 3.0 - Authentication Simplification

## 🔄 Problem We're Solving

**V2's Issue**: 448-line useAuth hook trying to do everything - authentication, authorization, impersonation, token management, profile fetching, caching, and more.

**V3's Solution**: Multiple focused hooks, each under 50 lines, with single responsibilities.

## 🎯 Authentication Architecture

### Core Hooks

#### 1. useAuth Hook (30 lines max)
```tsx
// hooks/auth/useAuth.ts
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check stored session first for faster loads
    const storedSession = localStorage.getItem('auth-session')
    if (storedSession) {
      const parsed = JSON.parse(storedSession)
      setUser(parsed.user)
      setProfile(parsed.profile)
    }

    // Verify with Supabase
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        setError(error.message)
        localStorage.removeItem('auth-session')
      } else if (session) {
        setUser(session.user)
        fetchProfile(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          localStorage.removeItem('auth-session')
        }
      }
    )
    
    return () => subscription.unsubscribe()
  }, [])

  return { 
    user, 
    profile, 
    loading, 
    error,
    isAuthenticated: !!user && !!profile 
  }
}
```

#### 2. usePermissions Hook (20 lines)
```tsx
// hooks/auth/usePermissions.ts
export const usePermissions = () => {
  const { profile } = useAuth()
  
  const hasPermission = (permission: string) => {
    return profile?.permissions?.includes(permission) || false
  }
  
  const hasAnyPermission = (permissions: string[]) => {
    return permissions.some(p => hasPermission(p))
  }
  
  const hasAllPermissions = (permissions: string[]) => {
    return permissions.every(p => hasPermission(p))
  }
  
  return { 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions,
    permissions: profile?.permissions || []
  }
}
```

#### 3. useAuthActions Hook (25 lines)
```tsx
// hooks/auth/useAuthActions.ts
export const useAuthActions = () => {
  const router = useRouter()
  
  const signIn = async (email: string, password: string, rememberMe = false) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          persistSession: rememberMe
        }
      })
      
      if (error) throw error
      
      // Store session for faster loads
      if (rememberMe && data.session) {
        localStorage.setItem('auth-session', JSON.stringify({
          user: data.user,
          profile: await fetchProfile(data.user.id)
        }))
      }
      
      router.push('/dashboard')
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }
  
  const signOut = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('auth-session')
    router.push('/auth/login')
  }
  
  return { signIn, signOut }
}
```

## 🛡️ API Route Protection

### Middleware Pattern
```tsx
// lib/auth/middleware.ts
export const withAuth = (
  handler: AuthenticatedHandler,
  options: AuthOptions = {}
) => {
  return async (request: Request) => {
    try {
      // Get session from request
      const token = request.headers.get('authorization')?.replace('Bearer ', '')
      
      if (!token && options.requireAuth) {
        return new Response(
          JSON.stringify({ error: 'No authorization token' }), 
          { status: 401 }
        )
      }
      
      // Verify token with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token)
      
      if (error && options.requireAuth) {
        return new Response(
          JSON.stringify({ error: 'Invalid token' }), 
          { status: 401 }
        )
      }
      
      // Fetch profile if user exists
      let profile = null
      if (user) {
        profile = await getUserProfile(user.id)
        
        // Check specific permission if required
        if (options.permission && !profile?.permissions?.includes(options.permission)) {
          return new Response(
            JSON.stringify({ error: 'Insufficient permissions' }), 
            { status: 403 }
          )
        }
      }
      
      // Call the actual handler
      return handler(request, { user, profile })
      
    } catch (error) {
      console.error('Auth middleware error:', error)
      return new Response(
        JSON.stringify({ error: 'Authentication error' }), 
        { status: 500 }
      )
    }
  }
}
```

### Usage in API Routes
```tsx
// app/api/projects/route.ts
export const GET = withAuth(
  async (request, { user, profile }) => {
    const projects = await getProjectsForUser(user.id)
    return NextResponse.json(projects)
  },
  { requireAuth: true }
)

export const POST = withAuth(
  async (request, { user, profile }) => {
    const data = await request.json()
    const project = await createProject(data, user.id)
    return NextResponse.json(project)
  },
  { 
    requireAuth: true,
    permission: 'create_projects'
  }
)
```

## 🔐 Login Component

```tsx
// components/auth/LoginForm.tsx
export function LoginForm() {
  const { signIn } = useAuthActions()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    const result = await signIn(email, password, rememberMe)
    
    if (!result.success) {
      setError(result.error || 'Login failed')
      setLoading(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      
      <Input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="remember"
          checked={rememberMe}
          onCheckedChange={setRememberMe}
        />
        <label htmlFor="remember">Remember me</label>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Signing in...' : 'Sign In'}
      </Button>
    </form>
  )
}
```

## 🔄 Auth Context Provider

```tsx
// providers/AuthProvider.tsx
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth()
  
  // Show loading screen while checking auth
  if (auth.loading) {
    return <AuthLoadingScreen />
  }
  
  // Show error if critical auth error
  if (auth.error && !auth.user) {
    return <AuthErrorScreen error={auth.error} />
  }
  
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  )
}
```

## 📝 Session Management

### Features
1. **Remember Me**: Longer session duration for trusted devices
2. **Session Persistence**: Store in localStorage for faster loads
3. **Auto Refresh**: Supabase handles token refresh automatically
4. **Network Retry**: Auto-retry on network failures
5. **Clear Error Messages**: User-friendly error handling

### Security Considerations
- Never store sensitive data in localStorage
- Use httpOnly cookies in production
- Implement session timeout for sensitive operations
- Clear session on logout from all tabs

## 🚀 Key Improvements from V2

| V2 Problems | V3 Solutions |
|------------|--------------|
| 448-line useAuth hook | Multiple focused hooks < 50 lines each |
| Complex impersonation logic | Removed - not needed in core auth |
| Manual token management | Let Supabase handle it |
| Mixed concerns (auth + permissions + profile) | Separated into distinct hooks |
| No loading states | Proper loading and error states |
| Route blocking slows navigation | Component-level permission checks |
| No session persistence | Remember me + localStorage session |

## 🎯 Implementation Checklist

- [ ] Create focused auth hooks
- [ ] Implement auth middleware for API routes
- [ ] Add session persistence
- [ ] Create login/logout components
- [ ] Add proper loading states
- [ ] Implement error handling
- [ ] Add remember me functionality
- [ ] Test auth flow end-to-end
- [ ] Add auth provider wrapper
- [ ] Document auth patterns for team

---

*Last Updated: January 2025*
*Status: Simplified Architecture Ready*
*Next Step: Approval Workflows*
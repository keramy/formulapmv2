# 🤖 **AI AGENT PERFORMANCE OPTIMIZATION GUIDE**
## Formula PM 2.0 - Detailed Implementation Instructions

---

## 📋 **OVERVIEW FOR AI AGENT**

This document provides **step-by-step instructions** for implementing performance optimizations in the Formula PM 2.0 application. Each section includes:

1. **What to do** - Clear action items
2. **Why it's needed** - Context and reasoning
3. **How to implement** - Detailed code examples
4. **Where to make changes** - Specific file paths
5. **Validation steps** - How to verify success

---

## 🎯 **PHASE 1: CRITICAL LOADING OPTIMIZATIONS**

### **TASK 1.1: Create Centralized Loading Orchestrator**

#### **What to do:**
Create a centralized loading state management system to coordinate all loading states across the application.

#### **Why it's needed:**
Currently, loading states are managed inconsistently across components, causing:
- Multiple loading spinners appearing simultaneously
- Conflicting loading states
- Poor user experience with loading state conflicts
- No coordination between different loading operations

#### **Files to create/modify:**
1. `src/contexts/LoadingContext.tsx` - New file
2. `src/hooks/useLoading.ts` - New file  
3. `src/components/ui/LoadingOrchestrator.tsx` - New file
4. `src/app/layout.tsx` - Modify to add LoadingProvider

#### **Step-by-step implementation:**

**Step 1: Create LoadingContext.tsx**
```typescript
// File: src/contexts/LoadingContext.tsx
'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface LoadingState {
  global: boolean
  auth: boolean
  navigation: boolean
  components: Record<string, boolean>
  data: Record<string, boolean>
}

interface LoadingContextType {
  loadingState: LoadingState
  setGlobalLoading: (loading: boolean) => void
  setAuthLoading: (loading: boolean) => void
  setNavigationLoading: (loading: boolean) => void
  setComponentLoading: (component: string, loading: boolean) => void
  setDataLoading: (key: string, loading: boolean) => void
  isAnyLoading: boolean
  getLoadingStatus: () => LoadingState
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    global: false,
    auth: false,
    navigation: false,
    components: {},
    data: {}
  })

  const setGlobalLoading = useCallback((loading: boolean) => {
    setLoadingState(prev => ({ ...prev, global: loading }))
  }, [])

  const setAuthLoading = useCallback((loading: boolean) => {
    setLoadingState(prev => ({ ...prev, auth: loading }))
  }, [])

  const setNavigationLoading = useCallback((loading: boolean) => {
    setLoadingState(prev => ({ ...prev, navigation: loading }))
  }, [])

  const setComponentLoading = useCallback((component: string, loading: boolean) => {
    setLoadingState(prev => ({
      ...prev,
      components: {
        ...prev.components,
        [component]: loading
      }
    }))
  }, [])

  const setDataLoading = useCallback((key: string, loading: boolean) => {
    setLoadingState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [key]: loading
      }
    }))
  }, [])

  const isAnyLoading = React.useMemo(() => {
    return loadingState.global ||
           loadingState.auth ||
           loadingState.navigation ||
           Object.values(loadingState.components).some(Boolean) ||
           Object.values(loadingState.data).some(Boolean)
  }, [loadingState])

  const getLoadingStatus = useCallback(() => loadingState, [loadingState])

  return (
    <LoadingContext.Provider value={{
      loadingState,
      setGlobalLoading,
      setAuthLoading,
      setNavigationLoading,
      setComponentLoading,
      setDataLoading,
      isAnyLoading,
      getLoadingStatus
    }}>
      {children}
    </LoadingContext.Provider>
  )
}

export function useLoading() {
  const context = useContext(LoadingContext)
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider')
  }
  return context
}
```**St
ep 2: Create useLoading hook**
```typescript
// File: src/hooks/useLoading.ts
'use client'

import { useCallback } from 'react'
import { useLoading as useLoadingContext } from '@/contexts/LoadingContext'

export function useComponentLoading(componentName: string) {
  const { setComponentLoading, loadingState } = useLoadingContext()
  
  const setLoading = useCallback((loading: boolean) => {
    setComponentLoading(componentName, loading)
  }, [componentName, setComponentLoading])
  
  const isLoading = loadingState.components[componentName] || false
  
  return { setLoading, isLoading }
}

export function useDataLoading(dataKey: string) {
  const { setDataLoading, loadingState } = useLoadingContext()
  
  const setLoading = useCallback((loading: boolean) => {
    setDataLoading(dataKey, loading)
  }, [dataKey, setDataLoading])
  
  const isLoading = loadingState.data[dataKey] || false
  
  return { setLoading, isLoading }
}

export function useGlobalLoading() {
  const { setGlobalLoading, loadingState } = useLoadingContext()
  
  return {
    setLoading: setGlobalLoading,
    isLoading: loadingState.global
  }
}

export function useAuthLoading() {
  const { setAuthLoading, loadingState } = useLoadingContext()
  
  return {
    setLoading: setAuthLoading,
    isLoading: loadingState.auth
  }
}

export function useNavigationLoading() {
  const { setNavigationLoading, loadingState } = useLoadingContext()
  
  return {
    setLoading: setNavigationLoading,
    isLoading: loadingState.navigation
  }
}

// Export the main context hook
export { useLoading } from '@/contexts/LoadingContext'
```

**Step 3: Create LoadingOrchestrator component**
```typescript
// File: src/components/ui/LoadingOrchestrator.tsx
'use client'

import React from 'react'
import { useLoading } from '@/contexts/LoadingContext'
import { Loader2 } from 'lucide-react'

interface LoadingOrchestratorProps {
  children: React.ReactNode
}

export function LoadingOrchestrator({ children }: LoadingOrchestratorProps) {
  const { loadingState, isAnyLoading } = useLoading()
  
  // Global loading overlay
  if (loadingState.global) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading application...</p>
        </div>
      </div>
    )
  }
  
  // Auth loading overlay
  if (loadingState.auth) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Authenticating...</p>
        </div>
      </div>
    )
  }
  
  // Navigation loading bar
  const NavigationLoadingBar = () => (
    <div className="fixed top-0 left-0 right-0 z-30">
      <div className="h-1 bg-primary/20">
        <div className="h-full bg-primary animate-pulse" style={{ width: '60%' }} />
      </div>
    </div>
  )
  
  return (
    <>
      {loadingState.navigation && <NavigationLoadingBar />}
      {children}
    </>
  )
}
```

**Step 4: Update layout.tsx to include LoadingProvider**
```typescript
// File: src/app/layout.tsx - ADD LoadingProvider
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { LayoutWrapper } from '@/components/layouts/LayoutWrapper'
import { ClientProviders } from '@/components/providers/ClientProviders'
import { LoadingProvider } from '@/contexts/LoadingContext' // ADD THIS
import { LoadingOrchestrator } from '@/components/ui/LoadingOrchestrator' // ADD THIS

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Formula PM 2.0',
  description: 'Construction Project Management System',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning={true}>
        <LoadingProvider> {/* ADD THIS */}
          <LoadingOrchestrator> {/* ADD THIS */}
            <ClientProviders>
              <LayoutWrapper>
                {children}
              </LayoutWrapper>
            </ClientProviders>
          </LoadingOrchestrator> {/* ADD THIS */}
        </LoadingProvider> {/* ADD THIS */}
      </body>
    </html>
  )
}
```

#### **Validation steps:**
1. Check that all files are created without TypeScript errors
2. Verify the app still loads without breaking
3. Test that loading states can be triggered from any component
4. Confirm loading overlays appear correctly

---

### **TASK 1.2: Optimize Bundle Splitting Configuration**

#### **What to do:**
Enhance the Next.js webpack configuration to optimize bundle splitting and reduce initial bundle size.

#### **Why it's needed:**
Current bundle analysis shows:
- Main bundle is ~2.5MB (too large)
- Vendor chunks are not optimally split
- Some dependencies are loaded unnecessarily on initial load
- No specific chunking for major libraries (Supabase, Radix UI)

#### **Files to modify:**
1. `next.config.js` - Enhance webpack configuration

#### **Step-by-step implementation:**

**Step 1: Update next.config.js with optimized webpack config**
```javascript
// File: next.config.js - REPLACE the existing webpack configuration
/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: false,
})

const nextConfig = {
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons', 
      '@radix-ui/react-dialog', 
      '@radix-ui/react-dropdown-menu',
      '@supabase/supabase-js',
      'react',
      'react-dom',
      '@tanstack/react-table',
      'recharts',
      'date-fns'
    ],
    // Enable turbo for faster builds
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  poweredByHeader: false,
  compress: true,
  
  // ENHANCED WEBPACK CONFIGURATION
  webpack: (config, { dev, isServer }) => {
    
    // Production optimizations
    if (!dev && !isServer) {
      // Enhanced chunk splitting strategy
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000,
        cacheGroups: {
          // Framework chunk (React, Next.js)
          framework: {
            test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
            name: 'framework',
            chunks: 'all',
            priority: 40,
            enforce: true,
          },
          
          // Supabase chunk
          supabase: {
            test: /[\\/]node_modules[\\/]@supabase[\\/]/,
            name: 'supabase',
            chunks: 'all',
            priority: 35,
            enforce: true,
          },
          
          // Radix UI chunk
          radix: {
            test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
            name: 'radix-ui',
            chunks: 'all',
            priority: 30,
            enforce: true,
          },
          
          // Charts and data visualization
          charts: {
            test: /[\\/]node_modules[\\/](recharts|d3|@tanstack\/react-table)[\\/]/,
            name: 'charts',
            chunks: 'all',
            priority: 25,
            enforce: true,
          },
          
          // Icons chunk
          icons: {
            test: /[\\/]node_modules[\\/](lucide-react|@radix-ui\/react-icons)[\\/]/,
            name: 'icons',
            chunks: 'all',
            priority: 20,
            enforce: true,
          },
          
          // Utilities chunk
          utils: {
            test: /[\\/]node_modules[\\/](date-fns|clsx|class-variance-authority|tailwind-merge)[\\/]/,
            name: 'utils',
            chunks: 'all',
            priority: 15,
            enforce: true,
          },
          
          // Common vendor chunk for remaining dependencies
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor',
            chunks: 'all',
            priority: 10,
            minChunks: 2,
            reuseExistingChunk: true,
          },
          
          // Common application code
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      }
      
      // Tree shaking optimization
      config.optimization.usedExports = true
      config.optimization.sideEffects = false
      
      // Module concatenation for better minification
      config.optimization.concatenateModules = true
    }
    
    // Development optimizations
    if (dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true,
            priority: 5,
          },
        },
      }
    }
    
    return config
  },
  
  // Security headers (existing)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Content-Security-Policy',
            value: process.env.NODE_ENV === 'development' 
              ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://*.supabase.co wss://*.supabase.co http://127.0.0.1:54321 ws://127.0.0.1:54321;"
              : "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://*.supabase.co wss://*.supabase.co;",
          },
        ],
      },
    ]
  },
}

module.exports = withBundleAnalyzer(nextConfig)
```

#### **Validation steps:**
1. Run `npm run build` to test the new configuration
2. Run `npm run analyze` to see the new bundle structure
3. Verify that chunks are created as expected:
   - framework.js (React, Next.js)
   - supabase.js (Supabase libraries)
   - radix-ui.js (Radix UI components)
   - charts.js (Data visualization)
   - icons.js (Icon libraries)
   - utils.js (Utility libraries)
   - vendor.js (Other dependencies)
4. Check that total bundle size is reduced

---

### **TASK 1.3: Implement Auth State Caching**

#### **What to do:**
Create an intelligent auth caching system that reduces authentication checks and improves navigation performance.

#### **Why it's needed:**
Current auth implementation:
- Validates auth state on every route change
- No caching of auth results
- Heavy useAuth hook called repeatedly
- Session recovery blocks UI for extended periods
- Multiple loading states for the same auth check

#### **Files to create/modify:**
1. `src/lib/auth-cache.ts` - New file
2. `src/hooks/useAuth.ts` - Modify to use caching
3. `src/components/layouts/LayoutWrapper.tsx` - Optimize auth checks

#### **Step-by-step implementation:**

**Step 1: Create auth-cache.ts**
```typescript
// File: src/lib/auth-cache.ts
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { UserProfile } from '@/types/auth'

interface AuthCacheEntry {
  user: SupabaseUser | null
  profile: UserProfile | null
  isAuthenticated: boolean
  timestamp: number
  expiresAt: number
}

interface AuthCache {
  entry: AuthCacheEntry | null
  validationPromise: Promise<AuthCacheEntry> | null
}

class AuthCacheManager {
  private cache: AuthCache = {
    entry: null,
    validationPromise: null
  }
  
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes
  private readonly BACKGROUND_REFRESH_THRESHOLD = 2 * 60 * 1000 // 2 minutes
  
  /**
   * Get cached auth state or validate if expired
   */
  async getAuthState(): Promise<AuthCacheEntry> {
    const now = Date.now()
    
    // Return valid cache immediately
    if (this.cache.entry && now < this.cache.entry.expiresAt) {
      // Trigger background refresh if approaching expiration
      if (now > this.cache.entry.timestamp + this.BACKGROUND_REFRESH_THRESHOLD) {
        this.refreshInBackground()
      }
      return this.cache.entry
    }
    
    // Return existing validation promise if in progress
    if (this.cache.validationPromise) {
      return this.cache.validationPromise
    }
    
    // Start new validation
    this.cache.validationPromise = this.validateAuth()
    
    try {
      const result = await this.cache.validationPromise
      this.cache.entry = result
      return result
    } finally {
      this.cache.validationPromise = null
    }
  }
  
  /**
   * Validate authentication state
   */
  private async validateAuth(): Promise<AuthCacheEntry> {
    try {
      // Import Supabase client dynamically to avoid SSR issues
      const { createClient } = await import('@/lib/supabase')
      const supabase = createClient()
      
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Auth validation error:', error)
        return this.createCacheEntry(null, null, false)
      }
      
      if (!session?.user) {
        return this.createCacheEntry(null, null, false)
      }
      
      // Fetch user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      
      return this.createCacheEntry(session.user, profile, true)
      
    } catch (error) {
      console.error('Auth cache validation failed:', error)
      return this.createCacheEntry(null, null, false)
    }
  }
  
  /**
   * Create cache entry with expiration
   */
  private createCacheEntry(
    user: SupabaseUser | null, 
    profile: UserProfile | null, 
    isAuthenticated: boolean
  ): AuthCacheEntry {
    const now = Date.now()
    return {
      user,
      profile,
      isAuthenticated,
      timestamp: now,
      expiresAt: now + this.CACHE_TTL
    }
  }
  
  /**
   * Refresh cache in background without blocking UI
   */
  private refreshInBackground(): void {
    if (this.cache.validationPromise) return
    
    this.cache.validationPromise = this.validateAuth()
    this.cache.validationPromise
      .then(result => {
        this.cache.entry = result
      })
      .catch(error => {
        console.error('Background auth refresh failed:', error)
      })
      .finally(() => {
        this.cache.validationPromise = null
      })
  }
  
  /**
   * Invalidate cache (call on sign out, sign in, etc.)
   */
  invalidate(): void {
    this.cache.entry = null
    this.cache.validationPromise = null
  }
  
  /**
   * Update cache with new auth state
   */
  updateCache(user: SupabaseUser | null, profile: UserProfile | null, isAuthenticated: boolean): void {
    this.cache.entry = this.createCacheEntry(user, profile, isAuthenticated)
  }
  
  /**
   * Check if cache is valid without triggering validation
   */
  isValid(): boolean {
    return this.cache.entry !== null && Date.now() < this.cache.entry.expiresAt
  }
  
  /**
   * Get cached entry without validation (may be null or expired)
   */
  getCachedEntry(): AuthCacheEntry | null {
    return this.cache.entry
  }
}

// Export singleton instance
export const authCache = new AuthCacheManager()
```**S
tep 2: Update useAuth.ts to use caching**
```typescript
// File: src/hooks/useAuth.ts - MODIFY to integrate auth caching
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { authCache } from '@/lib/auth-cache'
import { useAuthLoading } from '@/hooks/useLoading'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { UserProfile, AuthState } from '@/types/auth'

export function useAuth() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [authState, setAuthState] = useState<AuthState>('idle')
  const [authError, setAuthError] = useState<string | null>(null)
  const [isRecoveringSession, setIsRecoveringSession] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>({})
  
  const router = useRouter()
  const supabase = createClient()
  const { setLoading: setAuthLoading } = useAuthLoading()
  
  // Initialize auth state from cache
  useEffect(() => {
    let mounted = true
    
    const initializeAuth = async () => {
      try {
        setAuthState('loading')
        setAuthLoading(true)
        
        // Try to get cached auth state first
        const cachedEntry = authCache.getCachedEntry()
        if (cachedEntry && authCache.isValid()) {
          if (mounted) {
            setUser(cachedEntry.user)
            setProfile(cachedEntry.profile)
            setAuthState(cachedEntry.isAuthenticated ? 'authenticated' : 'idle')
            setAuthLoading(false)
          }
          return
        }
        
        // Get fresh auth state (may use cache internally)
        const authEntry = await authCache.getAuthState()
        
        if (mounted) {
          setUser(authEntry.user)
          setProfile(authEntry.profile)
          setAuthState(authEntry.isAuthenticated ? 'authenticated' : 'idle')
          setAuthError(null)
        }
        
      } catch (error) {
        console.error('Auth initialization failed:', error)
        if (mounted) {
          setAuthError('Failed to initialize authentication')
          setAuthState('error')
        }
      } finally {
        if (mounted) {
          setAuthLoading(false)
        }
      }
    }
    
    initializeAuth()
    
    return () => {
      mounted = false
    }
  }, [setAuthLoading])
  
  // Set up auth state change listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id)
        
        try {
          if (event === 'SIGNED_IN' && session?.user) {
            setAuthState('loading')
            setAuthLoading(true)
            
            // Fetch user profile
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()
            
            // Update cache
            authCache.updateCache(session.user, profile, true)
            
            setUser(session.user)
            setProfile(profile)
            setAuthState('authenticated')
            setAuthError(null)
            
          } else if (event === 'SIGNED_OUT') {
            // Clear cache
            authCache.invalidate()
            
            setUser(null)
            setProfile(null)
            setAuthState('idle')
            setAuthError(null)
            
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            // Update cache with refreshed session
            const cachedEntry = authCache.getCachedEntry()
            if (cachedEntry) {
              authCache.updateCache(session.user, cachedEntry.profile, true)
            }
            setUser(session.user)
          }
          
        } catch (error) {
          console.error('Auth state change error:', error)
          setAuthError('Authentication state change failed')
          setAuthState('error')
        } finally {
          setAuthLoading(false)
        }
      }
    )
    
    return () => subscription.unsubscribe()
  }, [supabase, setAuthLoading])
  
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setAuthState('loading')
      setAuthLoading(true)
      setAuthError(null)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        setAuthError(error.message)
        setAuthState('error')
        return { error }
      }
      
      // Auth state change listener will handle the rest
      return { data }
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign in failed'
      setAuthError(message)
      setAuthState('error')
      return { error: { message } }
    } finally {
      setAuthLoading(false)
    }
  }, [supabase, setAuthLoading])
  
  const signOut = useCallback(async () => {
    try {
      setAuthState('signing_out')
      setAuthLoading(true)
      
      await supabase.auth.signOut()
      
      // Clear cache
      authCache.invalidate()
      
      // Auth state change listener will handle the rest
      
    } catch (error) {
      console.error('Sign out error:', error)
      setAuthError('Sign out failed')
      setAuthState('error')
    } finally {
      setAuthLoading(false)
    }
  }, [supabase, setAuthLoading])
  
  const clearAuthError = useCallback(() => {
    setAuthError(null)
    if (authState === 'error') {
      setAuthState('idle')
    }
  }, [authState])
  
  // Fast auth check using cache
  const isAuthenticated = user !== null && profile !== null && authState === 'authenticated'
  const isError = authState === 'error' && authError !== null
  const loading = authState === 'loading'
  
  return {
    user,
    profile,
    authState,
    authError,
    isError,
    isRecoveringSession,
    isAuthenticated,
    loading,
    signIn,
    signOut,
    clearAuthError,
    debugInfo
  }
}
```

**Step 3: Optimize LayoutWrapper.tsx for cached auth**
```typescript
// File: src/components/layouts/LayoutWrapper.tsx - MODIFY auth checks
'use client'

import { Sidebar } from '@/components/layouts/Sidebar'
import { Header } from '@/components/layouts/Header'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { usePathname, useRouter } from 'next/navigation'
import { useNavigationLoading } from '@/hooks/useLoading' // ADD THIS
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, WifiOff, RefreshCw } from 'lucide-react'
import { RealtimeProvider } from '@/contexts/RealtimeContext'
import { DevErrorSuppressor } from '@/components/DevErrorSuppressor'

export const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { setLoading: setNavigationLoading } = useNavigationLoading() // ADD THIS
  
  // Always call useAuth hook to avoid conditional hook calls
  const { 
    user, 
    authState, 
    authError, 
    isError, 
    isRecoveringSession,
    isAuthenticated,
    clearAuthError,
    signOut,
    debugInfo 
  } = useAuth()

  // List of paths that should not show the sidebar/header
  const noLayoutPaths = ['/', '/auth/login', '/auth/register', '/auth/reset-password']
  const isNoLayoutPath = noLayoutPaths.includes(pathname)

  // OPTIMIZED: Client-side redirect logic with navigation loading
  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    
    // Redirect unauthenticated users away from protected pages
    const shouldRedirectToLogin = !isNoLayoutPath && !isAuthenticated && authState === 'idle' && !user
    if (shouldRedirectToLogin) {
      console.log('🔐 [LayoutWrapper] Redirecting to login - user not authenticated')
      setNavigationLoading(true) // ADD THIS
      
      // Small delay to show navigation loading
      timeoutId = setTimeout(() => {
        router.push('/auth/login')
        setNavigationLoading(false) // ADD THIS
      }, 100)
      return
    }
    
    // Redirect authenticated users away from auth pages, but not during logout
    const isAuthPage = pathname.startsWith('/auth/')
    const shouldRedirectToDashboard = isAuthPage && isAuthenticated && user && 
      authState !== 'loading' && authState !== 'signing_out'
    if (shouldRedirectToDashboard) {
      console.log('🔐 [LayoutWrapper] Redirecting to dashboard - user already authenticated')
      setNavigationLoading(true) // ADD THIS
      
      // Small delay to show navigation loading
      timeoutId = setTimeout(() => {
        router.push('/dashboard')
        setNavigationLoading(false) // ADD THIS
      }, 100)
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
        setNavigationLoading(false) // ADD THIS
      }
    }
  }, [isNoLayoutPath, isAuthenticated, authState, pathname, router, user, setNavigationLoading])

  // If on a no-layout path, render children directly without auth loading
  if (isNoLayoutPath) {
    return <>{children}</>
  }

  // OPTIMIZED: Show loading state for auth operations (reduced cases)
  if (authState === 'loading' && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading your session...</p>
        </div>
      </div>
    )
  }

  // Show recovery state
  if (isRecoveringSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <WifiOff className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <CardTitle>Recovering Session</CardTitle>
            <CardDescription>
              We're attempting to recover your session. Please wait...
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm text-muted-foreground">
                Attempt {debugInfo?.recoveryAttempts || 0} of 3
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show error state with recovery options
  if (isError && authError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <CardTitle>Authentication Error</CardTitle>
            <CardDescription>
              There was a problem with your session
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {authError || 'An authentication error occurred'}
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  clearAuthError()
                  router.push('/auth/login')
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => {
                  clearAuthError()
                  router.push('/auth/login')
                }}
              >
                Sign In Again
              </Button>
            </div>
            
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={async () => {
                await signOut()
                router.push('/auth/login')
              }}
            >
              Sign Out & Retry
            </Button>
            
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-2 bg-muted rounded text-xs">
                <div><strong>Debug Info:</strong></div>
                <div>State: {authState}</div>
                <div>Error: {authError}</div>
                <div>Recovery Attempts: {debugInfo?.recoveryAttempts}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // OPTIMIZED: If not authenticated, show redirecting message with less blocking
  if (!user || !isAuthenticated) {
    // Show redirecting state for unauthenticated users
    const message = authState === 'idle' ? 'Redirecting to login...' : 'Checking authentication...'
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">{message}</p>
        </div>
      </div>
    )
  }

  return (
    <RealtimeProvider>
      <DevErrorSuppressor />
      <div className="flex h-screen overflow-hidden">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Sidebar */}
        <Sidebar 
          className={cn(
            "z-50 transition-transform duration-300 ease-in-out",
            "lg:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
          onClose={() => setSidebarOpen(false)}
        />
        
        {/* Main content */}
        <main className="flex-1 flex flex-col overflow-y-auto lg:ml-64">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <div className="p-4 lg:p-6 flex-1">
            {children}
          </div>
        </main>
      </div>
    </RealtimeProvider>
  )
}
```

#### **Validation steps:**
1. Test that auth state is cached between route changes
2. Verify that navigation is faster after initial auth
3. Check that background auth refresh works
4. Confirm that sign in/out properly invalidates cache
5. Test that the app works offline with cached auth state

---

### **TASK 1.4: Create Skeleton Loading Components**

#### **What to do:**
Create content-aware skeleton loading components that match the actual content layout for better perceived performance.

#### **Why it's needed:**
Current loading states:
- Generic spinning loaders everywhere
- No indication of what content is loading
- Poor perceived performance
- Users don't know what to expect

#### **Files to create:**
1. `src/components/ui/skeletons/ProjectCardSkeleton.tsx`
2. `src/components/ui/skeletons/TaskListSkeleton.tsx`
3. `src/components/ui/skeletons/DashboardSkeleton.tsx`
4. `src/components/ui/skeletons/DataTableSkeleton.tsx`
5. `src/components/ui/skeletons/index.ts`

#### **Step-by-step implementation:**

**Step 1: Create base Skeleton component**
```typescript
// File: src/components/ui/skeletons/Skeleton.tsx
import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  children?: React.ReactNode
}

export function Skeleton({ className, children, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function SkeletonText({ className, ...props }: SkeletonProps) {
  return (
    <Skeleton
      className={cn("h-4 bg-muted", className)}
      {...props}
    />
  )
}

export function SkeletonAvatar({ className, ...props }: SkeletonProps) {
  return (
    <Skeleton
      className={cn("h-10 w-10 rounded-full", className)}
      {...props}
    />
  )
}

export function SkeletonButton({ className, ...props }: SkeletonProps) {
  return (
    <Skeleton
      className={cn("h-9 w-20 rounded-md", className)}
      {...props}
    />
  )
}
```

**Step 2: Create ProjectCardSkeleton**
```typescript
// File: src/components/ui/skeletons/ProjectCardSkeleton.tsx
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton, SkeletonText, SkeletonAvatar, SkeletonButton } from './Skeleton'

export function ProjectCardSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <SkeletonText className="h-6 w-48" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <SkeletonText className="h-4 w-32" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <SkeletonText className="h-3 w-16" />
            <SkeletonText className="h-4 w-20" />
          </div>
          <div className="space-y-2">
            <SkeletonText className="h-3 w-16" />
            <SkeletonText className="h-4 w-24" />
          </div>
        </div>
        
        <div className="space-y-2">
          <SkeletonText className="h-3 w-20" />
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            <SkeletonAvatar className="h-8 w-8" />
            <SkeletonAvatar className="h-8 w-8" />
            <SkeletonAvatar className="h-8 w-8" />
          </div>
          <SkeletonButton />
        </div>
      </CardContent>
    </Card>
  )
}

export function ProjectCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProjectCardSkeleton key={i} />
      ))}
    </div>
  )
}
```

**Step 3: Create TaskListSkeleton**
```typescript
// File: src/components/ui/skeletons/TaskListSkeleton.tsx
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton, SkeletonText, SkeletonAvatar } from './Skeleton'

function TaskItemSkeleton() {
  return (
    <div className="flex items-center space-x-4 p-4 border-b last:border-b-0">
      <Skeleton className="h-4 w-4 rounded" />
      <div className="flex-1 space-y-2">
        <SkeletonText className="h-4 w-3/4" />
        <div className="flex items-center space-x-4">
          <SkeletonText className="h-3 w-20" />
          <SkeletonText className="h-3 w-16" />
          <SkeletonText className="h-3 w-24" />
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <SkeletonAvatar className="h-6 w-6" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  )
}

export function TaskListSkeleton({ count = 8 }: { count?: number }) {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <SkeletonText className="h-6 w-32" />
          <div className="flex space-x-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
        <SkeletonText className="h-4 w-48" />
      </CardHeader>
      <CardContent className="p-0">
        {Array.from({ length: count }).map((_, i) => (
          <TaskItemSkeleton key={i} />
        ))}
      </CardContent>
    </Card>
  )
}
```

**Step 4: Create DashboardSkeleton**
```typescript
// File: src/components/ui/skeletons/DashboardSkeleton.tsx
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton, SkeletonText } from './Skeleton'

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <SkeletonText className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <SkeletonText className="h-8 w-16 mb-2" />
        <SkeletonText className="h-3 w-32" />
      </CardContent>
    </Card>
  )
}

function ChartSkeleton() {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <SkeletonText className="h-6 w-48" />
        <SkeletonText className="h-4 w-64" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-80 w-full" />
      </CardContent>
    </Card>
  )
}

function RecentActivitySkeleton() {
  return (
    <Card className="col-span-3">
      <CardHeader>
        <SkeletonText className="h-6 w-32" />
        <SkeletonText className="h-4 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2 flex-1">
              <SkeletonText className="h-4 w-3/4" />
              <SkeletonText className="h-3 w-1/2" />
            </div>
            <SkeletonText className="h-3 w-16" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <SkeletonText className="h-8 w-64" />
        <SkeletonText className="h-4 w-96" />
      </div>
      
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      
      {/* Main Content */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <ChartSkeleton />
        <RecentActivitySkeleton />
      </div>
    </div>
  )
}
```

**Step 5: Create DataTableSkeleton**
```typescript
// File: src/components/ui/skeletons/DataTableSkeleton.tsx
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton, SkeletonText } from './Skeleton'

interface DataTableSkeletonProps {
  columns?: number
  rows?: number
  showHeader?: boolean
  showPagination?: boolean
}

export function DataTableSkeleton({ 
  columns = 5, 
  rows = 10, 
  showHeader = true,
  showPagination = true 
}: DataTableSkeletonProps) {
  return (
    <Card>
      {showHeader && (
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <SkeletonText className="h-6 w-48" />
            <div className="flex space-x-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-28" />
          </div>
        </CardHeader>
      )}
      
      <CardContent className="p-0">
        {/* Table Header */}
        <div className="border-b">
          <div className="grid gap-4 p-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, i) => (
              <SkeletonText key={i} className="h-4 w-20" />
            ))}
          </div>
        </div>
        
        {/* Table Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="border-b last:border-b-0">
            <div className="grid gap-4 p-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <SkeletonText 
                  key={colIndex} 
                  className={`h-4 ${colIndex === 0 ? 'w-32' : colIndex === 1 ? 'w-24' : 'w-16'}`} 
                />
              ))}
            </div>
          </div>
        ))}
      </CardContent>
      
      {showPagination && (
        <div className="flex items-center justify-between p-4 border-t">
          <SkeletonText className="h-4 w-32" />
          <div className="flex space-x-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      )}
    </Card>
  )
}
```

**Step 6: Create index file for easy imports**
```typescript
// File: src/components/ui/skeletons/index.ts
export { Skeleton, SkeletonText, SkeletonAvatar, SkeletonButton } from './Skeleton'
export { ProjectCardSkeleton, ProjectCardSkeletonGrid } from './ProjectCardSkeleton'
export { TaskListSkeleton } from './TaskListSkeleton'
export { DashboardSkeleton } from './DashboardSkeleton'
export { DataTableSkeleton } from './DataTableSkeleton'
```

#### **Validation steps:**
1. Import and use skeleton components in place of loading spinners
2. Verify that skeletons match the actual content layout
3. Test that animations work smoothly
4. Check that skeletons are responsive on different screen sizes
5. Confirm that skeleton components don't cause layout shifts

---

## 🎯 **PHASE 2: NAVIGATION ENHANCEMENT**

### **TASK 2.1: Implement Route-Level Caching**

#### **What to do:**
Create a route caching system that stores rendered components and data to enable instant navigation between previously visited routes.

#### **Why it's needed:**
Current navigation issues:
- Every route change triggers full component re-render
- Data is re-fetched on every navigation
- No memory of previously visited routes
- Slow navigation between common routes

#### **Files to create:**
1. `src/lib/route-cache.ts` - Route caching manager
2. `src/contexts/RouteCacheContext.tsx` - Route cache context
3. `src/hooks/useRouteCache.ts` - Route cache hook
4. `src/components/navigation/CachedRoute.tsx` - Cached route wrapper

#### **Step-by-step implementation:**

**Step 1: Create route-cache.ts**
```typescript
// File: src/lib/route-cache.ts
interface RouteCacheEntry {
  path: string
  component: React.ReactNode
  data: any
  timestamp: number
  expiresAt: number
  scrollPosition: number
}

interface RouteCacheConfig {
  maxEntries: number
  defaultTTL: number
  routes: Record<string, { ttl?: number; preload?: boolean }>
}

class RouteCacheManager {
  private cache: Map<string, RouteCacheEntry> = new Map()
  private config: RouteCacheConfig = {
    maxEntries: 10,
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    routes: {
      '/dashboard': { ttl: 2 * 60 * 1000, preload: true },
      '/projects': { ttl: 3 * 60 * 1000, preload: true },
      '/tasks': { ttl: 2 * 60 * 1000 },
      '/reports': { ttl: 5 * 60 * 1000 },
      '/settings': { ttl: 10 * 60 * 1000 }
    }
  }
  
  /**
   * Store route in cache
   */
  set(path: string, component: React.ReactNode, data?: any): void {
    const now = Date.now()
    const routeConfig = this.config.routes[path] || {}
    const ttl = routeConfig.ttl || this.config.defaultTTL
    
    const entry: RouteCacheEntry = {
      path,
      component,
      data,
      timestamp: now,
      expiresAt: now + ttl,
      scrollPosition: window.scrollY || 0
    }
    
    this.cache.set(path, entry)
    
    // Cleanup old entries if cache is full
    if (this.cache.size > this.config.maxEntries) {
      this.cleanup()
    }
  }
  
  /**
   * Get cached route
   */
  get(path: string): RouteCacheEntry | null {
    const entry = this.cache.get(path)
    
    if (!entry) {
      return null
    }
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(path)
      return null
    }
    
    return entry
  }
  
  /**
   * Check if route is cached and valid
   */
  has(path: string): boolean {
    return this.get(path) !== null
  }
  
  /**
   * Invalidate specific route
   */
  invalidate(path: string): void {
    this.cache.delete(path)
  }
  
  /**
   * Invalidate routes matching pattern
   */
  invalidatePattern(pattern: RegExp): void {
    for (const [path] of this.cache) {
      if (pattern.test(path)) {
        this.cache.delete(path)
      }
    }
  }
  
  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
  }
  
  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    const entries = Array.from(this.cache.entries())
    
    // Sort by timestamp (oldest first)
    entries.sort(([, a], [, b]) => a.timestamp - b.timestamp)
    
    // Remove expired entries first
    for (const [path, entry] of entries) {
      if (now > entry.expiresAt) {
        this.cache.delete(path)
      }
    }
    
    // If still over limit, remove oldest entries
    if (this.cache.size > this.config.maxEntries) {
      const remainingEntries = Array.from(this.cache.entries())
      remainingEntries.sort(([, a], [, b]) => a.timestamp - b.timestamp)
      
      const toRemove = remainingEntries.slice(0, this.cache.size - this.config.maxEntries)
      for (const [path] of toRemove) {
        this.cache.delete(path)
      }
    }
  }
  
  /**
   * Get cache statistics
   */
  getStats(): {
    size: number
    maxSize: number
    hitRate: number
    entries: Array<{ path: string; timestamp: number; expiresAt: number }>
  } {
    const entries = Array.from(this.cache.entries()).map(([path, entry]) => ({
      path,
      timestamp: entry.timestamp,
      expiresAt: entry.expiresAt
    }))
    
    return {
      size: this.cache.size,
      maxSize: this.config.maxEntries,
      hitRate: 0, // Would need to track hits/misses
      entries
    }
  }
  
  /**
   * Preload routes that are likely to be visited
   */
  async preloadRoutes(currentPath: string): Promise<void> {
    const preloadCandidates = this.getPreloadCandidates(currentPath)
    
    for (const path of preloadCandidates) {
      if (!this.has(path)) {
        // Trigger route preload (implementation depends on your routing setup)
        this.triggerPreload(path)
      }
    }
  }
  
  /**
   * Get routes that should be preloaded based on current route
   */
  private getPreloadCandidates(currentPath: string): string[] {
    const navigationPatterns: Record<string, string[]> = {
      '/dashboard': ['/projects', '/tasks', '/reports'],
      '/projects': ['/projects/[id]', '/scope', '/milestones'],
      '/projects/[id]': ['/tasks', '/scope', '/shop-drawings'],
      '/tasks': ['/projects', '/milestones'],
      '/reports': ['/projects', '/dashboard']
    }
    
    return navigationPatterns[currentPath] || []
  }
  
  /**
   * Trigger route preload (placeholder - implement based on your needs)
   */
  private triggerPreload(path: string): void {
    // This would depend on your specific routing and data fetching setup
    console.log(`Preloading route: ${path}`)
  }
}

// Export singleton instance
export const routeCache = new RouteCacheManager()
```*
*Step 2: Create RouteCacheContext.tsx**
```typescript
// File: src/contexts/RouteCacheContext.tsx
'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { routeCache } from '@/lib/route-cache'

interface RouteCacheContextType {
  getCachedRoute: (path: string) => React.ReactNode | null
  setCachedRoute: (path: string, component: React.ReactNode, data?: any) => void
  invalidateRoute: (path: string) => void
  invalidatePattern: (pattern: RegExp) => void
  clearCache: () => void
  isCached: (path: string) => boolean
  preloadRoute: (path: string) => Promise<void>
}

const RouteCacheContext = createContext<RouteCacheContextType | undefined>(undefined)

export function RouteCacheProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [, forceUpdate] = useState({})
  
  // Trigger preloading when route changes
  useEffect(() => {
    routeCache.preloadRoutes(pathname)
  }, [pathname])
  
  const getCachedRoute = useCallback((path: string) => {
    const entry = routeCache.get(path)
    return entry?.component || null
  }, [])
  
  const setCachedRoute = useCallback((path: string, component: React.ReactNode, data?: any) => {
    routeCache.set(path, component, data)
    forceUpdate({}) // Trigger re-render to update cache status
  }, [])
  
  const invalidateRoute = useCallback((path: string) => {
    routeCache.invalidate(path)
    forceUpdate({}) // Trigger re-render to update cache status
  }, [])
  
  const invalidatePattern = useCallback((pattern: RegExp) => {
    routeCache.invalidatePattern(pattern)
    forceUpdate({}) // Trigger re-render to update cache status
  }, [])
  
  const clearCache = useCallback(() => {
    routeCache.clear()
    forceUpdate({}) // Trigger re-render to update cache status
  }, [])
  
  const isCached = useCallback((path: string) => {
    return routeCache.has(path)
  }, [])
  
  const preloadRoute = useCallback(async (path: string) => {
    // Implementation would depend on your routing setup
    // This is a placeholder for route preloading logic
    console.log(`Preloading route: ${path}`)
  }, [])
  
  return (
    <RouteCacheContext.Provider value={{
      getCachedRoute,
      setCachedRoute,
      invalidateRoute,
      invalidatePattern,
      clearCache,
      isCached,
      preloadRoute
    }}>
      {children}
    </RouteCacheContext.Provider>
  )
}

export function useRouteCache() {
  const context = useContext(RouteCacheContext)
  if (context === undefined) {
    throw new Error('useRouteCache must be used within a RouteCacheProvider')
  }
  return context
}
```

**Step 3: Create useRouteCache hook**
```typescript
// File: src/hooks/useRouteCache.ts
'use client'

import { useCallback, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useRouteCache as useRouteCacheContext } from '@/contexts/RouteCacheContext'

interface UseRouteCacheOptions {
  ttl?: number
  dependencies?: any[]
  onCacheHit?: () => void
  onCacheMiss?: () => void
}

export function useRouteCache(options: UseRouteCacheOptions = {}) {
  const pathname = usePathname()
  const { getCachedRoute, setCachedRoute, invalidateRoute, isCached } = useRouteCacheContext()
  const { ttl, dependencies = [], onCacheHit, onCacheMiss } = options
  
  const componentRef = useRef<React.ReactNode>(null)
  const dataRef = useRef<any>(null)
  
  // Check if current route is cached
  const isCurrentRouteCached = isCached(pathname)
  
  // Get cached component for current route
  const getCachedComponent = useCallback(() => {
    const cached = getCachedRoute(pathname)
    if (cached) {
      onCacheHit?.()
      return cached
    } else {
      onCacheMiss?.()
      return null
    }
  }, [pathname, getCachedRoute, onCacheHit, onCacheMiss])
  
  // Cache current component
  const cacheCurrentRoute = useCallback((component: React.ReactNode, data?: any) => {
    componentRef.current = component
    dataRef.current = data
    setCachedRoute(pathname, component, data)
  }, [pathname, setCachedRoute])
  
  // Invalidate current route cache
  const invalidateCurrentRoute = useCallback(() => {
    invalidateRoute(pathname)
    componentRef.current = null
    dataRef.current = null
  }, [pathname, invalidateRoute])
  
  // Auto-invalidate cache when dependencies change
  useEffect(() => {
    if (dependencies.length > 0) {
      invalidateCurrentRoute()
    }
  }, dependencies) // eslint-disable-line react-hooks/exhaustive-deps
  
  return {
    pathname,
    isCurrentRouteCached,
    getCachedComponent,
    cacheCurrentRoute,
    invalidateCurrentRoute,
    cachedData: dataRef.current
  }
}

// Hook for prefetching routes on hover/focus
export function usePrefetchRoute() {
  const { preloadRoute } = useRouteCacheContext()
  
  const prefetchOnHover = useCallback((path: string) => {
    return {
      onMouseEnter: () => preloadRoute(path),
      onFocus: () => preloadRoute(path)
    }
  }, [preloadRoute])
  
  const prefetchRoute = useCallback((path: string) => {
    preloadRoute(path)
  }, [preloadRoute])
  
  return {
    prefetchOnHover,
    prefetchRoute
  }
}
```

**Step 4: Create CachedRoute component**
```typescript
// File: src/components/navigation/CachedRoute.tsx
'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useRouteCache } from '@/hooks/useRouteCache'
import { useNavigationLoading } from '@/hooks/useLoading'

interface CachedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  dependencies?: any[]
  cacheTTL?: number
  onCacheHit?: () => void
  onCacheMiss?: () => void
}

export function CachedRoute({ 
  children, 
  fallback, 
  dependencies = [],
  cacheTTL,
  onCacheHit,
  onCacheMiss
}: CachedRouteProps) {
  const [isLoading, setIsLoading] = useState(true)
  const { setLoading: setNavigationLoading } = useNavigationLoading()
  
  const {
    isCurrentRouteCached,
    getCachedComponent,
    cacheCurrentRoute,
    pathname
  } = useRouteCache({
    ttl: cacheTTL,
    dependencies,
    onCacheHit: () => {
      setIsLoading(false)
      setNavigationLoading(false)
      onCacheHit?.()
    },
    onCacheMiss: () => {
      setIsLoading(true)
      setNavigationLoading(true)
      onCacheMiss?.()
    }
  })
  
  // Try to get cached component first
  const cachedComponent = getCachedComponent()
  
  useEffect(() => {
    if (cachedComponent) {
      // Use cached version immediately
      setIsLoading(false)
      setNavigationLoading(false)
    } else {
      // Will load fresh component
      setIsLoading(true)
      setNavigationLoading(true)
      
      // Cache the component once it's rendered
      const timer = setTimeout(() => {
        cacheCurrentRoute(children)
        setIsLoading(false)
        setNavigationLoading(false)
      }, 100) // Small delay to ensure component is fully rendered
      
      return () => clearTimeout(timer)
    }
  }, [pathname, cachedComponent, children, cacheCurrentRoute, setNavigationLoading])
  
  // Return cached component if available
  if (cachedComponent && !isLoading) {
    return <>{cachedComponent}</>
  }
  
  // Return fresh component with suspense
  return (
    <Suspense fallback={fallback || <div>Loading...</div>}>
      {children}
    </Suspense>
  )
}

// HOC version for easier integration
export function withRouteCache<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<CachedRouteProps, 'children'> = {}
) {
  return function CachedComponent(props: P) {
    return (
      <CachedRoute {...options}>
        <Component {...props} />
      </CachedRoute>
    )
  }
}
```

**Step 5: Update layout.tsx to include RouteCacheProvider**
```typescript
// File: src/app/layout.tsx - ADD RouteCacheProvider
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { LayoutWrapper } from '@/components/layouts/LayoutWrapper'
import { ClientProviders } from '@/components/providers/ClientProviders'
import { LoadingProvider } from '@/contexts/LoadingContext'
import { LoadingOrchestrator } from '@/components/ui/LoadingOrchestrator'
import { RouteCacheProvider } from '@/contexts/RouteCacheContext' // ADD THIS

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Formula PM 2.0',
  description: 'Construction Project Management System',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning={true}>
        <LoadingProvider>
          <RouteCacheProvider> {/* ADD THIS */}
            <LoadingOrchestrator>
              <ClientProviders>
                <LayoutWrapper>
                  {children}
                </LayoutWrapper>
              </ClientProviders>
            </LoadingOrchestrator>
          </RouteCacheProvider> {/* ADD THIS */}
        </LoadingProvider>
      </body>
    </html>
  )
}
```

#### **Validation steps:**
1. Test that routes are cached after first visit
2. Verify that navigation is instant for cached routes
3. Check that cache invalidation works when dependencies change
4. Test that cache respects TTL settings
5. Confirm that memory usage stays reasonable with cache limits

---

### **TASK 2.2: Add Predictive Navigation with Prefetching**

#### **What to do:**
Implement intelligent route prefetching that loads likely next routes in the background based on user behavior patterns.

#### **Why it's needed:**
Current navigation:
- Routes are only loaded when clicked
- No anticipation of user navigation patterns
- Missed opportunities for background loading
- Slower perceived navigation

#### **Files to create/modify:**
1. `src/lib/navigation-predictor.ts` - Navigation prediction logic
2. `src/components/navigation/PredictiveLink.tsx` - Enhanced Link component
3. `src/hooks/useNavigationPredictor.ts` - Navigation prediction hook
4. Update existing navigation components

#### **Step-by-step implementation:**

**Step 1: Create navigation-predictor.ts**
```typescript
// File: src/lib/navigation-predictor.ts
interface NavigationPattern {
  from: string
  to: string
  count: number
  lastUsed: number
  probability: number
}

interface UserBehavior {
  sessionStart: number
  totalNavigations: number
  patterns: NavigationPattern[]
  currentPath: string
  previousPath: string | null
  timeOnPage: number
  lastActivity: number
}

class NavigationPredictor {
  private behavior: UserBehavior = {
    sessionStart: Date.now(),
    totalNavigations: 0,
    patterns: [],
    currentPath: '/',
    previousPath: null,
    timeOnPage: 0,
    lastActivity: Date.now()
  }
  
  private readonly STORAGE_KEY = 'navigation_patterns'
  private readonly MAX_PATTERNS = 50
  private readonly MIN_PROBABILITY = 0.1
  
  // Common navigation patterns for the app
  private readonly COMMON_PATTERNS: Record<string, string[]> = {
    '/dashboard': ['/projects', '/tasks', '/reports', '/notifications'],
    '/projects': ['/projects/[id]', '/scope', '/milestones', '/dashboard'],
    '/projects/[id]': ['/tasks', '/scope', '/shop-drawings', '/milestones', '/projects'],
    '/tasks': ['/projects', '/milestones', '/dashboard'],
    '/scope': ['/projects/[id]', '/shop-drawings', '/material-specs'],
    '/shop-drawings': ['/scope', '/projects/[id]', '/material-specs'],
    '/milestones': ['/projects/[id]', '/tasks', '/projects'],
    '/reports': ['/projects', '/dashboard', '/financials'],
    '/settings': ['/dashboard', '/users'],
    '/notifications': ['/dashboard', '/tasks', '/projects']
  }
  
  constructor() {
    this.loadBehaviorData()
  }
  
  /**
   * Record a navigation event
   */
  recordNavigation(from: string, to: string): void {
    const now = Date.now()
    
    // Update behavior stats
    this.behavior.totalNavigations++
    this.behavior.timeOnPage = now - this.behavior.lastActivity
    this.behavior.previousPath = this.behavior.currentPath
    this.behavior.currentPath = to
    this.behavior.lastActivity = now
    
    // Find or create pattern
    let pattern = this.behavior.patterns.find(p => p.from === from && p.to === to)
    
    if (pattern) {
      pattern.count++
      pattern.lastUsed = now
    } else {
      pattern = {
        from,
        to,
        count: 1,
        lastUsed: now,
        probability: 0
      }
      this.behavior.patterns.push(pattern)
    }
    
    // Recalculate probabilities
    this.updateProbabilities()
    
    // Cleanup old patterns
    this.cleanupPatterns()
    
    // Save to storage
    this.saveBehaviorData()
  }
  
  /**
   * Get predicted next routes for current path
   */
  getPredictedRoutes(currentPath: string, limit: number = 3): string[] {
    const predictions: Array<{ path: string; score: number }> = []
    
    // Get learned patterns
    const learnedPatterns = this.behavior.patterns
      .filter(p => p.from === currentPath && p.probability >= this.MIN_PROBABILITY)
      .map(p => ({ path: p.to, score: p.probability * 0.7 })) // Weight learned patterns
    
    predictions.push(...learnedPatterns)
    
    // Get common patterns
    const commonPatterns = (this.COMMON_PATTERNS[currentPath] || [])
      .map(path => ({ path, score: 0.3 })) // Lower weight for common patterns
    
    predictions.push(...commonPatterns)
    
    // Remove duplicates and sort by score
    const uniquePredictions = predictions.reduce((acc, curr) => {
      const existing = acc.find(p => p.path === curr.path)
      if (existing) {
        existing.score = Math.max(existing.score, curr.score)
      } else {
        acc.push(curr)
      }
      return acc
    }, [] as Array<{ path: string; score: number }>)
    
    return uniquePredictions
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(p => p.path)
  }
  
  /**
   * Check if a route should be prefetched
   */
  shouldPrefetch(currentPath: string, targetPath: string): boolean {
    const predictions = this.getPredictedRoutes(currentPath, 5)
    return predictions.includes(targetPath)
  }
  
  /**
   * Get prefetch priority for a route
   */
  getPrefetchPriority(currentPath: string, targetPath: string): 'high' | 'medium' | 'low' | 'none' {
    const predictions = this.getPredictedRoutes(currentPath, 5)
    const index = predictions.indexOf(targetPath)
    
    if (index === -1) return 'none'
    if (index === 0) return 'high'
    if (index <= 2) return 'medium'
    return 'low'
  }
  
  /**
   * Update probabilities for all patterns
   */
  private updateProbabilities(): void {
    const totalNavigations = this.behavior.totalNavigations
    
    // Group patterns by 'from' path
    const patternGroups = this.behavior.patterns.reduce((acc, pattern) => {
      if (!acc[pattern.from]) {
        acc[pattern.from] = []
      }
      acc[pattern.from].push(pattern)
      return acc
    }, {} as Record<string, NavigationPattern[]>)
    
    // Calculate probabilities within each group
    Object.values(patternGroups).forEach(group => {
      const totalCount = group.reduce((sum, p) => sum + p.count, 0)
      
      group.forEach(pattern => {
        // Base probability from frequency
        const frequency = pattern.count / totalCount
        
        // Recency factor (more recent = higher probability)
        const recencyFactor = this.calculateRecencyFactor(pattern.lastUsed)
        
        // Time-based decay
        const decayFactor = this.calculateDecayFactor(pattern.lastUsed)
        
        pattern.probability = frequency * recencyFactor * decayFactor
      })
    })
  }
  
  /**
   * Calculate recency factor (0.5 to 1.5)
   */
  private calculateRecencyFactor(lastUsed: number): number {
    const now = Date.now()
    const hoursSinceUsed = (now - lastUsed) / (1000 * 60 * 60)
    
    if (hoursSinceUsed < 1) return 1.5      // Very recent
    if (hoursSinceUsed < 24) return 1.2     // Recent
    if (hoursSinceUsed < 168) return 1.0    // This week
    return 0.8                              // Older
  }
  
  /**
   * Calculate decay factor (0.1 to 1.0)
   */
  private calculateDecayFactor(lastUsed: number): number {
    const now = Date.now()
    const daysSinceUsed = (now - lastUsed) / (1000 * 60 * 60 * 24)
    
    if (daysSinceUsed < 1) return 1.0       // Today
    if (daysSinceUsed < 7) return 0.9       // This week
    if (daysSinceUsed < 30) return 0.7      // This month
    return 0.3                              // Older
  }
  
  /**
   * Remove old or low-probability patterns
   */
  private cleanupPatterns(): void {
    const now = Date.now()
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000)
    
    this.behavior.patterns = this.behavior.patterns
      .filter(p => p.lastUsed > thirtyDaysAgo || p.probability >= this.MIN_PROBABILITY)
      .sort((a, b) => b.probability - a.probability)
      .slice(0, this.MAX_PATTERNS)
  }
  
  /**
   * Load behavior data from storage
   */
  private loadBehaviorData(): void {
    if (typeof window === 'undefined') return
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        this.behavior = { ...this.behavior, ...data }
      }
    } catch (error) {
      console.warn('Failed to load navigation patterns:', error)
    }
  }
  
  /**
   * Save behavior data to storage
   */
  private saveBehaviorData(): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.behavior))
    } catch (error) {
      console.warn('Failed to save navigation patterns:', error)
    }
  }
  
  /**
   * Get behavior statistics
   */
  getStats(): {
    totalNavigations: number
    uniquePatterns: number
    sessionDuration: number
    topPatterns: Array<{ from: string; to: string; probability: number }>
  } {
    const now = Date.now()
    const sessionDuration = now - this.behavior.sessionStart
    
    const topPatterns = this.behavior.patterns
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 10)
      .map(p => ({
        from: p.from,
        to: p.to,
        probability: Math.round(p.probability * 100) / 100
      }))
    
    return {
      totalNavigations: this.behavior.totalNavigations,
      uniquePatterns: this.behavior.patterns.length,
      sessionDuration,
      topPatterns
    }
  }
  
  /**
   * Reset all behavior data
   */
  reset(): void {
    this.behavior = {
      sessionStart: Date.now(),
      totalNavigations: 0,
      patterns: [],
      currentPath: '/',
      previousPath: null,
      timeOnPage: 0,
      lastActivity: Date.now()
    }
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY)
    }
  }
}

// Export singleton instance
export const navigationPredictor = new NavigationPredictor()
```*
*Step 2: Create PredictiveLink component**
```typescript
// File: src/components/navigation/PredictiveLink.tsx
'use client'

import React, { useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { navigationPredictor } from '@/lib/navigation-predictor'
import { usePrefetchRoute } from '@/hooks/useRouteCache'

interface PredictiveLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  prefetchOnHover?: boolean
  prefetchOnVisible?: boolean
  prefetchDelay?: number
  onClick?: () => void
  [key: string]: any
}

export function PredictiveLink({
  href,
  children,
  className,
  prefetchOnHover = true,
  prefetchOnVisible = false,
  prefetchDelay = 100,
  onClick,
  ...props
}: PredictiveLinkProps) {
  const pathname = usePathname()
  const { prefetchRoute } = usePrefetchRoute()
  const linkRef = useRef<HTMLAnchorElement>(null)
  const prefetchTimeoutRef = useRef<NodeJS.Timeout>()
  const hasPrefetched = useRef(false)
  
  // Check if this route should be prefetched
  const shouldPrefetch = navigationPredictor.shouldPrefetch(pathname, href)
  const prefetchPriority = navigationPredictor.getPrefetchPriority(pathname, href)
  
  // Prefetch function with debouncing
  const doPrefetch = useCallback(() => {
    if (hasPrefetched.current) return
    
    hasPrefetched.current = true
    prefetchRoute(href)
    
    console.log(`Prefetched route: ${href} (priority: ${prefetchPriority})`)
  }, [href, prefetchRoute, prefetchPriority])
  
  // Handle hover prefetching
  const handleMouseEnter = useCallback(() => {
    if (!prefetchOnHover || !shouldPrefetch) return
    
    prefetchTimeoutRef.current = setTimeout(doPrefetch, prefetchDelay)
  }, [prefetchOnHover, shouldPrefetch, doPrefetch, prefetchDelay])
  
  const handleMouseLeave = useCallback(() => {
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current)
    }
  }, [])
  
  // Handle click tracking
  const handleClick = useCallback(() => {
    // Record navigation pattern
    navigationPredictor.recordNavigation(pathname, href)
    
    // Call custom onClick if provided
    onClick?.()
  }, [pathname, href, onClick])
  
  // Intersection Observer for visible prefetching
  useEffect(() => {
    if (!prefetchOnVisible || !shouldPrefetch || !linkRef.current) return
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            doPrefetch()
            observer.disconnect()
          }
        })
      },
      { threshold: 0.1 }
    )
    
    observer.observe(linkRef.current)
    
    return () => observer.disconnect()
  }, [prefetchOnVisible, shouldPrefetch, doPrefetch])
  
  // Auto-prefetch high priority routes
  useEffect(() => {
    if (prefetchPriority === 'high' && shouldPrefetch) {
      const timer = setTimeout(doPrefetch, 50) // Very quick prefetch for high priority
      return () => clearTimeout(timer)
    }
  }, [prefetchPriority, shouldPrefetch, doPrefetch])
  
  return (
    <Link
      ref={linkRef}
      href={href}
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Link>
  )
}

// Enhanced navigation component with predictive features
export function PredictiveNavigation({ 
  items, 
  className 
}: { 
  items: Array<{ href: string; label: string; icon?: React.ReactNode }>
  className?: string 
}) {
  const pathname = usePathname()
  
  return (
    <nav className={className}>
      {items.map((item) => {
        const isActive = pathname === item.href
        const priority = navigationPredictor.getPrefetchPriority(pathname, item.href)
        
        return (
          <PredictiveLink
            key={item.href}
            href={item.href}
            className={`
              flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium
              ${isActive 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }
              ${priority === 'high' ? 'ring-1 ring-primary/20' : ''}
            `}
            prefetchOnHover={true}
            prefetchOnVisible={priority === 'high'}
          >
            {item.icon}
            <span>{item.label}</span>
            {priority === 'high' && (
              <span className="ml-auto text-xs text-primary">●</span>
            )}
          </PredictiveLink>
        )
      })}
    </nav>
  )
}
```

**Step 3: Create useNavigationPredictor hook**
```typescript
// File: src/hooks/useNavigationPredictor.ts
'use client'

import { useEffect, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { navigationPredictor } from '@/lib/navigation-predictor'

export function useNavigationPredictor() {
  const pathname = usePathname()
  const [predictions, setPredictions] = useState<string[]>([])
  const [stats, setStats] = useState<any>({})
  
  // Update predictions when path changes
  useEffect(() => {
    const newPredictions = navigationPredictor.getPredictedRoutes(pathname, 5)
    setPredictions(newPredictions)
    
    const newStats = navigationPredictor.getStats()
    setStats(newStats)
  }, [pathname])
  
  // Record navigation
  const recordNavigation = useCallback((from: string, to: string) => {
    navigationPredictor.recordNavigation(from, to)
    
    // Update predictions after recording
    const newPredictions = navigationPredictor.getPredictedRoutes(to, 5)
    setPredictions(newPredictions)
    
    const newStats = navigationPredictor.getStats()
    setStats(newStats)
  }, [])
  
  // Check if route should be prefetched
  const shouldPrefetch = useCallback((targetPath: string) => {
    return navigationPredictor.shouldPrefetch(pathname, targetPath)
  }, [pathname])
  
  // Get prefetch priority
  const getPrefetchPriority = useCallback((targetPath: string) => {
    return navigationPredictor.getPrefetchPriority(pathname, targetPath)
  }, [pathname])
  
  // Reset predictor data
  const resetPredictor = useCallback(() => {
    navigationPredictor.reset()
    setPredictions([])
    setStats({})
  }, [])
  
  return {
    predictions,
    stats,
    recordNavigation,
    shouldPrefetch,
    getPrefetchPriority,
    resetPredictor
  }
}

// Hook for automatic navigation tracking
export function useNavigationTracking() {
  const pathname = usePathname()
  const [previousPath, setPreviousPath] = useState<string | null>(null)
  
  useEffect(() => {
    if (previousPath && previousPath !== pathname) {
      navigationPredictor.recordNavigation(previousPath, pathname)
    }
    setPreviousPath(pathname)
  }, [pathname, previousPath])
  
  return {
    currentPath: pathname,
    previousPath
  }
}

// Hook for prefetch management
export function usePrefetchManager() {
  const pathname = usePathname()
  const [prefetchedRoutes, setPrefetchedRoutes] = useState<Set<string>>(new Set())
  
  const prefetchRoute = useCallback(async (route: string) => {
    if (prefetchedRoutes.has(route)) return
    
    try {
      // Add your route prefetching logic here
      // This could involve preloading components, data, etc.
      console.log(`Prefetching route: ${route}`)
      
      setPrefetchedRoutes(prev => new Set([...prev, route]))
    } catch (error) {
      console.error(`Failed to prefetch route ${route}:`, error)
    }
  }, [prefetchedRoutes])
  
  const prefetchPredictedRoutes = useCallback(() => {
    const predictions = navigationPredictor.getPredictedRoutes(pathname, 3)
    
    predictions.forEach(route => {
      const priority = navigationPredictor.getPrefetchPriority(pathname, route)
      
      if (priority === 'high') {
        prefetchRoute(route)
      } else if (priority === 'medium') {
        // Delay medium priority prefetching
        setTimeout(() => prefetchRoute(route), 1000)
      }
    })
  }, [pathname, prefetchRoute])
  
  // Auto-prefetch on path change
  useEffect(() => {
    const timer = setTimeout(prefetchPredictedRoutes, 500)
    return () => clearTimeout(timer)
  }, [prefetchPredictedRoutes])
  
  return {
    prefetchedRoutes: Array.from(prefetchedRoutes),
    prefetchRoute,
    prefetchPredictedRoutes
  }
}
```

**Step 4: Update existing navigation components**

```typescript
// File: src/components/layouts/Sidebar.tsx - MODIFY to use PredictiveLink
// Replace existing Link imports and usage with PredictiveLink

import { PredictiveLink, PredictiveNavigation } from '@/components/navigation/PredictiveLink'

// Example of updating navigation items
const navigationItems = [
  { href: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { href: '/projects', label: 'Projects', icon: <ProjectsIcon /> },
  { href: '/tasks', label: 'Tasks', icon: <TasksIcon /> },
  { href: '/reports', label: 'Reports', icon: <ReportsIcon /> },
  { href: '/settings', label: 'Settings', icon: <SettingsIcon /> }
]

// In your Sidebar component, replace the navigation section with:
<PredictiveNavigation 
  items={navigationItems}
  className="space-y-1"
/>

// Or for individual links, replace:
// <Link href="/projects">Projects</Link>
// with:
<PredictiveLink href="/projects">Projects</PredictiveLink>
```

#### **Validation steps:**
1. Test that navigation patterns are learned and stored
2. Verify that high-priority routes are prefetched automatically
3. Check that hover prefetching works on navigation links
4. Confirm that navigation tracking records user behavior
5. Test that predictions improve over time with usage

---

## 🎯 **PHASE 3: ADVANCED OPTIMIZATIONS**

### **TASK 3.1: Implement Service Worker for Caching**

#### **What to do:**
Create a service worker that caches static assets, API responses, and provides offline functionality.

#### **Why it's needed:**
Current caching limitations:
- No offline support
- Static assets re-downloaded on each visit
- API responses not cached
- No background sync capabilities
- Poor performance on slow connections

#### **Files to create:**
1. `public/sw.js` - Service worker implementation
2. `src/lib/service-worker-registration.ts` - SW registration
3. `src/lib/cache-strategies.ts` - Caching strategies
4. `src/hooks/useServiceWorker.ts` - SW integration hook

#### **Step-by-step implementation:**

**Step 1: Create service worker**
```javascript
// File: public/sw.js
const CACHE_NAME = 'formula-pm-v2.0.0'
const STATIC_CACHE = `${CACHE_NAME}-static`
const DYNAMIC_CACHE = `${CACHE_NAME}-dynamic`
const API_CACHE = `${CACHE_NAME}-api`

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/projects',
  '/tasks',
  '/reports',
  '/offline',
  '/manifest.json',
  // Add your critical CSS and JS files here
]

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/projects',
  '/api/tasks',
  '/api/users',
  '/api/dashboard/stats'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('Service Worker: Static assets cached')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static assets', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker: Activated')
        return self.clients.claim()
      })
  )
})

// Fetch event - handle requests with caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }
  
  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request))
    return
  }
  
  // Handle static assets
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request))
    return
  }
  
  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request))
    return
  }
  
  // Default: network first, then cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone()
          caches.open(DYNAMIC_CACHE)
            .then((cache) => cache.put(request, responseClone))
        }
        return response
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(request)
      })
  )
})

// Handle API requests with cache-first strategy for GET requests
async function handleApiRequest(request) {
  const url = new URL(request.url)
  
  try {
    // For dashboard stats and other frequently accessed data, try cache first
    if (API_ENDPOINTS.some(endpoint => url.pathname.startsWith(endpoint))) {
      const cachedResponse = await caches.match(request)
      
      if (cachedResponse) {
        // Return cached response and update in background
        updateCacheInBackground(request)
        return cachedResponse
      }
    }
    
    // Network first for other API requests
    const networkResponse = await fetch(request)
    
    if (networkResponse.status === 200) {
      const responseClone = networkResponse.clone()
      const cache = await caches.open(API_CACHE)
      await cache.put(request, responseClone)
    }
    
    return networkResponse
    
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache', error)
    
    // Fallback to cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline response for API requests
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'This data is not available offline' 
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  try {
    const cachedResponse = await caches.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    const networkResponse = await fetch(request)
    
    if (networkResponse.status === 200) {
      const responseClone = networkResponse.clone()
      const cache = await caches.open(STATIC_CACHE)
      await cache.put(request, responseClone)
    }
    
    return networkResponse
    
  } catch (error) {
    console.log('Service Worker: Failed to fetch static asset', error)
    return caches.match('/offline') || new Response('Offline')
  }
}

// Handle navigation requests
async function handleNavigation(request) {
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.status === 200) {
      const responseClone = networkResponse.clone()
      const cache = await caches.open(DYNAMIC_CACHE)
      await cache.put(request, responseClone)
    }
    
    return networkResponse
    
  } catch (error) {
    console.log('Service Worker: Navigation failed, trying cache', error)
    
    // Try to find cached version
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Fallback to offline page
    return caches.match('/offline') || 
           caches.match('/') || 
           new Response('Offline')
  }
}

// Update cache in background
function updateCacheInBackground(request) {
  fetch(request)
    .then((response) => {
      if (response.status === 200) {
        const responseClone = response.clone()
        caches.open(API_CACHE)
          .then((cache) => cache.put(request, responseClone))
      }
    })
    .catch((error) => {
      console.log('Service Worker: Background update failed', error)
    })
}

// Check if request is for a static asset
function isStaticAsset(request) {
  const url = new URL(request.url)
  return url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag)
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

// Handle background sync
async function doBackgroundSync() {
  try {
    // Get offline actions from IndexedDB
    const offlineActions = await getOfflineActions()
    
    for (const action of offlineActions) {
      try {
        await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body
        })
        
        // Remove successful action
        await removeOfflineAction(action.id)
        
      } catch (error) {
        console.log('Service Worker: Failed to sync action', error)
      }
    }
    
  } catch (error) {
    console.error('Service Worker: Background sync failed', error)
  }
}

// Placeholder functions for offline actions (implement with IndexedDB)
async function getOfflineActions() {
  // Implement with IndexedDB
  return []
}

async function removeOfflineAction(id) {
  // Implement with IndexedDB
}

// Message handling
self.addEventListener('message', (event) => {
  const { type, payload } = event.data
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break
      
    case 'GET_CACHE_STATS':
      getCacheStats().then((stats) => {
        event.ports[0].postMessage({ type: 'CACHE_STATS', payload: stats })
      })
      break
      
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ type: 'CACHE_CLEARED' })
      })
      break
      
    default:
      console.log('Service Worker: Unknown message type', type)
  }
})

// Get cache statistics
async function getCacheStats() {
  const cacheNames = await caches.keys()
  const stats = {}
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName)
    const keys = await cache.keys()
    stats[cacheName] = keys.length
  }
  
  return stats
}

// Clear all caches
async function clearAllCaches() {
  const cacheNames = await caches.keys()
  await Promise.all(cacheNames.map(name => caches.delete(name)))
}
```

**Step 2: Create service worker registration**
```typescript
// File: src/lib/service-worker-registration.ts
interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void
  onUpdate?: (registration: ServiceWorkerRegistration) => void
  onOffline?: () => void
  onOnline?: () => void
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null
  private config: ServiceWorkerConfig = {}
  
  async register(config: ServiceWorkerConfig = {}): Promise<void> {
    this.config = config
    
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported')
      return
    }
    
    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })
      
      console.log('Service Worker registered:', this.registration.scope)
      
      // Handle updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration!.installing
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New Service Worker available')
              this.config.onUpdate?.(this.registration!)
            }
          })
        }
      })
      
      // Handle successful registration
      if (this.registration.active) {
        this.config.onSuccess?.(this.registration)
      }
      
      // Set up message handling
      this.setupMessageHandling()
      
      // Set up online/offline detection
      this.setupOnlineOfflineHandling()
      
    } catch (error) {
      console.error('Service Worker registration failed:', error)
    }
  }
  
  async unregister(): Promise<boolean> {
    if (this.registration) {
      return this.registration.unregister()
    }
    return false
  }
  
  async update(): Promise<void> {
    if (this.registration) {
      await this.registration.update()
    }
  }
  
  async skipWaiting(): Promise<void> {
    if (this.registration?.waiting) {
      this.sendMessage({ type: 'SKIP_WAITING' })
    }
  }
  
  async getCacheStats(): Promise<any> {
    return new Promise((resolve) => {
      const messageChannel = new MessageChannel()
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.type === 'CACHE_STATS') {
          resolve(event.data.payload)
        }
      }
      
      this.sendMessage({ type: 'GET_CACHE_STATS' }, [messageChannel.port2])
    })
  }
  
  async clearCache(): Promise<void> {
    return new Promise((resolve) => {
      const messageChannel = new MessageChannel()
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.type === 'CACHE_CLEARED') {
          resolve()
        }
      }
      
      this.sendMessage({ type: 'CLEAR_CACHE' }, [messageChannel.port2])
    })
  }
  
  private sendMessage(message: any, transfer?: Transferable[]): void {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(message, transfer)
    }
  }
  
  private setupMessageHandling(): void {
    navigator.serviceWorker.addEventListener('message', (event) => {
      const { type, payload } = event.data
      
      switch (type) {
        case 'CACHE_UPDATED':
          console.log('Cache updated:', payload)
          break
          
        case 'OFFLINE_ACTION_QUEUED':
          console.log('Action queued for background sync:', payload)
          break
          
        default:
          console.log('Unknown message from Service Worker:', type, payload)
      }
    })
  }
  
  private setupOnlineOfflineHandling(): void {
    window.addEventListener('online', () => {
      console.log('App is online')
      this.config.onOnline?.()
    })
    
    window.addEventListener('offline', () => {
      console.log('App is offline')
      this.config.onOffline?.()
    })
  }
  
  isOnline(): boolean {
    return navigator.onLine
  }
  
  getRegistration(): ServiceWorkerRegistration | null {
    return this.registration
  }
}

// Export singleton instance
export const serviceWorkerManager = new ServiceWorkerManager()

// Convenience function for easy registration
export async function registerServiceWorker(config?: ServiceWorkerConfig): Promise<void> {
  await serviceWorkerManager.register(config)
}
```
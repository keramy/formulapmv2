'use client'

import { User, AuthResponse } from '@supabase/supabase-js'
import { UserProfile, UserRole } from '@/types/auth'
import { supabase } from '@/lib/supabase'
import { authCache } from '@/lib/auth-cache'

/**
 * Centralized Authentication Service
 * 
 * This service provides a single source of truth for all authentication operations,
 * eliminating circular dependencies and providing a clean interface for auth logic.
 * 
 * Key Features:
 * - Singleton pattern to ensure one instance
 * - Event-driven architecture with listeners
 * - Centralized state management
 * - Built-in error handling and recovery
 * - Token management with auto-refresh
 * - Profile caching and synchronization
 * 
 * Benefits:
 * - Eliminates circular dependencies between hooks
 * - Provides consistent auth state across the application
 * - Simplifies testing and debugging
 * - Reduces code duplication
 * - Improves performance through caching
 */

export interface AuthState {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  accessToken: string | null
  refreshing: boolean
  lastUpdated: number
}

export interface AuthEventData {
  type: 'user_changed' | 'profile_changed' | 'loading_changed' | 'error_changed' | 'token_changed'
  data: any
  timestamp: number
}

type AuthEventListener = (event: AuthEventData) => void

/**
 * Singleton Authentication Service
 * 
 * Manages all authentication state and operations in a centralized location.
 * Uses event listeners to notify components of state changes without creating
 * circular dependencies.
 */
class AuthenticationService {
  private static instance: AuthenticationService | null = null
  private state: AuthState
  private listeners: AuthEventListener[] = []
  private refreshInterval: NodeJS.Timeout | null = null
  private refreshPromise: Promise<string | null> | null = null
  private authSubscription: any = null
  private initialized = false

  private constructor() {
    this.state = {
      user: null,
      profile: null,
      loading: true,
      error: null,
      isAuthenticated: false,
      accessToken: null,
      refreshing: false,
      lastUpdated: Date.now()
    }
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): AuthenticationService {
    if (!AuthenticationService.instance) {
      AuthenticationService.instance = new AuthenticationService()
    }
    return AuthenticationService.instance
  }

  /**
   * Initialize the authentication service
   * Sets up session monitoring and auto-refresh with timeout protection
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return

    console.log('🔐 [AuthService] Initializing authentication service')
    
    // Set a timeout for the entire initialization process
    const initTimeout = setTimeout(() => {
      if (!this.initialized) {
        console.warn('🔐 [AuthService] Initialization timeout - continuing without session')
        this.updateState({ 
          user: null,
          profile: null,
          loading: false, 
          isAuthenticated: false,
          accessToken: null,
          error: null
        })
        this.initialized = true
      }
    }, 10000) // 10 second timeout for initialization

    try {
      // Get initial session (has its own timeout)
      await this.loadInitialSession()

      // Set up auth state change listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔐 [AuthService] Auth state change:', event)
        try {
          await this.handleAuthStateChange(event, session)
        } catch (error) {
          console.warn('🔐 [AuthService] Error handling auth state change:', error)
        }
      })

      // Store subscription for cleanup
      this.authSubscription = subscription

      // Set up auto-refresh interval
      this.setupAutoRefresh()

      clearTimeout(initTimeout)
      this.initialized = true
      console.log('🔐 [AuthService] Authentication service initialized successfully')

    } catch (error) {
      clearTimeout(initTimeout)
      console.warn('🔐 [AuthService] Initialization completed with warnings:', error)
      
      // Don't fail initialization - continue with unauthenticated state
      this.updateState({ 
        user: null,
        profile: null,
        loading: false, 
        isAuthenticated: false,
        accessToken: null,
        error: null
      })
      this.initialized = true
    }
  }

  /**
   * Load initial session on startup with timeout protection
   */
  private async loadInitialSession(): Promise<void> {
    try {
      console.log('🔐 [AuthService] Loading initial session...')
      
      // Add timeout protection to session retrieval
      const sessionPromise = supabase.auth.getSession()
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Initial session load timeout')), 8000)
      })

      const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise])

      if (error) {
        console.warn('🔐 [AuthService] Session error:', error.message)
        
        // Handle specific error types
        if (error.message.includes('Invalid Refresh Token') || 
            error.message.includes('Refresh Token Not Found')) {
          console.log('🔐 [AuthService] Invalid refresh token - clearing storage')
          this.clearStoredSession()
        }
        
        // Don't throw - continue with unauthenticated state
        this.updateState({ 
          user: null, 
          profile: null, 
          loading: false, 
          isAuthenticated: false,
          accessToken: null,
          error: null // Don't show error for invalid tokens
        })
        return
      }

      if (session?.user) {
        console.log('🔐 [AuthService] Valid session found:', session.user.id)
        await this.setUser(session.user, session.access_token)
      } else {
        console.log('🔐 [AuthService] No session found')
        this.updateState({ 
          user: null, 
          profile: null, 
          loading: false, 
          isAuthenticated: false,
          accessToken: null,
          error: null
        })
      }

    } catch (error) {
      console.warn('🔐 [AuthService] Initial session load timeout/error:', error)
      
      // On timeout or error, continue without authentication but don't block the app
      this.updateState({ 
        user: null,
        profile: null,
        loading: false, 
        isAuthenticated: false,
        accessToken: null,
        error: null // Don't show timeout errors to user
      })
    }
  }

  /**
   * Handle Supabase auth state changes
   */
  private async handleAuthStateChange(event: string, session: any): Promise<void> {
    try {
      switch (event) {
        case 'SIGNED_IN':
          if (session?.user) {
            await this.setUser(session.user, session.access_token)
          }
          break

        case 'SIGNED_OUT':
          this.clearUserSession()
          break

        case 'TOKEN_REFRESHED':
          if (session?.user && session?.access_token) {
            this.updateState({ 
              user: session.user, 
              accessToken: session.access_token,
              refreshing: false
            })
            this.notifyListeners('token_changed', { token: session.access_token })
          }
          break

        case 'USER_UPDATED':
          if (session?.user) {
            this.updateState({ user: session.user })
            this.notifyListeners('user_changed', session.user)
          }
          break
      }
    } catch (error) {
      console.error('🔐 [AuthService] Error handling auth state change:', error)
      this.updateState({ 
        error: error instanceof Error ? error.message : 'Auth state change failed' 
      })
    }
  }

  /**
   * Set user and load their profile
   */
  private async setUser(user: User, accessToken: string): Promise<void> {
    this.updateState({ 
      user, 
      accessToken, 
      isAuthenticated: true,
      error: null 
    })

    this.notifyListeners('user_changed', user)

    // Load user profile
    await this.loadUserProfile(user.id)

    // Update cache
    const profile = this.state.profile
    authCache.setCachedAuth(user, profile, accessToken)

    this.updateState({ loading: false })
  }

  /**
   * Clear user session
   */
  private clearUserSession(): void {
    this.updateState({
      user: null,
      profile: null,
      loading: false,
      isAuthenticated: false,
      accessToken: null,
      error: null
    })

    authCache.clearCache()
    this.notifyListeners('user_changed', null)
    this.notifyListeners('profile_changed', null)
  }

  /**
   * Load user profile from database
   */
  private async loadUserProfile(userId: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error && !error.message.includes('No rows')) {
        throw error
      }

      if (data) {
        const profile: UserProfile = {
          id: data.id,
          role: data.role as UserRole,
          first_name: data.full_name?.split(' ')[0] || '',
          last_name: data.full_name?.split(' ').slice(1).join(' ') || '',
          email: data.email,
          phone: data.phone,
          company: '',
          department: '',
          avatar_url: data.avatar_url,
          permissions: data.permissions || {},
          is_active: data.is_active,
          created_at: data.created_at,
          updated_at: data.updated_at,
          seniority_level: data.seniority_level,
          dashboard_preferences: data.dashboard_preferences,
          previous_role: data.previous_role,
          role_migrated_at: data.role_migrated_at
        }

        this.updateState({ profile })
        this.notifyListeners('profile_changed', profile)

        console.log('🔐 [AuthService] Profile loaded:', profile.email)
      } else {
        console.warn('🔐 [AuthService] No profile found for user:', userId)
        this.updateState({ profile: null })
        this.notifyListeners('profile_changed', null)
      }

    } catch (error) {
      console.error('🔐 [AuthService] Profile load failed:', error)
      // Don't block authentication for profile errors
      this.updateState({ profile: null })
      this.notifyListeners('profile_changed', null)
    }
  }

  /**
   * Set up automatic token refresh
   */
  private setupAutoRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
    }

    this.refreshInterval = setInterval(async () => {
      if (this.state.user && this.state.accessToken) {
        console.log('🔄 [AuthService] Auto-refresh triggered')
        await this.refreshAccessToken()
      }
    }, 30 * 60 * 1000) // 30 minutes
  }

  /**
   * Update internal state and notify listeners
   */
  private updateState(updates: Partial<AuthState>): void {
    const previousState = { ...this.state }
    this.state = {
      ...this.state,
      ...updates,
      lastUpdated: Date.now()
    }

    // Notify of loading state changes
    if (previousState.loading !== this.state.loading) {
      this.notifyListeners('loading_changed', this.state.loading)
    }

    // Notify of error state changes
    if (previousState.error !== this.state.error) {
      this.notifyListeners('error_changed', this.state.error)
    }
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners(type: AuthEventData['type'], data: any): void {
    const event: AuthEventData = {
      type,
      data,
      timestamp: Date.now()
    }

    this.listeners.forEach(listener => {
      try {
        listener(event)
      } catch (error) {
        console.error('🔐 [AuthService] Listener error:', error)
      }
    })
  }

  // Public API methods

  /**
   * Get current authentication state
   */
  public getState(): AuthState {
    return { ...this.state }
  }

  /**
   * Add event listener for auth state changes
   */
  public addListener(listener: AuthEventListener): () => void {
    this.listeners.push(listener)

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * Sign in with email and password
   */
  public async signIn(email: string, password: string): Promise<AuthResponse> {
    this.updateState({ loading: true, error: null })

    try {
      const response = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (response.error) {
        this.updateState({ 
          loading: false, 
          error: response.error.message 
        })
      }

      return response

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed'
      this.updateState({ loading: false, error: errorMessage })
      
      return {
        data: { user: null, session: null },
        error: { message: errorMessage, status: 500, name: 'AuthError' } as any
      }
    }
  }

  /**
   * Sign out current user
   */
  public async signOut(): Promise<void> {
    this.updateState({ loading: true, error: null })

    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw error
      }

    } catch (error) {
      console.error('🔐 [AuthService] Sign out error:', error)
      this.updateState({ 
        error: error instanceof Error ? error.message : 'Sign out failed' 
      })
    } finally {
      // Always clear local state even if signOut fails
      this.clearUserSession()
    }
  }

  /**
   * Get current access token with enhanced debugging
   */
  public async getAccessToken(): Promise<string | null> {
    try {
      console.log('🔐 [AuthService] getAccessToken called - checking cached token...')
      
      // Return cached token if available and not expired
      if (this.state.accessToken && !this.isTokenExpired(this.state.accessToken)) {
        console.log('🔐 [AuthService] Using cached access token:', this.state.accessToken.substring(0, 20) + '...')
        return this.state.accessToken
      }

      console.log('🔐 [AuthService] No valid cached token, fetching fresh session...')
      
      // Add timeout to session retrieval
      const sessionPromise = supabase.auth.getSession()
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Get session timeout')), 8000)
      })

      const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise])

      if (error) {
        console.error('🔐 [AuthService] Session error:', error.message)
        return null
      }

      if (!session?.access_token) {
        console.warn('🔐 [AuthService] No access token in session')
        return null
      }

      console.log('🔐 [AuthService] Fresh access token retrieved:', session.access_token.substring(0, 20) + '...')
      this.updateState({ accessToken: session.access_token })
      return session.access_token

    } catch (error) {
      console.error('🔐 [AuthService] Get access token failed:', error)
      
      // For debugging - also try to get token from authCache as fallback
      try {
        const cached = authCache.getCachedAuth()
        if (cached?.accessToken) {
          console.log('🔐 [AuthService] Fallback: Using token from authCache')
          return cached.accessToken
        }
      } catch (cacheError) {
        console.warn('🔐 [AuthService] Cache fallback also failed:', cacheError)
      }
      
      return null
    }
  }

  /**
   * Manually refresh access token
   */
  public async refreshAccessToken(): Promise<string | null> {
    // Prevent concurrent refresh operations
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    this.updateState({ refreshing: true })

    this.refreshPromise = (async () => {
      try {
        const { data, error } = await supabase.auth.refreshSession()

        if (error || !data.session?.access_token) {
          throw error || new Error('No access token in refreshed session')
        }

        this.updateState({ 
          accessToken: data.session.access_token,
          user: data.session.user,
          refreshing: false 
        })

        // Update cache
        const cached = authCache.getCachedAuth()
        authCache.setCachedAuth(
          data.session.user,
          cached?.profile || this.state.profile,
          data.session.access_token
        )

        console.log('🔄 [AuthService] Token refreshed successfully')
        return data.session.access_token

      } catch (error) {
        console.error('🔄 [AuthService] Token refresh failed:', error)
        this.updateState({ 
          refreshing: false,
          error: error instanceof Error ? error.message : 'Token refresh failed'
        })
        return null

      } finally {
        this.refreshPromise = null
      }
    })()

    return this.refreshPromise
  }

  /**
   * Clear authentication errors
   */
  public clearError(): void {
    this.updateState({ error: null })
  }

  /**
   * Check if token is expired
   */
  private isTokenExpired(token: string): boolean {
    try {
      const parts = token.split('.')
      if (parts.length !== 3) return true

      const payload = JSON.parse(atob(parts[1]))
      const expiryTime = payload.exp * 1000
      const fiveMinutes = 5 * 60 * 1000

      return expiryTime <= (Date.now() + fiveMinutes)

    } catch {
      return true
    }
  }

  /**
   * Clear stored session data
   */
  private clearStoredSession(): void {
    if (typeof window === 'undefined') return

    try {
      // Clear Supabase localStorage entries
      Object.keys(window.localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.startsWith('supabase')) {
          window.localStorage.removeItem(key)
        }
      })
      console.log('🔐 [AuthService] Stored session data cleared')
    } catch (error) {
      console.warn('🔐 [AuthService] Failed to clear stored session:', error)
    }
  }

  /**
   * Cleanup method
   */
  public cleanup(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
      this.refreshInterval = null
    }

    if (this.authSubscription) {
      this.authSubscription.unsubscribe()
      this.authSubscription = null
    }

    this.listeners = []
    this.initialized = false
  }
}

// Export singleton instance
export const authService = AuthenticationService.getInstance()

// Export class for testing
export { AuthenticationService }
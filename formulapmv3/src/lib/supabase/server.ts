import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()
  
  const client = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Ensure proper cookie options for authentication persistence
              const cookieOptions = {
                ...options,
                httpOnly: false, // Allow client access for auth state
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax' as const,
                maxAge: options?.maxAge || 60 * 60 * 24 * 7, // 7 days default
              }
              cookieStore.set(name, value, cookieOptions)
            })
          } catch (error) {
            // Server Component - cookies will be handled by middleware
            console.warn('Cookie setting failed in server component:', error)
          }
        }
      },
      auth: {
        persistSession: false, // Don't persist sessions on server side
        autoRefreshToken: false, // Don't auto-refresh on server side to avoid token conflicts
        detectSessionInUrl: false, // Handled by middleware
      }
    }
  )

  // Add comprehensive error handling for server-side auth operations
  const originalGetSession = client.auth.getSession.bind(client.auth)
  const originalGetUser = client.auth.getUser.bind(client.auth)
  
  client.auth.getSession = async () => {
    try {
      const result = await originalGetSession()
      
      // If we get a refresh token error on server side, return null session instead of throwing
      if (result.error && (
        result.error.message.includes('Invalid Refresh Token') || 
        result.error.message.includes('Refresh Token Not Found')
      )) {
        // In development, suppress these errors as they're common and handled
        if (process.env.NODE_ENV === 'development') {
          // Silent handling in development
        } else {
          console.log('🔐 [ServerAuth] Ignoring refresh token error on server side')
        }
        return { data: { session: null }, error: null }
      }
      
      return result
    } catch (error: any) {
      // Catch any other auth errors and return null session
      if (error?.message?.includes('Refresh Token')) {
        if (process.env.NODE_ENV === 'development') {
          // Silent handling in development
        } else {
          console.log('🔐 [ServerAuth] Caught refresh token error, returning null session')
        }
        return { data: { session: null }, error: null }
      }
      throw error
    }
  }
  
  client.auth.getUser = async (jwt?: string) => {
    try {
      const result = await originalGetUser(jwt)
      
      // Handle refresh token errors for getUser as well
      if (result.error && (
        result.error.message.includes('Invalid Refresh Token') || 
        result.error.message.includes('Refresh Token Not Found')
      )) {
        if (process.env.NODE_ENV === 'development') {
          // Silent handling in development
        } else {
          console.log('🔐 [ServerAuth] Ignoring refresh token error in getUser')
        }
        return { data: { user: null }, error: null }
      }
      
      return result
    } catch (error: any) {
      if (error?.message?.includes('Refresh Token')) {
        if (process.env.NODE_ENV === 'development') {
          // Silent handling in development
        } else {
          console.log('🔐 [ServerAuth] Caught refresh token error in getUser')
        }
        return { data: { user: null }, error: null }
      }
      throw error
    }
  }

  return client
}
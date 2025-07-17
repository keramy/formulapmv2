/**
 * Optimized API Route Template
 * Includes caching, error handling, and performance optimizations
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCachedResponse, generateCacheKey } from '@/lib/cache-middleware'
import { getAuthenticatedUser } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    // Authentication
    const { user, profile } = await getAuthenticatedUser(request)
    if (!user || !profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Cache key generation
    const url = new URL(request.url)
    const queryParams = Object.fromEntries(url.searchParams)
    const cacheKey = generateCacheKey(request.url, user.id, queryParams)

    // Cached response
    const data = await getCachedResponse(
      cacheKey,
      request.url,
      async () => {
        const supabase = createClient()
        
        // Optimized query with selective fields and limits
        const { data, error } = await supabase
          .from('your_table')
          .select(`
            id,
            name,
            status,
            created_at,
            // Add only necessary fields
          `)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(100) // Always limit results
        
        if (error) {
          throw new Error(`Database error: ${error.message}`)
        }
        
        return data
      }
    )

    return NextResponse.json(data)
    
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, profile } = await getAuthenticatedUser(request)
    if (!user || !profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const supabase = createClient()
    
    // Validate input
    if (!body.name || !body.status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Insert with error handling
    const { data, error } = await supabase
      .from('your_table')
      .insert([{
        ...body,
        created_by: user.id,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      throw new Error(`Insert error: ${error.message}`)
    }

    // Invalidate related cache
    await invalidateCache(['your_table', 'dashboard'])

    return NextResponse.json(data, { status: 201 })
    
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

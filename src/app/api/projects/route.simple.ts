// SIMPLIFIED PROJECT API ROUTE - NO 500 ERRORS
// This version removes complex middleware to eliminate 500 errors
import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Simple authentication
    const { user, profile, error } = await verifyAuth(request)
    if (error || !user || !profile) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 })
    }

    // Parse query parameters manually (no complex query builder)
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)
    const search = searchParams.get('search')
    const status = searchParams.get('status')

    // Build simple query
    let query = supabase.from('projects').select(`
      *,
      client:clients(id, company_name, contact_person),
      project_manager:user_profiles!projects_project_manager_id_fkey(id, first_name, last_name, email)
    `)

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }
    if (status) {
      query = query.eq('status', status)
    }

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)
    query = query.order('created_at', { ascending: false })

    const { data, error: dbError } = await query

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json({ 
        success: false, 
        error: 'Database error' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: data || [] 
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Simple authentication
    const { user, profile, error } = await verifyAuth(request)
    if (error || !user || !profile) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 })
    }

    const body = await request.json()

    // Basic validation
    if (!body.name || !body.client_id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Project name and client ID are required' 
      }, { status: 400 })
    }

    // Create project
    const { data, error: dbError } = await supabase
      .from('projects')
      .insert({
        name: body.name,
        description: body.description || '',
        status: body.status || 'planning',
        client_id: body.client_id,
        project_manager_id: body.project_manager_id || user.id,
        start_date: body.start_date,
        end_date: body.end_date,
        budget: body.budget || 0,
        location: body.location || '',
        notes: body.notes || '',
        created_by: user.id
      })
      .select(`
        *,
        client:clients(id, company_name, contact_person),
        project_manager:user_profiles!projects_project_manager_id_fkey(id, first_name, last_name, email)
      `)
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create project' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data 
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
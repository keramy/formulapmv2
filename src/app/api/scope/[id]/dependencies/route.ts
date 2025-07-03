/**
 * Formula PM 2.0 Scope Dependencies API Endpoint
 * Wave 2B Business Logic Implementation
 * 
 * Handles scope item dependency management
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, getAuthenticatedUser } from '@/lib/middleware'
import { createServerClient } from '@/lib/supabase'
import { hasPermission } from '@/lib/permissions'
import { ScopeApiResponse } from '@/types/scope'

// ============================================================================
// GET /api/scope/[id]/dependencies - Get scope item dependencies
// ============================================================================

export const GET = withAuth(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check read permission
    if (!hasPermission(user.role, 'scope.view')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to view scope dependencies' },
        { status: 403 }
      )
    }

    const scopeItemId = params.id
    const supabase = createServerClient()

    // Get dependencies (items this item depends on)
    const { data: dependsOn } = await supabase
      .from('scope_dependencies')
      .select(`
        id,
        depends_on_id,
        dependency_type,
        description,
        created_at,
        depends_on_item:scope_items!depends_on_id(
          id,
          item_no,
          title,
          status,
          progress_percentage,
          timeline_end
        )
      `)
      .eq('scope_item_id', scopeItemId)

    // Get blocked items (items that depend on this item)
    const { data: blocks } = await supabase
      .from('scope_dependencies')
      .select(`
        id,
        scope_item_id,
        dependency_type,
        description,
        created_at,
        blocking_item:scope_items!scope_item_id(
          id,
          item_no,
          title,
          status,
          progress_percentage,
          timeline_start
        )
      `)
      .eq('depends_on_id', scopeItemId)

    const response: ScopeApiResponse<any> = {
      success: true,
      data: {
        depends_on: dependsOn || [],
        blocks: blocks || [],
        summary: {
          total_dependencies: (dependsOn || []).length,
          total_blocked_items: (blocks || []).length,
          blocking_dependencies: (dependsOn || []).filter(dep => 
            dep.depends_on_item?.status !== 'completed'
          ).length
        }
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Dependencies GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// ============================================================================
// POST /api/scope/[id]/dependencies - Add dependency
// ============================================================================

export const POST = withAuth(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check dependency management permission
    if (!hasPermission(user.role, 'scope.dependencies.manage')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to manage dependencies' },
        { status: 403 }
      )
    }

    const scopeItemId = params.id
    const body = await request.json()
    
    if (!body.depends_on_id) {
      return NextResponse.json(
        { success: false, error: 'depends_on_id is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Verify both scope items exist and are in the same project
    const { data: sourceItem } = await supabase
      .from('scope_items')
      .select('id, project_id, item_no, title')
      .eq('id', scopeItemId)
      .single()

    const { data: targetItem } = await supabase
      .from('scope_items')
      .select('id, project_id, item_no, title')
      .eq('id', body.depends_on_id)
      .single()

    if (!sourceItem || !targetItem) {
      return NextResponse.json(
        { success: false, error: 'One or both scope items not found' },
        { status: 404 }
      )
    }

    if (sourceItem.project_id !== targetItem.project_id) {
      return NextResponse.json(
        { success: false, error: 'Dependencies can only be created between items in the same project' },
        { status: 400 }
      )
    }

    // Check for circular dependency
    const hasCircularDependency = await checkCircularDependency(
      supabase, 
      body.depends_on_id, 
      scopeItemId
    )

    if (hasCircularDependency) {
      return NextResponse.json(
        { success: false, error: 'Cannot create circular dependency' },
        { status: 400 }
      )
    }

    // Check if dependency already exists
    const { data: existingDep } = await supabase
      .from('scope_dependencies')
      .select('id')
      .eq('scope_item_id', scopeItemId)
      .eq('depends_on_id', body.depends_on_id)
      .single()

    if (existingDep) {
      return NextResponse.json(
        { success: false, error: 'Dependency already exists' },
        { status: 400 }
      )
    }

    // Create the dependency
    const { data: dependency, error } = await supabase
      .from('scope_dependencies')
      .insert({
        scope_item_id: scopeItemId,
        depends_on_id: body.depends_on_id,
        dependency_type: body.dependency_type || 'blocks',
        description: body.description || null
      })
      .select(`
        *,
        depends_on_item:scope_items!depends_on_id(id, item_no, title, status)
      `)
      .single()

    if (error) {
      console.error('Dependency creation error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create dependency' },
        { status: 500 }
      )
    }

    // Update the scope item's dependencies array
    await supabase
      .rpc('add_scope_dependency', {
        item_id: scopeItemId,
        dependency_id: body.depends_on_id
      })

    const response: ScopeApiResponse<any> = {
      success: true,
      data: dependency
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('Dependencies POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// ============================================================================
// DELETE /api/scope/[id]/dependencies?depends_on_id=X - Remove dependency
// ============================================================================

export const DELETE = withAuth(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check dependency management permission
    if (!hasPermission(user.role, 'scope.dependencies.manage')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to manage dependencies' },
        { status: 403 }
      )
    }

    const scopeItemId = params.id
    const url = new URL(request.url)
    const dependsOnId = url.searchParams.get('depends_on_id')

    if (!dependsOnId) {
      return NextResponse.json(
        { success: false, error: 'depends_on_id query parameter is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Delete the dependency
    const { error } = await supabase
      .from('scope_dependencies')
      .delete()
      .eq('scope_item_id', scopeItemId)
      .eq('depends_on_id', dependsOnId)

    if (error) {
      console.error('Dependency deletion error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to remove dependency' },
        { status: 500 }
      )
    }

    // Update the scope item's dependencies array
    await supabase
      .rpc('remove_scope_dependency', {
        item_id: scopeItemId,
        dependency_id: dependsOnId
      })

    return NextResponse.json({
      success: true,
      message: 'Dependency removed successfully'
    })

  } catch (error) {
    console.error('Dependencies DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function checkCircularDependency(
  supabase: any, 
  startItemId: string, 
  targetItemId: string,
  visited: Set<string> = new Set()
): Promise<boolean> {
  if (visited.has(startItemId)) {
    return true // Circular dependency detected
  }

  if (startItemId === targetItemId) {
    return true // Direct circular dependency
  }

  visited.add(startItemId)

  // Get all items that startItemId depends on
  const { data: dependencies } = await supabase
    .from('scope_dependencies')
    .select('depends_on_id')
    .eq('scope_item_id', startItemId)

  if (!dependencies) return false

  // Recursively check each dependency
  for (const dep of dependencies) {
    if (await checkCircularDependency(supabase, dep.depends_on_id, targetItemId, new Set(visited))) {
      return true
    }
  }

  return false
}
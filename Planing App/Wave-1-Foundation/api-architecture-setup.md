# API Architecture Setup - Wave 1 Foundation
## Enhanced Coordinator Agent Implementation

### **🎯 OBJECTIVE**
Establish a comprehensive API architecture with role-based filtering endpoints that support the GlobalSidebar navigation system and authentication-based data access control.

### **📋 TASK BREAKDOWN FOR COORDINATOR**

**FOUNDATION TASKS (Spawn immediately):**
1. **Next.js API Routes Setup**: App router API endpoints configuration
2. **Supabase Integration**: Database queries with RLS enforcement
3. **Authentication Middleware**: JWT validation and role extraction
4. **Permission-based Filtering**: Data access control implementation

**DEPENDENT TASKS (Wait for foundation approval):**
5. **Rate Limiting**: API protection for external users
6. **Caching Strategy**: Performance optimization for frequent queries

---

## **🛠️ API Architecture Overview**

### **Next.js 15 App Router API Structure**
```
app/api/
├── auth/
│   ├── login/route.ts
│   ├── logout/route.ts
│   └── profile/route.ts
├── dashboard/
│   └── stats/route.ts
├── tasks/
│   ├── route.ts                    # GET /api/tasks (filtered)
│   ├── [taskId]/route.ts          # GET /api/tasks/[id]
│   └── create/route.ts            # POST /api/tasks
├── scope/
│   ├── route.ts                   # GET /api/scope (filtered)
│   ├── [projectId]/route.ts       # GET /api/scope/[projectId]
│   └── import/route.ts            # POST /api/scope/import
├── shop-drawings/
│   ├── route.ts                   # GET /api/shop-drawings (filtered)
│   ├── [drawingId]/route.ts       # GET /api/shop-drawings/[id]
│   └── upload/route.ts            # POST /api/shop-drawings/upload
├── clients/
│   ├── route.ts                   # GET /api/clients (filtered)
│   ├── [clientId]/route.ts        # GET /api/clients/[id]
│   └── projects/route.ts          # GET /api/clients/projects
├── procurement/
│   ├── route.ts                   # GET /api/procurement (filtered)
│   ├── suppliers/route.ts         # GET /api/procurement/suppliers
│   └── orders/route.ts            # GET /api/procurement/orders
└── projects/
    ├── route.ts                   # GET /api/projects (filtered)
    ├── [projectId]/route.ts       # GET /api/projects/[id]
    └── assign/route.ts            # POST /api/projects/assign
```

---

## **🔐 Authentication Middleware**

### **JWT Verification Middleware**
```typescript
// lib/middleware/auth.ts
import { NextRequest } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export interface AuthUser {
  id: string
  role: string
  email: string
  permissions: string[]
}

export async function verifyAuth(request: NextRequest): Promise<AuthUser | null> {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session) {
      return null
    }

    // Fetch user profile with role and permissions
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, role, email, permissions')
      .eq('id', session.user.id)
      .single()

    if (!profile) {
      return null
    }

    return {
      id: profile.id,
      role: profile.role,
      email: profile.email,
      permissions: profile.permissions || []
    }
  } catch (error) {
    console.error('Auth verification error:', error)
    return null
  }
}

export function requireAuth(handler: (req: NextRequest, user: AuthUser) => Promise<Response>) {
  return async (request: NextRequest) => {
    const user = await verifyAuth(request)
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return handler(request, user)
  }
}

export function requirePermission(permission: string) {
  return (handler: (req: NextRequest, user: AuthUser) => Promise<Response>) => {
    return requireAuth(async (request: NextRequest, user: AuthUser) => {
      if (!user.permissions.includes(permission)) {
        return new Response(
          JSON.stringify({ error: 'Insufficient permissions' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        )
      }

      return handler(request, user)
    })
  }
}
```

---

## **📊 Global Navigation API Endpoints**

### **Tasks API with Filtering**
```typescript
// app/api/tasks/route.ts
import { NextRequest } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { requirePermission } from '@/lib/middleware/auth'

export const GET = requirePermission('tasks.view')(async (request: NextRequest, user) => {
  const supabase = createRouteHandlerClient({ cookies })
  const { searchParams } = new URL(request.url)
  
  const projectId = searchParams.get('project_id')
  const status = searchParams.get('status')
  const assignedTo = searchParams.get('assigned_to')

  let query = supabase
    .from('tasks')
    .select(`
      id,
      title,
      description,
      status,
      priority,
      due_date,
      assigned_to,
      created_by,
      project:projects(id, name),
      assignee:user_profiles!assigned_to(id, first_name, last_name)
    `)

  // Apply role-based filtering
  if (user.role === 'field_worker' || user.role === 'subcontractor') {
    // Field workers and subcontractors only see their assigned tasks
    query = query.eq('assigned_to', user.id)
  } else if (user.role === 'project_manager') {
    // Project managers see tasks for their projects
    const { data: projectIds } = await supabase
      .from('project_assignments')
      .select('project_id')
      .eq('user_id', user.id)
      .eq('role', 'project_manager')
    
    const projectIdArray = projectIds?.map(p => p.project_id) || []
    query = query.in('project_id', projectIdArray)
  } else if (user.role === 'client') {
    // Clients see limited task info for their projects
    const { data: clientProjects } = await supabase
      .from('projects')
      .select('id')
      .eq('client_id', user.id)
    
    const clientProjectIds = clientProjects?.map(p => p.id) || []
    query = query
      .in('project_id', clientProjectIds)
      .select('id, title, status, due_date, project:projects(id, name)')
  }
  // Management roles (company_owner, general_manager, etc.) see all tasks - no additional filtering

  // Apply query parameters
  if (projectId) {
    query = query.eq('project_id', projectId)
  }
  if (status) {
    query = query.eq('status', status)
  }
  if (assignedTo) {
    query = query.eq('assigned_to', assignedTo)
  }

  const { data: tasks, error } = await query
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch tasks' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Add task counts for navigation badges
  const { count: pendingCount } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')
    .eq('assigned_to', user.id)

  return new Response(
    JSON.stringify({
      tasks,
      metadata: {
        total: tasks?.length || 0,
        pending_count: pendingCount || 0,
        user_role: user.role
      }
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})

export const POST = requirePermission('tasks.create')(async (request: NextRequest, user) => {
  const supabase = createRouteHandlerClient({ cookies })
  const body = await request.json()

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      ...body,
      created_by: user.id
    })
    .select()
    .single()

  if (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to create task' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ task }),
    { status: 201, headers: { 'Content-Type': 'application/json' } }
  )
})
```

### **Scope API with Project Filtering**
```typescript
// app/api/scope/route.ts
import { NextRequest } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { requirePermission } from '@/lib/middleware/auth'

export const GET = requirePermission('scope.view')(async (request: NextRequest, user) => {
  const supabase = createRouteHandlerClient({ cookies })
  const { searchParams } = new URL(request.url)
  
  const projectId = searchParams.get('project_id')
  const category = searchParams.get('category')

  let query = supabase
    .from('scope_items')
    .select(`
      id,
      title,
      description,
      category,
      status,
      progress,
      timeline,
      project:projects(id, name, client_id),
      supplier:suppliers(id, name)
    `)

  // Apply role-based filtering
  if (user.role === 'client') {
    // Clients only see scope for their projects
    const { data: clientProjects } = await supabase
      .from('projects')
      .select('id')
      .eq('client_id', user.id)
    
    const clientProjectIds = clientProjects?.map(p => p.id) || []
    query = query
      .in('project_id', clientProjectIds)
      .select(`
        id,
        title,
        description,
        category,
        status,
        progress,
        timeline,
        project:projects(id, name)
      `) // Exclude supplier and pricing info for clients
  } else if (user.role === 'field_worker' || user.role === 'subcontractor') {
    // Field workers see scope for assigned projects
    const { data: assignedProjects } = await supabase
      .from('project_assignments')
      .select('project_id')
      .eq('user_id', user.id)
    
    const assignedProjectIds = assignedProjects?.map(p => p.project_id) || []
    query = query.in('project_id', assignedProjectIds)
  } else if (user.role === 'project_manager') {
    // Project managers see scope for their projects
    const { data: managedProjects } = await supabase
      .from('project_assignments')
      .select('project_id')
      .eq('user_id', user.id)
      .eq('role', 'project_manager')
    
    const managedProjectIds = managedProjects?.map(p => p.project_id) || []
    query = query.in('project_id', managedProjectIds)
  }
  // Management and purchase roles see all scope items

  // Apply query parameters
  if (projectId) {
    query = query.eq('project_id', projectId)
  }
  if (category) {
    query = query.eq('category', category)
  }

  const { data: scopeItems, error } = await query
    .order('created_at', { ascending: false })

  if (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch scope items' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({
      scope_items: scopeItems,
      metadata: {
        total: scopeItems?.length || 0,
        categories: ['construction', 'millwork', 'electrical', 'mechanical'],
        user_role: user.role
      }
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

### **Shop Drawings API with Access Control**
```typescript
// app/api/shop-drawings/route.ts
import { NextRequest } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { requirePermission } from '@/lib/middleware/auth'

export const GET = requirePermission('shop_drawings.view_all')(async (request: NextRequest, user) => {
  const supabase = createRouteHandlerClient({ cookies })
  const { searchParams } = new URL(request.url)
  
  const projectId = searchParams.get('project_id')
  const status = searchParams.get('status')
  const drawingType = searchParams.get('type')

  let query = supabase
    .from('shop_drawings')
    .select(`
      id,
      filename,
      drawing_type,
      version,
      status,
      created_at,
      created_by,
      project:projects(id, name, client_id),
      scope_item:scope_items(id, title),
      creator:user_profiles!created_by(id, first_name, last_name),
      approvals:document_approvals(
        id,
        status,
        approved_at,
        approver:user_profiles!approver_id(id, first_name, last_name)
      )
    `)

  // Apply role-based filtering
  if (user.role === 'client') {
    // Clients only see drawings for their projects
    const { data: clientProjects } = await supabase
      .from('projects')
      .select('id')
      .eq('client_id', user.id)
    
    const clientProjectIds = clientProjects?.map(p => p.id) || []
    query = query.in('project_id', clientProjectIds)
  } else if (user.role === 'architect') {
    // Architects see drawings they created or are assigned to
    query = query.or(`created_by.eq.${user.id},project_id.in.(${await getAssignedProjectIds(user.id, supabase)})`)
  } else if (user.role === 'project_manager') {
    // Project managers see drawings for their projects
    const { data: managedProjects } = await supabase
      .from('project_assignments')
      .select('project_id')
      .eq('user_id', user.id)
      .eq('role', 'project_manager')
    
    const managedProjectIds = managedProjects?.map(p => p.project_id) || []
    query = query.in('project_id', managedProjectIds)
  }
  // Management roles see all drawings

  // Apply query parameters
  if (projectId) {
    query = query.eq('project_id', projectId)
  }
  if (status) {
    query = query.eq('status', status)
  }
  if (drawingType) {
    query = query.eq('drawing_type', drawingType)
  }

  const { data: drawings, error } = await query
    .order('created_at', { ascending: false })

  if (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch shop drawings' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Count pending approvals for navigation badge
  const { count: pendingApprovals } = await supabase
    .from('document_approvals')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')
    .eq('approver_id', user.id)

  return new Response(
    JSON.stringify({
      drawings,
      metadata: {
        total: drawings?.length || 0,
        pending_approvals: pendingApprovals || 0,
        user_role: user.role
      }
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})

async function getAssignedProjectIds(userId: string, supabase: any): Promise<string> {
  const { data: assignments } = await supabase
    .from('project_assignments')
    .select('project_id')
    .eq('user_id', userId)
  
  return assignments?.map((a: any) => a.project_id).join(',') || ''
}
```

### **Clients API with Relationship Filtering**
```typescript
// app/api/clients/route.ts
import { NextRequest } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { requirePermission } from '@/lib/middleware/auth'

export const GET = requirePermission('clients.view')(async (request: NextRequest, user) => {
  const supabase = createRouteHandlerClient({ cookies })
  const { searchParams } = new URL(request.url)
  
  const includeProjects = searchParams.get('include_projects') === 'true'

  let query = supabase
    .from('clients')
    .select(`
      id,
      company_name,
      contact_person,
      email,
      phone,
      address,
      created_at,
      ${includeProjects ? `
        projects(
          id,
          name,
          status,
          start_date,
          end_date,
          progress
        )
      ` : ''}
    `)

  // Role-based filtering
  if (user.role === 'project_manager') {
    // Project managers only see clients for their projects
    const { data: managedProjects } = await supabase
      .from('project_assignments')
      .select('project_id')
      .eq('user_id', user.id)
      .eq('role', 'project_manager')
    
    const { data: projectClients } = await supabase
      .from('projects')
      .select('client_id')
      .in('id', managedProjects?.map(p => p.project_id) || [])
    
    const clientIds = projectClients?.map(p => p.client_id).filter(Boolean) || []
    query = query.in('id', clientIds)
  }
  // Management roles see all clients

  const { data: clients, error } = await query
    .order('company_name', { ascending: true })

  if (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch clients' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({
      clients,
      metadata: {
        total: clients?.length || 0,
        user_role: user.role
      }
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

### **Procurement API with Purchase Access Control**
```typescript
// app/api/procurement/route.ts
import { NextRequest } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { requirePermission } from '@/lib/middleware/auth'

export const GET = requirePermission('procurement.view')(async (request: NextRequest, user) => {
  const supabase = createRouteHandlerClient({ cookies })
  const { searchParams } = new URL(request.url)
  
  const type = searchParams.get('type') || 'overview' // overview, suppliers, orders
  const status = searchParams.get('status')

  if (type === 'suppliers') {
    let query = supabase
      .from('suppliers')
      .select(`
        id,
        name,
        contact_person,
        email,
        phone,
        categories,
        rating,
        created_at,
        scope_assignments:scope_items(count)
      `)

    const { data: suppliers, error } = await query
      .order('name', { ascending: true })

    if (error) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch suppliers' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        suppliers,
        metadata: {
          total: suppliers?.length || 0,
          user_role: user.role
        }
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  }

  if (type === 'orders') {
    let query = supabase
      .from('purchase_orders')
      .select(`
        id,
        order_number,
        status,
        total_amount,
        order_date,
        delivery_date,
        supplier:suppliers(id, name),
        project:projects(id, name),
        items:purchase_order_items(
          id,
          quantity,
          unit_price,
          scope_item:scope_items(id, title)
        )
      `)

    // Apply role-based filtering
    if (user.role === 'project_manager') {
      // Project managers see orders for their projects
      const { data: managedProjects } = await supabase
        .from('project_assignments')
        .select('project_id')
        .eq('user_id', user.id)
        .eq('role', 'project_manager')
      
      const managedProjectIds = managedProjects?.map(p => p.project_id) || []
      query = query.in('project_id', managedProjectIds)
    }
    // Purchase team and management see all orders

    if (status) {
      query = query.eq('status', status)
    }

    const { data: orders, error } = await query
      .order('order_date', { ascending: false })

    if (error) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch purchase orders' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        orders,
        metadata: {
          total: orders?.length || 0,
          user_role: user.role
        }
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Default overview response
  const [suppliersCount, pendingOrders, totalOrderValue] = await Promise.all([
    supabase.from('suppliers').select('*', { count: 'exact', head: true }),
    supabase.from('purchase_orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('purchase_orders').select('total_amount').eq('status', 'approved')
  ])

  const totalValue = totalOrderValue.data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0

  return new Response(
    JSON.stringify({
      overview: {
        total_suppliers: suppliersCount.count || 0,
        pending_orders: pendingOrders.count || 0,
        total_order_value: totalValue,
        user_role: user.role
      }
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

---

## **🔄 API Response Patterns**

### **Standard Response Format**
```typescript
// lib/api/response.ts
export interface ApiResponse<T> {
  data?: T
  error?: string
  metadata?: {
    total: number
    page?: number
    limit?: number
    user_role: string
    permissions?: string[]
  }
}

export function createSuccessResponse<T>(
  data: T,
  metadata?: Partial<ApiResponse<T>['metadata']>
): Response {
  return new Response(
    JSON.stringify({
      data,
      metadata: {
        total: Array.isArray(data) ? data.length : 1,
        ...metadata
      }
    }),
    { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  )
}

export function createErrorResponse(
  error: string,
  status: number = 400
): Response {
  return new Response(
    JSON.stringify({ error }),
    { 
      status,
      headers: { 'Content-Type': 'application/json' }
    }
  )
}
```

---

## **🛡️ Security & Rate Limiting**

### **Rate Limiting Middleware**
```typescript
// lib/middleware/rateLimit.ts
import { NextRequest } from 'next/server'

const rateLimit = new Map<string, { count: number; resetTime: number }>()

export function rateLimitMiddleware(
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
) {
  return (handler: (req: NextRequest) => Promise<Response>) => {
    return async (request: NextRequest) => {
      const ip = request.ip || 'unknown'
      const now = Date.now()
      
      // Clean old entries
      for (const [key, value] of rateLimit.entries()) {
        if (now > value.resetTime) {
          rateLimit.delete(key)
        }
      }
      
      const current = rateLimit.get(ip) || { count: 0, resetTime: now + windowMs }
      
      if (current.count >= maxRequests) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded' }),
          { 
            status: 429,
            headers: { 
              'Content-Type': 'application/json',
              'Retry-After': Math.ceil((current.resetTime - now) / 1000).toString()
            }
          }
        )
      }
      
      current.count++
      rateLimit.set(ip, current)
      
      return handler(request)
    }
  }
}
```

---

## **🔧 COORDINATOR IMPLEMENTATION INSTRUCTIONS**

### **Subagent Spawning Strategy**
```
TASK: API Architecture Implementation
OBJECTIVE: Deploy filtered API endpoints supporting GlobalSidebar navigation
CONTEXT: Authentication-based data access for all 13 user types

REQUIRED READING:
- Authentication: @Wave-1-Foundation/authentication-system.md
- UI Framework: @Wave-1-Foundation/core-ui-framework.md
- Database: @Wave-1-Foundation/database-schema-design.md

IMPLEMENTATION REQUIREMENTS:
1. Create all API endpoints with role-based filtering
2. Implement authentication middleware with JWT validation
3. Add permission-based access control to all routes
4. Test API security and data isolation

DELIVERABLES:
1. Complete API route implementations
2. Authentication middleware system
3. Rate limiting and security measures
4. API documentation and testing suite
```

### **Quality Gates**
- ✅ All API endpoints implement role-based filtering
- ✅ Authentication middleware validates all requests
- ✅ Data isolation prevents unauthorized access
- ✅ Rate limiting protects against abuse
- ✅ API responses include metadata for navigation badges

### **Dependencies for Next Wave**
- Authentication system must be fully functional
- All API endpoints tested with different user roles
- Performance optimized for mobile and web clients
- Security audit completed and vulnerabilities addressed

---

## **🎯 SUCCESS CRITERIA**
1. **Security Validation**: APIs enforce proper data isolation by role
2. **Performance**: All endpoints respond within acceptable limits
3. **Integration**: APIs support GlobalSidebar navigation requirements
4. **Documentation**: Complete API documentation with examples

**Evaluation Score Target**: 90+ using authentication-based data access patterns
# API Routes Refactoring Guide

**Priority**: HIGH  
**Timeline**: Week 5 (Phase 3)  
**Effort**: 40 hours total  
**Scope**: 10 API routes with complexity >10

## Overview

This guide covers refactoring high-complexity API routes using the Service Layer Pattern, proper error handling, and comprehensive validation.

## Current Problems

```typescript
// ❌ CURRENT PROBLEMATIC CODE - src/app/api/projects/[id]/route.ts
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  // 350+ lines of mixed responsibilities
  
  const data = await request.json();
  
  // Inline validation (40 lines)
  if (!data.name) throw new Error('Name required');
  if (!data.budget) throw new Error('Budget required');
  // ... 38 more validation lines
  
  // Business logic mixed with HTTP handling (120 lines)
  const project = await supabase.from('projects').select('*').eq('id', params.id).single();
  if (project.data.status === 'completed') {
    // Complex status transition logic (60 lines)
  }
  
  // Database operations scattered throughout (80 lines)
  await supabase.from('projects').update(data).eq('id', params.id);
  await supabase.from('project_budgets').update({...}).eq('project_id', params.id);
  await supabase.from('notifications').insert({...});
  
  // Manual error handling everywhere (50 lines)
  try {
    // ... operations
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
  
  return NextResponse.json(updatedProject);
}
```

### Problems Identified
1. **Mixed Responsibilities**: HTTP handling + business logic + data access
2. **No Service Layer**: All logic in route handlers
3. **Inconsistent Error Handling**: Manual try-catch everywhere
4. **No Input Validation**: Basic validation scattered throughout
5. **Direct Database Access**: No abstraction layer
6. **No Testing**: Monolithic structure hard to test

## Refactoring Strategy: Service Layer Pattern

### Phase 1: Create Service Layer Infrastructure (8 hours)

#### Step 1.1: Base Service Class (2 hours)

```typescript
// src/lib/services/base-service.ts
import { supabase } from '../supabase';
import { ServiceError, ValidationError, NotFoundError } from '../errors';

export abstract class BaseService {
  protected supabase = supabase;

  protected async executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      console.error(`Service error in ${context}:`, error);
      
      if (error instanceof ServiceError) {
        throw error;
      }
      
      throw new ServiceError(`Operation failed: ${context}`, error);
    }
  }

  protected validateRequired(data: any, fields: string[]): void {
    const missing = fields.filter(field => !data[field] || data[field] === '');
    if (missing.length > 0) {
      throw new ValidationError(`Required fields missing: ${missing.join(', ')}`);
    }
  }

  protected async findByIdOrThrow<T>(
    table: string, 
    id: string, 
    select: string = '*'
  ): Promise<T> {
    const { data, error } = await this.supabase
      .from(table)
      .select(select)
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundError(`${table} with id ${id} not found`);
    }

    return data as T;
  }
}
```

#### Step 1.2: Error Classes (2 hours)

```typescript
// src/lib/errors/service-errors.ts
export class ServiceError extends Error {
  constructor(
    message: string,
    public originalError?: any,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

export class ValidationError extends ServiceError {
  constructor(message: string, public field?: string) {
    super(message, null, 400);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ServiceError {
  constructor(message: string) {
    super(message, null, 404);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends ServiceError {
  constructor(message: string = 'Unauthorized') {
    super(message, null, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ServiceError {
  constructor(message: string = 'Forbidden') {
    super(message, null, 403);
    this.name = 'ForbiddenError';
  }
}
```

#### Step 1.3: API Error Handler (2 hours)

```typescript
// src/lib/api/error-handler.ts
import { NextResponse } from 'next/server';
import { ServiceError, ValidationError, NotFoundError, UnauthorizedError, ForbiddenError } from '../errors';

export function handleApiError(error: any): NextResponse {
  console.error('API Error:', error);

  if (error instanceof ValidationError) {
    return NextResponse.json(
      { 
        error: error.message,
        field: error.field,
        type: 'validation_error'
      },
      { status: 400 }
    );
  }

  if (error instanceof NotFoundError) {
    return NextResponse.json(
      { 
        error: error.message,
        type: 'not_found_error'
      },
      { status: 404 }
    );
  }

  if (error instanceof UnauthorizedError) {
    return NextResponse.json(
      { 
        error: error.message,
        type: 'unauthorized_error'
      },
      { status: 401 }
    );
  }

  if (error instanceof ForbiddenError) {
    return NextResponse.json(
      { 
        error: error.message,
        type: 'forbidden_error'
      },
      { status: 403 }
    );
  }

  if (error instanceof ServiceError) {
    return NextResponse.json(
      { 
        error: error.message,
        type: 'service_error'
      },
      { status: error.statusCode }
    );
  }

  // Generic error
  return NextResponse.json(
    { 
      error: 'Internal server error',
      type: 'internal_error'
    },
    { status: 500 }
  );
}
```

#### Step 1.4: Input Validation System (2 hours)

```typescript
// src/lib/validation/schemas.ts
import { z } from 'zod';

export const ProjectUpdateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  budget: z.number().positive(),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  manager_id: z.string().uuid().optional()
});

export const ProjectCreateSchema = ProjectUpdateSchema.extend({
  client_id: z.string().uuid(),
  project_type: z.enum(['construction', 'renovation', 'maintenance'])
});

export const UserCreateSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(['admin', 'manager', 'employee', 'client']),
  phone: z.string().optional(),
  department: z.string().optional()
});

// Validation helper
export function validateInput<T>(schema: z.ZodSchema<T>, data: any): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      throw new ValidationError(
        `${firstError.path.join('.')}: ${firstError.message}`,
        firstError.path.join('.')
      );
    }
    throw error;
  }
}
```

### Phase 2: Refactor High-Complexity Routes (32 hours)

#### Step 2.1: Projects API Refactoring (10 hours)

```typescript
// src/lib/services/project-service.ts
import { BaseService } from './base-service';
import { validateInput, ProjectCreateSchema, ProjectUpdateSchema } from '../validation/schemas';
import { NotFoundError, ForbiddenError } from '../errors';

export interface Project {
  id: string;
  name: string;
  description?: string;
  budget: number;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  client_id: string;
  manager_id?: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export class ProjectService extends BaseService {
  async createProject(data: any, userId: string): Promise<Project> {
    return this.executeWithErrorHandling(async () => {
      // Validate input
      const validatedData = validateInput(ProjectCreateSchema, data);

      // Check permissions
      await this.checkCreatePermission(userId);

      // Create project
      const { data: project, error } = await this.supabase
        .from('projects')
        .insert({
          ...validatedData,
          created_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Initialize project budget
      await this.initializeProjectBudget(project.id, validatedData.budget);

      // Create initial notifications
      await this.createProjectNotifications(project.id, userId);

      return project;
    }, 'createProject');
  }

  async updateProject(id: string, data: any, userId: string): Promise<Project> {
    return this.executeWithErrorHandling(async () => {
      // Validate input
      const validatedData = validateInput(ProjectUpdateSchema, data);

      // Get existing project
      const existingProject = await this.findByIdOrThrow<Project>('projects', id);

      // Check permissions
      await this.checkUpdatePermission(existingProject, userId);

      // Handle status transitions
      if (validatedData.status !== existingProject.status) {
        await this.handleStatusTransition(existingProject, validatedData.status, userId);
      }

      // Update project
      const { data: updatedProject, error } = await this.supabase
        .from('projects')
        .update({
          ...validatedData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Update related data if needed
      if (validatedData.budget !== existingProject.budget) {
        await this.updateProjectBudget(id, validatedData.budget);
      }

      return updatedProject;
    }, 'updateProject');
  }

  async getProject(id: string, userId: string): Promise<Project> {
    return this.executeWithErrorHandling(async () => {
      const project = await this.findByIdOrThrow<Project>('projects', id);
      
      // Check read permissions
      await this.checkReadPermission(project, userId);
      
      return project;
    }, 'getProject');
  }

  async deleteProject(id: string, userId: string): Promise<void> {
    return this.executeWithErrorHandling(async () => {
      const project = await this.findByIdOrThrow<Project>('projects', id);
      
      // Check delete permissions
      await this.checkDeletePermission(project, userId);
      
      // Soft delete
      const { error } = await this.supabase
        .from('projects')
        .update({ 
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    }, 'deleteProject');
  }

  // Private helper methods
  private async checkCreatePermission(userId: string): Promise<void> {
    const { data: user } = await this.supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (!user || !['admin', 'manager'].includes(user.role)) {
      throw new ForbiddenError('Insufficient permissions to create projects');
    }
  }

  private async checkUpdatePermission(project: Project, userId: string): Promise<void> {
    const { data: user } = await this.supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (!user) throw new ForbiddenError('User not found');

    const canUpdate = 
      user.role === 'admin' ||
      (user.role === 'manager' && project.manager_id === userId);

    if (!canUpdate) {
      throw new ForbiddenError('Insufficient permissions to update this project');
    }
  }

  private async handleStatusTransition(
    project: Project, 
    newStatus: string, 
    userId: string
  ): Promise<void> {
    // Validate status transition
    const validTransitions = {
      'planning': ['active', 'cancelled'],
      'active': ['on_hold', 'completed', 'cancelled'],
      'on_hold': ['active', 'cancelled'],
      'completed': [],
      'cancelled': []
    };

    const allowedTransitions = validTransitions[project.status] || [];
    if (!allowedTransitions.includes(newStatus)) {
      throw new ValidationError(
        `Invalid status transition from ${project.status} to ${newStatus}`
      );
    }

    // Log status change
    await this.supabase
      .from('project_status_history')
      .insert({
        project_id: project.id,
        from_status: project.status,
        to_status: newStatus,
        changed_by: userId,
        changed_at: new Date().toISOString()
      });
  }

  private async initializeProjectBudget(projectId: string, budget: number): Promise<void> {
    await this.supabase
      .from('project_budgets')
      .insert({
        project_id: projectId,
        total_budget: budget,
        allocated_budget: 0,
        spent_budget: 0,
        created_at: new Date().toISOString()
      });
  }

  private async updateProjectBudget(projectId: string, newBudget: number): Promise<void> {
    await this.supabase
      .from('project_budgets')
      .update({
        total_budget: newBudget,
        updated_at: new Date().toISOString()
      })
      .eq('project_id', projectId);
  }

  private async createProjectNotifications(projectId: string, userId: string): Promise<void> {
    // Notify relevant stakeholders about new project
    await this.supabase
      .from('notifications')
      .insert({
        type: 'project_created',
        title: 'New Project Created',
        message: `A new project has been created`,
        project_id: projectId,
        created_by: userId,
        created_at: new Date().toISOString()
      });
  }
}
```

#### Step 2.2: Refactored Projects Route (4 hours)

```typescript
// src/app/api/projects/[id]/route.ts - Refactored
import { NextRequest, NextResponse } from 'next/server';
import { ProjectService } from '../../../../lib/services/project-service';
import { handleApiError } from '../../../../lib/api/error-handler';

const projectService = new ProjectService();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const project = await projectService.getProject(params.id, userId);
    return NextResponse.json(project);

  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const data = await request.json();
    const updatedProject = await projectService.updateProject(params.id, data, userId);
    
    return NextResponse.json(updatedProject);

  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    await projectService.deleteProject(params.id, userId);
    
    return NextResponse.json({ message: 'Project deleted successfully' });

  } catch (error) {
    return handleApiError(error);
  }
}
```

#### Step 2.3: Admin Users API Refactoring (8 hours)

```typescript
// src/lib/services/user-management-service.ts
export class UserManagementService extends BaseService {
  async createUser(data: any, adminUserId: string): Promise<User> {
    return this.executeWithErrorHandling(async () => {
      // Validate admin permissions
      await this.checkAdminPermission(adminUserId);

      // Validate input
      const validatedData = validateInput(UserCreateSchema, data);

      // Check if email already exists
      await this.checkEmailUnique(validatedData.email);

      // Create user in auth system
      const authUser = await this.createAuthUser(validatedData);

      // Create user profile
      const { data: user, error } = await this.supabase
        .from('users')
        .insert({
          id: authUser.id,
          email: validatedData.email,
          name: validatedData.name,
          role: validatedData.role,
          phone: validatedData.phone,
          department: validatedData.department,
          created_by: adminUserId,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Send welcome email
      await this.sendWelcomeEmail(user);

      // Log admin action
      await this.logAdminAction(adminUserId, 'user_created', { userId: user.id });

      return user;
    }, 'createUser');
  }

  async updateUser(id: string, data: any, adminUserId: string): Promise<User> {
    return this.executeWithErrorHandling(async () => {
      await this.checkAdminPermission(adminUserId);
      
      const existingUser = await this.findByIdOrThrow<User>('users', id);
      
      // Validate role change permissions
      if (data.role && data.role !== existingUser.role) {
        await this.checkRoleChangePermission(adminUserId, existingUser.role, data.role);
      }

      const { data: updatedUser, error } = await this.supabase
        .from('users')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await this.logAdminAction(adminUserId, 'user_updated', { userId: id, changes: data });

      return updatedUser;
    }, 'updateUser');
  }

  private async checkAdminPermission(userId: string): Promise<void> {
    const { data: user } = await this.supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (!user || user.role !== 'admin') {
      throw new ForbiddenError('Admin permissions required');
    }
  }

  private async checkEmailUnique(email: string): Promise<void> {
    const { data } = await this.supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (data) {
      throw new ValidationError('Email already exists', 'email');
    }
  }

  private async logAdminAction(adminId: string, action: string, details: any): Promise<void> {
    await this.supabase
      .from('admin_audit_log')
      .insert({
        admin_id: adminId,
        action,
        details,
        timestamp: new Date().toISOString()
      });
  }
}
```

#### Step 2.4: Scope API Refactoring (10 hours)

```typescript
// src/lib/services/scope-service.ts
export class ScopeService extends BaseService {
  async createScope(data: any, userId: string): Promise<Scope> {
    return this.executeWithErrorHandling(async () => {
      const validatedData = validateInput(ScopeCreateSchema, data);
      
      // Check project permissions
      await this.checkProjectAccess(validatedData.project_id, userId);

      const { data: scope, error } = await this.supabase
        .from('scopes')
        .insert({
          ...validatedData,
          created_by: userId,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Initialize scope budget
      await this.initializeScopeBudget(scope.id, validatedData.estimated_cost);

      return scope;
    }, 'createScope');
  }

  async updateScope(id: string, data: any, userId: string): Promise<Scope> {
    return this.executeWithErrorHandling(async () => {
      const existingScope = await this.findByIdOrThrow<Scope>('scopes', id);
      await this.checkScopeAccess(existingScope, userId);

      const validatedData = validateInput(ScopeUpdateSchema, data);

      const { data: updatedScope, error } = await this.supabase
        .from('scopes')
        .update({
          ...validatedData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Update budget if changed
      if (validatedData.estimated_cost !== existingScope.estimated_cost) {
        await this.updateScopeBudget(id, validatedData.estimated_cost);
      }

      return updatedScope;
    }, 'updateScope');
  }

  private async checkProjectAccess(projectId: string, userId: string): Promise<void> {
    const { data: project } = await this.supabase
      .from('projects')
      .select('manager_id')
      .eq('id', projectId)
      .single();

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const { data: user } = await this.supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    const hasAccess = 
      user?.role === 'admin' ||
      project.manager_id === userId;

    if (!hasAccess) {
      throw new ForbiddenError('Insufficient permissions for this project');
    }
  }
}
```

## Testing Strategy

```typescript
// tests/services/project-service.test.ts
import { ProjectService } from '../../src/lib/services/project-service';
import { ValidationError, NotFoundError, ForbiddenError } from '../../src/lib/errors';

describe('ProjectService', () => {
  let projectService: ProjectService;

  beforeEach(() => {
    projectService = new ProjectService();
  });

  describe('createProject', () => {
    it('should create project with valid data', async () => {
      const projectData = {
        name: 'Test Project',
        budget: 100000,
        client_id: 'client-123',
        project_type: 'construction'
      };

      const result = await projectService.createProject(projectData, 'admin-user-id');
      
      expect(result.name).toBe('Test Project');
      expect(result.budget).toBe(100000);
    });

    it('should throw ValidationError for invalid data', async () => {
      const invalidData = { name: '' }; // Missing required fields

      await expect(
        projectService.createProject(invalidData, 'admin-user-id')
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ForbiddenError for non-admin user', async () => {
      const projectData = { name: 'Test', budget: 1000 };

      await expect(
        projectService.createProject(projectData, 'regular-user-id')
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
```

## Migration Strategy

1. **Week 1**: Create service layer infrastructure
2. **Week 2**: Refactor 3 highest complexity routes
3. **Week 3**: Refactor remaining 7 routes
4. **Week 4**: Integration testing and deployment
5. **Week 5**: Monitor and optimize

## Expected Results

- **Complexity Reduction**: From 18 average to <8 per route
- **Maintainability**: Clear separation of concerns
- **Testability**: Each service can be tested independently
- **Consistency**: Standardized error handling and validation
- **Security**: Proper authorization and input validation

This refactoring transforms monolithic API routes into clean, maintainable services following SOLID principles.
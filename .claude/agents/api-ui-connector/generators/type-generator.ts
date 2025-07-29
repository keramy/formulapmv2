import * as fs from 'fs/promises'
import * as path from 'path'
import { ApiAnalysis } from '../analyzers/api-analyzer'

export async function generateTypes(
  projectRoot: string,
  resourceName: string,
  analysis: ApiAnalysis
): Promise<string> {
  const capitalizedResource = capitalize(resourceName)
  const pluralResource = pluralize(resourceName)
  const typePath = path.join(projectRoot, 'src/types/api', `${pluralResource}.ts`)
  
  // Ensure directory exists
  await fs.mkdir(path.dirname(typePath), { recursive: true })
  
  const typeContent = generateTypeContent(resourceName, capitalizedResource, analysis)
  await fs.writeFile(typePath, typeContent, 'utf-8')
  
  return typePath
}

function generateTypeContent(
  resourceName: string,
  capitalizedResource: string,
  analysis: ApiAnalysis
): string {
  // Generate types based on common patterns and detected endpoints
  return `// Auto-generated types for ${resourceName}

export interface ${capitalizedResource} {
  id: string
  title: string
  description?: string
  status: ${capitalizedResource}Status
  priority: ${capitalizedResource}Priority
  project_id: string
  created_by: string
  assigned_to?: string
  due_date?: string
  estimated_hours?: number
  actual_hours?: number
  progress_percentage?: number
  tags?: string[]
  created_at: string
  updated_at: string
  
  // Relations
  project?: {
    id: string
    name: string
    code: string
  }
  created_by_user?: {
    id: string
    full_name: string
    email: string
  }
  assigned_to_user?: {
    id: string
    full_name: string
    email: string
  }
}

export type ${capitalizedResource}Status = 'pending' | 'in_progress' | 'review' | 'done' | 'cancelled'
export type ${capitalizedResource}Priority = 'low' | 'medium' | 'high' | 'urgent'

export interface Create${capitalizedResource}Data {
  title: string
  description?: string
  status?: ${capitalizedResource}Status
  priority?: ${capitalizedResource}Priority
  project_id: string
  assigned_to?: string
  due_date?: string
  estimated_hours?: number
  tags?: string[]
}

export interface Update${capitalizedResource}Data {
  title?: string
  description?: string
  status?: ${capitalizedResource}Status
  priority?: ${capitalizedResource}Priority
  assigned_to?: string
  due_date?: string
  estimated_hours?: number
  actual_hours?: number
  progress_percentage?: number
  tags?: string[]
}

export interface ${capitalizedResource}Filters {
  project_id?: string
  status?: ${capitalizedResource}Status
  priority?: ${capitalizedResource}Priority
  assigned_to?: string
  created_by?: string
  search?: string
  date_from?: string
  date_to?: string
}

export interface ${capitalizedResource}Response {
  success: boolean
  data: ${capitalizedResource}
  error?: string
}

export interface ${capitalizedResource}ListResponse {
  success: boolean
  data: ${capitalizedResource}[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  error?: string
}

export interface ${capitalizedResource}Comment {
  id: string
  task_id: string
  user_id: string
  comment: string
  created_at: string
  updated_at: string
  user?: {
    id: string
    full_name: string
    email: string
  }
}

export interface Create${capitalizedResource}CommentData {
  comment: string
}
`
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function pluralize(str: string): string {
  if (str.endsWith('y')) {
    return str.slice(0, -1) + 'ies'
  } else if (str.endsWith('s') || str.endsWith('x') || str.endsWith('ch')) {
    return str + 'es'
  }
  return str + 's'
}
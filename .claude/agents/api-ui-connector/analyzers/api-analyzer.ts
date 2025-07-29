import * as fs from 'fs/promises'
import * as path from 'path'
import * as ts from 'typescript'

export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  hasAuth: boolean
  permission?: string
  requestType?: string
  responseType?: string
  description?: string
}

export interface ApiAnalysis {
  resourceName: string
  endpoints: ApiEndpoint[]
  hasZodSchema: boolean
  schemaImports?: string[]
  types?: {
    request?: string
    response?: string
    item?: string
  }
}

export async function analyzeApiRoute(projectRoot: string, apiPath: string): Promise<ApiAnalysis | null> {
  const routePath = path.join(projectRoot, 'src/app', apiPath.replace(/^\//, ''), 'route.ts')
  
  try {
    const content = await fs.readFile(routePath, 'utf-8')
    
    // Extract resource name
    const resourceName = extractResourceName(apiPath)
    
    // Analyze endpoints
    const endpoints = analyzeEndpoints(content)
    
    // Check for Zod schemas
    const hasZodSchema = content.includes('z.object') || content.includes('zod')
    
    // Extract types
    const types = extractTypes(content, resourceName)
    
    return {
      resourceName,
      endpoints,
      hasZodSchema,
      types
    }
  } catch (error) {
    console.error(`Failed to analyze API route: ${error}`)
    return null
  }
}

function extractResourceName(apiPath: string): string {
  const parts = apiPath.split('/').filter(p => p && p !== 'api')
  const lastPart = parts[parts.length - 1]
  
  // Convert to singular form for type names
  if (lastPart.endsWith('ies')) {
    return lastPart.slice(0, -3) + 'y'
  } else if (lastPart.endsWith('es')) {
    return lastPart.slice(0, -2)
  } else if (lastPart.endsWith('s')) {
    return lastPart.slice(0, -1)
  }
  
  return lastPart
}

function analyzeEndpoints(content: string): ApiEndpoint[] {
  const endpoints: ApiEndpoint[] = []
  
  // Regular expression patterns for different API patterns
  const patterns = [
    // withAuth pattern
    /export const (GET|POST|PUT|PATCH|DELETE) = withAuth\(async[^}]+\}, \{ permission: '([^']+)' \}\)/g,
    // Standard export pattern
    /export async function (GET|POST|PUT|PATCH|DELETE)\s*\([^)]*\)/g,
    // Const export pattern
    /export const (GET|POST|PUT|PATCH|DELETE) = async[^}]+}/g
  ]
  
  const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const
  
  for (const method of methods) {
    const hasMethod = new RegExp(`export (const |async function )?${method}`, 'g').test(content)
    if (hasMethod) {
      const endpoint: ApiEndpoint = {
        method,
        hasAuth: false
      }
      
      // Check for withAuth pattern
      const withAuthMatch = new RegExp(
        `export const ${method} = withAuth\\(async[^}]+\\}, \\{ permission: '([^']+)' \\}\\)`
      ).exec(content)
      
      if (withAuthMatch) {
        endpoint.hasAuth = true
        endpoint.permission = withAuthMatch[1]
      } else {
        // Check for verifyAuth usage
        endpoint.hasAuth = content.includes('verifyAuth') && 
                          new RegExp(`${method}[^}]+verifyAuth`).test(content)
      }
      
      endpoints.push(endpoint)
    }
  }
  
  return endpoints
}

function extractTypes(content: string, resourceName: string): ApiAnalysis['types'] {
  const types: ApiAnalysis['types'] = {}
  
  // Common type patterns
  const typePatterns = [
    // Interface definitions
    /interface\s+(\w+)\s*{[^}]+}/g,
    // Type definitions
    /type\s+(\w+)\s*=\s*{[^}]+}/g,
    // Zod schema to type
    /type\s+(\w+)\s*=\s*z\.infer<typeof\s+(\w+)>/g
  ]
  
  // Look for common naming patterns
  const capitalizedResource = resourceName.charAt(0).toUpperCase() + resourceName.slice(1)
  
  if (content.includes(`${capitalizedResource}Response`)) {
    types.response = `${capitalizedResource}Response`
  }
  
  if (content.includes(`${capitalizedResource}Request`)) {
    types.request = `${capitalizedResource}Request`
  }
  
  if (content.includes(`${capitalizedResource}Item`) || content.includes(capitalizedResource)) {
    types.item = content.includes(`${capitalizedResource}Item`) 
      ? `${capitalizedResource}Item` 
      : capitalizedResource
  }
  
  return types
}
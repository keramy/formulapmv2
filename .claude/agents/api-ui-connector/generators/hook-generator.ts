import * as fs from 'fs/promises'
import * as path from 'path'
import { ApiAnalysis } from '../analyzers/api-analyzer'

interface HookOptions {
  operations: string
  realtime: boolean
  cacheTtl: number
}

export async function generateHook(
  projectRoot: string,
  resourceName: string,
  analysis: ApiAnalysis,
  options: HookOptions
): Promise<string> {
  const hookName = `use${capitalize(resourceName)}Api`
  const hookPath = path.join(projectRoot, 'src/hooks/api', `${hookName}.ts`)
  
  // Ensure directory exists
  await fs.mkdir(path.dirname(hookPath), { recursive: true })
  
  const hookContent = generateHookContent(resourceName, analysis, options)
  await fs.writeFile(hookPath, hookContent, 'utf-8')
  
  return hookPath
}

function generateHookContent(
  resourceName: string,
  analysis: ApiAnalysis,
  options: HookOptions
): string {
  const capitalizedResource = capitalize(resourceName)
  const pluralResource = pluralize(resourceName)
  const hasGet = analysis.endpoints.some(e => e.method === 'GET')
  const hasPost = analysis.endpoints.some(e => e.method === 'POST')
  const hasPut = analysis.endpoints.some(e => e.method === 'PUT' || e.method === 'PATCH')
  const hasDelete = analysis.endpoints.some(e => e.method === 'DELETE')
  
  return `import { useCallback, useState } from 'react'
import { useApiQuery } from '@/hooks/useApiQuery'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import type { ${capitalizedResource}, Create${capitalizedResource}Data, Update${capitalizedResource}Data } from '@/types/api/${pluralResource}'

interface Use${capitalizedResource}ApiOptions {
  enabled?: boolean
  filters?: Record<string, any>
  sortField?: string
  sortDirection?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export function use${capitalizedResource}Api(options: Use${capitalizedResource}ApiOptions = {}) {
  const { getAccessToken } = useAuth()
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch ${pluralResource} list
  const {
    data: ${pluralResource},
    loading,
    error,
    refetch
  } = useApiQuery<${capitalizedResource}[]>({
    endpoint: '/api/${pluralResource}',
    params: {
      ...options.filters,
      sort_field: options.sortField,
      sort_direction: options.sortDirection,
      page: options.page,
      limit: options.limit
    },
    cacheKey: '${pluralResource}-list',
    enabled: options.enabled !== false,
    cacheTTL: ${options.cacheTtl}
  })

  ${hasPost ? `// Create ${resourceName}
  const create${capitalizedResource} = useCallback(async (data: Create${capitalizedResource}Data) => {
    setIsCreating(true)
    try {
      const token = await getAccessToken()
      const response = await fetch('/api/${pluralResource}', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create ${resourceName}')
      }

      const result = await response.json()
      toast.success('${capitalizedResource} created successfully')
      refetch() // Refresh the list
      return result.data
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create ${resourceName}')
      throw error
    } finally {
      setIsCreating(false)
    }
  }, [getAccessToken, refetch])` : ''}

  ${hasPut ? `// Update ${resourceName}
  const update${capitalizedResource} = useCallback(async (id: string, data: Update${capitalizedResource}Data) => {
    setIsUpdating(true)
    try {
      const token = await getAccessToken()
      const response = await fetch(\`/api/${pluralResource}/\${id}\`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update ${resourceName}')
      }

      const result = await response.json()
      toast.success('${capitalizedResource} updated successfully')
      refetch() // Refresh the list
      return result.data
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update ${resourceName}')
      throw error
    } finally {
      setIsUpdating(false)
    }
  }, [getAccessToken, refetch])` : ''}

  ${hasDelete ? `// Delete ${resourceName}
  const delete${capitalizedResource} = useCallback(async (id: string) => {
    setIsDeleting(true)
    try {
      const token = await getAccessToken()
      const response = await fetch(\`/api/${pluralResource}/\${id}\`, {
        method: 'DELETE',
        headers: {
          'Authorization': \`Bearer \${token}\`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete ${resourceName}')
      }

      toast.success('${capitalizedResource} deleted successfully')
      refetch() // Refresh the list
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete ${resourceName}')
      throw error
    } finally {
      setIsDeleting(false)
    }
  }, [getAccessToken, refetch])` : ''}

  // Get single ${resourceName}
  const get${capitalizedResource} = useCallback(async (id: string) => {
    try {
      const token = await getAccessToken()
      const response = await fetch(\`/api/${pluralResource}/\${id}\`, {
        headers: {
          'Authorization': \`Bearer \${token}\`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch ${resourceName}')
      }

      const result = await response.json()
      return result.data
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch ${resourceName}')
      throw error
    }
  }, [getAccessToken])

  return {
    // Data
    ${pluralResource}: ${pluralResource} || [],
    loading,
    error,
    
    // Actions
    ${hasPost ? `create${capitalizedResource},` : ''}
    ${hasPut ? `update${capitalizedResource},` : ''}
    ${hasDelete ? `delete${capitalizedResource},` : ''}
    get${capitalizedResource},
    refetch,
    
    // Loading states
    isCreating,
    isUpdating,
    isDeleting
  }
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
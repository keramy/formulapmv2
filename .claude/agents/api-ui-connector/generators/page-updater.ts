import * as fs from 'fs/promises'
import * as path from 'path'

interface Component {
  type: string
  path: string
}

export async function updatePageComponent(
  projectRoot: string,
  pagePath: string,
  resourceName: string,
  components: Component[]
): Promise<void> {
  const capitalizedResource = capitalize(resourceName)
  const pluralResource = pluralize(resourceName)
  const fullPagePath = path.join(projectRoot, 'src/app', pagePath.replace(/^\//, ''), 'page.tsx')
  
  // Read existing page content
  let pageContent: string
  try {
    pageContent = await fs.readFile(fullPagePath, 'utf-8')
  } catch {
    // If page doesn't exist, create a new one
    pageContent = generateNewPageContent(resourceName, capitalizedResource, pluralResource)
  }
  
  // Update imports and content
  const updatedContent = updatePageContent(pageContent, resourceName, capitalizedResource, pluralResource, components)
  
  await fs.writeFile(fullPagePath, updatedContent, 'utf-8')
}

function updatePageContent(
  content: string,
  resourceName: string,
  capitalizedResource: string,
  pluralResource: string,
  components: Component[]
): string {
  // If it's a placeholder page, replace it entirely
  if (content.includes('No tasks found. Create your first task') || 
      content.includes('placeholder') ||
      content.includes('coming soon')) {
    return generateNewPageContent(resourceName, capitalizedResource, pluralResource)
  }
  
  // Otherwise, try to intelligently update the existing page
  // This is a simplified version - in production you'd want more sophisticated AST manipulation
  return content
}

function generateNewPageContent(
  resourceName: string,
  capitalizedResource: string,
  pluralResource: string
): string {
  return `'use client'

import { useSearchParams } from 'next/navigation'
import { ${capitalizedResource}sList } from '@/components/${pluralResource}/${capitalizedResource}sList'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckSquare, Clock, AlertCircle, CheckCircle } from 'lucide-react'
import { use${capitalizedResource}Api } from '@/hooks/api/use${capitalizedResource}Api'

export default function ${capitalizedResource}sPage() {
  const searchParams = useSearchParams()
  const projectId = searchParams.get('project_id')
  
  const { ${pluralResource}, loading } = use${capitalizedResource}Api({
    filters: projectId ? { project_id: projectId } : undefined
  })

  // Calculate statistics
  const stats = {
    total: ${pluralResource}?.length || 0,
    pending: ${pluralResource}?.filter(t => t.status === 'pending').length || 0,
    inProgress: ${pluralResource}?.filter(t => t.status === 'in_progress').length || 0,
    completed: ${pluralResource}?.filter(t => t.status === 'done').length || 0,
    overdue: ${pluralResource}?.filter(t => {
      if (!t.due_date || t.status === 'done' || t.status === 'cancelled') return false
      return new Date(t.due_date) < new Date()
    }).length || 0
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">${capitalizedResource} Management</h1>
        <p className="text-gray-600">
          Manage ${pluralResource} and track progress across your projects
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total ${capitalizedResource}s</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All ${pluralResource} in the system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">
              Currently being worked on
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overdue}</div>
            <p className="text-xs text-muted-foreground">
              Past their due date
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">
              Successfully completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ${capitalizedResource}s List */}
      <${capitalizedResource}sList projectId={projectId || undefined} />
    </div>
  )
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
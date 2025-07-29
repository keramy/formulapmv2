import * as fs from 'fs/promises'
import * as path from 'path'
import { analyzeApiRoute } from './analyzers/api-analyzer'
import { generateHook } from './generators/hook-generator'
import { generateListComponent } from './generators/list-generator'
import { generateFormComponent } from './generators/form-generator'
import { generateTypes } from './generators/type-generator'
import { updatePageComponent } from './generators/page-updater'

interface AgentOptions {
  api: string
  page?: string
  operations?: string
  component?: 'list' | 'form' | 'detail' | 'all'
  realtime?: boolean
  cacheTtl?: number
}

export class ApiUiConnectorAgent {
  private projectRoot: string

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot
  }

  async execute(options: AgentOptions): Promise<void> {
    console.log('🔧 API-UI Connection Agent Starting...')
    
    // Step 1: Analyze API route
    console.log(`📊 Analyzing API route: ${options.api}`)
    const apiAnalysis = await analyzeApiRoute(this.projectRoot, options.api)
    
    if (!apiAnalysis) {
      throw new Error(`API route ${options.api} not found or could not be analyzed`)
    }

    // Extract resource name from API path
    const resourceName = this.extractResourceName(options.api)
    const pagePath = options.page || `/${resourceName}`

    // Step 2: Generate TypeScript types
    console.log(`📝 Generating TypeScript types for ${resourceName}`)
    const typesPath = await generateTypes(this.projectRoot, resourceName, apiAnalysis)

    // Step 3: Generate API hook
    console.log(`🪝 Generating API hook for ${resourceName}`)
    const hookPath = await generateHook(this.projectRoot, resourceName, apiAnalysis, {
      operations: options.operations || 'crud',
      realtime: options.realtime || false,
      cacheTtl: options.cacheTtl || 30000
    })

    // Step 4: Generate UI components based on options
    const components = []
    
    if (!options.component || options.component === 'all' || options.component === 'list') {
      console.log(`📋 Generating list component for ${resourceName}`)
      const listPath = await generateListComponent(this.projectRoot, resourceName, apiAnalysis)
      components.push({ type: 'list', path: listPath })
    }

    if (!options.component || options.component === 'all' || options.component === 'form') {
      console.log(`📝 Generating form component for ${resourceName}`)
      const formPath = await generateFormComponent(this.projectRoot, resourceName, apiAnalysis)
      components.push({ type: 'form', path: formPath })
    }

    // Step 5: Update page component to use generated components
    if (!options.component || options.component === 'all') {
      console.log(`🔄 Updating page component at ${pagePath}`)
      await updatePageComponent(this.projectRoot, pagePath, resourceName, components)
    }

    console.log(`✅ API-UI Connection completed successfully!`)
    console.log(`
Generated files:
- Types: ${typesPath}
- Hook: ${hookPath}
${components.map(c => `- ${c.type}: ${c.path}`).join('\n')}
- Updated page: ${pagePath}
    `)
  }

  private extractResourceName(apiPath: string): string {
    // Extract resource name from API path
    // /api/tasks -> tasks
    // /api/projects/[id]/tasks -> tasks
    const parts = apiPath.split('/')
    const resourcePart = parts[parts.length - 1]
    
    // Handle dynamic routes
    if (resourcePart.startsWith('[') && resourcePart.endsWith(']')) {
      return parts[parts.length - 2] || 'resource'
    }
    
    return resourcePart
  }

  async validateOptions(options: AgentOptions): Promise<string[]> {
    const errors: string[] = []

    if (!options.api) {
      errors.push('--api parameter is required')
    }

    if (options.component && !['list', 'form', 'detail', 'all'].includes(options.component)) {
      errors.push('--component must be one of: list, form, detail, all')
    }

    if (options.operations && !options.operations.match(/^[crud]+$/)) {
      errors.push('--operations must contain only c, r, u, d characters')
    }

    // Check if API route exists
    if (options.api) {
      const apiPath = path.join(this.projectRoot, 'src/app', options.api.replace(/^\//, ''), 'route.ts')
      try {
        await fs.access(apiPath)
      } catch {
        errors.push(`API route not found: ${apiPath}`)
      }
    }

    return errors
  }
}
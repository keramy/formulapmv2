/**
 * Formula PM 2.0 @Mention Intelligence Engine
 * Smart linking to projects, scope items, documents, users, and tasks
 */

'use client'

import { supabase } from '@/lib/supabase'
import { getUserAccessibleProjects } from '@/lib/database'
import { MentionMatch, MentionSuggestion, MentionParseResult } from '@/types/tasks'

export class MentionParser {
  // Regular expressions for different mention types
  private static readonly MENTION_PATTERNS = {
    project: /@project:([a-zA-Z0-9-_]+)/g,
    scope: /@scope:([0-9]+)/g,
    document: /@(?:document|shopdrawing):([a-zA-Z0-9-_]+)/g,
    user: /@user:([a-zA-Z0-9-_]+)/g,
    task: /@task:([a-zA-Z0-9-_]+)/g
  }

  // Autocomplete trigger patterns (without full ID)
  private static readonly AUTOCOMPLETE_PATTERNS = {
    project: /@project:?([a-zA-Z0-9-_]*)$/,
    scope: /@scope:?([0-9]*)$/,
    document: /@(?:document|shopdrawing):?([a-zA-Z0-9-_]*)$/,
    user: /@user:?([a-zA-Z0-9-_]*)$/,
    task: /@task:?([a-zA-Z0-9-_]*)$/
  }

  /**
   * Parse @mentions in text and return structured data with entity validation
   */
  static async parseMentions(text: string, projectId: string): Promise<MentionParseResult> {
    const mentions: MentionMatch[] = []
    const extractedReferences = {
      projects: [] as string[],
      scope_items: [] as string[],
      documents: [] as string[],
      users: [] as string[],
      tasks: [] as string[]
    }

    // Process each mention type
    for (const [type, regex] of Object.entries(this.MENTION_PATTERNS)) {
      const typeRegex = new RegExp(regex.source, 'g') // Create fresh regex instance
      let match

      while ((match = typeRegex.exec(text)) !== null) {
        const entityId = match[1]
        const entity = await this.resolveEntity(type as keyof typeof this.MENTION_PATTERNS, entityId, projectId)
        
        if (entity) {
          const mentionMatch: MentionMatch = {
            type: type as any,
            id: entityId,
            title: entity.title,
            startIndex: match.index,
            endIndex: match.index + match[0].length,
            url: this.generateEntityUrl(type as any, entityId, projectId)
          }
          
          mentions.push(mentionMatch)
          
          // Add to extracted references
          switch (type) {
            case 'project':
              extractedReferences.projects.push(entityId)
              break
            case 'scope':
              extractedReferences.scope_items.push(entityId)
              break
            case 'document':
              extractedReferences.documents.push(entityId)
              break
            case 'user':
              extractedReferences.users.push(entityId)
              break
            case 'task':
              extractedReferences.tasks.push(entityId)
              break
          }
        }
      }
    }

    // Sort mentions by position for proper processing
    mentions.sort((a, b) => a.startIndex - b.startIndex)

    // Process text to create clickable links (this would be used by UI components)
    let processedText = text
    let offset = 0

    for (const mention of mentions) {
      const originalMention = text.substring(mention.startIndex, mention.endIndex)
      const linkMarkup = `[${mention.title}](${mention.url})`
      
      const beforeMention = processedText.substring(0, mention.startIndex + offset)
      const afterMention = processedText.substring(mention.endIndex + offset)
      
      processedText = beforeMention + linkMarkup + afterMention
      offset += linkMarkup.length - originalMention.length
    }

    return {
      originalText: text,
      processedText,
      mentions,
      extractedReferences
    }
  }

  /**
   * Get autocomplete suggestions for @mentions - optimized with batch queries
   */
  static async getSuggestions(
    query: string, 
    type: string, 
    projectId: string,
    limit: number = 10
  ): Promise<MentionSuggestion[]> {
    try {
      const suggestionProvider = this.getSuggestionProvider(type)
      return await suggestionProvider(query, projectId, limit)
    } catch (error) {
      console.error(`Failed to get ${type} suggestions:`, error)
      return []
    }
  }

  /**
   * Detect mention context from cursor position in text
   */
  static detectMentionContext(text: string, cursorPosition: number): {
    type: string | null
    query: string
    startIndex: number
  } {
    // Get text up to cursor position
    const textBeforeCursor = text.substring(0, cursorPosition)
    
    // Check each autocomplete pattern
    for (const [type, pattern] of Object.entries(this.AUTOCOMPLETE_PATTERNS)) {
      const match = textBeforeCursor.match(pattern)
      if (match) {
        return {
          type,
          query: match[1] || '',
          startIndex: match.index!
        }
      }
    }

    return {
      type: null,
      query: '',
      startIndex: -1
    }
  }

  /**
   * Resolve entity by type and ID using optimized database utilities
   */
  private static async resolveEntity(
    type: keyof typeof this.MENTION_PATTERNS, 
    id: string, 
    projectId: string
  ): Promise<{ title: string } | null> {
    try {
      // Use consolidated database access pattern
      const resolver = this.getEntityResolver(type)
      return await resolver(id, projectId)
    } catch (error) {
      console.error(`Failed to resolve ${type}:${id}`, error)
      return null
    }
  }

  /**
   * Generate navigation URL for entity
   */
  private static generateEntityUrl(
    type: string, 
    id: string, 
    projectId: string
  ): string {
    const baseUrl = `/projects/${projectId}`
    
    switch (type) {
      case 'project':
        return `/projects/${id}`
      case 'scope':
        return `${baseUrl}/scope?item=${id}`
      case 'document':
        return `${baseUrl}/documents/${id}`
      case 'user':
        return `/team/${id}`
      case 'task':
        return `${baseUrl}/tasks/${id}`
      default:
        return '#'
    }
  }

  // ============================================================================
  // OPTIMIZED ENTITY RESOLUTION
  // ============================================================================

  /**
   * Get entity resolver function based on type - leverages existing database utilities
   */
  private static getEntityResolver(type: keyof typeof this.MENTION_PATTERNS) {
    const resolvers = {
      project: this.resolveProject,
      scope: this.resolveScopeItem,
      document: this.resolveDocument,
      user: this.resolveUser,
      task: this.resolveTask
    }
    return resolvers[type]
  }

  private static async resolveProject(id: string): Promise<{ title: string } | null> {
    const { data: project } = await supabase
      .from('projects')
      .select('id, name')
      .eq('id', id)
      .single()

    return project ? { title: project.name } : null
  }

  private static async resolveScopeItem(itemNo: string, projectId: string): Promise<{ title: string } | null> {
    const { data: scope } = await supabase
      .from('scope_items')
      .select('id, description, item_no')
      .eq('project_id', projectId)
      .eq('item_no', parseInt(itemNo))
      .single()

    return scope ? { title: `#${scope.item_no}: ${scope.description}` } : null
  }

  private static async resolveDocument(id: string, projectId: string): Promise<{ title: string } | null> {
    const { data: doc } = await supabase
      .from('documents')
      .select('id, title')
      .eq('project_id', projectId)
      .eq('id', id)
      .single()

    return doc ? { title: doc.title } : null
  }

  private static async resolveUser(id: string): Promise<{ title: string } | null> {
    const { data: user } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name')
      .eq('id', id)
      .single()

    return user ? { title: `${user.first_name} ${user.last_name}` } : null
  }

  private static async resolveTask(id: string, projectId: string): Promise<{ title: string } | null> {
    const { data: task } = await supabase
      .from('tasks')
      .select('id, title')
      .eq('project_id', projectId)
      .eq('id', id)
      .single()

    return task ? { title: task.title } : null
  }

  // ============================================================================
  // OPTIMIZED SUGGESTION METHODS
  // ============================================================================

  /**
   * Get suggestion provider function based on type - enables better optimization
   */
  private static getSuggestionProvider(type: string): (query: string, projectId: string, limit: number) => Promise<MentionSuggestion[]> {
    const providers = {
      project: this.getProjectSuggestions,
      scope: this.getScopeSuggestions,
      document: this.getDocumentSuggestions,
      user: this.getUserSuggestions,
      task: this.getTaskSuggestions
    }
    return providers[type as keyof typeof providers] || ((query: string, projectId: string, limit: number) => Promise.resolve([]))
  }

  private static async getProjectSuggestions(query: string, _projectId: string, limit: number): Promise<MentionSuggestion[]> {
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name, status')
      .ilike('name', `%${query}%`)
      .eq('status', 'active') // Only suggest active projects
      .limit(limit)

    return projects?.map(p => ({
      type: 'project',
      id: p.id,
      title: p.name,
      subtitle: 'Active Project',
      url: `/projects/${p.id}`,
      icon: 'FolderOpen',
      priority: 1
    })) || []
  }

  private static async getScopeSuggestions(query: string, projectId: string, limit: number): Promise<MentionSuggestion[]> {
    // Build query for both item number and description search
    let dbQuery = supabase
      .from('scope_items')
      .select('id, item_no, description, category, status')
      .eq('project_id', projectId)
      .limit(limit)

    // If query is numeric, search by item_no, otherwise search description
    if (/^\d+$/.test(query)) {
      dbQuery = dbQuery.gte('item_no', parseInt(query))
    } else {
      dbQuery = dbQuery.ilike('description', `%${query}%`)
    }

    const { data: items } = await dbQuery

    return items?.map(item => ({
      type: 'scope',
      id: item.item_no.toString(),
      title: `#${item.item_no}: ${item.description}`,
      subtitle: `${item.category} • ${item.status}`,
      url: `/projects/${projectId}/scope?item=${item.item_no}`,
      icon: 'Package',
      priority: item.status === 'in_progress' ? 1 : 2
    })) || []
  }

  private static async getDocumentSuggestions(query: string, projectId: string, limit: number): Promise<MentionSuggestion[]> {
    const { data: docs } = await supabase
      .from('documents')
      .select('id, title, document_type, status')
      .eq('project_id', projectId)
      .ilike('title', `%${query}%`)
      .limit(limit)

    return docs?.map(doc => ({
      type: 'document',
      id: doc.id,
      title: doc.title,
      subtitle: `${doc.document_type.replace('_', ' ')} • ${doc.status}`,
      url: `/projects/${projectId}/documents/${doc.id}`,
      icon: doc.document_type === 'shop_drawing' ? 'FileText' : 'File',
      priority: doc.status === 'approved' ? 1 : 2
    })) || []
  }

  private static async getUserSuggestions(query: string, projectId: string, limit: number): Promise<MentionSuggestion[]> {
    // Get users assigned to the project
    const { data: assignments } = await supabase
      .from('project_assignments')
      .select(`
        user_id,
        role,
        user_profiles!inner(
          id, 
          first_name, 
          last_name, 
          role,
          email
        )
      `)
      .eq('project_id', projectId)
      .eq('is_active', true)
      .or(`user_profiles.first_name.ilike.%${query}%,user_profiles.last_name.ilike.%${query}%`)
      .limit(limit)

    return assignments?.map(assignment => {
      const user = assignment.user_profiles
      return {
        type: 'user',
        id: user.id,
        title: `${user.first_name} ${user.last_name}`,
        subtitle: `${assignment.role.replace('_', ' ')} • ${user.role.replace('_', ' ')}`,
        url: `/team/${user.id}`,
        icon: 'User',
        priority: assignment.role === 'project_manager' ? 1 : 2
      }
    }) || []
  }

  private static async getTaskSuggestions(query: string, projectId: string, limit: number): Promise<MentionSuggestion[]> {
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title, status, priority')
      .eq('project_id', projectId)
      .ilike('title', `%${query}%`)
      .neq('status', 'cancelled') // Don't suggest cancelled tasks
      .limit(limit)

    return tasks?.map(task => ({
      type: 'task',
      id: task.id,
      title: task.title,
      subtitle: `${task.status} • ${task.priority} priority`,
      url: `/projects/${projectId}/tasks/${task.id}`,
      icon: 'CheckSquare',
      priority: task.status === 'in_progress' ? 1 : task.status === 'todo' ? 2 : 3
    })) || []
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Convert mention-enabled text to HTML with clickable links
   */
  static convertMentionsToHTML(mentions: MentionMatch[], originalText: string): string {
    if (mentions.length === 0) return originalText

    let html = ''
    let lastIndex = 0

    for (const mention of mentions) {
      // Add text before mention
      html += originalText.substring(lastIndex, mention.startIndex)
      
      // Add mention as link
      html += `<a href="${mention.url}" class="mention mention-${mention.type}" data-mention-type="${mention.type}" data-mention-id="${mention.id}">${mention.title}</a>`
      
      lastIndex = mention.endIndex
    }

    // Add remaining text
    html += originalText.substring(lastIndex)
    
    return html
  }

  /**
   * Extract plain text from mention-enabled content
   */
  static stripMentions(text: string): string {
    let cleanText = text
    
    for (const pattern of Object.values(this.MENTION_PATTERNS)) {
      cleanText = cleanText.replace(pattern, (match, id) => `@${id}`)
    }
    
    return cleanText
  }

  /**
   * Validate mention syntax without entity resolution
   */
  static validateMentionSyntax(text: string): {
    valid: boolean
    invalid_mentions: Array<{ text: string, position: number, reason: string }>
  } {
    const invalid_mentions: Array<{ text: string, position: number, reason: string }> = []
    
    // Check for malformed mentions
    const malformedPattern = /@(\w+):?([^@\s]*)/g
    let match

    while ((match = malformedPattern.exec(text)) !== null) {
      const [fullMatch, type, id] = match
      
      if (!['project', 'scope', 'document', 'shopdrawing', 'user', 'task'].includes(type)) {
        invalid_mentions.push({
          text: fullMatch,
          position: match.index,
          reason: `Unknown mention type: ${type}`
        })
      } else if (!id) {
        invalid_mentions.push({
          text: fullMatch,
          position: match.index,
          reason: `Missing ID for ${type} mention`
        })
      } else if (type === 'scope' && !/^\d+$/.test(id)) {
        invalid_mentions.push({
          text: fullMatch,
          position: match.index,
          reason: 'Scope mentions must use numeric item numbers'
        })
      }
    }

    return {
      valid: invalid_mentions.length === 0,
      invalid_mentions
    }
  }
}
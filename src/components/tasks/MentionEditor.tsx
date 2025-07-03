/**
 * Formula PM 2.0 Mention Editor Component
 * Rich text editor with @mention autocomplete and intelligence
 */

'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { MentionParser, MentionSuggestion } from '@/lib/mentions'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  FolderOpen, 
  Package, 
  FileText, 
  File, 
  User, 
  CheckSquare,
  Link 
} from 'lucide-react'

interface MentionEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  projectId: string
  className?: string
  disabled?: boolean
  minHeight?: string
}

const MENTION_ICONS: Record<string, React.ComponentType<any>> = {
  project: FolderOpen,
  scope: Package,
  document: File,
  shopdrawing: FileText,
  user: User,
  task: CheckSquare
}

export const MentionEditor: React.FC<MentionEditorProps> = ({
  value,
  onChange,
  placeholder = "Type @ to mention projects, scope items, users, tasks, or documents...",
  projectId,
  className = "",
  disabled = false,
  minHeight = "100px"
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [suggestions, setSuggestions] = useState<MentionSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [mentionContext, setMentionContext] = useState<{
    type: string | null
    query: string
    startIndex: number
  }>({ type: null, query: '', startIndex: -1 })
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0)
  const [cursorPosition, setCursorPosition] = useState(0)

  // Handle text changes and detect mention context
  const handleTextChange = useCallback(async (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = event.target.value
    const cursorPos = event.target.selectionStart
    
    onChange(newValue)
    setCursorPosition(cursorPos)

    // Detect mention context at cursor position
    const context = MentionParser.detectMentionContext(newValue, cursorPos)
    setMentionContext(context)

    if (context.type && context.query !== undefined) {
      // Fetch suggestions for the detected mention type
      try {
        const mentionSuggestions = await MentionParser.getSuggestions(
          context.query,
          context.type,
          projectId,
          10
        )
        setSuggestions(mentionSuggestions)
        setShowSuggestions(mentionSuggestions.length > 0)
        setSelectedSuggestionIndex(0)
      } catch (error) {
        console.error('Failed to fetch mention suggestions:', error)
        setSuggestions([])
        setShowSuggestions(false)
      }
    } else {
      setShowSuggestions(false)
      setSuggestions([])
    }
  }, [onChange, projectId])

  // Handle keyboard navigation in suggestions
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        event.preventDefault()
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break
      case 'Enter':
      case 'Tab':
        event.preventDefault()
        insertMention(suggestions[selectedSuggestionIndex])
        break
      case 'Escape':
        event.preventDefault()
        setShowSuggestions(false)
        break
    }
  }, [showSuggestions, suggestions, selectedSuggestionIndex])

  // Insert selected mention into text
  const insertMention = useCallback((suggestion: MentionSuggestion) => {
    if (!textareaRef.current || mentionContext.type === null) return

    const textarea = textareaRef.current
    const beforeMention = value.substring(0, mentionContext.startIndex)
    const afterMention = value.substring(cursorPosition)
    
    const mentionText = `@${suggestion.type}:${suggestion.id}`
    const newValue = beforeMention + mentionText + afterMention
    const newCursorPos = mentionContext.startIndex + mentionText.length

    onChange(newValue)
    setShowSuggestions(false)
    setSuggestions([])
    setMentionContext({ type: null, query: '', startIndex: -1 })

    // Set cursor position after mention
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }, [value, mentionContext, cursorPosition, onChange])

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion: MentionSuggestion) => {
    insertMention(suggestion)
  }, [insertMention])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (textareaRef.current && !textareaRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={`relative ${className}`}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          w-full px-3 py-2 border border-gray-300 rounded-md
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          resize-none font-mono text-sm
          disabled:bg-gray-100 disabled:cursor-not-allowed
        `}
        style={{ minHeight }}
      />

      {/* Mention Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60">
          <ScrollArea className="max-h-60">
            <div className="py-1">
              {suggestions.map((suggestion, index) => {
                const IconComponent = MENTION_ICONS[suggestion.type] || Link
                return (
                  <button
                    key={`${suggestion.type}-${suggestion.id}`}
                    className={`
                      w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100
                      flex items-center space-x-3 text-sm
                      ${index === selectedSuggestionIndex ? 'bg-blue-50' : ''}
                    `}
                    onClick={() => handleSuggestionClick(suggestion)}
                    onMouseEnter={() => setSelectedSuggestionIndex(index)}
                  >
                    <IconComponent className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {suggestion.title}
                      </div>
                      {suggestion.subtitle && (
                        <div className="text-gray-500 text-xs truncate">
                          {suggestion.subtitle}
                        </div>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {suggestion.type}
                    </Badge>
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Mention Help Text */}
      <div className="mt-2 text-xs text-gray-500">
        <div className="flex flex-wrap gap-2">
          <span>Type <code className="bg-gray-100 px-1 rounded">@project:</code> for projects</span>
          <span>•</span>
          <span><code className="bg-gray-100 px-1 rounded">@scope:</code> for scope items</span>
          <span>•</span>
          <span><code className="bg-gray-100 px-1 rounded">@user:</code> for team members</span>
          <span>•</span>
          <span><code className="bg-gray-100 px-1 rounded">@task:</code> for tasks</span>
          <span>•</span>
          <span><code className="bg-gray-100 px-1 rounded">@document:</code> for documents</span>
        </div>
      </div>
    </div>
  )
}
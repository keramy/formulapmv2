/**
 * useClients Hook - Real API integration with Supabase
 * Uses consistent patterns from existing hooks
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'

interface Client {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  location?: string
  status: 'active' | 'inactive' | 'pending'
  projects_count: number
  last_activity?: string
  created_at: string
  type: 'individual' | 'company'
}

interface ClientsResponse {
  success: boolean
  data: Client[]
  pagination?: {
    page: number
    limit: number
    total: number
    has_more: boolean
  }
  error?: string
}

interface UseClientsOptions {
  page?: number
  limit?: number
  search?: string
  status?: string
  type?: string
  sortField?: string
  sortDirection?: 'asc' | 'desc'
}

export function useClients(options: UseClientsOptions = {}) {
  const { user, getAccessToken } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<ClientsResponse['pagination']>()
  const [currentPage, setCurrentPage] = useState(1)

  const {
    page = 1,
    limit = 20,
    search,
    status,
    type,
    sortField = 'name',
    sortDirection = 'asc'
  } = options

  // Update current page when page option changes
  useEffect(() => {
    setCurrentPage(page)
  }, [page])

  const fetchClients = useCallback(async () => {
    if (!user) {
      setLoading(false)
      setError('User not authenticated')
      return
    }

    try {
      setError(null)
      const token = await getAccessToken()
      
      if (!token) {
        throw new Error('Authentication token not available')
      }

      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        sort_field: sortField,
        sort_direction: sortDirection
      })

      if (search) {
        params.append('search', search)
      }

      if (status && status !== 'all') {
        params.append('status', status)
      }

      if (type && type !== 'all') {
        params.append('type', type)
      }

      const response = await fetch(`/api/clients?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`)
      }

      const result: ClientsResponse = await response.json()

      if (result.success && result.data) {
        setClients(Array.isArray(result.data) ? result.data : [])
        setPagination(result.pagination)
      } else {
        throw new Error(result.error || 'Failed to fetch clients - invalid response format')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred while fetching clients'
      console.error('Error fetching clients:', errorMessage)
      setError(errorMessage)
      setClients([]) // Clear clients on error
    } finally {
      setLoading(false)
    }
  }, [user, getAccessToken, currentPage, limit, search, status, type, sortField, sortDirection])

  // Create new client
  const createClient = useCallback(async (clientData: {
    name: string
    email: string
    phone?: string
    company?: string
    location?: string
    address?: string
    zip_code?: string
    country?: string
    tax_id?: string
    type?: 'individual' | 'company'
  }) => {
    if (!user) {
      throw new Error('User not authenticated')
    }

    try {
      const token = await getAccessToken()
      
      if (!token) {
        throw new Error('Authentication token not available')
      }

      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        // Refresh the clients list
        await fetchClients()
        return result.data
      } else {
        throw new Error(result.error || 'Failed to create client')
      }
    } catch (err) {
      console.error('Error creating client:', err)
      throw err
    }
  }, [user, getAccessToken, fetchClients])

  // Update client
  const updateClient = useCallback(async (clientId: string, updates: Partial<Client>) => {
    if (!user) {
      throw new Error('User not authenticated')
    }

    try {
      const token = await getAccessToken()
      
      if (!token) {
        throw new Error('Authentication token not available')
      }

      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        // Update local state
        setClients(prev => prev.map(client =>
          client.id === clientId ? { ...client, ...updates } : client
        ))
        return result.data
      } else {
        throw new Error(result.error || 'Failed to update client')
      }
    } catch (err) {
      console.error('Error updating client:', err)
      throw err
    }
  }, [user, getAccessToken])

  // Delete client
  const deleteClient = useCallback(async (clientId: string) => {
    if (!user) {
      throw new Error('User not authenticated')
    }

    try {
      const token = await getAccessToken()
      
      if (!token) {
        throw new Error('Authentication token not available')
      }

      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        // Remove from local state
        setClients(prev => prev.filter(client => client.id !== clientId))
        return true
      } else {
        throw new Error(result.error || 'Failed to delete client')
      }
    } catch (err) {
      console.error('Error deleting client:', err)
      throw err
    }
  }, [user, getAccessToken])

  // Refresh clients
  const refresh = useCallback(() => {
    setLoading(true)
    fetchClients()
  }, [fetchClients])

  // Pagination functions
  const goToPage = useCallback((newPage: number) => {
    if (pagination && newPage >= 1 && newPage <= Math.ceil(pagination.total / pagination.limit) && newPage !== currentPage) {
      setCurrentPage(newPage)
      setLoading(true)
    }
  }, [pagination, currentPage])

  const nextPage = useCallback(() => {
    if (pagination?.has_more) {
      goToPage(currentPage + 1)
    }
  }, [pagination, currentPage, goToPage])

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      goToPage(currentPage - 1)
    }
  }, [currentPage, goToPage])

  // Initial fetch
  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  return {
    clients,
    loading,
    error,
    pagination,
    createClient,
    updateClient,
    deleteClient,
    refresh,
    refetch: fetchClients,
    // Pagination functions
    goToPage,
    nextPage,
    prevPage
  }
}
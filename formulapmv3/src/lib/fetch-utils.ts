/**
 * Utility functions for robust API fetching with retry logic
 */

export interface FetchWithRetryOptions {
  retries?: number
  retryDelay?: number
  timeout?: number
  backoff?: boolean
  onRetry?: (attempt: number, error: Error) => void
}

/**
 * Fetch with retry logic and exponential backoff
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit & FetchWithRetryOptions = {}
): Promise<Response> {
  const {
    retries = 3,
    retryDelay = 1000,
    timeout = 15000,
    backoff = true,
    onRetry,
    ...fetchOptions
  } = options

  let lastError: Error

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Create timeout promise that rejects with a clear timeout error
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Request timeout after ${timeout}ms`))
        }, timeout)
      })

      // Create fetch promise
      const fetchPromise = fetch(url, fetchOptions)

      // Race between fetch and timeout
      const response = await Promise.race([fetchPromise, timeoutPromise])
      
      // If response is successful or client error (4xx), don't retry
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response
      }

      // Server error (5xx) - should retry
      throw new Error(`Server error: ${response.status} ${response.statusText}`)

    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')

      // If this is the last attempt, throw the error
      if (attempt === retries) {
        break
      }

      // Don't retry on authentication errors
      if (lastError.message.includes('Unauthorized') || lastError.message.includes('401')) {
        break
      }

      // Don't retry on user abort or certain timeout scenarios
      if (lastError.name === 'AbortError' && !lastError.message.includes('timeout')) {
        break
      }

      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, lastError)
      }

      // Wait before retrying with exponential backoff
      const delay = backoff ? retryDelay * Math.pow(2, attempt) : retryDelay
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

/**
 * Authenticated fetch with retry logic
 */
export async function authenticatedFetch(
  url: string,
  getAccessToken: () => Promise<string | null>,
  options: RequestInit & FetchWithRetryOptions = {}
): Promise<Response> {
  const token = await getAccessToken()
  if (!token) {
    throw new Error('No access token available')
  }

  const { headers = {}, ...otherOptions } = options

  return fetchWithRetry(url, {
    ...otherOptions,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...headers
    }
  })
}

/**
 * Check if error indicates a network connectivity issue
 */
export function isNetworkError(error: Error): boolean {
  return error.message.includes('Failed to fetch') ||
         error.message.includes('Network request failed') ||
         error.message.includes('fetch') ||
         error.name === 'NetworkError' ||
         error.name === 'TypeError'
}

/**
 * Check if error indicates a timeout
 */
export function isTimeoutError(error: Error): boolean {
  return error.name === 'AbortError' ||
         error.message.includes('timeout') ||
         error.message.includes('Timeout') ||
         error.message.includes('Request timeout after')
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyErrorMessage(error: Error): string {
  if (isTimeoutError(error)) {
    return 'Request timeout - please try again'
  }
  
  if (isNetworkError(error)) {
    return 'Network error - please check your connection and try again'
  }
  
  if (error.message.includes('Unauthorized') || error.message.includes('401')) {
    return 'Authentication failed - please log in again'
  }
  
  if (error.message.includes('403') || error.message.includes('Forbidden')) {
    return 'You do not have permission to perform this action'
  }
  
  if (error.message.includes('404') || error.message.includes('Not Found')) {
    return 'The requested resource was not found'
  }
  
  if (error.message.includes('500') || error.message.includes('Server error')) {
    return 'Server error - please try again later'
  }

  return error.message || 'An unexpected error occurred'
}
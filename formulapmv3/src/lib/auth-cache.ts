'use client';

import { User } from '@supabase/supabase-js';
import { UserProfile } from '@/types/auth';

/**
 * AuthCacheManager - Intelligent caching system for authentication state
 * Reduces repeated auth checks and improves navigation performance
 */

interface CachedAuthState {
  user: User | null;
  profile: UserProfile | null;
  timestamp: number;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
}

interface CacheOptions {
  ttl: number; // Time to live in milliseconds
  maxAge: number; // Maximum age before forced refresh
  enablePersistence: boolean; // Whether to persist to localStorage
}

export class AuthCacheManager {
  private cache: CachedAuthState | null = null;
  private options: CacheOptions;
  private readonly STORAGE_KEY = 'formula_pm_auth_cache';
  private refreshPromise: Promise<CachedAuthState | null> | null = null;

  constructor(options: Partial<CacheOptions> = {}) {
    this.options = {
      ttl: 5 * 60 * 1000, // 5 minutes
      maxAge: 30 * 60 * 1000, // 30 minutes
      enablePersistence: true,
      ...options
    };

    // Load from localStorage on initialization (async to prevent blocking)
    if (this.options.enablePersistence && typeof window !== 'undefined') {
      // Use setTimeout to make it async and prevent blocking the constructor
      setTimeout(() => this.loadFromStorage(), 0);
    }
  }

  /**
   * Get cached auth state if valid, otherwise return null
   */
  getCachedAuth(): CachedAuthState | null {
    if (!this.cache) {
      return null;
    }

    const now = Date.now();
    const age = now - this.cache.timestamp;

    // Check if cache is still valid
    if (age > this.options.ttl) {
      console.log('🔐 [AuthCache] Cache expired, age:', Math.round(age / 1000), 'seconds');
      return null;
    }

    // Check if token is still valid
    if (this.cache.expiresAt && now >= this.cache.expiresAt) {
      console.log('🔐 [AuthCache] Token expired');
      return null;
    }

    console.log('🔐 [AuthCache] Cache hit, age:', Math.round(age / 1000), 'seconds');
    return this.cache;
  }

  /**
   * Cache auth state with automatic persistence
   */
  setCachedAuth(user: User | null, profile: UserProfile | null, accessToken: string | null = null): void {
    const now = Date.now();
    
    // Calculate token expiration (JWT tokens typically expire in 1 hour)
    let expiresAt: number | null = null;
    if (accessToken) {
      try {
        // Decode JWT payload to get expiration
        const parts = accessToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          expiresAt = payload.exp * 1000; // Convert to milliseconds
        } else {
          // Invalid token format
          expiresAt = now + (60 * 60 * 1000); // Fallback: 1 hour
        }
      } catch (error) {
        console.warn('🔐 [AuthCache] Could not decode JWT token:', error);
        // Fallback: assume 1 hour expiration
        expiresAt = now + (60 * 60 * 1000);
      }
    }

    this.cache = {
      user,
      profile,
      timestamp: now,
      accessToken,
      refreshToken: null, // We don't cache refresh tokens for security
      expiresAt
    };

    console.log('🔐 [AuthCache] Cached auth state, expires at:', 
      expiresAt ? new Date(expiresAt).toLocaleTimeString() : 'unknown');

    // Persist to localStorage if enabled
    if (this.options.enablePersistence) {
      this.saveToStorage();
    }
  }

  /**
   * Clear cached auth state
   */
  clearCache(): void {
    console.log('🔐 [AuthCache] Clearing auth cache');
    this.cache = null;
    this.refreshPromise = null;

    if (this.options.enablePersistence && typeof window !== 'undefined') {
      try {
        localStorage.removeItem(this.STORAGE_KEY);
      } catch (error) {
        console.warn('🔐 [AuthCache] Could not clear cache from storage:', error);
      }
    }
  }

  /**
   * Check if cache needs refresh (approaching expiration)
   */
  needsRefresh(): boolean {
    if (!this.cache) {
      return true;
    }

    const now = Date.now();
    const age = now - this.cache.timestamp;
    const tokenTimeLeft = this.cache.expiresAt ? this.cache.expiresAt - now : this.options.ttl;

    // Refresh if cache is older than 80% of TTL or token expires in less than 5 minutes
    return age > (this.options.ttl * 0.8) || tokenTimeLeft < (5 * 60 * 1000);
  }

  /**
   * Get or create a refresh promise to prevent duplicate refreshes
   */
  getRefreshPromise(): Promise<CachedAuthState | null> | null {
    return this.refreshPromise;
  }

  /**
   * Set refresh promise
   */
  setRefreshPromise(promise: Promise<CachedAuthState | null>): void {
    this.refreshPromise = promise;
    
    // Clear promise when it resolves/rejects
    promise.finally(() => {
      this.refreshPromise = null;
    });
  }

  /**
   * Load cache from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed: CachedAuthState = JSON.parse(stored);
        
        // Validate stored data
        const now = Date.now();
        const age = now - parsed.timestamp;
        
        if (age < this.options.maxAge) {
          this.cache = parsed;
          console.log('🔐 [AuthCache] Loaded from storage, age:', Math.round(age / 1000), 'seconds');
        } else {
          console.log('🔐 [AuthCache] Stored cache too old, discarding');
          localStorage.removeItem(this.STORAGE_KEY);
        }
      }
    } catch (error) {
      console.warn('🔐 [AuthCache] Could not load from storage:', error);
      // Clear corrupted data
      try {
        localStorage.removeItem(this.STORAGE_KEY);
      } catch (clearError) {
        console.warn('🔐 [AuthCache] Could not clear corrupted storage:', clearError);
      }
    }
  }

  /**
   * Save cache to localStorage
   */
  private saveToStorage(): void {
    if (!this.cache || typeof window === 'undefined') {
      return;
    }

    try {
      // Don't persist sensitive tokens to localStorage for security
      const toStore: CachedAuthState = {
        ...this.cache,
        accessToken: null,
        refreshToken: null
      };
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(toStore));
    } catch (error) {
      console.warn('🔐 [AuthCache] Could not save to storage:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    hasCache: boolean;
    age: number | null;
    timeToExpiry: number | null;
    needsRefresh: boolean;
  } {
    if (!this.cache) {
      return {
        hasCache: false,
        age: null,
        timeToExpiry: null,
        needsRefresh: true
      };
    }

    const now = Date.now();
    const age = now - this.cache.timestamp;
    const timeToExpiry = this.cache.expiresAt ? this.cache.expiresAt - now : null;

    return {
      hasCache: true,
      age,
      timeToExpiry,
      needsRefresh: this.needsRefresh()
    };
  }
}

// Global cache instance
export const authCache = new AuthCacheManager({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxAge: 30 * 60 * 1000, // 30 minutes
  enablePersistence: true
});

// Cache utilities
export const AuthCacheUtils = {
  /**
   * Create a cache-first auth check function
   */
  createCacheFirstAuth: <T>(
    fetchFn: () => Promise<T>,
    getCachedValue: () => T | null,
    shouldRefresh: () => boolean = () => false
  ) => {
    return async (): Promise<T> => {
      // Try cache first
      const cached = getCachedValue();
      if (cached && !shouldRefresh()) {
        return cached;
      }

      // Fallback to network
      return fetchFn();
    };
  },

  /**
   * Debounce auth refreshes to prevent multiple simultaneous calls
   */
  debounceRefresh: <T>(
    refreshFn: () => Promise<T>,
    delay: number = 1000
  ) => {
    let timeoutId: NodeJS.Timeout | null = null;
    let pendingPromise: Promise<T> | null = null;

    return (): Promise<T> => {
      if (pendingPromise) {
        return pendingPromise;
      }

      pendingPromise = new Promise<T>((resolve, reject) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(async () => {
          try {
            const result = await refreshFn();
            resolve(result);
          } catch (error) {
            reject(error);
          } finally {
            pendingPromise = null;
            timeoutId = null;
          }
        }, delay);
      });

      return pendingPromise;
    };
  },

  /**
   * Format cache age for display
   */
  formatAge: (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
};
// src/services/core/BaseService.ts

import { SupabaseClient } from '@supabase/supabase-js';
import { supabase as sharedClient } from '@/integrations/supabase/client';

/**
 * Base service class that provides common functionality for all services
 */
export abstract class BaseService {
  protected supabase: SupabaseClient;
  
  protected constructor() {
    // Always use the shared client to avoid multiple GoTrueClient instances
    this.supabase = sharedClient;
  }
  
  /**
   * Create a cache with optional expiration time
   */
  protected createCache<T>(expirationMs: number = 5 * 60 * 1000): Map<string, { value: T; timestamp: number }> {
    return new Map<string, { value: T; timestamp: number }>();
  }
  
  /**
   * Get a value from cache
   */
  protected getCachedValue<T>(
    cache: Map<string, { value: T; timestamp: number }>,
    key: string,
    expirationMs: number = 5 * 60 * 1000
  ): T | undefined {
    const cached = cache.get(key);
    
    if (!cached) {
      return undefined;
    }
    
    // Check expiration
    const now = Date.now();
    if (now - cached.timestamp > expirationMs) {
      cache.delete(key);
      return undefined;
    }
    
    return cached.value;
  }
  
  /**
   * Set a value in cache
   */
  protected setCachedValue<T>(
    cache: Map<string, { value: T; timestamp: number }>,
    key: string,
    value: T
  ): void {
    cache.set(key, { value, timestamp: Date.now() });
  }
  
  /**
   * Execute a database operation with fallback to localStorage
   */
  protected async safeDbOperation<T>(
    operation: () => Promise<{ data: T | null; error: any }>,
    localStorageFallbackKey?: string,
    transform?: (localValue: string) => T
  ): Promise<{ data: T | null; error: any; usedFallback?: boolean }> {
    try {
      // Try to execute the database operation
      const result = await operation();
      
      // If successful, return the result
      if (!result.error) {
        return result;
      }
      
      // If failed and we have a localStorage key, try to get from localStorage
      if (localStorageFallbackKey) {
        console.warn('Database operation failed, using localStorage fallback');
        
        const localValue = localStorage.getItem(localStorageFallbackKey);
        
        if (localValue) {
          // Transform the local value if needed
          const transformedValue = transform ? transform(localValue) : JSON.parse(localValue) as T;
          
          return {
            data: transformedValue,
            error: null,
            usedFallback: true
          };
        }
      }
      
      // If no fallback or fallback failed, return the original error
      return result;
    } catch (error) {
      console.error('Error in safeDbOperation:', error);
      
      // Try localStorage fallback in case of exception
      if (localStorageFallbackKey) {
        const localValue = localStorage.getItem(localStorageFallbackKey);
        
        if (localValue) {
          const transformedValue = transform ? transform(localValue) : JSON.parse(localValue) as T;
          
          return {
            data: transformedValue,
            error: null,
            usedFallback: true
          };
        }
      }
      
      return { data: null, error };
    }
  }
}
// REFACTORED: src/core/analytics/SpendingCache.ts
/**
 * In-memory cache for monthly spending amounts.
 * Keyed by a unique combination of payment method and date range.
 */
// PersistentCache interface
export interface PersistentCache {
  get(key: string): Promise<number | undefined>;
  set(key: string, value: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

// SpendingCache.ts with TTL and pluggable persistent cache (IndexedDB, localStorage, etc.)
interface CacheEntry {
  value: number;
  timestamp: number;
}

export class SpendingCache {
  private memoryCache = new Map<string, CacheEntry>();
  private ttl: number;

  constructor(
    ttl: number = 5 * 60 * 1000,
    private persistentCache?: PersistentCache
  ) {
    this.ttl = ttl;
  }

  async get(key: string): Promise<number | undefined> {
    const entry = this.memoryCache.get(key);
    const now = Date.now();

    if (entry) {
      if (now - entry.timestamp > this.ttl) {
        this.memoryCache.delete(key);
        if (this.persistentCache) await this.persistentCache.delete(key);
        return undefined;
      }
      return entry.value;
    }

    if (this.persistentCache) {
      return this.persistentCache.get(key);
    }

    return undefined;
  }

  async set(key: string, value: number): Promise<void> {
    const entry: CacheEntry = { value, timestamp: Date.now() };
    this.memoryCache.set(key, entry);
    if (this.persistentCache) await this.persistentCache.set(key, value);
  }

  async clearByPrefix(prefix: string): Promise<void> {
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(`${prefix}-`)) {
        this.memoryCache.delete(key);
        if (this.persistentCache) await this.persistentCache.delete(key);
      }
    }
  }

  async clearAll(): Promise<void> {
    this.memoryCache.clear();
    if (this.persistentCache) await this.persistentCache.clear();
  }
}

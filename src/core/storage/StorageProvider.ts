import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Abstract interface for storage operations
 * Provides a common API for both localStorage and Supabase
 */
export interface StorageProvider {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<boolean>;
  remove(key: string): Promise<boolean>;
  update<T>(key: string, updateFn: (value: T | null) => T): Promise<T | null>;
  query<T>(table: string, options?: QueryOptions): Promise<T[]>;
  insert<T>(table: string, data: Record<string, unknown>): Promise<T | null>;
  update<T>(
    table: string,
    id: string,
    data: Record<string, unknown>
  ): Promise<boolean>;
  delete(table: string, id: string): Promise<boolean>;
  upsert<T>(table: string, data: Record<string, unknown>): Promise<T | null>;
}

// Define a type for query options
export interface QueryOptions {
  select?: string;
  filters?: Array<{
    column: string;
    value: string | number | boolean;
    eq?: boolean;
    neq?: boolean;
    ilike?: boolean;
  }>;
  orderBy?: {
    column: string;
    options?: { ascending?: boolean };
  };
  limit?: number;
  filter?: (item: unknown) => boolean;
}

/**
 * Local storage implementation of StorageProvider
 */
export class LocalStorageProvider implements StorageProvider {
  async get<T>(key: string): Promise<T | null> {
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    try {
      return JSON.parse(stored) as T;
    } catch (e) {
      console.error(`Error parsing stored data for key ${key}:`, e);
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<boolean> {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`Error storing data for key ${key}:`, e);
      return false;
    }
  }

  async remove(key: string): Promise<boolean> {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error(`Error removing data for key ${key}:`, e);
      return false;
    }
  }

  async update<T>(
    key: string,
    updateFn: (value: T | null) => T
  ): Promise<T | null> {
    try {
      const currentValue = await this.get<T>(key);
      const updatedValue = updateFn(currentValue);
      await this.set(key, updatedValue);
      return updatedValue;
    } catch (e) {
      console.error(`Error updating data for key ${key}:`, e);
      return null;
    }
  }

  // These methods simulate table operations using localStorage
  async query<T>(key: string, options?: QueryOptions): Promise<T[]> {
    const data = (await this.get<T[]>(key)) || [];
    // Apply simple filtering if options provided
    if (options?.filter && typeof options.filter === "function") {
      return data.filter(options.filter);
    }
    return data;
  }

  async insert<T>(
    key: string,
    data: Record<string, unknown>
  ): Promise<T | null> {
    try {
      const items = (await this.get<Array<Record<string, unknown>>>(key)) || [];
      items.push(data);
      await this.set(key, items);
      return data as T;
    } catch (e) {
      console.error(`Error inserting data for key ${key}:`, e);
      return null;
    }
  }

  async update<T>(
    key: string,
    id: string,
    data: Record<string, unknown>
  ): Promise<boolean> {
    try {
      const items = (await this.get<Array<Record<string, unknown>>>(key)) || [];
      const index = items.findIndex((item) => item.id === id);
      if (index === -1) return false;

      items[index] = { ...items[index], ...data };
      return await this.set(key, items);
    } catch (e) {
      console.error(`Error updating data for key ${key}:`, e);
      return false;
    }
  }

  async delete(key: string, id: string): Promise<boolean> {
    try {
      const items = (await this.get<Array<Record<string, unknown>>>(key)) || [];
      const filtered = items.filter((item) => item.id !== id);
      if (filtered.length === items.length) return false;

      return await this.set(key, filtered);
    } catch (e) {
      console.error(`Error deleting data for key ${key}:`, e);
      return false;
    }
  }

  async upsert<T>(
    key: string,
    data: Record<string, unknown>
  ): Promise<T | null> {
    try {
      if (!data.id) return null;

      const items = (await this.get<Array<Record<string, unknown>>>(key)) || [];
      const index = items.findIndex((item) => item.id === data.id);

      if (index === -1) {
        // Insert
        items.push(data);
      } else {
        // Update
        items[index] = { ...items[index], ...data };
      }

      await this.set(key, items);
      return data as T;
    } catch (e) {
      console.error(`Error upserting data for key ${key}:`, e);
      return null;
    }
  }
}

/**
 * Supabase implementation of StorageProvider
 */
export class SupabaseStorageProvider implements StorageProvider {
  constructor(private supabase: SupabaseClient) {}

  // Direct key-value operations (implemented using tables in Supabase)
  async get<T>(key: string): Promise<T | null> {
    try {
      const { data, error } = await this.supabase
        .from("key_value_storage")
        .select("value")
        .eq("key", key)
        .single();

      if (error || !data) return null;
      return JSON.parse(data.value) as T;
    } catch (e) {
      console.error(`Error getting data for key ${key}:`, e);
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<boolean> {
    try {
      const stringValue = JSON.stringify(value);
      const { error } = await this.supabase
        .from("key_value_storage")
        .upsert({ key, value: stringValue })
        .select();

      return !error;
    } catch (e) {
      console.error(`Error setting data for key ${key}:`, e);
      return false;
    }
  }

  async remove(key: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from("key_value_storage")
        .delete()
        .eq("key", key);

      return !error;
    } catch (e) {
      console.error(`Error removing data for key ${key}:`, e);
      return false;
    }
  }

  async update<T>(
    key: string,
    updateFn: (value: T | null) => T
  ): Promise<T | null> {
    try {
      const currentValue = await this.get<T>(key);
      const updatedValue = updateFn(currentValue);
      const success = await this.set(key, updatedValue);
      return success ? updatedValue : null;
    } catch (e) {
      console.error(`Error updating data for key ${key}:`, e);
      return null;
    }
  }

  // Table operations
  async query<T>(table: string, options?: QueryOptions): Promise<T[]> {
    try {
      let query = this.supabase.from(table).select(options?.select || "*");

      // Apply filters if provided
      if (options?.filters) {
        for (const filter of options.filters) {
          if (filter.eq) {
            query = query.eq(filter.column, filter.value);
          } else if (filter.neq) {
            query = query.neq(filter.column, filter.value);
          } else if (filter.ilike) {
            query = query.ilike(filter.column, filter.value);
          }
          // Add more filter types as needed
        }
      }

      // Apply ordering
      if (options?.orderBy) {
        query = query.order(options.orderBy.column, options.orderBy.options);
      }

      // Apply limit
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error(`Error querying table ${table}:`, error);
        return [];
      }

      return (data as T[]) || [];
    } catch (e) {
      console.error(`Error querying table ${table}:`, e);
      return [];
    }
  }

  async insert<T>(
    table: string,
    data: Record<string, unknown>
  ): Promise<T | null> {
    try {
      const { data: result, error } = await this.supabase
        .from(table)
        .insert(data)
        .select()
        .single();

      if (error) {
        console.error(`Error inserting into table ${table}:`, error);
        return null;
      }

      return result as T;
    } catch (e) {
      console.error(`Error inserting into table ${table}:`, e);
      return null;
    }
  }

  async update<T>(
    table: string,
    id: string,
    data: Record<string, unknown>
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from(table)
        .update(data)
        .eq("id", id);

      return !error;
    } catch (e) {
      console.error(`Error updating table ${table}:`, e);
      return false;
    }
  }

  async delete(table: string, id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.from(table).delete().eq("id", id);

      return !error;
    } catch (e) {
      console.error(`Error deleting from table ${table}:`, e);
      return false;
    }
  }

  async upsert<T>(
    table: string,
    data: Record<string, unknown>
  ): Promise<T | null> {
    try {
      const { data: result, error } = await this.supabase
        .from(table)
        .upsert(data)
        .select()
        .single();

      if (error) {
        console.error(`Error upserting into table ${table}:`, error);
        return null;
      }

      return result as T;
    } catch (e) {
      console.error(`Error upserting into table ${table}:`, e);
      return null;
    }
  }
}

// Factory to get the appropriate storage provider
export class StorageProviderFactory {
  public static getProvider(
    useLocalStorage: boolean,
    supabase: SupabaseClient
  ): StorageProvider {
    return useLocalStorage
      ? new LocalStorageProvider()
      : new SupabaseStorageProvider(supabase);
  }
}

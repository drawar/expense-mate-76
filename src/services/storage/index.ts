
// Re-export all storage utilities for backward compatibility
export * from '@/utils/storage/index';
export * from '@/utils/storage/transactions/add';
export * from '@/utils/storage/transactions/edit';
export * from '@/utils/storage/transactions/delete';
export * from '@/utils/storage/merchantTracking';

// Storage service for managing local storage mode
export const storageService = {
  _useLocalStorage: false,
  
  // Get current storage mode
  isLocalStorageMode(): boolean {
    return this._useLocalStorage;
  },
  
  // Set storage mode
  setLocalStorageMode(useLocalStorage: boolean): void {
    this._useLocalStorage = useLocalStorage;
    console.log(`Storage mode set to ${useLocalStorage ? 'local storage' : 'Supabase'}`);
  }
};

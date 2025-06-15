
// Placeholder utility functions for storage operations
export const getStorageKey = (key: string) => `app_${key}`;

export const setStorageItem = (key: string, value: any) => {
  try {
    localStorage.setItem(getStorageKey(key), JSON.stringify(value));
  } catch (error) {
    console.error('Error setting storage item:', error);
  }
};

export const getStorageItem = (key: string) => {
  try {
    const item = localStorage.getItem(getStorageKey(key));
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('Error getting storage item:', error);
    return null;
  }
};

export const removeStorageItem = (key: string) => {
  try {
    localStorage.removeItem(getStorageKey(key));
  } catch (error) {
    console.error('Error removing storage item:', error);
  }
};

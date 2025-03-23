
import { Merchant } from '@/types';

// LocalStorage key
const MERCHANTS_KEY = 'expenseTracker_merchants';

// Save merchants to localStorage
export const saveMerchants = (merchants: Merchant[]): void => {
  localStorage.setItem(MERCHANTS_KEY, JSON.stringify(merchants));
};

// Get merchants from localStorage
export const getMerchants = (): Merchant[] => {
  const stored = localStorage.getItem(MERCHANTS_KEY);
  return stored ? JSON.parse(stored) : [];
};

// Get merchant by name (case insensitive) or return undefined
export const getMerchantByName = (name: string): Merchant | undefined => {
  const merchants = getMerchants();
  return merchants.find(m => m.name.toLowerCase() === name.toLowerCase());
};

// Add a new merchant or update if already exists
export const addOrUpdateMerchant = (merchant: Merchant): Merchant => {
  const merchants = getMerchants();
  
  // Check if merchant with same name exists
  const existingIndex = merchants.findIndex(m => m.name.toLowerCase() === merchant.name.toLowerCase());
  
  if (existingIndex >= 0) {
    // Update existing merchant
    merchants[existingIndex] = {
      ...merchants[existingIndex],
      ...merchant,
      id: merchants[existingIndex].id,
    };
  } else {
    // Add new merchant
    merchant.id = Date.now().toString();
    merchants.push(merchant);
  }
  
  saveMerchants(merchants);
  return existingIndex >= 0 ? merchants[existingIndex] : merchant;
};

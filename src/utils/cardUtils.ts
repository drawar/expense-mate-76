/**
 * Utility functions for credit card related operations
 */

import { PaymentMethod } from '@/types';

/**
 * Generates a consistent card type ID for reward rules mapping
 * @param issuer The card issuer name
 * @param name The card name
 * @param fallbackId Optional fallback ID if issuer or name is not available
 * @returns A normalized card type ID string
 */
export const getCardTypeId = (
  issuer?: string,
  name?: string,
  fallbackId?: string
): string => {
  if (!issuer || !name) {
    return fallbackId || '';
  }

  // Handle special case for American Express
  const formattedIssuer = issuer.toLowerCase() === "american express" ? 
    "amex" : issuer.toLowerCase();
  
  // Remove apostrophes and convert spaces to hyphens in the name
  const formattedName = name.toLowerCase()
    .replace(/'/g, '')  // Remove apostrophes
    .replace(/\s+/g, '-');  // Convert spaces to hyphens
  
  return `${formattedIssuer}-${formattedName}`;
};

/**
 * Generates a card type ID from a payment method object
 * @param method The payment method object
 * @returns A normalized card type ID string
 */
export const getCardTypeIdFromMethod = (method: PaymentMethod): string => {
  return getCardTypeId(method.issuer, method.name, method.id);
};
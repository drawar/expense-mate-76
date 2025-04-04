
// src/hooks/dashboard/useTransactionFiltering.ts
import { useMemo } from "react";
import { Transaction } from "@/types";
import { TimeframeTab } from "@/utils/transactionProcessor";
import { filterTransactionsByTimeframe } from "@/utils/transactionProcessor";

export interface FilterOptions {
  timeframe?: TimeframeTab;
  useStatementMonth?: boolean;
  statementCycleDay?: number;
  paymentMethodIds?: string[];
  merchantIds?: string[];
  categories?: string[];
  searchTerm?: string;
}

/**
 * Custom hook to filter transactions based on various criteria
 */
export function useTransactionFiltering() {
  // Function to filter transactions based on provided filter options
  const filterTransactions = (transactions: Transaction[], options: FilterOptions = {}) => {
    let filtered = [...transactions];
    
    // Filter by payment method IDs if specified
    if (options.paymentMethodIds && options.paymentMethodIds.length > 0) {
      filtered = filtered.filter(tx => 
        options.paymentMethodIds?.includes(tx.paymentMethod.id)
      );
    }
    
    // Filter by merchant IDs if specified
    if (options.merchantIds && options.merchantIds.length > 0) {
      filtered = filtered.filter(tx => 
        options.merchantIds?.includes(tx.merchant.id)
      );
    }
    
    // Filter by categories if specified
    if (options.categories && options.categories.length > 0) {
      filtered = filtered.filter(tx => 
        options.categories?.includes(tx.category || '')
      );
    }
    
    // Filter by search term if specified
    if (options.searchTerm && options.searchTerm.trim() !== '') {
      const searchLower = options.searchTerm.toLowerCase();
      filtered = filtered.filter(tx => {
        // Search in notes
        if (tx.notes && tx.notes.toLowerCase().includes(searchLower)) {
          return true;
        }
        
        // Search in category
        if (tx.category && tx.category.toLowerCase().includes(searchLower)) {
          return true;
        }
        
        // Search in merchant name
        if (tx.merchant && tx.merchant.name.toLowerCase().includes(searchLower)) {
          return true;
        }
        
        return false;
      });
    }
    
    // Apply timeframe filtering if specified
    if (options.timeframe) {
      filtered = filterTransactionsByTimeframe(
        filtered,
        options.timeframe,
        options.useStatementMonth || false,
        options.statementCycleDay || 1
      );
    }
    
    return filtered;
  };
  
  return { filterTransactions };
}

import { useState, useEffect, useCallback } from "react";
import { storageService } from "@/core/storage/StorageService";
import { Merchant, MerchantCategoryCode } from "@/types";

export interface MerchantSuggestion {
  name: string;
  address?: string;
  isOnline: boolean;
  mcc?: MerchantCategoryCode;
  count: number;
}

export function useMerchantSuggestions() {
  const [merchants, setMerchants] = useState<MerchantSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMerchants = async () => {
      try {
        const transactions = await storageService.getTransactions();

        // Extract unique merchants from transactions with usage count
        // Use most recent MCC for each merchant
        const merchantMap = new Map<
          string,
          { merchant: Merchant; count: number; latestDate: string }
        >();

        transactions.forEach((tx) => {
          if (!tx.merchant?.name) return;

          const key = tx.merchant.name.toLowerCase().trim();
          const existing = merchantMap.get(key);
          if (existing) {
            existing.count++;
            // Update to most recent data (transactions are sorted by date desc)
            if (!existing.latestDate || tx.date > existing.latestDate) {
              existing.latestDate = tx.date;
              // Update MCC to most recent if available
              if (tx.merchant.mcc) {
                existing.merchant.mcc = tx.merchant.mcc;
              }
              // Update address if current one is missing but transaction has one
              if (!existing.merchant.address && tx.merchant.address) {
                existing.merchant.address = tx.merchant.address;
              }
            }
          } else {
            merchantMap.set(key, {
              merchant: tx.merchant,
              count: 1,
              latestDate: tx.date,
            });
          }
        });

        // Convert to suggestions array, sorted by usage count
        const suggestions: MerchantSuggestion[] = Array.from(
          merchantMap.values()
        )
          .sort((a, b) => b.count - a.count)
          .map((m) => ({
            name: m.merchant.name,
            address: m.merchant.address,
            isOnline: m.merchant.isOnline,
            mcc: m.merchant.mcc,
            count: m.count,
          }));

        setMerchants(suggestions);
      } catch (error) {
        console.error("Error loading merchant suggestions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMerchants();
  }, []);

  const getNameSuggestions = useCallback(
    (query: string): MerchantSuggestion[] => {
      if (!query || query.length < 2) return [];

      const lowerQuery = query.toLowerCase().trim();
      return merchants
        .filter((m) => m.name.toLowerCase().includes(lowerQuery))
        .slice(0, 10);
    },
    [merchants]
  );

  const getAddressSuggestions = useCallback(
    (query: string, merchantName?: string): string[] => {
      if (!query || query.length < 2) return [];

      const lowerQuery = query.toLowerCase().trim();

      // If merchant name is provided, prioritize addresses from that merchant
      let filteredMerchants = merchants;
      if (merchantName) {
        const exactMatches = merchants.filter(
          (m) => m.name.toLowerCase() === merchantName.toLowerCase()
        );
        if (exactMatches.length > 0) {
          filteredMerchants = exactMatches;
        }
      }

      // Get unique addresses that match the query
      const addresses = new Set<string>();
      filteredMerchants.forEach((m) => {
        if (m.address && m.address.toLowerCase().includes(lowerQuery)) {
          addresses.add(m.address);
        }
      });

      return Array.from(addresses).slice(0, 10);
    },
    [merchants]
  );

  const getMerchantByName = useCallback(
    (name: string): MerchantSuggestion | undefined => {
      return merchants.find((m) => m.name.toLowerCase() === name.toLowerCase());
    },
    [merchants]
  );

  return {
    merchants,
    isLoading,
    getNameSuggestions,
    getAddressSuggestions,
    getMerchantByName,
  };
}

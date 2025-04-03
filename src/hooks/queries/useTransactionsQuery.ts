
import { useQuery } from "@tanstack/react-query";
import { Transaction } from "@/types";
import { getTransactions } from "@/utils/storageUtils";
import { USE_LOCAL_STORAGE_DEFAULT } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Custom hook to fetch transactions using React Query
 */
export function useTransactionsQuery() {
  return useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      try {
        const allTransactions = await getTransactions(USE_LOCAL_STORAGE_DEFAULT);
        // Filter out deleted transactions
        return allTransactions.filter((tx) => !tx.is_deleted);
      } catch (error) {
        console.error("Error fetching transactions:", error);
        toast.error("Failed to load transactions");
        return [] as Transaction[];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
}

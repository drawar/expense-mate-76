
import { useQuery } from "@tanstack/react-query";
import { Transaction } from "@/types";
import { getTransactions } from "@/services/storage";
import { toast } from "sonner";

/**
 * Custom hook to fetch transactions using React Query
 */
export function useTransactionsQuery() {
  return useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      try {
        const transactions = await getTransactions();
        return transactions.filter(tx => tx.is_deleted !== true);
      } catch (error) {
        console.error("Error fetching transactions:", error);
        toast.error("Failed to load transactions");
        return [] as Transaction[];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

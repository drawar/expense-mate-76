// hooks/usePaymentMethods.ts (new consolidated version)
import { useQuery } from "@tanstack/react-query";
import { PaymentMethod, Currency } from "@/types";
import { getPaymentMethods } from "@/utils/storageUtils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Custom hook to fetch payment methods using React Query
 * @param options Additional options for fetching payment methods
 */
export function usePaymentMethods(options?: {
  skipQueryCache?: boolean;
  localFallback?: boolean;
}) {
  const { skipQueryCache = false, localFallback = true } = options || {};
  
  const query = useQuery({
    queryKey: ["paymentMethods"],
    queryFn: async () => {
      try {
        return await getPaymentMethods();
      } catch (error) {
        console.error("Error fetching payment methods:", error);
        toast.error("Failed to load payment methods");
        return [] as PaymentMethod[];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Provide a manual refetch function for compatibility with the old hook
  const refetch = async () => {
    return query.refetch();
  };

  return {
    paymentMethods: query.data || [],
    isLoading: query.isLoading,
    error: query.error ? "Failed to load payment methods" : null,
    refetch,
  };
}

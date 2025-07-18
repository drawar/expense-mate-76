
import { useQuery } from "@tanstack/react-query";
import { PaymentMethod } from "@/types";
import { storageService } from '@/core/storage';
import { toast } from "sonner";

/**
 * Custom hook to fetch payment methods using React Query
 */
export function usePaymentMethodsQuery() {
  return useQuery({
    queryKey: ["paymentMethods"],
    queryFn: async () => {
      try {
        return await storageService.getPaymentMethods();
      } catch (error) {
        console.error("Error fetching payment methods:", error);
        toast.error("Failed to load payment methods");
        return [] as PaymentMethod[];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

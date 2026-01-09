import { useQuery } from "@tanstack/react-query";
import { PaymentMethod } from "@/types";
import { storageService } from "@/core/storage";
import { toast } from "sonner";

/**
 * Custom hook to fetch payment methods using React Query
 * @param options.includeInactive - If true, includes inactive payment methods (default: false)
 */
export function usePaymentMethodsQuery(options?: {
  includeInactive?: boolean;
}) {
  const includeInactive = options?.includeInactive ?? false;

  return useQuery({
    queryKey: ["paymentMethods", { includeInactive }],
    queryFn: async () => {
      try {
        return await storageService.getPaymentMethods({ includeInactive });
      } catch (error) {
        console.error("Error fetching payment methods:", error);
        toast.error("Failed to load payment methods");
        return [] as PaymentMethod[];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

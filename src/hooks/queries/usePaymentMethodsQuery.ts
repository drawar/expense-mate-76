import { useQuery } from "@tanstack/react-query";
import { PaymentMethod } from "@/types";
import { storageService } from "@/core/storage";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

/**
 * Custom hook to fetch payment methods using React Query
 * @param options.includeInactive - If true, includes inactive payment methods (default: false)
 */
export function usePaymentMethodsQuery(options?: {
  includeInactive?: boolean;
}) {
  const includeInactive = options?.includeInactive ?? false;
  const { user } = useAuth();

  return useQuery({
    queryKey: ["paymentMethods", user?.id, { includeInactive }],
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
    enabled: !!user, // Only fetch when user is authenticated
  });
}


// hooks/usePaymentMethods.ts - NEW FILE
import { useState, useEffect } from 'react';
import { PaymentMethod } from '@/types';
import { storageService } from '@/core/storage';

export function usePaymentMethods() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        setIsLoading(true);
        const methods = await storageService.getPaymentMethods();
        setPaymentMethods(methods);
        setError(null);
      } catch (err) {
        console.error('Error fetching payment methods:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch payment methods'));
        // Fallback to any default methods or empty array
        setPaymentMethods([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentMethods();
  }, []);

  return { paymentMethods, isLoading, error };
}

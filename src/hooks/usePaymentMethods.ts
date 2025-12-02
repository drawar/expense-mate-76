
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
        console.log('usePaymentMethods: Starting to fetch payment methods...');
        setIsLoading(true);
        const methods = await storageService.getPaymentMethods();
        console.log('usePaymentMethods: Fetched payment methods:', {
          count: methods.length,
          methods: methods.map(m => ({ id: m.id, name: m.name, active: m.active }))
        });
        setPaymentMethods(methods);
        setError(null);
      } catch (err) {
        console.error('usePaymentMethods: Error fetching payment methods:', err);
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

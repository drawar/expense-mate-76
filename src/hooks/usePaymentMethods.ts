
import { useState, useEffect } from 'react';
import { PaymentMethod } from '@/types';
import { getPaymentMethods } from '@/utils/storageUtils';
import { useToast } from '@/hooks/use-toast';

export const usePaymentMethods = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Loading payment methods...');
        const methods = await getPaymentMethods();
        console.log('Payment methods loaded:', methods);
        
        if (!methods || methods.length === 0) {
          console.error('No payment methods found');
          toast({
            title: 'Warning',
            description: 'No payment methods found. Please add some payment methods first.',
            variant: 'destructive',
          });
        } else {
          console.log('Payment methods loaded:', methods.length);
        }
        
        setPaymentMethods(methods);
      } catch (error) {
        console.error('Error loading payment methods:', error);
        toast({
          title: 'Error',
          description: 'Failed to load payment methods',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [toast]);

  return { paymentMethods, isLoading };
};

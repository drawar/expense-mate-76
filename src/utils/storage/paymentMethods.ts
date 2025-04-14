
import { PaymentMethod } from '@/types';

export const getPaymentMethods = async (): Promise<PaymentMethod[]> => {
  // Implementation of getting payment methods
  return [];
};

export const addPaymentMethod = async (paymentMethod: Omit<PaymentMethod, 'id'>): Promise<PaymentMethod> => {
  // Implementation of adding payment method
  return {} as PaymentMethod;
};

export const updatePaymentMethod = async (id: string, data: Partial<PaymentMethod>): Promise<PaymentMethod> => {
  // Implementation of updating payment method
  return {} as PaymentMethod;
};

export const deletePaymentMethod = async (id: string): Promise<boolean> => {
  // Implementation of deleting payment method
  return true;
};

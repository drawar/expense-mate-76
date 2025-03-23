
import { PaymentMethod } from '@/types';
import { defaultPaymentMethods } from '../defaults/paymentMethods';

// LocalStorage key
const PAYMENT_METHODS_KEY = 'expenseTracker_paymentMethods';

// Save payment methods to localStorage
export const savePaymentMethods = (paymentMethods: PaymentMethod[]): void => {
  localStorage.setItem(PAYMENT_METHODS_KEY, JSON.stringify(paymentMethods));
};

// Get payment methods from localStorage or return defaults
export const getPaymentMethods = (): PaymentMethod[] => {
  const stored = localStorage.getItem(PAYMENT_METHODS_KEY);
  return stored ? JSON.parse(stored) : defaultPaymentMethods;
};

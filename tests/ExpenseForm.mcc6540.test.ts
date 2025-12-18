import { describe, it, expect } from '@jest/globals';
import { z } from 'zod';

// Import the form schema
import { formSchema } from '@/hooks/expense/expense-form/formSchema';

describe('ExpenseForm - MCC 6540 Negative Amount Support', () => {
  it('should allow negative amounts for MCC 6540', () => {
    const formData = {
      merchantName: 'Test Merchant',
      isOnline: false,
      isContactless: false,
      amount: '-50.00',
      currency: 'CAD',
      paymentMethodId: 'test-payment-method',
      date: new Date(),
      mcc: { code: '6540', description: 'POI Funding Transactions' },
    };

    const result = formSchema.safeParse(formData);
    expect(result.success).toBe(true);
  });

  it('should allow positive amounts for MCC 6540', () => {
    const formData = {
      merchantName: 'Test Merchant',
      isOnline: false,
      isContactless: false,
      amount: '50.00',
      currency: 'CAD',
      paymentMethodId: 'test-payment-method',
      date: new Date(),
      mcc: { code: '6540', description: 'POI Funding Transactions' },
    };

    const result = formSchema.safeParse(formData);
    expect(result.success).toBe(true);
  });

  it('should reject zero amounts for MCC 6540', () => {
    const formData = {
      merchantName: 'Test Merchant',
      isOnline: false,
      isContactless: false,
      amount: '0.00',
      currency: 'CAD',
      paymentMethodId: 'test-payment-method',
      date: new Date(),
      mcc: { code: '6540', description: 'POI Funding Transactions' },
    };

    const result = formSchema.safeParse(formData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('cannot be zero');
    }
  });

  it('should reject negative amounts for non-6540 MCC codes', () => {
    const formData = {
      merchantName: 'Test Merchant',
      isOnline: false,
      isContactless: false,
      amount: '-50.00',
      currency: 'CAD',
      paymentMethodId: 'test-payment-method',
      date: new Date(),
      mcc: { code: '5411', description: 'Grocery Stores' },
    };

    const result = formSchema.safeParse(formData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('must be positive');
    }
  });

  it('should allow positive amounts for non-6540 MCC codes', () => {
    const formData = {
      merchantName: 'Test Merchant',
      isOnline: false,
      isContactless: false,
      amount: '50.00',
      currency: 'CAD',
      paymentMethodId: 'test-payment-method',
      date: new Date(),
      mcc: { code: '5411', description: 'Grocery Stores' },
    };

    const result = formSchema.safeParse(formData);
    expect(result.success).toBe(true);
  });

  it('should reject negative amounts when no MCC is selected', () => {
    const formData = {
      merchantName: 'Test Merchant',
      isOnline: false,
      isContactless: false,
      amount: '-50.00',
      currency: 'CAD',
      paymentMethodId: 'test-payment-method',
      date: new Date(),
      mcc: null,
    };

    const result = formSchema.safeParse(formData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('must be positive');
    }
  });
});

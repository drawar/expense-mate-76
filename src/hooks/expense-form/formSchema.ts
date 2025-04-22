import { z } from 'zod';
import { MerchantCategoryCode } from '@/types';

// Form schema definition
export const formSchema = z.object({
  merchantName: z.string().min(1, 'Merchant name is required'),
  merchantAddress: z.string().optional(),
  isOnline: z.boolean().default(false),
  isContactless: z.boolean().default(false),
  amount: z.string().min(1, 'Amount is required').refine(value => !isNaN(Number(value)) && Number(value) > 0, {
    message: 'Amount must be a positive number',
  }),
  currency: z.string().min(1, 'Currency is required'),
  paymentMethodId: z.string().min(1, 'Payment method is required'),
  paymentAmount: z.string().refine(value => !isNaN(Number(value)) && Number(value) >= 0, {
    message: 'Payment amount must be a non-negative number',
  }).optional(),
  reimbursementAmount: z.string().refine(value => value === '' || (!isNaN(Number(value)) && Number(value) >= 0), {
    message: 'Reimbursement amount must be a non-negative number',
  }).default('0'),
  category: z.string().optional(),
  date: z.date({
    required_error: 'Date is required',
  }),
  notes: z.string().optional(),
  mcc: z.any().optional(),
});

export type FormValues = z.infer<typeof formSchema>;

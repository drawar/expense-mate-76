
import { z } from 'zod';
import { MerchantCategoryCode, Currency } from '@/types';

export const formSchema = z.object({
  merchantName: z.string().min(1, "Merchant name is required"),
  merchantAddress: z.string().optional(),
  isOnline: z.boolean().default(false),
  isContactless: z.boolean().default(false),
  amount: z.string().min(1, "Amount is required"),
  currency: z.string().min(1, "Currency is required"),
  paymentMethodId: z.string().min(1, "Payment method is required"),
  paymentAmount: z.string().optional(),
  date: z.date(),
  notes: z.string().optional(),
  mcc: z.custom<MerchantCategoryCode | null>().optional(),
});

export type FormValues = z.infer<typeof formSchema>;

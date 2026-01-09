import { z } from "zod";
import { MerchantCategoryCode, Currency } from "@/types";

export const formSchema = z
  .object({
    merchantName: z.string().min(1, "Merchant name is required"),
    merchantAddress: z.string().optional(),
    isOnline: z.boolean().default(false),
    isContactless: z.boolean().default(false),
    amount: z.coerce.number(), // Allows negative for refunds
    currency: z.string().min(1, "Currency is required"),
    paymentMethodId: z.string().min(1, "Payment method is required"),
    paymentAmount: z.string().optional(),
    eurFareAmount: z.string().optional(), // For Brim AF/KLM special case: EUR fare amount for bonus calculation
    date: z.date(),
    time: z.string().optional(), // Optional time in HH:mm format; if not set, current time is used on submission
    notes: z.string().optional(),
    mcc: z.custom<MerchantCategoryCode | null>().optional(),
    rewardPoints: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val || val.trim() === "") return true; // Empty is valid (will be treated as 0)
          const num = Number(val);
          return !isNaN(num); // Allow negative for refunds
        },
        { message: "Please enter a valid number" }
      )
      .refine(
        (val) => {
          if (!val || val.trim() === "") return true;
          const num = Number(val);
          if (isNaN(num)) return true; // Let the first refine handle this
          // Check for up to 2 decimal places
          const decimalPart = val.replace("-", "").split(".")[1];
          return !decimalPart || decimalPart.length <= 2;
        },
        { message: "Please enter a number with up to 2 decimal places" }
      ),
    promoBonusPoints: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val || val.trim() === "") return true; // Empty is valid (will be treated as 0)
          const num = Number(val);
          return !isNaN(num) && num >= 0;
        },
        { message: "Please enter a valid non-negative number" }
      ),
    basePoints: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val || val.trim() === "") return true;
          const num = Number(val);
          return !isNaN(num); // Allow negative for refunds
        },
        { message: "Please enter a valid number" }
      ),
    bonusPoints: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val || val.trim() === "") return true;
          const num = Number(val);
          return !isNaN(num); // Allow negative for refunds
        },
        { message: "Please enter a valid number" }
      ),
    reimbursementAmount: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val || val.trim() === "") return true;
          const num = Number(val);
          return !isNaN(num) && num >= 0;
        },
        { message: "Please enter a valid non-negative number" }
      ),
  })
  .superRefine((data, ctx) => {
    // Validate amount field - allow negative for refunds, but not zero
    const amount = data.amount;

    if (amount === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Amount cannot be zero",
        path: ["amount"],
      });
    }
  });

export type FormValues = z.infer<typeof formSchema>;

import { Currency } from "@/types";

export type IncomeFrequency = "biweekly" | "monthly";

export interface RecurringIncome {
  id: string;
  name: string; // e.g., "Primary Salary", "Side Gig"
  amount: number;
  currency: Currency;
  frequency: IncomeFrequency;
  dayOfMonth?: number; // For monthly: 1-31, day of payment
  startDate?: string; // ISO date when income started (optional)
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Database row type (snake_case for Supabase)
export interface DbRecurringIncome {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  currency: string;
  frequency: string;
  day_of_month: number | null;
  start_date: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

import {
  ShoppingCartIcon,
  UtensilsIcon,
  ShoppingBagIcon,
  PlaneIcon,
  FilmIcon,
  HeartPulseIcon,
  ZapIcon,
  WrenchIcon,
  CarIcon,
  GraduationCapIcon,
  HomeIcon,
  LandmarkIcon,
  BuildingIcon,
  CircleHelpIcon,
  LucideIcon,
} from "lucide-react";

/**
 * Budget categories for user-defined transaction categorization.
 * These are the categories users can assign to transactions for spending analysis.
 */
export const BUDGET_CATEGORIES = [
  "Groceries",
  "Food & Drinks",
  "Shopping",
  "Travel",
  "Entertainment",
  "Health & Personal Care",
  "Utilities",
  "Services",
  "Automotive",
  "Education",
  "Home & Rent",
  "Financial Services",
  "Government",
  "Uncategorized",
] as const;

export type BudgetCategory = (typeof BUDGET_CATEGORIES)[number];

/**
 * Icon mapping for each budget category
 */
export const CATEGORY_ICONS: Record<BudgetCategory, LucideIcon> = {
  Groceries: ShoppingCartIcon,
  "Food & Drinks": UtensilsIcon,
  Shopping: ShoppingBagIcon,
  Travel: PlaneIcon,
  Entertainment: FilmIcon,
  "Health & Personal Care": HeartPulseIcon,
  Utilities: ZapIcon,
  Services: WrenchIcon,
  Automotive: CarIcon,
  Education: GraduationCapIcon,
  "Home & Rent": HomeIcon,
  "Financial Services": LandmarkIcon,
  Government: BuildingIcon,
  Uncategorized: CircleHelpIcon,
};

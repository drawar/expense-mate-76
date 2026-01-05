/**
 * Icon Constants - Phosphor Icons from react-icons/pi
 *
 * This file provides icon mappings for categories, badges, and UI elements.
 * All icons are from the Phosphor Icons library via react-icons.
 */

import React from "react";
import {
  PiHouse,
  PiSparkle,
  PiBuildings,
  PiUser,
  PiBriefcase,
  PiCoins,
  PiShoppingCart,
  PiLightbulb,
  PiCar,
  PiPill,
  PiForkKnife,
  PiPizza,
  PiFilmSlate,
  PiPersonSimpleRun,
  PiAirplaneTilt,
  PiBroom,
  PiArmchair,
  PiHammer,
  PiPawPrint,
  PiTShirt,
  PiFlowerLotus,
  PiBarbell,
  PiBooks,
  PiGraduationCap,
  PiDeviceMobile,
  PiBank,
  PiShieldCheck,
  PiGift,
  PiMoney,
  PiWarning,
  PiQuestion,
  PiPackage,
  PiMedal,
  PiTrophy,
  PiDiamond,
  PiFire,
  PiCreditCard,
  PiMotorcycle,
} from "react-icons/pi";
import type { IconType } from "react-icons";

// =============================================================================
// Category Icon Mapping
// =============================================================================

export type CategoryIconName =
  // Parent Categories
  | "essentials"
  | "lifestyle"
  | "home_living"
  | "personal_care"
  | "work_education"
  | "financial_other"
  // Subcategories
  | "groceries"
  | "housing"
  | "utilities"
  | "transportation"
  | "healthcare"
  | "dining_out"
  | "fast_food"
  | "food_delivery"
  | "entertainment"
  | "hobbies"
  | "travel"
  | "home_essentials"
  | "furniture"
  | "home_improvement"
  | "pet_care"
  | "clothing"
  | "beauty"
  | "fitness"
  | "professional_dev"
  | "work_expenses"
  | "education"
  | "subscriptions"
  | "financial_services"
  | "insurance"
  | "gifts"
  | "cash_atm"
  | "fees"
  | "uncategorized"
  | "default";

export const CATEGORY_ICONS: Record<CategoryIconName, IconType> = {
  // Parent Categories
  essentials: PiHouse,
  lifestyle: PiSparkle,
  home_living: PiBuildings,
  personal_care: PiUser,
  work_education: PiBriefcase,
  financial_other: PiCoins,

  // Subcategories - Essentials
  groceries: PiShoppingCart,
  housing: PiBuildings,
  utilities: PiLightbulb,
  transportation: PiCar,
  healthcare: PiPill,

  // Subcategories - Lifestyle
  dining_out: PiForkKnife,
  fast_food: PiPizza,
  food_delivery: PiMotorcycle,
  entertainment: PiFilmSlate,
  hobbies: PiPersonSimpleRun,
  travel: PiAirplaneTilt,

  // Subcategories - Home & Living
  home_essentials: PiBroom,
  furniture: PiArmchair,
  home_improvement: PiHammer,
  pet_care: PiPawPrint,

  // Subcategories - Personal Care
  clothing: PiTShirt,
  beauty: PiFlowerLotus,
  fitness: PiBarbell,

  // Subcategories - Work & Education
  professional_dev: PiBooks,
  work_expenses: PiBriefcase,
  education: PiGraduationCap,

  // Subcategories - Financial & Other
  subscriptions: PiDeviceMobile,
  financial_services: PiBank,
  insurance: PiShieldCheck,
  gifts: PiGift,
  cash_atm: PiMoney,
  fees: PiWarning,
  uncategorized: PiQuestion,

  // Default fallback
  default: PiPackage,
};

// =============================================================================
// Badge Icon Mapping
// =============================================================================

export type BadgeTier = "bronze" | "silver" | "gold" | "diamond";

export const BADGE_ICONS: Record<BadgeTier, IconType> = {
  bronze: PiMedal,
  silver: PiMedal,
  gold: PiTrophy,
  diamond: PiDiamond,
};

// =============================================================================
// UI Icon Mapping
// =============================================================================

export const UI_ICONS = {
  creditCard: PiCreditCard,
  money: PiCoins,
  fire: PiFire,
} as const;

// =============================================================================
// Icon Component Helper
// =============================================================================

interface CategoryIconProps {
  iconName: CategoryIconName;
  className?: string;
  size?: number | string;
  color?: string;
}

/**
 * Renders a category icon by name
 */
export const CategoryIcon: React.FC<CategoryIconProps> = ({
  iconName,
  className,
  size = 20,
  color,
}) => {
  const IconComponent = CATEGORY_ICONS[iconName] || CATEGORY_ICONS.default;
  return <IconComponent className={className} size={size} color={color} />;
};

interface BadgeIconProps {
  tier: BadgeTier;
  className?: string;
  size?: number | string;
  color?: string;
}

/**
 * Renders a badge icon by tier
 */
export const BadgeIcon: React.FC<BadgeIconProps> = ({
  tier,
  className,
  size = 20,
  color,
}) => {
  const IconComponent = BADGE_ICONS[tier];
  return <IconComponent className={className} size={size} color={color} />;
};

// =============================================================================
// Get Icon Function (for non-React contexts)
// =============================================================================

/**
 * Get the icon component for a category ID
 */
export function getCategoryIcon(categoryId: string): IconType {
  return (
    CATEGORY_ICONS[categoryId as CategoryIconName] || CATEGORY_ICONS.default
  );
}

/**
 * Get the icon component for a badge tier
 */
export function getBadgeIcon(tier: BadgeTier): IconType {
  return BADGE_ICONS[tier];
}

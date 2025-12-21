import React from "react";
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ChevronDirection = "up" | "down" | "left" | "right";
type ChevronSize = "small" | "medium" | "large";

interface ChevronProps {
  direction?: ChevronDirection;
  size?: ChevronSize;
  className?: string;
  style?: React.CSSProperties;
}

const sizeMap: Record<ChevronSize, number> = {
  small: 16,
  medium: 20,
  large: 24,
};

const iconMap = {
  up: ChevronUp,
  down: ChevronDown,
  left: ChevronLeft,
  right: ChevronRight,
};

/**
 * Standardized Chevron component for consistent styling across the app.
 *
 * Design tokens:
 * - Color: var(--color-icon-secondary) - #A8A5A0 (light) / #5C5854 (dark)
 * - Opacity: 1 (no transparency variation)
 * - Sizes: small (16px), medium (20px), large (24px)
 *
 * Usage:
 * - Navigation chevrons: size="medium", direction="right"
 * - Expandable sections: size="medium", direction="up"/"down"
 * - Carousel navigation: size="large", direction="left"/"right"
 * - Dropdowns/selects: size="small", direction="down"
 */
export const Chevron: React.FC<ChevronProps> = ({
  direction = "right",
  size = "medium",
  className,
  style,
}) => {
  const IconComponent = iconMap[direction];
  const iconSize = sizeMap[size];

  return (
    <IconComponent
      size={iconSize}
      className={cn("flex-shrink-0", className)}
      style={{
        color: "var(--color-icon-secondary)",
        opacity: 1,
        strokeWidth: 2,
        ...style,
      }}
    />
  );
};

export default Chevron;

// components/common/FAB.tsx
import React from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface FABProps {
  to?: string;
  onClick?: () => void;
  className?: string;
  icon?: React.ReactNode;
  label?: string;
}

/**
 * Floating Action Button for primary actions
 * Positioned at bottom-right with proper safe area spacing
 */
const FAB: React.FC<FABProps> = ({
  to,
  onClick,
  className,
  icon = <Plus className="h-6 w-6" />,
  label = "Add",
}) => {
  const buttonClasses = cn(
    // Base styles
    "fixed bottom-6 right-6 z-50",
    // Size and shape - 56px is standard FAB size, meets 44px minimum
    "h-14 w-14 rounded-full",
    // Colors
    "bg-primary text-primary-foreground",
    // Shadow for elevation
    "shadow-lg shadow-primary/25",
    // Hover and active states
    "hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30",
    "active:scale-95",
    // Transitions
    "transition-all duration-200",
    // Flexbox for centering icon
    "flex items-center justify-center",
    // Safe area for mobile
    "mb-safe",
    className
  );

  const content = (
    <>
      {icon}
      <span className="sr-only">{label}</span>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={buttonClasses} aria-label={label}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={buttonClasses}
      aria-label={label}
    >
      {content}
    </button>
  );
};

export default React.memo(FAB);

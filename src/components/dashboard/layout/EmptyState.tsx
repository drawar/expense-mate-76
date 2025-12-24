import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PlusCircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: "default" | "outline" | "secondary";
}

export interface EmptyStateProps {
  /** Title text */
  title?: string;
  /** Description text */
  description?: string;
  /** Icon to display (centered above title) */
  icon?: React.ReactNode;
  /** Primary action button */
  action?: EmptyStateAction;
  /** Secondary action (e.g., reset filters) */
  secondaryAction?: EmptyStateAction;
  /** Visual variant */
  variant?: "default" | "dashed" | "card";
  /** Size variant affecting padding and text sizes */
  size?: "sm" | "md" | "lg";
  /** Additional className */
  className?: string;
  /** Hide the default action button */
  hideAction?: boolean;
}

/**
 * A versatile empty state component for displaying when there's no data.
 *
 * Use this component across the app for consistent empty state displays.
 *
 * @example
 * // Basic usage (default variant)
 * <EmptyState
 *   title="No transactions"
 *   description="Add your first transaction to get started."
 * />
 *
 * @example
 * // Dashed border variant (for prompts to add content)
 * <EmptyState
 *   variant="dashed"
 *   title="No Payment Methods"
 *   description="Add credit cards to track expenses."
 *   icon={<CreditCardIcon className="h-12 w-12" />}
 *   action={{ label: "Add Payment Method", onClick: handleAdd }}
 * />
 *
 * @example
 * // Card variant (glass morphism)
 * <EmptyState
 *   variant="card"
 *   title="No results"
 *   description="No transactions match your filters."
 *   secondaryAction={{ label: "Reset Filters", onClick: onReset, variant: "outline" }}
 *   hideAction
 * />
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No data available",
  description = "Add transactions to see insights and visualizations.",
  icon,
  action,
  secondaryAction,
  variant = "default",
  size = "md",
  className = "",
  hideAction = false,
}) => {
  const navigate = useNavigate();

  // Default action to add expense
  const defaultAction: EmptyStateAction = {
    label: "Add Transaction",
    onClick: () => navigate("/add-expense"),
  };

  const finalAction = action || defaultAction;

  // Size-based styles
  const sizeStyles = {
    sm: {
      padding: "p-4",
      iconWrapper: "p-3 mb-3",
      iconSize: "h-8 w-8",
      title: "text-base",
      description: "text-sm mb-4",
    },
    md: {
      padding: "p-6",
      iconWrapper: "p-4 mb-4",
      iconSize: "h-10 w-10",
      title: "text-lg",
      description: "text-sm mb-6",
    },
    lg: {
      padding: "py-16 px-6",
      iconWrapper: "p-5 mb-5",
      iconSize: "h-12 w-12",
      title: "text-lg",
      description: "text-sm mb-8 max-w-sm",
    },
  };

  // Variant-based container styles
  const variantStyles = {
    default: "",
    dashed: "border-2 border-dashed rounded-xl",
    card: "glass-card rounded-xl",
  };

  const variantContainerStyle =
    variant === "dashed"
      ? {
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-surface)",
        }
      : {};

  const currentSize = sizeStyles[size];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        currentSize.padding,
        variantStyles[variant],
        className
      )}
      style={variantContainerStyle}
    >
      {/* Icon */}
      {icon && (
        <div
          className={cn("rounded-full", currentSize.iconWrapper)}
          style={{
            backgroundColor: "var(--color-accent-subtle)",
          }}
        >
          {React.isValidElement(icon) &&
            React.cloneElement(icon as React.ReactElement, {
              className: cn(
                currentSize.iconSize,
                (icon as React.ReactElement).props?.className
              ),
              style: {
                color: "var(--color-accent)",
                opacity: 0.7,
                strokeWidth: 1.5,
                ...(icon as React.ReactElement).props?.style,
              },
            })}
        </div>
      )}

      {/* Title */}
      <h3
        className={cn("font-medium mb-2", currentSize.title)}
        style={{
          color: "var(--color-text-primary)",
          letterSpacing: "-0.2px",
        }}
      >
        {title}
      </h3>

      {/* Description */}
      <p
        className={cn("text-center", currentSize.description)}
        style={{
          color: "var(--color-text-secondary)",
          lineHeight: 1.5,
        }}
      >
        {description}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Secondary action (e.g., reset filters) */}
        {secondaryAction && (
          <Button
            variant={secondaryAction.variant || "outline"}
            onClick={secondaryAction.onClick}
          >
            {secondaryAction.label}
          </Button>
        )}

        {/* Primary action */}
        {!hideAction && (
          <Button
            onClick={finalAction.onClick}
            variant={finalAction.variant || "default"}
            className="gap-2"
          >
            <PlusCircleIcon className="h-4 w-4" />
            {finalAction.label}
          </Button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;

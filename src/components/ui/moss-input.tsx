import * as React from "react";
import { cn } from "@/lib/utils";

interface MossInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export const MossInput = React.forwardRef<HTMLInputElement, MossInputProps>(
  ({ className, disabled, ...props }, ref) => {
    return (
      <input
        ref={ref}
        disabled={disabled}
        className={cn("moss-input h-10", className)}
        style={{
          backgroundColor: "var(--color-surface)",
          borderRadius: "var(--radius-input)",
          paddingLeft: "var(--space-md)",
          paddingRight: "var(--space-md)",
          fontSize: "var(--font-size-body)",
          color: disabled
            ? "var(--color-text-disabled)"
            : "var(--color-text-primary)",
          border: "1px solid var(--color-border-subtle)",
          width: "100%",
          cursor: disabled ? "not-allowed" : "text",
        }}
        {...props}
      />
    );
  }
);

MossInput.displayName = "MossInput";

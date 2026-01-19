import * as React from "react";
import { cn } from "@/lib/utils";

interface MossInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export const MossInput = React.forwardRef<HTMLInputElement, MossInputProps>(
  ({ className, disabled, type, onWheel, ...props }, ref) => {
    // Prevent scroll wheel from changing number input values
    const handleWheel = React.useCallback(
      (e: React.WheelEvent<HTMLInputElement>) => {
        if (type === "number") {
          // Blur the input to prevent scroll from changing value
          e.currentTarget.blur();
        }
        // Call any provided onWheel handler
        onWheel?.(e);
      },
      [type, onWheel]
    );

    return (
      <input
        ref={ref}
        type={type}
        disabled={disabled}
        onWheel={handleWheel}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 text-base md:text-sm",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:border-[var(--color-accent)] focus-visible:shadow-[0_0_0_2px_var(--color-accent-subtle)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-[border-color,box-shadow] duration-150",
          className
        )}
        {...props}
      />
    );
  }
);

MossInput.displayName = "MossInput";

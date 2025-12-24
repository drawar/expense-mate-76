import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface LoadingButtonProps extends ButtonProps {
  /** Whether the button is in a loading state */
  isLoading?: boolean;
  /** Text to display when loading (defaults to children) */
  loadingText?: string;
  /** Position of the loading spinner (default: "left") */
  spinnerPosition?: "left" | "right";
}

/**
 * A button component with built-in loading state support.
 *
 * Automatically shows a spinner and disables the button when loading.
 * Useful for form submissions and async actions.
 *
 * @example
 * // Basic usage
 * <LoadingButton isLoading={isSubmitting} onClick={handleSubmit}>
 *   Submit
 * </LoadingButton>
 *
 * @example
 * // With custom loading text
 * <LoadingButton
 *   isLoading={isSaving}
 *   loadingText="Saving..."
 *   onClick={handleSave}
 * >
 *   Save Changes
 * </LoadingButton>
 *
 * @example
 * // With spinner on the right
 * <LoadingButton
 *   isLoading={isProcessing}
 *   spinnerPosition="right"
 * >
 *   Process
 * </LoadingButton>
 */
const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  (
    {
      isLoading = false,
      loadingText,
      spinnerPosition = "left",
      children,
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    const content = isLoading ? (loadingText ?? children) : children;

    const spinner = (
      <Loader2
        className={cn(
          "h-4 w-4 animate-spin",
          spinnerPosition === "left" ? "mr-2" : "ml-2"
        )}
      />
    );

    return (
      <Button
        ref={ref}
        disabled={disabled || isLoading}
        className={className}
        {...props}
      >
        {isLoading && spinnerPosition === "left" && spinner}
        {content}
        {isLoading && spinnerPosition === "right" && spinner}
      </Button>
    );
  }
);
LoadingButton.displayName = "LoadingButton";

export { LoadingButton };

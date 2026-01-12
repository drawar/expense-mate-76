import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowLeft, X } from "lucide-react";

import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  hideCloseButton?: boolean;
  hideOverlay?: boolean;
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(
  (
    { className, children, hideCloseButton, hideOverlay, onKeyDown, ...props },
    ref
  ) => {
    // Allow native keyboard shortcuts (Ctrl+A, Cmd+A, etc.) in form inputs
    const handleKeyDown = (e: React.KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isFormInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // Allow Ctrl/Cmd+A (select all) in form inputs
      if (isFormInput && (e.ctrlKey || e.metaKey) && e.key === "a") {
        e.stopPropagation();
      }

      onKeyDown?.(e);
    };

    // Allow wheel scrolling within scrollable areas
    const handleWheel = (e: React.WheelEvent) => {
      const target = e.target as HTMLElement;
      const scrollableParent =
        target.closest('[data-scrollable="true"]') ||
        target.closest(".overflow-y-auto") ||
        target.closest(".overflow-auto");

      if (scrollableParent) {
        e.stopPropagation();
      }
    };

    // Allow touch scrolling within scrollable areas
    const handleTouchMove = (e: React.TouchEvent) => {
      const target = e.target as HTMLElement;
      const scrollableParent =
        target.closest('[data-scrollable="true"]') ||
        target.closest(".overflow-y-auto") ||
        target.closest(".overflow-auto");

      if (scrollableParent) {
        // Allow the touch event to propagate for scrolling
        e.stopPropagation();
      }
    };

    return (
      <DialogPortal>
        {!hideOverlay && <DialogOverlay />}
        <DialogPrimitive.Content
          ref={ref}
          className={cn(
            "fixed left-[50%] top-[50%] z-50 grid w-[calc(100%-2rem)] max-w-lg translate-x-[-50%] translate-y-[-50%] gap-5 border bg-background px-5 pt-4 pb-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-lg touch-pan-y",
            className
          )}
          style={{ WebkitOverflowScrolling: "touch" }}
          onKeyDown={handleKeyDown}
          onWheel={handleWheel}
          onTouchMove={handleTouchMove}
          {...props}
        >
          {children}
          {!hideCloseButton && (
            <DialogPrimitive.Close className="absolute right-4 top-4 h-11 w-11 flex items-center justify-center rounded-lg ring-offset-background transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
              <X
                className="h-6 w-6"
                style={{ color: "var(--color-text-tertiary)" }}
              />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          )}
        </DialogPrimitive.Content>
      </DialogPortal>
    );
  }
);
DialogContent.displayName = DialogPrimitive.Content.displayName;

interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  showBackButton?: boolean;
  onBack?: () => void;
  showCloseButton?: boolean;
  onClose?: () => void;
}

const DialogHeader = ({
  className,
  showBackButton = false,
  onBack,
  showCloseButton = false,
  onClose,
  children,
  ...props
}: DialogHeaderProps) => (
  <div
    className={cn(
      "relative flex flex-col text-center min-h-[68px] justify-center",
      className
    )}
    {...props}
  >
    {showBackButton && (
      <button
        type="button"
        onClick={onBack}
        className="absolute left-3 top-1/2 -translate-y-1/2 h-11 w-11 flex items-center justify-center rounded-lg ring-offset-background transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <ArrowLeft
          className="h-6 w-6"
          style={{ color: "var(--color-text-tertiary)" }}
        />
        <span className="sr-only">Go back</span>
      </button>
    )}
    {children}
    {showCloseButton && (
      <DialogPrimitive.Close
        onClick={onClose}
        className="absolute right-3 top-1/2 -translate-y-1/2 h-11 w-11 flex items-center justify-center rounded-lg ring-offset-background transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <X
          className="h-6 w-6"
          style={{ color: "var(--color-text-tertiary)" }}
        />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    )}
  </div>
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight px-12",
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm mt-1", className)}
    style={{ color: "var(--color-text-secondary)" }}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};

export type { DialogHeaderProps };

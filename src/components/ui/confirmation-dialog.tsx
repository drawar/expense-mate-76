import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface ConfirmationDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Callback when confirm button is clicked */
  onConfirm: () => void;
  /** Dialog title */
  title: string;
  /** Dialog description/message */
  description: string;
  /** Text for confirm button (default: "Confirm") */
  confirmText?: string;
  /** Text for cancel button (default: "Cancel") */
  cancelText?: string;
  /** Visual variant affecting confirm button style */
  variant?: "default" | "destructive";
  /** Whether the confirm action is in progress */
  isLoading?: boolean;
  /** Custom icon to display in the header (optional) */
  icon?: React.ReactNode;
}

/**
 * A reusable confirmation dialog component.
 *
 * Use this for delete confirmations, destructive actions, or any action
 * that requires user confirmation before proceeding.
 *
 * @example
 * // Destructive action (delete)
 * <ConfirmationDialog
 *   isOpen={isDeleteOpen}
 *   onOpenChange={setIsDeleteOpen}
 *   onConfirm={handleDelete}
 *   title="Delete Transaction"
 *   description="Are you sure you want to delete this transaction? This action cannot be undone."
 *   confirmText="Delete"
 *   variant="destructive"
 * />
 *
 * @example
 * // Standard confirmation with loading state
 * <ConfirmationDialog
 *   isOpen={isConfirmOpen}
 *   onOpenChange={setIsConfirmOpen}
 *   onConfirm={handleConfirm}
 *   title="Confirm Action"
 *   description="Are you sure you want to proceed?"
 *   isLoading={isSubmitting}
 * />
 */
export function ConfirmationDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  isLoading = false,
  icon,
}: ConfirmationDialogProps) {
  const handleConfirm = () => {
    if (!isLoading) {
      onConfirm();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent hideCloseButton>
        <DialogHeader showCloseButton>
          <DialogTitle className="flex items-center gap-2">
            {icon}
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ConfirmationDialog;

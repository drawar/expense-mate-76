import React, { useState, useCallback } from "react";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReceiptScanDialog } from "./ReceiptScanDialog";
import { ScanResult } from "@/hooks/useReceiptScan";
import { Currency } from "@/types";
import { cn } from "@/lib/utils";

interface ReceiptScanButtonProps {
  onScanComplete: (result: ScanResult) => void;
  defaultCurrency?: Currency;
  variant?: "floating" | "inline";
  className?: string;
}

/**
 * ReceiptScanButton - Button that opens the receipt scanner
 *
 * Variants:
 * - floating: Fixed position FAB in bottom right corner
 * - inline: Regular button for placing in forms/headers
 */
export const ReceiptScanButton: React.FC<ReceiptScanButtonProps> = ({
  onScanComplete,
  defaultCurrency = "SGD",
  variant = "floating",
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleScanComplete = useCallback(
    (result: ScanResult) => {
      onScanComplete(result);
    },
    [onScanComplete]
  );

  if (variant === "floating") {
    return (
      <>
        <Button
          onClick={() => setIsOpen(true)}
          size="icon"
          className={cn(
            "fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg z-40",
            "bg-primary hover:bg-primary/90",
            "md:bottom-8 md:right-8",
            className
          )}
          aria-label="Scan receipt"
        >
          <Camera className="h-6 w-6" />
        </Button>

        <ReceiptScanDialog
          open={isOpen}
          onOpenChange={setIsOpen}
          onScanComplete={handleScanComplete}
          defaultCurrency={defaultCurrency}
        />
      </>
    );
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className={className}
      >
        <Camera className="h-4 w-4 mr-2" />
        Scan Receipt
      </Button>

      <ReceiptScanDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        onScanComplete={handleScanComplete}
        defaultCurrency={defaultCurrency}
      />
    </>
  );
};

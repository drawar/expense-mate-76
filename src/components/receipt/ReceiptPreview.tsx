import React from "react";
import {
  Store,
  DollarSign,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  ImageOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Currency } from "@/types";
import { cn } from "@/lib/utils";

interface ExtractedData {
  merchantName?: string;
  amount?: number;
  currency?: Currency;
  date?: string;
  time?: string;
}

interface ReceiptPreviewProps {
  imageUrl?: string;
  extractedData: ExtractedData;
  confidence: number;
  needsReview?: boolean;
  className?: string;
  showImage?: boolean;
}

/**
 * ReceiptPreview - Shows extracted receipt data with optional image preview
 *
 * Displays:
 * - Receipt image thumbnail
 * - Extracted merchant, amount, date
 * - Confidence indicator
 * - Review warning if low confidence
 */
export const ReceiptPreview: React.FC<ReceiptPreviewProps> = ({
  imageUrl,
  extractedData,
  confidence,
  needsReview = false,
  className,
  showImage = true,
}) => {
  const confidencePercent = Math.round(confidence * 100);
  const isHighConfidence = confidence >= 0.7;

  // Format amount with currency
  const formatAmount = (amount?: number, currency?: Currency) => {
    if (amount === undefined) return "Not detected";
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 2,
    });
    return formatter.format(amount);
  };

  // Format date nicely
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Not detected";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Image and data layout */}
      <div className="flex gap-4">
        {/* Receipt image thumbnail */}
        {showImage && (
          <div className="flex-shrink-0 w-24 h-32 rounded-lg overflow-hidden bg-muted border">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Receipt"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageOff
                  className="h-8 w-8"
                  style={{ color: "var(--color-text-tertiary)" }}
                />
              </div>
            )}
          </div>
        )}

        {/* Extracted data */}
        <div className="flex-1 space-y-3">
          {/* Merchant */}
          <DataRow
            icon={Store}
            label="Merchant"
            value={extractedData.merchantName || "Not detected"}
            isDetected={!!extractedData.merchantName}
          />

          {/* Amount */}
          <DataRow
            icon={DollarSign}
            label="Amount"
            value={formatAmount(extractedData.amount, extractedData.currency)}
            isDetected={extractedData.amount !== undefined}
            highlight
          />

          {/* Date */}
          <DataRow
            icon={Calendar}
            label="Date"
            value={formatDate(extractedData.date)}
            isDetected={!!extractedData.date}
          />

          {/* Time (optional) */}
          {extractedData.time && (
            <DataRow
              icon={Clock}
              label="Time"
              value={extractedData.time}
              isDetected
            />
          )}
        </div>
      </div>

      {/* Confidence indicator */}
      <div className="flex items-center justify-between pt-2 border-t">
        <div className="flex items-center gap-2">
          {isHighConfidence ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          )}
          <span
            className="text-sm"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Confidence: {confidencePercent}%
          </span>
        </div>

        {needsReview && (
          <Badge variant="outline" className="text-amber-600 border-amber-300">
            Please verify
          </Badge>
        )}
      </div>

      {/* Low confidence warning */}
      {needsReview && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700 dark:text-amber-400">
            Some details couldn't be clearly read. Please verify the extracted
            information before saving.
          </p>
        </div>
      )}
    </div>
  );
};

// Helper component for data rows
interface DataRowProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  isDetected: boolean;
  highlight?: boolean;
}

const DataRow: React.FC<DataRowProps> = ({
  icon: Icon,
  label,
  value,
  isDetected,
  highlight = false,
}) => (
  <div className="flex items-center gap-2">
    <Icon
      className="h-4 w-4 flex-shrink-0"
      style={{ color: "var(--color-text-tertiary)" }}
    />
    <div className="flex-1 min-w-0">
      <span
        className="text-xs block"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        {label}
      </span>
      <span
        className={cn(
          "text-sm truncate block",
          highlight && isDetected && "font-semibold",
          !isDetected && "italic"
        )}
        style={{
          color: isDetected
            ? "var(--color-text-primary)"
            : "var(--color-text-tertiary)",
        }}
      >
        {value}
      </span>
    </div>
  </div>
);

/**
 * Receipt Scanning Components
 *
 * Provides UI for capturing receipts, showing scan progress,
 * and previewing extracted data.
 *
 * Usage:
 * ```tsx
 * import { ReceiptScanButton } from '@/components/receipt';
 *
 * // Add floating scan button to your page
 * <ReceiptScanButton
 *   onScanComplete={(result) => {
 *     // Pre-fill form with extracted data
 *     form.setValue('merchantName', result.prefill.merchantName);
 *     form.setValue('amount', result.prefill.amount);
 *   }}
 *   defaultCurrency="SGD"
 * />
 * ```
 */

export { ReceiptCapture } from "./ReceiptCapture";
export { ReceiptPreview } from "./ReceiptPreview";
export { ReceiptScanDialog } from "./ReceiptScanDialog";
export { ReceiptScanButton } from "./ReceiptScanButton";

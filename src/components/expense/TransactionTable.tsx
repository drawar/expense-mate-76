import { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Transaction, PaymentMethod } from "@/types";
import { CurrencyService } from "@/core/currency";
import { formatDate } from "@/utils/dates/formatters";
import {
  EditIcon,
  TrashIcon,
  DownloadIcon,
  EyeIcon,
  AlertCircle,
  Pencil,
} from "lucide-react";
import { exportTransactionsToCSV } from "@/core/storage";
import { withResolvedStringPromise } from "@/utils/files/fileUtils";
import { getEffectiveCategory } from "@/utils/categoryMapping";
import {
  getCategoryEmoji,
  getCategoryColor,
} from "@/utils/constants/categories";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

/**
 * Format date for group header (Today, Yesterday, or full date)
 */
function formatDateGroupHeader(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEEE, MMMM d, yyyy");
}

interface TransactionTableProps {
  transactions: Transaction[];
  paymentMethods: PaymentMethod[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  onView: (transaction: Transaction) => void;
  onCategoryEdit?: (transaction: Transaction) => void;
}

const TransactionTable = ({
  transactions,
  paymentMethods,
  onEdit,
  onDelete,
  onView,
  onCategoryEdit,
}: TransactionTableProps) => {
  // Memoize CSV export to prevent recalculation on every render
  const handleExportCSV = useMemo(
    () => async () => {
      const csvPromise = exportTransactionsToCSV(transactions);

      // Use the utility function to handle the string promise safely
      await withResolvedStringPromise(async (csvContent) => {
        // Create a blob and download link
        const url = URL.createObjectURL(
          new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        );
        const link = document.createElement("a");

        link.setAttribute("href", url);
        link.setAttribute(
          "download",
          `transactions_export_${new Date().toISOString().slice(0, 10)}.csv`
        );
        link.style.visibility = "hidden";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url); // Clean up
      }, csvPromise);
    },
    [transactions]
  );

  // Precompute all categories for display - only recalculate when transactions change
  const transactionCategories = useMemo(() => {
    return transactions.reduce(
      (acc, transaction) => {
        acc[transaction.id] = getEffectiveCategory(transaction);
        return acc;
      },
      {} as Record<string, string>
    );
  }, [transactions]);

  // Group transactions by date for better organization
  const groupedTransactions = useMemo(() => {
    const groups: { date: string; transactions: Transaction[] }[] = [];
    let currentDate = "";
    let currentGroup: Transaction[] = [];

    // Transactions are already sorted by date (desc), group them
    transactions.forEach((tx) => {
      const txDate =
        typeof tx.date === "string"
          ? tx.date.split("T")[0]
          : format(tx.date, "yyyy-MM-dd");

      if (txDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, transactions: currentGroup });
        }
        currentDate = txDate;
        currentGroup = [tx];
      } else {
        currentGroup.push(tx);
      }
    });

    // Don't forget the last group
    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, transactions: currentGroup });
    }

    return groups;
  }, [transactions]);

  return (
    <div className="w-full">
      <div className="flex justify-end mb-4">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
          onClick={handleExportCSV}
        >
          <DownloadIcon className="h-4 w-4" style={{ strokeWidth: 2.5 }} />
          Export CSV
        </Button>
      </div>

      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Time</TableHead>
              <TableHead>Merchant</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead>Points</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No transactions found.
                </TableCell>
              </TableRow>
            ) : (
              groupedTransactions.map((group) => (
                <>
                  {/* Date Header Row */}
                  <TableRow
                    key={`date-${group.date}`}
                    className="bg-muted/50 hover:bg-muted/50"
                  >
                    <TableCell
                      colSpan={7}
                      className="py-2 font-semibold text-sm text-muted-foreground"
                    >
                      {formatDateGroupHeader(group.date)}
                    </TableCell>
                  </TableRow>
                  {/* Transaction Rows for this date */}
                  {group.transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="text-muted-foreground text-sm">
                        {(() => {
                          const dateStr =
                            typeof transaction.date === "string"
                              ? transaction.date
                              : transaction.date.toISOString();
                          // Only show time if the date string contains time info (has T and isn't just YYYY-MM-DD)
                          const hasTime =
                            dateStr.includes("T") && dateStr.length > 10;
                          if (!hasTime) return "—";
                          return format(parseISO(dateStr), "h:mm a");
                        })()}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {transaction.merchant.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {transaction.merchant.isOnline
                            ? "Online"
                            : "In-store"}
                          {transaction.isContactless &&
                            !transaction.merchant.isOnline &&
                            " • Contactless"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <button
                            className={cn(
                              "flex items-center gap-1.5 px-2 py-1 rounded-md text-sm",
                              "hover:bg-muted/50 transition-colors cursor-pointer",
                              "border border-transparent hover:border-muted-foreground/20",
                              onCategoryEdit
                                ? "cursor-pointer"
                                : "cursor-default"
                            )}
                            onClick={() => onCategoryEdit?.(transaction)}
                            disabled={!onCategoryEdit}
                          >
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor: getCategoryColor(
                                  transactionCategories[transaction.id]
                                ),
                              }}
                            />
                            <span>
                              {getCategoryEmoji(
                                transactionCategories[transaction.id]
                              )}
                            </span>
                            <span className="truncate max-w-[100px]">
                              {transactionCategories[transaction.id]}
                            </span>
                            {onCategoryEdit && (
                              <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                            )}
                          </button>
                          {transaction.needsReview && (
                            <Badge
                              variant="outline"
                              className="text-amber-600 border-amber-300 bg-amber-50 text-xs px-1.5 py-0"
                            >
                              <AlertCircle className="h-3 w-3 mr-0.5" />
                              Review
                            </Badge>
                          )}
                          {transaction.isRecategorized && (
                            <Badge
                              variant="outline"
                              className="text-blue-600 border-blue-300 bg-blue-50 text-xs px-1.5 py-0"
                            >
                              Edited
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          {CurrencyService.format(
                            transaction.amount,
                            transaction.currency
                          )}
                        </div>
                        {transaction.currency !==
                          transaction.paymentCurrency && (
                          <div className="text-xs text-muted-foreground">
                            {CurrencyService.format(
                              transaction.paymentAmount,
                              transaction.paymentCurrency
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {transaction.paymentMethod.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {transaction.paymentMethod.issuer}
                        </div>
                      </TableCell>
                      <TableCell>
                        {transaction.rewardPoints > 0 ? (
                          <div className="font-medium">
                            {transaction.rewardPoints.toLocaleString()}
                          </div>
                        ) : transaction.paymentMethod.type === "credit_card" ? (
                          <div className="text-amber-600 font-medium">
                            {Math.round(
                              transaction.amount * 0.4
                            ).toLocaleString()}
                            *
                          </div>
                        ) : (
                          <div className="text-muted-foreground">-</div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onView(transaction)}
                          >
                            <EyeIcon
                              className="h-4 w-4"
                              style={{
                                color: "var(--color-icon-secondary)",
                                strokeWidth: 2.5,
                              }}
                            />
                            <span className="sr-only">View</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(transaction)}
                          >
                            <EditIcon
                              className="h-4 w-4"
                              style={{
                                color: "var(--color-icon-secondary)",
                                strokeWidth: 2.5,
                              }}
                            />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(transaction)}
                          >
                            <TrashIcon
                              className="h-4 w-4"
                              style={{
                                color: "var(--color-icon-secondary)",
                                strokeWidth: 2.5,
                              }}
                            />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TransactionTable;

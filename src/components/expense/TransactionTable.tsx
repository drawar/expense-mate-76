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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Transaction, PaymentMethod } from "@/types";
import { CurrencyService } from "@/core/currency";
import {
  DownloadIcon,
  EyeIcon,
  AlertCircle,
  Pencil,
  MoreHorizontal,
  Trash2,
  Globe,
  Wifi,
} from "lucide-react";
import { exportTransactionsToCSV } from "@/core/storage";
import { withResolvedStringPromise } from "@/utils/files/fileUtils";
import { getEffectiveCategory } from "@/utils/categoryMapping";
import {
  getCategoryIcon,
  getCategoryColor,
} from "@/utils/constants/categories";
import { CategoryIcon, type CategoryIconName } from "@/utils/constants/icons";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PaymentMethodIcon } from "@/components/ui/payment-method-select-item";
import { formatCardShortName } from "@/utils/cardNetworkUtils";

/**
 * Get a YYYY-MM-DD key from a Date using LOCAL timezone (not UTC)
 * This fixes timezone issues where transactions appear on wrong days
 */
function getLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Format date for group header (Today, Yesterday, or full date)
 * Uses the actual Date object to ensure correct timezone handling
 */
function formatDateGroupHeader(date: Date): string {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEE, MMM d, yyyy");
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
    const groups: {
      date: string;
      dateObj: Date;
      transactions: Transaction[];
    }[] = [];
    let currentDate = "";
    let currentDateObj: Date | null = null;
    let currentGroup: Transaction[] = [];

    // Transactions are already sorted by date (desc), group them
    transactions.forEach((tx) => {
      // Parse the transaction date and get local date key
      const txDateObj = parseISO(tx.date);
      const txDate = getLocalDateKey(txDateObj);

      if (txDate !== currentDate) {
        if (currentGroup.length > 0 && currentDateObj) {
          groups.push({
            date: currentDate,
            dateObj: currentDateObj,
            transactions: currentGroup,
          });
        }
        currentDate = txDate;
        currentDateObj = txDateObj;
        currentGroup = [tx];
      } else {
        currentGroup.push(tx);
      }
    });

    // Don't forget the last group
    if (currentGroup.length > 0 && currentDateObj) {
      groups.push({
        date: currentDate,
        dateObj: currentDateObj,
        transactions: currentGroup,
      });
    }

    return groups;
  }, [transactions]);

  return (
    <div className="w-full">
      <div className="flex justify-end mb-3">
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
              <TableHead>Merchant</TableHead>
              <TableHead className="w-[120px]">Amount</TableHead>
              <TableHead className="w-[180px]">Payment</TableHead>
              <TableHead className="w-[50px] text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No transactions found.
                </TableCell>
              </TableRow>
            ) : (
              groupedTransactions.flatMap((group) => [
                // Date Header Row
                <TableRow
                  key={`date-${group.date}`}
                  className="bg-muted/50 hover:bg-muted/50"
                >
                  <TableCell
                    colSpan={4}
                    className="py-1.5 font-medium text-xs text-muted-foreground"
                  >
                    {formatDateGroupHeader(group.dateObj)}
                  </TableCell>
                </TableRow>,
                // Transaction Rows for this date
                ...group.transactions.map((transaction) => {
                  const category = transactionCategories[transaction.id];
                  const categoryColor = getCategoryColor(category);

                  return (
                    <TableRow
                      key={transaction.id}
                      className="group cursor-pointer"
                      onClick={() => onView(transaction)}
                    >
                      {/* Merchant + Category Column */}
                      <TableCell>
                        <div className="flex items-start gap-2">
                          {/* Category color indicator */}
                          <div
                            className="w-1 h-8 rounded-full flex-shrink-0 mt-0.5"
                            style={{ backgroundColor: categoryColor }}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium truncate">
                                {transaction.merchant.name}
                              </span>
                              {/* Online/Contactless indicators */}
                              {transaction.merchant.isOnline ? (
                                <Globe
                                  className="h-3 w-3 text-muted-foreground flex-shrink-0"
                                  title="Online"
                                />
                              ) : (
                                transaction.isContactless && (
                                  <Wifi
                                    className="h-3 w-3 text-muted-foreground flex-shrink-0"
                                    title="Contactless"
                                  />
                                )
                              )}
                            </div>
                            {/* Category with badges */}
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      className={cn(
                                        "flex items-center gap-1 hover:underline",
                                        onCategoryEdit
                                          ? "cursor-pointer"
                                          : "cursor-default"
                                      )}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onCategoryEdit?.(transaction);
                                      }}
                                      disabled={!onCategoryEdit}
                                    >
                                      <CategoryIcon
                                        iconName={
                                          getCategoryIcon(
                                            category
                                          ) as CategoryIconName
                                        }
                                        size={14}
                                        className="flex-shrink-0"
                                      />
                                      <span className="truncate max-w-[150px]">
                                        {category}
                                      </span>
                                      {onCategoryEdit && (
                                        <Pencil className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 flex-shrink-0" />
                                      )}
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{category}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              {transaction.needsReview && (
                                <Badge
                                  variant="outline"
                                  className="text-amber-600 border-amber-300 bg-amber-50 text-[10px] px-1 py-0 h-4"
                                >
                                  <AlertCircle className="h-2.5 w-2.5 mr-0.5" />
                                  Review
                                </Badge>
                              )}
                              {transaction.isRecategorized && (
                                <Badge
                                  variant="outline"
                                  className="text-blue-600 border-blue-300 bg-blue-50 text-[10px] px-1 py-0 h-4"
                                >
                                  Edited
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Amount + Points Column */}
                      <TableCell>
                        <div>
                          <div className="font-medium">
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
                          {/* Points - only show if non-zero */}
                          {transaction.rewardPoints !== 0 && (
                            <div
                              className={`text-xs font-medium ${transaction.rewardPoints < 0 ? "text-destructive" : ""}`}
                              style={
                                transaction.rewardPoints > 0
                                  ? { color: "var(--color-accent)" }
                                  : undefined
                              }
                            >
                              {transaction.rewardPoints > 0 ? "+" : ""}
                              {transaction.rewardPoints.toLocaleString()} pts
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Payment Method Column */}
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-0">
                          <PaymentMethodIcon
                            method={transaction.paymentMethod}
                            size="sm"
                            className="flex-shrink-0"
                          />
                          <span className="text-sm line-clamp-2">
                            {formatCardShortName(
                              transaction.paymentMethod.issuer || "",
                              transaction.paymentMethod.name
                            )}
                          </span>
                        </div>
                      </TableCell>

                      {/* Actions Column - Dropdown Menu */}
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onView(transaction);
                              }}
                            >
                              <EyeIcon className="mr-2 h-4 w-4" />
                              View details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit(transaction);
                              }}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(transaction);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                }),
              ])
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TransactionTable;

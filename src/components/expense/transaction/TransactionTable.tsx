import { useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Transaction } from "@/types";
import { CurrencyService } from "@/core/currency/CurrencyService";
import { formatDate } from "@/utils/dates/formatters";
import {
  EditIcon,
  TrashIcon,
  DownloadIcon,
  EyeIcon,
  AlertCircle,
  Pencil,
} from "lucide-react";
import { getEffectiveCategory } from "@/utils/categoryMapping";
import {
  getCategoryEmoji,
  getCategoryColor,
  getParentCategory,
} from "@/utils/constants/categories";
import { cn } from "@/lib/utils";

interface TransactionTableProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  onView: (transaction: Transaction) => void;
  onExport: () => void;
  onCategoryEdit?: (transaction: Transaction) => void;
  categoryMap?: Record<string, string>;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  onEdit,
  onDelete,
  onView,
  onExport,
  onCategoryEdit,
  categoryMap = {},
}) => {
  return (
    <div className="w-full">
      <div className="flex justify-end mb-4">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
          onClick={onExport}
        >
          <DownloadIcon className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
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
              transactions.map((transaction) => {
                const effectiveCategory =
                  categoryMap[transaction.id] ||
                  getEffectiveCategory(transaction);
                const categoryEmoji = getCategoryEmoji(effectiveCategory);
                const categoryColor = getCategoryColor(effectiveCategory);
                const parentCategory = getParentCategory(effectiveCategory);
                const needsReview = transaction.needsReview;
                const isRecategorized = transaction.isRecategorized;

                return (
                  <TableRow key={transaction.id}>
                    <TableCell>{formatDate(transaction.date)}</TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {transaction.merchant.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {transaction.merchant.isOnline ? "Online" : "In-store"}
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
                            "border border-transparent hover:border-muted-foreground/20"
                          )}
                          onClick={() => onCategoryEdit?.(transaction)}
                          title="Click to change category"
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: categoryColor }}
                          />
                          <span>{categoryEmoji}</span>
                          <span className="truncate max-w-[120px]">
                            {effectiveCategory}
                          </span>
                          <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                        </button>
                        {needsReview && (
                          <Badge
                            variant="outline"
                            className="text-amber-600 border-amber-300 bg-amber-50 text-xs"
                          >
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Review
                          </Badge>
                        )}
                        {isRecategorized && (
                          <Badge
                            variant="outline"
                            className="text-blue-600 border-blue-300 bg-blue-50 text-xs"
                          >
                            Edited
                          </Badge>
                        )}
                      </div>
                      {parentCategory && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {parentCategory.emoji} {parentCategory.name}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        {CurrencyService.format(
                          transaction.amount,
                          transaction.currency
                        )}
                      </div>
                      {transaction.currency !== transaction.paymentCurrency && (
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
                          <EyeIcon className="h-4 w-4" />
                          <span className="sr-only">View</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(transaction)}
                        >
                          <EditIcon className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(transaction)}
                        >
                          <TrashIcon className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

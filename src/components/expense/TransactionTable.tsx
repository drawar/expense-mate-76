
import { useState, useMemo } from "react";
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
import { Transaction, PaymentMethod } from "@/types";
import { CurrencyService } from "@/core/currency";
import { formatDate } from "@/utils/dates/formatters";
import { EditIcon, TrashIcon, DownloadIcon, EyeIcon } from "lucide-react";
import { exportTransactionsToCSV } from "@/core/storage";
import { withResolvedStringPromise } from "@/utils/files/fileUtils";
import {
  getCategoryFromMCC,
  getCategoryFromMerchantName,
} from "@/utils/categoryMapping";

interface TransactionTableProps {
  transactions: Transaction[];
  paymentMethods: PaymentMethod[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  onView: (transaction: Transaction) => void;
}

const TransactionTable = ({
  transactions,
  paymentMethods,
  onEdit,
  onDelete,
  onView,
}: TransactionTableProps) => {
  // Memoize CSV export to prevent recalculation on every render
  const handleExportCSV = useMemo(
    () => async () => {
      const csvPromise = exportTransactionsToCSV(transactions);
      
      // Use the utility function to handle the string promise safely
      await withResolvedStringPromise(async (csvContent) => {
        // Create a blob and download link
        const url = URL.createObjectURL(new Blob([csvContent], { type: "text/csv;charset=utf-8;" }));
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
        const txId = transaction.id;

        // Use transaction's stored category if available
        if (transaction.category && transaction.category !== "Uncategorized") {
          acc[txId] = transaction.category;
          return acc;
        }

        // Try to determine from MCC
        if (transaction.merchant.mcc?.code) {
          acc[txId] = getCategoryFromMCC(transaction.merchant.mcc.code);
          return acc;
        }

        // Try to determine from merchant name
        const nameBasedCategory = getCategoryFromMerchantName(
          transaction.merchant.name
        );
        if (nameBasedCategory) {
          acc[txId] = nameBasedCategory;
          return acc;
        }

        acc[txId] = "Uncategorized";
        return acc;
      },
      {} as Record<string, string>
    );
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
              transactions.map((transaction) => (
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
                  <TableCell>{transactionCategories[transaction.id]}</TableCell>
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
                        {Math.round(transaction.amount * 0.4).toLocaleString()}*
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
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TransactionTable;

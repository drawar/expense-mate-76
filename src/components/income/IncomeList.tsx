import React from "react";
import { RecurringIncome } from "@/types";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PencilIcon, TrashIcon, CalendarIcon } from "lucide-react";
import { format } from "date-fns";

interface IncomeListProps {
  incomeSources: RecurringIncome[];
  onEdit: (income: RecurringIncome) => void;
  onDelete: (id: string) => void;
}

export const IncomeList: React.FC<IncomeListProps> = ({
  incomeSources,
  onEdit,
  onDelete,
}) => {
  // Sort by date descending (newest first)
  const sortedIncome = [...incomeSources].sort((a, b) => {
    if (!a.startDate && !b.startDate) return 0;
    if (!a.startDate) return 1;
    if (!b.startDate) return -1;
    return b.startDate.localeCompare(a.startDate);
  });

  return (
    <div className="rounded-lg border bg-[var(--color-card-bg)] border-[var(--color-border)]">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-[var(--color-text-secondary)]">
              Name
            </TableHead>
            <TableHead className="text-[var(--color-text-secondary)]">
              Amount
            </TableHead>
            <TableHead className="text-[var(--color-text-secondary)] hidden sm:table-cell">
              Date
            </TableHead>
            <TableHead className="text-[var(--color-text-secondary)] hidden md:table-cell">
              Notes
            </TableHead>
            <TableHead className="text-right text-[var(--color-text-secondary)]">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedIncome.map((income) => (
            <IncomeRow
              key={income.id}
              income={income}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

interface IncomeRowProps {
  income: RecurringIncome;
  onEdit: (income: RecurringIncome) => void;
  onDelete: (id: string) => void;
}

const IncomeRow: React.FC<IncomeRowProps> = ({ income, onEdit, onDelete }) => {
  const { formatCurrency } = useCurrencyFormatter(income.currency);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return format(date, "MMM d, yyyy");
  };

  return (
    <TableRow className="hover:bg-[var(--color-surface)]">
      <TableCell>
        <span className="font-medium text-[var(--color-text-primary)]">
          {income.name}
        </span>
      </TableCell>
      <TableCell>
        <span className="font-medium text-[var(--color-accent)]">
          {formatCurrency(income.amount)}
        </span>
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        {income.startDate ? (
          <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
            <CalendarIcon className="h-3.5 w-3.5" />
            <span>{formatDate(income.startDate)}</span>
          </div>
        ) : (
          <span className="text-[var(--color-text-tertiary)]">—</span>
        )}
      </TableCell>
      <TableCell className="hidden md:table-cell max-w-[200px]">
        {income.notes ? (
          <span className="text-[var(--color-text-secondary)] truncate block">
            {income.notes}
          </span>
        ) : (
          <span className="text-[var(--color-text-tertiary)]">—</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(income)}
            className="h-8 w-8"
          >
            <PencilIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(income.id)}
            className="h-8 w-8 text-[var(--color-danger)] hover:text-[var(--color-danger)]"
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

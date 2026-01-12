import React, { useMemo } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";

/**
 * Get a YYYY-MM-DD key from a date string
 */
function getDateKey(dateStr: string): string {
  return dateStr; // Already in YYYY-MM-DD format
}

/**
 * Format date for group header (Today, Yesterday, or full date)
 */
function formatDateGroupHeader(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEE, MMM d, yyyy");
}

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
  // Group income by date for better organization
  const groupedIncome = useMemo(() => {
    // Sort by date descending (newest first)
    const sorted = [...incomeSources].sort((a, b) => {
      if (!a.startDate && !b.startDate) return 0;
      if (!a.startDate) return 1;
      if (!b.startDate) return -1;
      return b.startDate.localeCompare(a.startDate);
    });

    const groups: {
      date: string;
      items: RecurringIncome[];
    }[] = [];
    let currentDate = "";
    let currentGroup: RecurringIncome[] = [];

    sorted.forEach((income) => {
      const incomeDate = income.startDate || "No Date";

      if (incomeDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({
            date: currentDate,
            items: currentGroup,
          });
        }
        currentDate = incomeDate;
        currentGroup = [income];
      } else {
        currentGroup.push(income);
      }
    });

    // Don't forget the last group
    if (currentGroup.length > 0) {
      groups.push({
        date: currentDate,
        items: currentGroup,
      });
    }

    return groups;
  }, [incomeSources]);

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="w-[120px]">Amount</TableHead>
            <TableHead className="hidden md:table-cell">Notes</TableHead>
            <TableHead className="w-[50px] text-right"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {incomeSources.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                No payslips found.
              </TableCell>
            </TableRow>
          ) : (
            groupedIncome.flatMap((group) => [
              // Date Header Row
              <TableRow
                key={`date-${group.date}`}
                className="bg-muted/50 hover:bg-muted/50"
              >
                <TableCell
                  colSpan={4}
                  className="py-1.5 font-medium text-xs text-muted-foreground"
                >
                  {group.date === "No Date"
                    ? "No Date"
                    : formatDateGroupHeader(group.date)}
                </TableCell>
              </TableRow>,
              // Income Rows for this date
              ...group.items.map((income) => (
                <IncomeRow
                  key={income.id}
                  income={income}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              )),
            ])
          )}
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

  return (
    <TableRow className="group cursor-pointer" onClick={() => onEdit(income)}>
      {/* Name Column */}
      <TableCell>
        <div className="flex items-start gap-2">
          {/* Green color indicator for income */}
          <div
            className="w-1 h-8 rounded-full flex-shrink-0 mt-0.5"
            style={{ backgroundColor: "var(--color-accent)" }}
          />
          <div className="min-w-0 flex-1">
            <span className="font-medium">{income.name}</span>
          </div>
        </div>
      </TableCell>

      {/* Amount Column */}
      <TableCell>
        <div className="font-medium" style={{ color: "var(--color-accent)" }}>
          +{formatCurrency(income.amount)}
        </div>
      </TableCell>

      {/* Notes Column */}
      <TableCell className="hidden md:table-cell max-w-[200px]">
        {income.notes ? (
          <span className="text-muted-foreground truncate block">
            {income.notes}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
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
                onEdit(income);
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
                onDelete(income.id);
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
};

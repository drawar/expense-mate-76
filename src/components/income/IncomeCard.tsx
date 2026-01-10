import React from "react";
import { RecurringIncome } from "@/types";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PencilIcon, TrashIcon, CalendarIcon } from "lucide-react";

interface IncomeCardProps {
  income: RecurringIncome;
  onEdit: (income: RecurringIncome) => void;
  onDelete: (id: string) => void;
}

export const IncomeCard: React.FC<IncomeCardProps> = ({
  income,
  onEdit,
  onDelete,
}) => {
  const { formatCurrency } = useCurrencyFormatter(income.currency);

  return (
    <div
      className={`p-4 rounded-lg border transition-colors ${
        income.isActive
          ? "bg-[var(--color-card-bg)] border-[var(--color-border)]"
          : "bg-[var(--color-surface)] border-[var(--color-border)] opacity-60"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-[var(--color-text-primary)] truncate">
              {income.name}
            </h3>
            {!income.isActive && (
              <Badge variant="secondary" className="text-xs">
                Inactive
              </Badge>
            )}
          </div>

          <div className="text-xl font-semibold text-[var(--color-accent)] mb-2">
            {formatCurrency(income.amount)}
          </div>

          {income.startDate && (
            <div className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)]">
              <CalendarIcon className="h-3.5 w-3.5" />
              <span>
                Pay date:{" "}
                {new Date(income.startDate + "T00:00:00").toLocaleDateString()}
              </span>
            </div>
          )}

          {income.notes && (
            <p className="text-sm text-[var(--color-text-secondary)] mt-2 line-clamp-2">
              {income.notes}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1">
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
            className="h-8 w-8 text-destructive hover:text-destructive"
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

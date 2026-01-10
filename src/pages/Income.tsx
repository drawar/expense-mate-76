import { useState } from "react";
import { RecurringIncome, Currency } from "@/types";
import { useRecurringIncome } from "@/hooks/useRecurringIncome";
import { useToast } from "@/hooks/use-toast";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUpIcon } from "lucide-react";
import { EmptyIncomeState, IncomeList, IncomeForm } from "@/components/income";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const DEFAULT_CURRENCY: Currency = "CAD";

const Income = () => {
  const {
    incomeSources,
    totalMonthlyIncome,
    isLoading,
    saveIncome,
    deleteIncome,
  } = useRecurringIncome(DEFAULT_CURRENCY);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<RecurringIncome | null>(
    null
  );
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const { toast } = useToast();
  const { formatCurrency } = useCurrencyFormatter(DEFAULT_CURRENCY);

  const handleAddIncome = () => {
    setEditingIncome(null);
    setIsFormOpen(true);
  };

  const handleEditIncome = (income: RecurringIncome) => {
    setEditingIncome(income);
    setIsFormOpen(true);
  };

  const handleDeleteIncome = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;

    try {
      await deleteIncome(deleteConfirmId);
      toast({
        title: "Payslip deleted",
        description: "Payslip has been removed.",
      });
    } catch (error) {
      console.error("Error deleting payslip:", error);
      toast({
        title: "Error",
        description: "Failed to delete payslip.",
        variant: "destructive",
      });
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleFormSubmit = async (
    income: Omit<RecurringIncome, "createdAt" | "updatedAt">
  ) => {
    try {
      await saveIncome(income);
      toast({
        title: editingIncome ? "Payslip updated" : "Payslip added",
        description: `${income.name} has been ${editingIncome ? "updated" : "added"}.`,
      });
    } catch (error) {
      console.error("Error saving payslip:", error);
      toast({
        title: "Error",
        description: "Failed to save payslip.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const incomeToDelete = incomeSources.find((i) => i.id === deleteConfirmId);

  return (
    <div className="min-h-screen">
      <div className="container max-w-7xl mx-auto pb-16 px-4 md:px-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10 mt-4">
          <div>
            <h1 className="text-2xl font-medium tracking-tight text-gradient">
              Payslips
            </h1>
            <p className="text-muted-foreground mt-1.5 text-sm">
              Track your income payments
            </p>
          </div>

          <Button
            onClick={handleAddIncome}
            className="w-full sm:w-auto mt-4 sm:mt-0 gap-2"
            aria-label="Add new payslip"
          >
            <Plus className="h-4 w-4" />
            Add Payslip
          </Button>
        </div>

        {isLoading ? (
          <div
            className="flex flex-col items-center justify-center py-16"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <div
              className="w-10 h-10 border-2 rounded-full animate-spin mb-4"
              style={{
                borderColor: "var(--color-border)",
                borderTopColor: "var(--color-accent)",
              }}
            />
            <span className="text-sm">Loading income sources...</span>
          </div>
        ) : incomeSources.length === 0 ? (
          <EmptyIncomeState onAddClick={handleAddIncome} />
        ) : (
          <div className="space-y-8">
            {/* Summary Card */}
            <div className="p-6 rounded-lg border bg-[var(--color-card-bg)] border-[var(--color-border)]">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-[var(--color-accent-subtle)]">
                  <TrendingUpIcon className="h-5 w-5 text-[var(--color-success)]" />
                </div>
                <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                  Total Income
                </span>
              </div>
              <div className="text-3xl font-medium text-[var(--color-success)]">
                {formatCurrency(totalMonthlyIncome)}
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                {incomeSources.length} payslip
                {incomeSources.length !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Income List */}
            <IncomeList
              incomeSources={incomeSources}
              onEdit={handleEditIncome}
              onDelete={handleDeleteIncome}
            />
          </div>
        )}

        {/* Income Form Modal */}
        <IncomeForm
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingIncome(null);
          }}
          onSubmit={handleFormSubmit}
          editingIncome={editingIncome}
          defaultCurrency={DEFAULT_CURRENCY}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={!!deleteConfirmId}
          onOpenChange={(open) => !open && setDeleteConfirmId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Payslip</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{incomeToDelete?.name}"? This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Income;

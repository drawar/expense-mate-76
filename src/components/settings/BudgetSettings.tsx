import { useState, useEffect } from "react";
import { Currency } from "@/types";
import { CurrencyService } from "@/core/currency/CurrencyService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  TargetIcon,
  Loader2,
  CheckIcon,
  PencilIcon,
  XIcon,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useBudget, BudgetPeriodType } from "@/hooks/useBudget";

/**
 * BudgetSettings component for setting the monthly/weekly budget
 */
export function BudgetSettings() {
  const [displayCurrency, setDisplayCurrency] = useState<Currency>(
    CurrencyService.getDefaultCurrency()
  );

  const { rawBudget, periodType, isLoading, setBudget } = useBudget(
    displayCurrency,
    "thisMonth"
  );

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [editPeriodType, setEditPeriodType] =
    useState<BudgetPeriodType>("monthly");
  const [isSaving, setIsSaving] = useState(false);

  // Sync edit values when budget loads or when entering edit mode
  useEffect(() => {
    if (!isLoading) {
      setEditValue(rawBudget > 0 ? rawBudget.toString() : "");
      setEditPeriodType(periodType);
    }
  }, [rawBudget, periodType, isLoading]);

  // Update display currency when default changes
  useEffect(() => {
    setDisplayCurrency(CurrencyService.getDefaultCurrency());
  }, []);

  // Auto-enter edit mode if no budget set
  useEffect(() => {
    if (!isLoading && rawBudget === 0) {
      setIsEditing(true);
    }
  }, [isLoading, rawBudget]);

  const handleStartEdit = () => {
    setEditValue(rawBudget > 0 ? rawBudget.toString() : "");
    setEditPeriodType(periodType);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditValue(rawBudget > 0 ? rawBudget.toString() : "");
    setEditPeriodType(periodType);
    setIsEditing(false);
  };

  const handleSave = async () => {
    const amount = parseFloat(editValue);
    if (isNaN(amount) || amount < 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid budget amount",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await setBudget(amount, displayCurrency, editPeriodType);
      toast({
        title: "Budget saved",
        description: `Your ${editPeriodType} budget has been set to ${CurrencyService.format(amount, displayCurrency)}`,
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save budget:", error);
      toast({
        title: "Error",
        description: "Failed to save budget. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const currencyOptions = CurrencyService.getCurrencyOptions();
  const hasBudget = rawBudget > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TargetIcon className="h-5 w-5" />
          Budget
        </CardTitle>
        <CardDescription>
          Set your spending budget to track your expenses against a target.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading budget...
            </div>
          ) : !isEditing && hasBudget ? (
            // Read-only view when budget exists
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-semibold">
                  {CurrencyService.format(rawBudget, displayCurrency)}
                </p>
                <p className="text-sm text-muted-foreground capitalize">
                  {periodType} budget
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleStartEdit}>
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit Budget
              </Button>
            </div>
          ) : (
            // Edit form
            <>
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium min-w-[120px]">
                  Amount
                </label>
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    placeholder="Enter budget amount"
                    className="flex-1"
                    autoFocus
                  />
                  <Select
                    value={editPeriodType}
                    onValueChange={(value) =>
                      setEditPeriodType(value as BudgetPeriodType)
                    }
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="text-sm font-medium min-w-[120px]">
                  Currency
                </label>
                <Select
                  value={displayCurrency}
                  onValueChange={(value) =>
                    setDisplayCurrency(value as Currency)
                  }
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencyOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                {hasBudget && (
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    <XIcon className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                )}
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-4 w-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Your budget will be used to track spending on the dashboard and
                provide insights about your spending habits.
              </p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

import { useState, useEffect } from "react";
import { ConversionService } from "@/core/currency/ConversionService";
import { RewardCurrency } from "@/core/currency/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Save, AlertCircle, RefreshCw, Trash2 } from "lucide-react";

/**
 * Rate matrix using currency IDs as keys
 * { sourceCurrencyId: { targetCurrencyId: rate } }
 */
type RateMatrix = Record<string, Record<string, number>>;

/**
 * Editing state for a specific cell
 */
interface EditingCell {
  sourceCurrencyId: string;
  targetCurrencyId: string;
  value: string;
}

/**
 * ConversionRateManager component for managing conversion rates between
 * reward currencies (bank points) and destination currencies (airline miles).
 *
 * Uses the unified reward_currencies table with is_transferrable flag:
 * - Source currencies: is_transferrable = true (bank points like Citi ThankYou)
 * - Target currencies: is_transferrable = false (airline miles like KrisFlyer)
 */
export function ConversionRateManager() {
  const [rateMatrix, setRateMatrix] = useState<RateMatrix>({});
  const [sourceCurrencies, setSourceCurrencies] = useState<RewardCurrency[]>(
    []
  );
  const [targetCurrencies, setTargetCurrencies] = useState<RewardCurrency[]>(
    []
  );
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [deleteConfirmCurrency, setDeleteConfirmCurrency] = useState<
    string | null
  >(null);

  const conversionService = ConversionService.getInstance();

  /**
   * Load all data from the database
   */
  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Load currencies and rates in parallel
      const [sources, targets, rates] = await Promise.all([
        conversionService.getTransferrableCurrencies(),
        conversionService.getDestinationCurrencies(),
        conversionService.getAllConversionRatesWithCurrencies(),
      ]);

      setSourceCurrencies(sources);
      setTargetCurrencies(targets);

      // Build rate matrix from rates array
      const matrix: RateMatrix = {};
      for (const rate of rates) {
        if (!matrix[rate.sourceCurrencyId]) {
          matrix[rate.sourceCurrencyId] = {};
        }
        matrix[rate.sourceCurrencyId][rate.targetCurrencyId] = rate.rate;
      }
      setRateMatrix(matrix);
      setHasChanges(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load data";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Initialize component by loading data
   */
  useEffect(() => {
    loadData();
  }, []);

  /**
   * Get the rate for a specific source/target pair
   */
  const getRate = (
    sourceCurrencyId: string,
    targetCurrencyId: string
  ): number | undefined => {
    return rateMatrix[sourceCurrencyId]?.[targetCurrencyId];
  };

  /**
   * Handle cell click to start editing
   */
  const handleCellClick = (
    sourceCurrencyId: string,
    targetCurrencyId: string
  ) => {
    const currentRate = getRate(sourceCurrencyId, targetCurrencyId);
    setEditingCell({
      sourceCurrencyId,
      targetCurrencyId,
      value: currentRate !== undefined ? currentRate.toString() : "",
    });
  };

  /**
   * Handle input change during editing
   */
  const handleInputChange = (value: string) => {
    if (editingCell) {
      setEditingCell({
        ...editingCell,
        value,
      });
    }
  };

  /**
   * Validate rate value
   */
  const validateRate = (value: string): { valid: boolean; error?: string } => {
    if (value.trim() === "") {
      return { valid: false, error: "Rate cannot be empty" };
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return { valid: false, error: "Rate must be a valid number" };
    }

    if (numValue <= 0) {
      return { valid: false, error: "Rate must be a positive number" };
    }

    return { valid: true };
  };

  /**
   * Handle blur or enter key to save cell edit
   */
  const handleCellSave = () => {
    if (!editingCell) return;

    const validation = validateRate(editingCell.value);
    if (!validation.valid) {
      toast({
        title: "Invalid Rate",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    const numValue = parseFloat(editingCell.value);

    // Update local state
    setRateMatrix((prev) => {
      const updated = { ...prev };
      if (!updated[editingCell.sourceCurrencyId]) {
        updated[editingCell.sourceCurrencyId] = {};
      }
      updated[editingCell.sourceCurrencyId][editingCell.targetCurrencyId] =
        numValue;
      return updated;
    });

    setHasChanges(true);
    setEditingCell(null);
  };

  /**
   * Handle escape key to cancel editing
   */
  const handleCellCancel = () => {
    setEditingCell(null);
  };

  /**
   * Handle key press in input
   */
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleCellSave();
    } else if (e.key === "Escape") {
      handleCellCancel();
    }
  };

  /**
   * Delete all conversion rates for a source currency
   */
  const handleDeleteSourceCurrency = async (sourceCurrencyId: string) => {
    setIsDeleting(sourceCurrencyId);
    setDeleteConfirmCurrency(null);

    try {
      await conversionService.deleteConversionRatesForSourceCurrency(
        sourceCurrencyId
      );

      // Remove from local state
      setRateMatrix((prev) => {
        const updated = { ...prev };
        delete updated[sourceCurrencyId];
        return updated;
      });

      const currency = sourceCurrencies.find((c) => c.id === sourceCurrencyId);
      toast({
        title: "Rates Deleted",
        description: `Successfully deleted all rates for "${currency?.displayName || sourceCurrencyId}"`,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete rates";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  /**
   * Save all changes to the database
   */
  const handleSaveAll = async () => {
    setIsSaving(true);
    setError(null);

    try {
      // Collect all updates
      const updates: Array<{
        sourceCurrencyId: string;
        targetCurrencyId: string;
        rate: number;
      }> = [];

      for (const sourceCurrencyId of Object.keys(rateMatrix)) {
        for (const targetCurrencyId of Object.keys(
          rateMatrix[sourceCurrencyId]
        )) {
          const rate = rateMatrix[sourceCurrencyId][targetCurrencyId];
          if (rate !== undefined && rate > 0) {
            updates.push({
              sourceCurrencyId,
              targetCurrencyId,
              rate,
            });
          }
        }
      }

      // Batch upsert
      await conversionService.batchUpsertConversionRatesById(updates);

      setHasChanges(false);
      toast({
        title: "Success",
        description: "Conversion rates saved successfully",
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to save conversion rates";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Retry loading after error
   */
  const handleRetry = () => {
    loadData();
  };

  // Get source currencies that have at least one rate defined
  const sourceCurrenciesWithRates = sourceCurrencies.filter(
    (sc) => rateMatrix[sc.id] && Object.keys(rateMatrix[sc.id]).length > 0
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Conversion Rate Management</CardTitle>
            <CardDescription>
              Manage conversion rates between reward currencies (bank points)
              and airline miles. Click on any cell to edit the rate.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className="ml-4"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">
              Loading conversion rates...
            </span>
          </div>
        ) : sourceCurrenciesWithRates.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Conversion Rates</AlertTitle>
            <AlertDescription>
              No conversion rates have been configured yet. Rates are seeded
              when the application starts.
            </AlertDescription>
          </Alert>
        ) : null}

        {!isLoading && sourceCurrenciesWithRates.length > 0 && (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-medium">Source Currency</TableHead>
                  {targetCurrencies.map((currency) => (
                    <TableHead
                      key={currency.id}
                      className="text-center font-medium"
                    >
                      {currency.displayName}
                    </TableHead>
                  ))}
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sourceCurrenciesWithRates.map((sourceCurrency) => (
                  <TableRow key={sourceCurrency.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{sourceCurrency.displayName}</div>
                        {sourceCurrency.issuer && (
                          <div className="text-xs text-muted-foreground">
                            {sourceCurrency.issuer}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    {targetCurrencies.map((targetCurrency) => {
                      const rate = getRate(
                        sourceCurrency.id,
                        targetCurrency.id
                      );
                      const isEditing =
                        editingCell?.sourceCurrencyId === sourceCurrency.id &&
                        editingCell?.targetCurrencyId === targetCurrency.id;

                      return (
                        <TableCell
                          key={targetCurrency.id}
                          className="text-center cursor-pointer hover:bg-muted/50"
                          onClick={() =>
                            !isEditing &&
                            handleCellClick(
                              sourceCurrency.id,
                              targetCurrency.id
                            )
                          }
                        >
                          {isEditing ? (
                            <Input
                              type="number"
                              step="0.0001"
                              min="0"
                              value={editingCell.value}
                              onChange={(e) =>
                                handleInputChange(e.target.value)
                              }
                              onBlur={handleCellSave}
                              onKeyDown={handleKeyPress}
                              autoFocus
                              className="w-24 mx-auto text-center"
                            />
                          ) : (
                            <span
                              className={
                                rate !== undefined
                                  ? ""
                                  : "text-muted-foreground"
                              }
                            >
                              {rate !== undefined ? rate.toFixed(4) : "-"}
                            </span>
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell>
                      <Dialog
                        open={deleteConfirmCurrency === sourceCurrency.id}
                        onOpenChange={(open) =>
                          setDeleteConfirmCurrency(
                            open ? sourceCurrency.id : null
                          )
                        }
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            disabled={isDeleting === sourceCurrency.id}
                          >
                            {isDeleting === sourceCurrency.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </DialogTrigger>
                        <DialogContent
                          className="sm:max-w-md max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden"
                          hideCloseButton
                        >
                          <DialogHeader
                            className="border-b flex-shrink-0"
                            showCloseButton
                            onClose={() => setDeleteConfirmCurrency(null)}
                          >
                            <DialogTitle>Delete Conversion Rates</DialogTitle>
                            <DialogDescription className="text-center">
                              Are you sure you want to delete all conversion
                              rates for "{sourceCurrency.displayName}"? This
                              cannot be undone.
                            </DialogDescription>
                          </DialogHeader>
                          <div
                            className="px-4 py-4 border-t flex gap-3 flex-shrink-0"
                            style={{ borderColor: "var(--color-border)" }}
                          >
                            <Button
                              variant="outline"
                              onClick={() => setDeleteConfirmCurrency(null)}
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() =>
                                handleDeleteSourceCurrency(sourceCurrency.id)
                              }
                              className="flex-1"
                            >
                              Delete
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                {hasChanges && "You have unsaved changes"}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={loadData}
                  disabled={isSaving}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload
                </Button>
                <Button
                  onClick={handleSaveAll}
                  disabled={!hasChanges || isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

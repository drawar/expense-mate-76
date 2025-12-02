import { useState, useEffect } from "react";
import {
  ConversionService,
  MilesCurrency,
  ConversionRateMatrix,
} from "@/core/currency/ConversionService";
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
import { Loader2, Save, AlertCircle, RefreshCw } from "lucide-react";

/**
 * Miles currency options in display order
 */
const MILES_CURRENCIES: MilesCurrency[] = [
  "KrisFlyer",
  "AsiaMiles",
  "Avios",
  "FlyingBlue",
  "Aeroplan",
  "Velocity",
];

/**
 * Editing state for a specific cell
 */
interface EditingCell {
  rewardCurrency: string;
  milesCurrency: MilesCurrency;
  value: string;
}

/**
 * ConversionRateManager component for managing conversion rates between
 * reward currencies and miles programs.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */
export function ConversionRateManager() {
  const [conversionRates, setConversionRates] = useState<ConversionRateMatrix>({});
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const conversionService = ConversionService.getInstance();

  /**
   * Load conversion rates from the database
   */
  const loadConversionRates = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const rates = await conversionService.getAllConversionRates();
      setConversionRates(rates);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load conversion rates";
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
   * Initialize component by loading rates
   */
  useEffect(() => {
    loadConversionRates();
  }, []);

  /**
   * Get all unique reward currencies from the matrix
   */
  const getRewardCurrencies = (): string[] => {
    return Object.keys(conversionRates).sort();
  };

  /**
   * Get the conversion rate for a specific pair
   */
  const getRate = (rewardCurrency: string, milesCurrency: MilesCurrency): number | undefined => {
    return conversionRates[rewardCurrency]?.[milesCurrency];
  };

  /**
   * Handle cell click to start editing
   */
  const handleCellClick = (rewardCurrency: string, milesCurrency: MilesCurrency) => {
    const currentRate = getRate(rewardCurrency, milesCurrency);
    setEditingCell({
      rewardCurrency,
      milesCurrency,
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
    setConversionRates((prev) => {
      const updated = { ...prev };
      if (!updated[editingCell.rewardCurrency]) {
        updated[editingCell.rewardCurrency] = {};
      }
      updated[editingCell.rewardCurrency][editingCell.milesCurrency] = numValue;
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
   * Save all changes to the database
   */
  const handleSaveAll = async () => {
    setIsSaving(true);
    setError(null);

    try {
      // Collect all updates
      const updates: Array<{
        rewardCurrency: string;
        milesCurrency: MilesCurrency;
        rate: number;
      }> = [];

      for (const rewardCurrency of Object.keys(conversionRates)) {
        for (const milesCurrency of MILES_CURRENCIES) {
          const rate = conversionRates[rewardCurrency][milesCurrency];
          if (rate !== undefined) {
            updates.push({
              rewardCurrency,
              milesCurrency,
              rate,
            });
          }
        }
      }

      // Batch update
      await conversionService.batchUpdateConversionRates(updates);

      setHasChanges(false);
      toast({
        title: "Success",
        description: "Conversion rates saved successfully",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save conversion rates";
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
   * Retry loading rates after error
   */
  const handleRetry = () => {
    loadConversionRates();
  };

  const rewardCurrencies = getRewardCurrencies();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Conversion Rate Management</CardTitle>
        <CardDescription>
          Manage conversion rates between reward currencies and miles programs.
          Click on any cell to edit the rate. Rates must be positive numbers.
        </CardDescription>
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
            <span className="ml-2 text-muted-foreground">Loading conversion rates...</span>
          </div>
        ) : rewardCurrencies.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Conversion Rates</AlertTitle>
            <AlertDescription>
              No conversion rates have been configured yet. Click on cells below to add rates.
            </AlertDescription>
          </Alert>
        ) : null}

        {!isLoading && (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Reward Currency</TableHead>
                    {MILES_CURRENCIES.map((currency) => (
                      <TableHead key={currency} className="text-center font-semibold">
                        {currency}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rewardCurrencies.map((rewardCurrency) => (
                    <TableRow key={rewardCurrency}>
                      <TableCell className="font-medium">{rewardCurrency}</TableCell>
                      {MILES_CURRENCIES.map((milesCurrency) => {
                        const rate = getRate(rewardCurrency, milesCurrency);
                        const isEditing =
                          editingCell?.rewardCurrency === rewardCurrency &&
                          editingCell?.milesCurrency === milesCurrency;

                        return (
                          <TableCell
                            key={milesCurrency}
                            className="text-center cursor-pointer hover:bg-muted/50"
                            onClick={() => !isEditing && handleCellClick(rewardCurrency, milesCurrency)}
                          >
                            {isEditing ? (
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={editingCell.value}
                                onChange={(e) => handleInputChange(e.target.value)}
                                onBlur={handleCellSave}
                                onKeyDown={handleKeyPress}
                                autoFocus
                                className="w-24 mx-auto text-center"
                              />
                            ) : (
                              <span className={rate !== undefined ? "" : "text-muted-foreground"}>
                                {rate !== undefined ? rate.toFixed(4) : "—"}
                              </span>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                {hasChanges && "You have unsaved changes"}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={loadConversionRates}
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

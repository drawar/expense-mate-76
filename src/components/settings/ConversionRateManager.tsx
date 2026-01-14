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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Save,
  AlertCircle,
  RefreshCw,
  Trash2,
  Plus,
  ChevronRight,
  Building2,
} from "lucide-react";

/**
 * Rate matrix using currency IDs as keys
 * { sourceCurrencyId: { targetCurrencyId: rate } }
 */
type RateMatrix = Record<string, Record<string, number>>;

/**
 * ConversionRateManager component with Master-Detail layout
 *
 * Left panel: List of source currencies (bank points)
 * Right panel: Edit rates for selected source currency
 */
export function ConversionRateManager() {
  const [rateMatrix, setRateMatrix] = useState<RateMatrix>({});
  const [sourceCurrencies, setSourceCurrencies] = useState<RewardCurrency[]>(
    []
  );
  const [targetCurrencies, setTargetCurrencies] = useState<RewardCurrency[]>(
    []
  );
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [editingRates, setEditingRates] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [deleteConfirmCurrency, setDeleteConfirmCurrency] = useState<
    string | null
  >(null);
  const [showAddPartnerDialog, setShowAddPartnerDialog] = useState(false);
  const [newPartnerId, setNewPartnerId] = useState<string>("");

  const conversionService = ConversionService.getInstance();

  /**
   * Load all data from the database
   */
  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
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

      // Auto-select first source with rates
      const firstWithRates = sources.find(
        (s) => matrix[s.id] && Object.keys(matrix[s.id]).length > 0
      );
      if (firstWithRates && !selectedSourceId) {
        setSelectedSourceId(firstWithRates.id);
        initializeEditingRates(firstWithRates.id, matrix);
      }
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
   * Initialize editing state for a source currency
   */
  const initializeEditingRates = (
    sourceId: string,
    matrix: RateMatrix = rateMatrix
  ) => {
    const rates = matrix[sourceId] || {};
    const editing: Record<string, string> = {};
    for (const [targetId, rate] of Object.entries(rates)) {
      editing[targetId] = rate.toString();
    }
    setEditingRates(editing);
  };

  useEffect(() => {
    loadData();
  }, []);

  /**
   * Handle selecting a source currency
   */
  const handleSelectSource = (sourceId: string) => {
    if (hasChanges) {
      // Prompt to save or discard
      const confirmed = window.confirm(
        "You have unsaved changes. Discard them?"
      );
      if (!confirmed) return;
    }
    setSelectedSourceId(sourceId);
    initializeEditingRates(sourceId);
    setHasChanges(false);
  };

  /**
   * Handle rate input change
   */
  const handleRateChange = (targetId: string, value: string) => {
    setEditingRates((prev) => ({
      ...prev,
      [targetId]: value,
    }));
    setHasChanges(true);
  };

  /**
   * Remove a transfer partner
   */
  const handleRemovePartner = (targetId: string) => {
    setEditingRates((prev) => {
      const updated = { ...prev };
      delete updated[targetId];
      return updated;
    });
    setHasChanges(true);
  };

  /**
   * Add a new transfer partner
   */
  const handleAddPartner = () => {
    if (!newPartnerId || editingRates[newPartnerId] !== undefined) {
      toast({
        title: "Cannot Add",
        description: "Partner already exists or invalid selection",
        variant: "destructive",
      });
      return;
    }
    setEditingRates((prev) => ({
      ...prev,
      [newPartnerId]: "1.0",
    }));
    setNewPartnerId("");
    setShowAddPartnerDialog(false);
    setHasChanges(true);
  };

  /**
   * Save changes for the selected source
   */
  const handleSave = async () => {
    if (!selectedSourceId) return;

    setIsSaving(true);
    setError(null);

    try {
      // Validate all rates
      for (const [targetId, value] of Object.entries(editingRates)) {
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue <= 0) {
          const target = targetCurrencies.find((t) => t.id === targetId);
          throw new Error(
            `Invalid rate for ${target?.displayName || targetId}`
          );
        }
      }

      // Build updates array
      const updates = Object.entries(editingRates).map(([targetId, value]) => ({
        sourceCurrencyId: selectedSourceId,
        targetCurrencyId: targetId,
        rate: parseFloat(value),
      }));

      // First delete all existing rates for this source
      await conversionService.deleteConversionRatesForSourceCurrency(
        selectedSourceId
      );

      // Then insert the new rates
      if (updates.length > 0) {
        await conversionService.batchUpsertConversionRatesById(updates);
      }

      // Update local state
      setRateMatrix((prev) => {
        const updated = { ...prev };
        updated[selectedSourceId] = {};
        for (const update of updates) {
          updated[selectedSourceId][update.targetCurrencyId] = update.rate;
        }
        return updated;
      });

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
   * Delete all rates for a source currency
   */
  const handleDeleteSource = async (sourceCurrencyId: string) => {
    setIsDeleting(sourceCurrencyId);
    setDeleteConfirmCurrency(null);

    try {
      await conversionService.deleteConversionRatesForSourceCurrency(
        sourceCurrencyId
      );

      setRateMatrix((prev) => {
        const updated = { ...prev };
        delete updated[sourceCurrencyId];
        return updated;
      });

      // If we deleted the selected source, clear selection
      if (selectedSourceId === sourceCurrencyId) {
        setSelectedSourceId(null);
        setEditingRates({});
      }

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

  // Get source currencies that have at least one rate defined
  const sourceCurrenciesWithRates = sourceCurrencies.filter(
    (sc) => rateMatrix[sc.id] && Object.keys(rateMatrix[sc.id]).length > 0
  );

  // Get the selected source currency
  const selectedSource = sourceCurrencies.find(
    (s) => s.id === selectedSourceId
  );

  // Get available partners to add (those not already in editingRates)
  const availablePartnersToAdd = targetCurrencies.filter(
    (t) => editingRates[t.id] === undefined
  );

  // Get the partners for the selected source
  const currentPartners = Object.keys(editingRates)
    .map((targetId) => targetCurrencies.find((t) => t.id === targetId))
    .filter(Boolean) as RewardCurrency[];

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle>Conversion Rate Management</CardTitle>
        <CardDescription>
          Select a bank points program to view and edit its transfer partners
          and rates.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {error && (
          <div className="px-6 pb-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>{error}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadData}
                  className="ml-4"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">
              Loading conversion rates...
            </span>
          </div>
        ) : sourceCurrenciesWithRates.length === 0 ? (
          <div className="px-6 pb-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Conversion Rates</AlertTitle>
              <AlertDescription>
                No conversion rates have been configured yet.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="flex min-h-[400px]">
            {/* Left Panel - Source Currency List */}
            <div
              className="w-64 flex-shrink-0 border-r overflow-y-auto"
              style={{ borderColor: "var(--color-border)" }}
            >
              <div
                className="px-3 py-2 text-xs font-medium uppercase tracking-wider"
                style={{
                  color: "var(--color-text-tertiary)",
                  backgroundColor: "var(--color-surface)",
                }}
              >
                Bank Points Programs
              </div>
              {sourceCurrenciesWithRates.map((source) => {
                const isSelected = source.id === selectedSourceId;
                const rateCount = Object.keys(
                  rateMatrix[source.id] || {}
                ).length;

                return (
                  <button
                    key={source.id}
                    onClick={() => handleSelectSource(source.id)}
                    className={`w-full text-left px-3 py-3 border-b transition-colors ${
                      isSelected
                        ? "bg-[var(--color-accent)]/10"
                        : "hover:bg-[var(--color-surface)]"
                    }`}
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div
                          className="font-medium text-sm truncate"
                          style={{
                            color: isSelected
                              ? "var(--color-accent)"
                              : "var(--color-text-primary)",
                          }}
                        >
                          {source.displayName}
                        </div>
                        {source.issuer && (
                          <div
                            className="text-xs truncate"
                            style={{ color: "var(--color-text-tertiary)" }}
                          >
                            {source.issuer}
                          </div>
                        )}
                        <div
                          className="text-xs mt-0.5"
                          style={{ color: "var(--color-text-tertiary)" }}
                        >
                          {rateCount} partner{rateCount !== 1 ? "s" : ""}
                        </div>
                      </div>
                      {isSelected && (
                        <ChevronRight
                          className="h-4 w-4 flex-shrink-0"
                          style={{ color: "var(--color-accent)" }}
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right Panel - Rate Details */}
            <div className="flex-1 flex flex-col min-w-0">
              {selectedSource ? (
                <>
                  {/* Header */}
                  <div
                    className="px-6 py-4 border-b flex items-center justify-between"
                    style={{
                      borderColor: "var(--color-border)",
                      backgroundColor: "var(--color-surface)",
                    }}
                  >
                    <div>
                      <h3
                        className="font-semibold text-lg"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {selectedSource.displayName}
                      </h3>
                      {selectedSource.issuer && (
                        <p
                          className="text-sm"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          {selectedSource.issuer}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddPartnerDialog(true)}
                        disabled={availablePartnersToAdd.length === 0}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Partner
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() =>
                          setDeleteConfirmCurrency(selectedSourceId)
                        }
                        disabled={isDeleting === selectedSourceId}
                      >
                        {isDeleting === selectedSourceId ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Partners List */}
                  <div className="flex-1 overflow-y-auto px-6 py-4">
                    {currentPartners.length === 0 ? (
                      <div
                        className="text-center py-8"
                        style={{ color: "var(--color-text-tertiary)" }}
                      >
                        <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No transfer partners</p>
                        <p className="text-xs mt-1">
                          Click "Add Partner" to add a transfer option
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div
                          className="text-xs font-medium uppercase tracking-wider mb-3"
                          style={{ color: "var(--color-text-tertiary)" }}
                        >
                          Transfer Partners ({currentPartners.length})
                        </div>
                        {currentPartners.map((partner) => (
                          <div
                            key={partner.id}
                            className="flex items-center gap-4 p-3 rounded-lg"
                            style={{ backgroundColor: "var(--color-surface)" }}
                          >
                            <div className="flex-1 min-w-0">
                              <div
                                className="font-medium text-sm"
                                style={{ color: "var(--color-text-primary)" }}
                              >
                                {partner.displayName}
                              </div>
                              {partner.issuer && (
                                <div
                                  className="text-xs"
                                  style={{
                                    color: "var(--color-text-tertiary)",
                                  }}
                                >
                                  {partner.issuer}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className="text-xs"
                                style={{ color: "var(--color-text-tertiary)" }}
                              >
                                1 pt =
                              </span>
                              <Input
                                type="number"
                                step="0.0001"
                                min="0"
                                value={editingRates[partner.id] || ""}
                                onChange={(e) =>
                                  handleRateChange(partner.id, e.target.value)
                                }
                                className="w-24 text-center"
                              />
                              <span
                                className="text-xs"
                                style={{ color: "var(--color-text-tertiary)" }}
                              >
                                mi
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleRemovePartner(partner.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div
                    className="px-6 py-4 border-t flex items-center justify-between"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    <div
                      className="text-sm"
                      style={{ color: "var(--color-text-tertiary)" }}
                    >
                      {hasChanges && "You have unsaved changes"}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() =>
                          initializeEditingRates(selectedSourceId!)
                        }
                        disabled={!hasChanges || isSaving}
                      >
                        Discard
                      </Button>
                      <Button
                        onClick={handleSave}
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
              ) : (
                <div
                  className="flex-1 flex items-center justify-center"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  <div className="text-center">
                    <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Select a program from the left</p>
                    <p className="text-xs mt-1">
                      to view and edit its transfer partners
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteConfirmCurrency}
        onOpenChange={(open) => !open && setDeleteConfirmCurrency(null)}
      >
        <DialogContent className="sm:max-w-md" hideCloseButton>
          <DialogHeader
            showCloseButton
            onClose={() => setDeleteConfirmCurrency(null)}
          >
            <DialogTitle>Delete All Transfer Partners</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete all conversion rates for "
              {sourceCurrencies.find((c) => c.id === deleteConfirmCurrency)
                ?.displayName || ""}
              "? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3">
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
                deleteConfirmCurrency &&
                handleDeleteSource(deleteConfirmCurrency)
              }
              className="flex-1"
            >
              Delete All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Partner Dialog */}
      <Dialog
        open={showAddPartnerDialog}
        onOpenChange={setShowAddPartnerDialog}
      >
        <DialogContent className="sm:max-w-md" hideCloseButton>
          <DialogHeader
            showCloseButton
            onClose={() => setShowAddPartnerDialog(false)}
          >
            <DialogTitle>Add Transfer Partner</DialogTitle>
            <DialogDescription>
              Select an airline program to add as a transfer partner for{" "}
              {selectedSource?.displayName}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={newPartnerId} onValueChange={setNewPartnerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select airline program" />
              </SelectTrigger>
              <SelectContent>
                {availablePartnersToAdd.map((partner) => (
                  <SelectItem key={partner.id} value={partner.id}>
                    <div>
                      <div>{partner.displayName}</div>
                      {partner.issuer && (
                        <div className="text-xs text-muted-foreground">
                          {partner.issuer}
                        </div>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setNewPartnerId("");
                setShowAddPartnerDialog(false);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddPartner}
              disabled={!newPartnerId}
              className="flex-1"
            >
              Add Partner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

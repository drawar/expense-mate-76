/**
 * RedemptionDialog - Form dialog for adding/editing point redemptions
 * Includes flight-specific fields and CPP (cents per point) preview
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronRight, ChevronDown, Loader2, Plane } from "lucide-react";
import { format } from "date-fns";
import SelectionDialog, {
  SelectionOption,
} from "@/components/payment-method/SelectionDialog";
import type {
  PointsRedemption,
  PointsRedemptionInput,
  RedemptionType,
  CabinClass,
} from "@/core/points/types";
import type { RewardCurrency } from "@/core/currency/types";
import { CurrencyService } from "@/core/currency";

const REDEMPTION_TYPES: { value: RedemptionType; label: string }[] = [
  { value: "flight", label: "Flight Award" },
  { value: "hotel", label: "Hotel Reward" },
  { value: "merchandise", label: "Merchandise" },
  { value: "cash_back", label: "Cash Back" },
  { value: "statement_credit", label: "Statement Credit" },
  { value: "transfer_out", label: "Transfer to Partner" },
  { value: "other", label: "Other" },
];

const REDEMPTION_TYPE_OPTIONS: SelectionOption[] = REDEMPTION_TYPES.map(
  (t) => ({
    value: t.value,
    label: t.label,
  })
);

const CABIN_CLASSES: { value: CabinClass; label: string }[] = [
  { value: "economy", label: "Economy" },
  { value: "premium_economy", label: "Premium Economy" },
  { value: "business", label: "Business" },
  { value: "first", label: "First Class" },
];

const CABIN_CLASS_OPTIONS: SelectionOption[] = CABIN_CLASSES.map((c) => ({
  value: c.value,
  label: c.label,
}));

// Use centralized currency options from CurrencyService
const CASH_CURRENCY_OPTIONS: SelectionOption[] =
  CurrencyService.getCurrencyOptions().map((c) => ({
    value: c.value,
    label: c.value, // Just show the code for compact display
  }));

interface RedemptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: PointsRedemptionInput) => Promise<void>;
  rewardCurrencies: RewardCurrency[];
  redemption?: PointsRedemption; // For editing
  defaultCurrencyId?: string;
  isLoading?: boolean;
}

export function RedemptionDialog({
  isOpen,
  onClose,
  onSubmit,
  rewardCurrencies,
  redemption,
  defaultCurrencyId,
  isLoading = false,
}: RedemptionDialogProps) {
  const isEditing = !!redemption;

  // Form state
  const [rewardCurrencyId, setRewardCurrencyId] = useState(
    defaultCurrencyId || ""
  );
  const [pointsRedeemed, setPointsRedeemed] = useState("");
  const [redemptionType, setRedemptionType] =
    useState<RedemptionType>("flight");
  const [description, setDescription] = useState("");

  // Flight-specific fields
  const [flightRoute, setFlightRoute] = useState("");
  const [cabinClass, setCabinClass] = useState<CabinClass | "">("");
  const [airline, setAirline] = useState("");
  const [bookingReference, setBookingReference] = useState("");
  const [passengers, setPassengers] = useState("1");

  // Taxes and fees
  const [taxesFees, setTaxesFees] = useState("");
  const [taxesFeesCurrency, setTaxesFeesCurrency] = useState("USD");

  // Dates
  const [redemptionDate, setRedemptionDate] = useState<Date>(new Date());
  const [travelDate, setTravelDate] = useState<Date | undefined>();

  // Selection dialog state
  const [showCurrencyDialog, setShowCurrencyDialog] = useState(false);
  const [showTypeDialog, setShowTypeDialog] = useState(false);
  const [showCabinDialog, setShowCabinDialog] = useState(false);
  const [showTaxesFeesCurrencyDialog, setShowTaxesFeesCurrencyDialog] =
    useState(false);
  const [showAirlineDialog, setShowAirlineDialog] = useState(false);
  const [showRedemptionDatePicker, setShowRedemptionDatePicker] =
    useState(false);
  const [showTravelDatePicker, setShowTravelDatePicker] = useState(false);
  const [isFlightDetailsOpen, setIsFlightDetailsOpen] = useState(true);

  // Reset form when dialog opens/closes or redemption changes
  useEffect(() => {
    if (isOpen) {
      if (redemption) {
        setRewardCurrencyId(redemption.rewardCurrencyId);
        setPointsRedeemed(String(redemption.pointsRedeemed));
        setRedemptionType(redemption.redemptionType);
        setDescription(redemption.description);
        setFlightRoute(redemption.flightRoute || "");
        setCabinClass(redemption.cabinClass || "");
        setAirline(redemption.airline || "");
        setBookingReference(redemption.bookingReference || "");
        setPassengers(String(redemption.passengers || 1));
        setTaxesFees(redemption.taxesFees ? String(redemption.taxesFees) : "");
        setTaxesFeesCurrency(redemption.taxesFeesCurrency || "USD");
        setRedemptionDate(redemption.redemptionDate);
        setTravelDate(redemption.travelDate);
      } else {
        setRewardCurrencyId(defaultCurrencyId || "");
        setPointsRedeemed("");
        setRedemptionType("flight");
        setDescription("");
        setFlightRoute("");
        setCabinClass("");
        setAirline("");
        setBookingReference("");
        setPassengers("1");
        setTaxesFees("");
        setTaxesFeesCurrency("USD");
        setRedemptionDate(new Date());
        setTravelDate(undefined);
      }
    }
  }, [isOpen, redemption, defaultCurrencyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numPoints = Number(pointsRedeemed);
    if (!rewardCurrencyId || isNaN(numPoints) || numPoints <= 0) {
      return;
    }

    await onSubmit({
      rewardCurrencyId,
      pointsRedeemed: numPoints,
      redemptionType,
      description,
      flightRoute: flightRoute || undefined,
      cabinClass: cabinClass || undefined,
      airline: airline || undefined,
      bookingReference: bookingReference || undefined,
      passengers: passengers ? Number(passengers) : undefined,
      taxesFees: taxesFees ? Number(taxesFees) : undefined,
      taxesFeesCurrency: taxesFees ? taxesFeesCurrency : undefined,
      redemptionDate,
      travelDate,
    });
  };

  const isFlightRedemption = redemptionType === "flight";
  const selectedCurrency = (rewardCurrencies || []).find(
    (c) => c.id === rewardCurrencyId
  );

  // Build currency options for selection dialog
  const currencyOptions: SelectionOption[] = (rewardCurrencies || []).map(
    (c) => ({
      value: c.id,
      label: c.displayName,
      description: c.issuer || undefined,
    })
  );

  // Build airline options from unique issuers
  const airlineOptions: SelectionOption[] = useMemo(() => {
    const uniqueIssuers = new Set<string>();
    (rewardCurrencies || []).forEach((c) => {
      if (c.issuer) uniqueIssuers.add(c.issuer);
    });
    return Array.from(uniqueIssuers)
      .sort()
      .map((issuer) => ({
        value: issuer,
        label: issuer,
      }));
  }, [rewardCurrencies]);

  const getTypeLabel = () => {
    return (
      REDEMPTION_TYPES.find((t) => t.value === redemptionType)?.label ||
      "Select type"
    );
  };

  const getCabinLabel = () => {
    return (
      CABIN_CLASSES.find((c) => c.value === cabinClass)?.label || "Select cabin"
    );
  };

  // Check if any selection dialog is open
  const isAnySelectionDialogOpen =
    showCurrencyDialog ||
    showTypeDialog ||
    showCabinDialog ||
    showTaxesFeesCurrencyDialog ||
    showAirlineDialog ||
    showRedemptionDatePicker ||
    showTravelDatePicker;

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => !open && !isAnySelectionDialogOpen && onClose()}
      >
        <DialogContent
          className="sm:max-w-lg max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden"
          hideCloseButton
        >
          <DialogHeader
            className="border-b flex-shrink-0"
            showCloseButton
            onClose={onClose}
          >
            <DialogTitle>
              {isEditing ? "Edit Redemption" : "Record Points Redemption"}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col flex-1 min-h-0 overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 min-h-0">
              {/* Reward Currency */}
              <button
                type="button"
                onClick={() => !isEditing && setShowCurrencyDialog(true)}
                className="w-full py-3 flex items-center justify-between text-base md:text-sm"
                disabled={isEditing}
              >
                <span
                  className="font-medium whitespace-nowrap shrink-0"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Reward Currency
                </span>
                <span className="flex items-center gap-1">
                  <span
                    className="truncate"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {selectedCurrency?.displayName || "Select currency"}
                  </span>
                  {!isEditing && (
                    <ChevronRight
                      className="h-4 w-4 shrink-0"
                      style={{ color: "var(--color-text-tertiary)" }}
                    />
                  )}
                </span>
              </button>

              {/* Redemption Type */}
              <button
                type="button"
                onClick={() => setShowTypeDialog(true)}
                className="w-full py-3 flex items-center justify-between text-base md:text-sm"
              >
                <span
                  className="font-medium whitespace-nowrap shrink-0"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Type
                </span>
                <span className="flex items-center gap-1">
                  <span
                    className="truncate"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {getTypeLabel()}
                  </span>
                  <ChevronRight
                    className="h-4 w-4 shrink-0"
                    style={{ color: "var(--color-text-tertiary)" }}
                  />
                </span>
              </button>

              {/* Points Redeemed */}
              <div className="py-3 flex items-center justify-between gap-4">
                <label
                  htmlFor="points"
                  className="text-base md:text-sm font-medium shrink-0"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Points
                </label>
                <Input
                  id="points"
                  type="text"
                  inputMode="numeric"
                  placeholder="50000"
                  value={pointsRedeemed}
                  onChange={(e) =>
                    setPointsRedeemed(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  className="h-9 rounded-lg text-base md:text-sm text-right border-none shadow-none pl-0 pr-2 focus-visible:ring-0 w-32"
                  style={{
                    backgroundColor: "transparent",
                    color: "var(--color-text-primary)",
                  }}
                />
              </div>

              {/* Points Preview */}
              {selectedCurrency && pointsRedeemed && (
                <p
                  className="text-sm text-right pb-2"
                  style={{ color: "var(--color-error)" }}
                >
                  -{Number(pointsRedeemed).toLocaleString()}{" "}
                  {selectedCurrency.displayName}
                </p>
              )}

              {/* Redemption Date */}
              <Popover
                open={showRedemptionDatePicker}
                onOpenChange={setShowRedemptionDatePicker}
              >
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="w-full py-3 flex items-center justify-between text-base md:text-sm"
                  >
                    <span
                      className="font-medium whitespace-nowrap shrink-0"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      Redemption Date
                    </span>
                    <span className="flex items-center gap-1">
                      <span
                        className="truncate"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {format(redemptionDate, "yyyy-MM-dd")}
                      </span>
                      <ChevronRight
                        className="h-4 w-4 shrink-0"
                        style={{ color: "var(--color-text-tertiary)" }}
                      />
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0"
                  align="end"
                  side="top"
                  sideOffset={4}
                >
                  <Calendar
                    mode="single"
                    selected={redemptionDate}
                    onSelect={(date) => {
                      if (date) {
                        setRedemptionDate(date);
                        setShowRedemptionDatePicker(false);
                      }
                    }}
                    defaultMonth={redemptionDate}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {/* Flight Details (collapsible) */}
              {isFlightRedemption && (
                <Collapsible
                  open={isFlightDetailsOpen}
                  onOpenChange={setIsFlightDetailsOpen}
                  className="pt-4"
                >
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 text-sm font-medium py-2"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      <Plane className="h-4 w-4" />
                      <span>Flight Details</span>
                      <ChevronDown
                        className={`h-4 w-4 ml-auto transition-transform ${
                          isFlightDetailsOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 pt-2">
                    {/* Route */}
                    <div className="py-3 flex items-center justify-between gap-4">
                      <label
                        htmlFor="route"
                        className="text-base md:text-sm font-medium shrink-0"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        Route
                      </label>
                      <Input
                        id="route"
                        placeholder="SFO → NRT → SIN"
                        value={flightRoute}
                        onChange={(e) => setFlightRoute(e.target.value)}
                        className="h-9 rounded-lg text-base md:text-sm text-right border-none shadow-none pl-0 pr-2 focus-visible:ring-0 flex-1 max-w-[180px]"
                        style={{
                          backgroundColor: "transparent",
                          color: "var(--color-text-primary)",
                        }}
                      />
                    </div>

                    {/* Cabin Class */}
                    <button
                      type="button"
                      onClick={() => setShowCabinDialog(true)}
                      className="w-full py-3 flex items-center justify-between text-base md:text-sm"
                    >
                      <span
                        className="font-medium whitespace-nowrap shrink-0"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        Cabin
                      </span>
                      <span className="flex items-center gap-1">
                        <span
                          className="truncate"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          {getCabinLabel()}
                        </span>
                        <ChevronRight
                          className="h-4 w-4 shrink-0"
                          style={{ color: "var(--color-text-tertiary)" }}
                        />
                      </span>
                    </button>

                    {/* Airline */}
                    <button
                      type="button"
                      onClick={() => setShowAirlineDialog(true)}
                      className="w-full py-3 flex items-center justify-between text-base md:text-sm"
                    >
                      <span
                        className="font-medium whitespace-nowrap shrink-0"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        Airline
                      </span>
                      <span className="flex items-center gap-1">
                        <span
                          className="truncate"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          {airline || "Select airline"}
                        </span>
                        <ChevronRight
                          className="h-4 w-4 shrink-0"
                          style={{ color: "var(--color-text-tertiary)" }}
                        />
                      </span>
                    </button>

                    {/* Passengers */}
                    <div className="py-3 flex items-center justify-between gap-4">
                      <label
                        htmlFor="passengers"
                        className="text-base md:text-sm font-medium shrink-0"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        Passengers
                      </label>
                      <Input
                        id="passengers"
                        type="text"
                        inputMode="numeric"
                        placeholder="1"
                        value={passengers}
                        onChange={(e) =>
                          setPassengers(e.target.value.replace(/[^0-9]/g, ""))
                        }
                        className="h-9 rounded-lg text-base md:text-sm text-right border-none shadow-none pl-0 pr-2 focus-visible:ring-0 w-20"
                        style={{
                          backgroundColor: "transparent",
                          color: "var(--color-text-primary)",
                        }}
                      />
                    </div>

                    {/* Booking Reference */}
                    <div className="py-3 flex items-center justify-between gap-4">
                      <label
                        htmlFor="booking"
                        className="text-base md:text-sm font-medium shrink-0"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        Booking Ref
                      </label>
                      <Input
                        id="booking"
                        placeholder="ABC123"
                        value={bookingReference}
                        onChange={(e) => setBookingReference(e.target.value)}
                        className="h-9 rounded-lg text-base md:text-sm text-right border-none shadow-none pl-0 pr-2 focus-visible:ring-0 w-32"
                        style={{
                          backgroundColor: "transparent",
                          color: "var(--color-text-primary)",
                        }}
                      />
                    </div>

                    {/* Travel Date */}
                    <Popover
                      open={showTravelDatePicker}
                      onOpenChange={setShowTravelDatePicker}
                    >
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="w-full py-3 flex items-center justify-between text-base md:text-sm"
                        >
                          <span
                            className="font-medium whitespace-nowrap shrink-0"
                            style={{ color: "var(--color-text-secondary)" }}
                          >
                            Travel Date
                          </span>
                          <span className="flex items-center gap-1">
                            <span
                              className="truncate"
                              style={{ color: "var(--color-text-primary)" }}
                            >
                              {travelDate
                                ? format(travelDate, "yyyy-MM-dd")
                                : "Select date"}
                            </span>
                            <ChevronRight
                              className="h-4 w-4 shrink-0"
                              style={{ color: "var(--color-text-tertiary)" }}
                            />
                          </span>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0"
                        align="end"
                        side="top"
                        sideOffset={4}
                      >
                        <Calendar
                          mode="single"
                          selected={travelDate}
                          onSelect={(date) => {
                            setTravelDate(date);
                            setShowTravelDatePicker(false);
                          }}
                          defaultMonth={travelDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Taxes and Fees Section */}
              <div className="pt-4">
                <p
                  className="text-xs font-medium uppercase tracking-wide pb-2"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  Taxes and Fees
                </p>

                {/* Fee Currency */}
                <button
                  type="button"
                  onClick={() => setShowTaxesFeesCurrencyDialog(true)}
                  className="w-full py-3 flex items-center justify-between text-base md:text-sm"
                >
                  <span
                    className="font-medium whitespace-nowrap shrink-0"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Currency
                  </span>
                  <span className="flex items-center gap-1">
                    <span
                      className="truncate"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {taxesFeesCurrency}
                    </span>
                    <ChevronRight
                      className="h-4 w-4 shrink-0"
                      style={{ color: "var(--color-text-tertiary)" }}
                    />
                  </span>
                </button>

                {/* Fee Amount */}
                <div className="py-3 flex items-center justify-between gap-4">
                  <label
                    htmlFor="taxesFees"
                    className="text-base md:text-sm font-medium shrink-0"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Amount
                  </label>
                  <Input
                    id="taxesFees"
                    type="text"
                    inputMode="decimal"
                    placeholder="150.00"
                    value={taxesFees}
                    onChange={(e) => setTaxesFees(e.target.value)}
                    className="h-9 rounded-lg text-base md:text-sm text-right border-none shadow-none pl-0 pr-2 focus-visible:ring-0 w-32"
                    style={{
                      backgroundColor: "transparent",
                      color: "var(--color-text-primary)",
                    }}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="pt-4 space-y-2">
                <label
                  htmlFor="description"
                  className="text-base md:text-sm font-medium"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Notes
                </label>
                <Textarea
                  id="description"
                  placeholder="e.g., Round trip award flight to Tokyo"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="text-base md:text-sm"
                />
              </div>
            </div>

            {/* Footer */}
            <div
              className="px-4 py-4 border-t flex gap-3 flex-shrink-0"
              style={{ borderColor: "var(--color-border)" }}
            >
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={
                  isLoading ||
                  !rewardCurrencyId ||
                  !pointsRedeemed ||
                  Number(pointsRedeemed) <= 0
                }
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Save Changes" : "Record Redemption"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Selection Dialogs */}
      <SelectionDialog
        open={showCurrencyDialog}
        onOpenChange={setShowCurrencyDialog}
        onCloseAll={onClose}
        title="Reward Currency"
        options={currencyOptions}
        selectedValue={rewardCurrencyId}
        onSelect={(value) => {
          setRewardCurrencyId(value);
        }}
      />

      <SelectionDialog
        open={showTypeDialog}
        onOpenChange={setShowTypeDialog}
        onCloseAll={onClose}
        title="Redemption Type"
        options={REDEMPTION_TYPE_OPTIONS}
        selectedValue={redemptionType}
        onSelect={(value) => {
          setRedemptionType(value as RedemptionType);
        }}
      />

      <SelectionDialog
        open={showCabinDialog}
        onOpenChange={setShowCabinDialog}
        onCloseAll={onClose}
        title="Cabin Class"
        options={CABIN_CLASS_OPTIONS}
        selectedValue={cabinClass}
        onSelect={(value) => {
          setCabinClass(value as CabinClass);
        }}
      />

      <SelectionDialog
        open={showAirlineDialog}
        onOpenChange={setShowAirlineDialog}
        onCloseAll={onClose}
        title="Airline"
        options={airlineOptions}
        selectedValue={airline}
        onSelect={(value) => {
          setAirline(value);
        }}
      />

      <SelectionDialog
        open={showTaxesFeesCurrencyDialog}
        onOpenChange={setShowTaxesFeesCurrencyDialog}
        onCloseAll={onClose}
        title="Fee Currency"
        options={CASH_CURRENCY_OPTIONS}
        selectedValue={taxesFeesCurrency}
        onSelect={(value) => {
          setTaxesFeesCurrency(value);
        }}
      />
    </>
  );
}

export default RedemptionDialog;

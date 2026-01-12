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
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Loader2, Plane } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type {
  PointsRedemption,
  PointsRedemptionInput,
  RedemptionType,
  CabinClass,
} from "@/core/points/types";
import type { RewardCurrency } from "@/core/currency/types";
import { CPPBadge } from "./BalanceCard";

const REDEMPTION_TYPES: { value: RedemptionType; label: string }[] = [
  { value: "flight", label: "Flight Award" },
  { value: "hotel", label: "Hotel Reward" },
  { value: "merchandise", label: "Merchandise" },
  { value: "cash_back", label: "Cash Back" },
  { value: "statement_credit", label: "Statement Credit" },
  { value: "transfer_out", label: "Transfer to Partner" },
  { value: "other", label: "Other" },
];

const CABIN_CLASSES: { value: CabinClass; label: string }[] = [
  { value: "economy", label: "Economy" },
  { value: "premium_economy", label: "Premium Economy" },
  { value: "business", label: "Business" },
  { value: "first", label: "First Class" },
];

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

  // CPP fields
  const [cashValue, setCashValue] = useState("");
  const [cashValueCurrency, setCashValueCurrency] = useState("USD");

  // Dates
  const [redemptionDate, setRedemptionDate] = useState<Date>(new Date());
  const [travelDate, setTravelDate] = useState<Date | undefined>();

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
        setCashValue(redemption.cashValue ? String(redemption.cashValue) : "");
        setCashValueCurrency(redemption.cashValueCurrency || "USD");
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
        setCashValue("");
        setCashValueCurrency("USD");
        setRedemptionDate(new Date());
        setTravelDate(undefined);
      }
    }
  }, [isOpen, redemption, defaultCurrencyId]);

  // Calculate CPP in real-time
  const calculatedCpp = useMemo(() => {
    const points = Number(pointsRedeemed);
    const value = Number(cashValue);
    if (points > 0 && value > 0) {
      // CPP = (cash value in cents) / points
      return (value * 100) / points;
    }
    return null;
  }, [pointsRedeemed, cashValue]);

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
      cashValue: cashValue ? Number(cashValue) : undefined,
      cashValueCurrency: cashValue ? cashValueCurrency : undefined,
      redemptionDate,
      travelDate,
    });
  };

  const isFlightRedemption = redemptionType === "flight";
  const selectedCurrency = (rewardCurrencies || []).find(
    (c) => c.id === rewardCurrencyId
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Redemption" : "Record Points Redemption"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Reward Currency */}
          <div className="space-y-2">
            <Label htmlFor="currency">Reward Currency</Label>
            <Select
              value={rewardCurrencyId}
              onValueChange={setRewardCurrencyId}
              disabled={isEditing}
            >
              <SelectTrigger id="currency">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {(rewardCurrencies || []).map((currency) => (
                  <SelectItem key={currency.id} value={currency.id}>
                    {currency.displayName}
                    {currency.issuer && (
                      <span className="text-muted-foreground ml-1">
                        ({currency.issuer})
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Redemption Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Redemption Type</Label>
            <Select
              value={redemptionType}
              onValueChange={(v) => setRedemptionType(v as RedemptionType)}
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REDEMPTION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Points Redeemed */}
          <div className="space-y-2">
            <Label htmlFor="points">Points Redeemed</Label>
            <Input
              id="points"
              type="number"
              min="0"
              step="1"
              placeholder="50000"
              value={pointsRedeemed}
              onChange={(e) => setPointsRedeemed(e.target.value)}
            />
            {selectedCurrency && pointsRedeemed && (
              <p className="text-sm text-muted-foreground">
                {Number(pointsRedeemed).toLocaleString()}{" "}
                {selectedCurrency.displayName}
              </p>
            )}
          </div>

          {/* Flight-specific fields */}
          {isFlightRedemption && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Plane className="h-4 w-4" />
                Flight Details
              </div>

              {/* Route */}
              <div className="space-y-2">
                <Label htmlFor="route">Route</Label>
                <Input
                  id="route"
                  placeholder="e.g., SFO → NRT → SIN"
                  value={flightRoute}
                  onChange={(e) => setFlightRoute(e.target.value)}
                />
              </div>

              {/* Cabin Class & Airline */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="cabin">Cabin Class</Label>
                  <Select
                    value={cabinClass}
                    onValueChange={(v) => setCabinClass(v as CabinClass)}
                  >
                    <SelectTrigger id="cabin">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {CABIN_CLASSES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="airline">Airline</Label>
                  <Input
                    id="airline"
                    placeholder="e.g., Singapore Airlines"
                    value={airline}
                    onChange={(e) => setAirline(e.target.value)}
                  />
                </div>
              </div>

              {/* Passengers & Booking Reference */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="passengers">Passengers</Label>
                  <Input
                    id="passengers"
                    type="number"
                    min="1"
                    value={passengers}
                    onChange={(e) => setPassengers(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="booking">Booking Ref</Label>
                  <Input
                    id="booking"
                    placeholder="e.g., ABC123"
                    value={bookingReference}
                    onChange={(e) => setBookingReference(e.target.value)}
                  />
                </div>
              </div>

              {/* Travel Date */}
              <div className="space-y-2">
                <Label>Travel Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !travelDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {travelDate ? (
                        format(travelDate, "PPP")
                      ) : (
                        <span>Pick travel date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={travelDate}
                      onSelect={setTravelDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          {/* Cash Value for CPP */}
          <div className="space-y-2">
            <Label htmlFor="cashValue">Cash Value (for CPP calculation)</Label>
            <div className="flex gap-2">
              <Select
                value={cashValueCurrency}
                onValueChange={setCashValueCurrency}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="SGD">SGD</SelectItem>
                  <SelectItem value="CAD">CAD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
              <Input
                id="cashValue"
                type="number"
                min="0"
                step="0.01"
                placeholder="1500.00"
                value={cashValue}
                onChange={(e) => setCashValue(e.target.value)}
                className="flex-1"
              />
            </div>
            {calculatedCpp !== null && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">CPP:</span>
                <CPPBadge cpp={calculatedCpp} />
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Enter what you would have paid in cash for this redemption
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="e.g., Round trip award flight to Tokyo"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Redemption Date */}
          <div className="space-y-2">
            <Label>Redemption Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !redemptionDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {redemptionDate ? (
                    format(redemptionDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={redemptionDate}
                  onSelect={(date) => date && setRedemptionDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default RedemptionDialog;

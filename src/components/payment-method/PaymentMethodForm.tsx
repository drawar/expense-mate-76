import React, { useState, useEffect } from "react";
import { PaymentMethod, Currency } from "@/types";
import { CurrencyService, ConversionService } from "@/core/currency";
import { RewardCurrency } from "@/core/currency/types";
import { v4 as uuidv4 } from "uuid";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

interface PaymentMethodFormProps {
  currentMethod: PaymentMethod | null;
  isEditing: boolean;
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  isOpen: boolean; // Add this prop to control the dialog open state
}

const currencyOptions = CurrencyService.getCurrencyOptions();

const PaymentMethodForm: React.FC<PaymentMethodFormProps> = ({
  currentMethod,
  isEditing,
  isLoading,
  onClose,
  onSubmit,
  isOpen, // Use this prop to control the dialog
}) => {
  // All form fields as controlled state
  const [name, setName] = useState<string>(currentMethod?.name || "");
  const [selectedType, setSelectedType] = useState<string>(
    currentMethod?.type || "credit_card"
  );
  const [currency, setCurrency] = useState<string>(
    currentMethod?.currency || "CAD"
  );
  const [issuer, setIssuer] = useState<string>(currentMethod?.issuer || "");
  const [lastFourDigits, setLastFourDigits] = useState<string>(
    currentMethod?.lastFourDigits || ""
  );
  const [pointsCurrency, setPointsCurrency] = useState<string>(
    currentMethod?.pointsCurrency || ""
  );
  const [rewardCurrencyId, setRewardCurrencyId] = useState<string>(
    currentMethod?.rewardCurrencyId || ""
  );
  const [statementStartDay, setStatementStartDay] = useState<string>(
    currentMethod?.statementStartDay?.toString() || ""
  );
  const [isMonthlyStatement, setIsMonthlyStatement] = useState<boolean>(
    currentMethod?.isMonthlyStatement || false
  );
  const [active, setActive] = useState<boolean>(currentMethod?.active ?? true);

  // Reward currencies from database
  const [rewardCurrencies, setRewardCurrencies] = useState<RewardCurrency[]>(
    []
  );
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(false);

  // Fetch all reward currencies when dialog opens
  useEffect(() => {
    if (isOpen) {
      const fetchCurrencies = async () => {
        setIsLoadingCurrencies(true);
        try {
          const conversionService = ConversionService.getInstance();
          const currencies = await conversionService.getRewardCurrencies();
          setRewardCurrencies(currencies);
        } catch (error) {
          console.error("Error fetching reward currencies:", error);
        } finally {
          setIsLoadingCurrencies(false);
        }
      };
      fetchCurrencies();
    }
  }, [isOpen]);

  // Reset all form values when dialog opens with different method
  useEffect(() => {
    setName(currentMethod?.name || "");
    setSelectedType(currentMethod?.type || "credit_card");
    setCurrency(currentMethod?.currency || "CAD");
    setIssuer(currentMethod?.issuer || "");
    setLastFourDigits(currentMethod?.lastFourDigits || "");
    setPointsCurrency(currentMethod?.pointsCurrency || "");
    setRewardCurrencyId(currentMethod?.rewardCurrencyId || "");
    setStatementStartDay(currentMethod?.statementStartDay?.toString() || "");
    setIsMonthlyStatement(currentMethod?.isMonthlyStatement || false);
    setActive(currentMethod?.active ?? true);
  }, [currentMethod, isOpen]);

  const isCreditCard = selectedType === "credit_card";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Payment Method" : "Add Payment Method"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details of your payment method"
              : "Add a new payment method for tracking expenses"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit}>
          {/* Hidden inputs to sync controlled state values with FormData */}
          <input type="hidden" name="type" value={selectedType} />
          <input type="hidden" name="currency" value={currency} />
          <input type="hidden" name="pointsCurrency" value={pointsCurrency} />
          <input
            type="hidden"
            name="rewardCurrencyId"
            value={rewardCurrencyId}
          />
          <input
            type="hidden"
            name="isMonthlyStatement"
            value={isMonthlyStatement ? "on" : ""}
          />
          <input type="hidden" name="active" value={active ? "on" : ""} />
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g. Chase Sapphire"
                className="col-span-3"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select payment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="prepaid_card">Prepaid Card</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="currency" className="text-right">
                Currency
              </Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="col-span-3">
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

            {isCreditCard ? (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="issuer" className="text-right">
                    Issuer
                  </Label>
                  <Input
                    id="issuer"
                    name="issuer"
                    placeholder="e.g. Chase, Amex"
                    className="col-span-3"
                    value={issuer}
                    onChange={(e) => setIssuer(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="lastFourDigits" className="text-right">
                    Last 4 Digits
                  </Label>
                  <Input
                    id="lastFourDigits"
                    name="lastFourDigits"
                    placeholder="e.g. 1234"
                    className="col-span-3"
                    maxLength={4}
                    value={lastFourDigits}
                    onChange={(e) => setLastFourDigits(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="rewardCurrency" className="text-right">
                    Rewards Currency
                  </Label>
                  <Select
                    value={rewardCurrencyId}
                    onValueChange={(value) => {
                      setRewardCurrencyId(value);
                      // Also set pointsCurrency for backward compatibility
                      const selected = rewardCurrencies.find(
                        (c) => c.id === value
                      );
                      if (selected) {
                        setPointsCurrency(selected.displayName);
                      }
                    }}
                    disabled={isLoadingCurrencies}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue
                        placeholder={
                          isLoadingCurrencies
                            ? "Loading..."
                            : "Select rewards currency"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {rewardCurrencies.map((currency) => (
                        <SelectItem key={currency.id} value={currency.id}>
                          {currency.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="statementStartDay" className="text-right">
                    Statement Day
                  </Label>
                  <Input
                    id="statementStartDay"
                    name="statementStartDay"
                    type="number"
                    min="1"
                    max="31"
                    placeholder="e.g. 15"
                    className="col-span-3"
                    value={statementStartDay}
                    onChange={(e) => setStatementStartDay(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Statement Type</Label>
                  <div className="col-span-3 flex items-center space-x-2">
                    <Switch
                      id="isMonthlyStatement"
                      name="isMonthlyStatement"
                      checked={isMonthlyStatement}
                      onCheckedChange={setIsMonthlyStatement}
                    />
                    <Label htmlFor="isMonthlyStatement">
                      Use statement month (instead of calendar month)
                    </Label>
                  </div>
                </div>
              </>
            ) : null}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Status</Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Switch
                  id="active"
                  name="active"
                  checked={active}
                  onCheckedChange={setActive}
                />
                <Label htmlFor="active">Active</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : isEditing ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentMethodForm;

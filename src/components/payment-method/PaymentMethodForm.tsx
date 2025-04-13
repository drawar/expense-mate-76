import React, { useState } from "react";
import { PaymentMethod, Currency } from "@/types";
import { CurrencyService } from "@/services/currency";
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
                defaultValue={currentMethod?.name || ""}
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <Select
                name="type"
                defaultValue={currentMethod?.type || "credit_card"}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select payment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="currency" className="text-right">
                Currency
              </Label>
              <Select
                name="currency"
                defaultValue={currentMethod?.currency || "USD"}
              >
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

            {currentMethod?.type === "credit_card" || !currentMethod ? (
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
                    defaultValue={currentMethod?.issuer || ""}
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
                    defaultValue={currentMethod?.lastFourDigits || ""}
                  />
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
                    defaultValue={
                      currentMethod?.statementStartDay?.toString() || ""
                    }
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Statement Type</Label>
                  <div className="col-span-3 flex items-center space-x-2">
                    <Switch
                      id="isMonthlyStatement"
                      name="isMonthlyStatement"
                      defaultChecked={currentMethod?.isMonthlyStatement}
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
                  defaultChecked={currentMethod?.active ?? true}
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

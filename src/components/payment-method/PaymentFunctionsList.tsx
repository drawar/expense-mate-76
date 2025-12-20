import React from "react";
import { PaymentMethod } from "@/types";
import {
  ToggleLeftIcon,
  ToggleRightIcon,
  EditIcon,
  ImageIcon,
  CreditCardIcon,
  BanknoteIcon,
  CalendarIcon,
  ChevronRightIcon,
} from "lucide-react";
import { CurrencyService } from "@/core/currency/CurrencyService";
import { Button } from "@/components/ui/button";
import { useTransactionsQuery } from "@/hooks/queries/useTransactionsQuery";
import { Separator } from "@/components/ui/separator";
import { RewardRule } from "@/core/rewards/types";
import { RewardRulesSection } from "./RewardRulesSection";

interface PaymentFunctionsListProps {
  paymentMethod: PaymentMethod;
  rewardRules: RewardRule[];
  onToggleActive: (id: string) => void;
  onEdit: (method: PaymentMethod) => void;
  onImageUpload: (method: PaymentMethod) => void;
  onRulesChanged?: () => void;
}

export const PaymentFunctionsList: React.FC<PaymentFunctionsListProps> = ({
  paymentMethod,
  rewardRules,
  onToggleActive,
  onEdit,
  onImageUpload,
  onRulesChanged,
}) => {
  const { data: allTransactions = [] } = useTransactionsQuery();

  // Filter transactions for this payment method
  const paymentMethodTransactions = allTransactions.filter(
    (tx) => tx.paymentMethod.id === paymentMethod.id && !tx.is_deleted
  );

  // Calculate total spent with this payment method
  const totalSpent = paymentMethodTransactions.reduce(
    (total, tx) => total + tx.paymentAmount,
    0
  );

  // Calculate total reward points earned
  const totalRewardPoints = paymentMethodTransactions.reduce(
    (total, tx) => total + (tx.rewardPoints || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
        <h2 className="text-xl font-semibold flex items-center">
          {paymentMethod.type === "credit_card" ? (
            <CreditCardIcon
              className="h-5 w-5 mr-2"
              style={{
                color: "var(--color-icon-primary)",
                strokeWidth: 2.5,
              }}
            />
          ) : (
            <BanknoteIcon
              className="h-5 w-5 mr-2"
              style={{
                color: "var(--color-icon-primary)",
                strokeWidth: 2.5,
              }}
            />
          )}
          {paymentMethod.type === "credit_card"
            ? `${paymentMethod.issuer} ${paymentMethod.name}`
            : paymentMethod.name}
        </h2>

        <Button
          variant={paymentMethod.active ? "default" : "outline"}
          size="sm"
          className="mt-2 sm:mt-0"
          onClick={() => onToggleActive(paymentMethod.id)}
        >
          {paymentMethod.active ? (
            <ToggleRightIcon
              className="h-4 w-4 mr-2 text-green-500"
              style={{ strokeWidth: 2.5 }}
            />
          ) : (
            <ToggleLeftIcon
              className="h-4 w-4 mr-2"
              style={{
                color: "var(--color-icon-secondary)",
                strokeWidth: 2.5,
              }}
            />
          )}
          {paymentMethod.active ? "Active" : "Inactive"}
        </Button>
      </div>

      <Separator />

      {/* Stats summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-muted/40 rounded-lg p-4">
          <h3 className="text-sm text-muted-foreground mb-1">Total Spent</h3>
          <p className="text-xl font-semibold">
            {CurrencyService.format(totalSpent, paymentMethod.currency)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {paymentMethodTransactions.length} transactions
          </p>
        </div>

        {paymentMethod.type === "credit_card" && (
          <>
            <div className="bg-muted/40 rounded-lg p-4">
              <h3 className="text-sm text-muted-foreground mb-1">
                Reward Points
              </h3>
              <p className="text-xl font-semibold">
                {totalRewardPoints.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Total earned points
              </p>
            </div>

            <div className="bg-muted/40 rounded-lg p-4">
              <h3 className="text-sm text-muted-foreground mb-1">
                Statement Cycle
              </h3>
              <p className="text-xl font-semibold">
                {paymentMethod.statementStartDay
                  ? `Day ${paymentMethod.statementStartDay}`
                  : "Calendar Month"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Billing cycle
              </p>
            </div>
          </>
        )}
      </div>

      {/* Payment Method Settings */}
      <div className="bg-card rounded-lg shadow-sm border">
        <div className="divide-y">
          {/* Edit payment method */}
          <div
            className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => onEdit(paymentMethod)}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <EditIcon
                  className="h-4 w-4 mr-3"
                  style={{
                    color: "var(--color-icon-secondary)",
                    strokeWidth: 2.5,
                  }}
                />
                <div>
                  <h3 className="font-medium">Edit Payment Method</h3>
                  <p className="text-sm text-muted-foreground">
                    Update name, currency, and other details
                  </p>
                </div>
              </div>
              <ChevronRightIcon
                className="h-5 w-5"
                style={{
                  color: "var(--color-icon-secondary)",
                  strokeWidth: 2.5,
                }}
              />
            </div>
          </div>

          {/* Upload card image - only for credit cards */}
          {paymentMethod.type === "credit_card" && (
            <div
              className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => onImageUpload(paymentMethod)}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <ImageIcon
                    className="h-4 w-4 mr-3"
                    style={{
                      color: "var(--color-icon-secondary)",
                      strokeWidth: 2.5,
                    }}
                  />
                  <div>
                    <h3 className="font-medium">Upload Card Image</h3>
                    <p className="text-sm text-muted-foreground">
                      {paymentMethod.imageUrl
                        ? "Change card image"
                        : "Add an image of your card"}
                    </p>
                  </div>
                </div>
                <ChevronRightIcon
                  className="h-5 w-5"
                  style={{
                    color: "var(--color-icon-secondary)",
                    strokeWidth: 2.5,
                  }}
                />
              </div>
            </div>
          )}

          {/* Statement details */}
          {paymentMethod.type === "credit_card" && (
            <div className="p-4 hover:bg-muted/50 transition-colors">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <CalendarIcon
                    className="h-4 w-4 mr-3"
                    style={{
                      color: "var(--color-icon-secondary)",
                      strokeWidth: 2.5,
                    }}
                  />
                  <div>
                    <h3 className="font-medium">Statement Details</h3>
                    <p className="text-sm text-muted-foreground">
                      {paymentMethod.statementStartDay
                        ? `Statement starts on day ${paymentMethod.statementStartDay} of each month`
                        : "Calendar month billing cycle"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Unified Reward Rules Section - only for credit cards */}
      {paymentMethod.type === "credit_card" && (
        <RewardRulesSection
          paymentMethod={paymentMethod}
          rewardRules={rewardRules}
          onRulesChanged={onRulesChanged}
        />
      )}
    </div>
  );
};

import React, { useState } from "react";
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
  AlertTriangle,
} from "lucide-react";
import { CurrencyService } from "@/core/currency/CurrencyService";
import { Button } from "@/components/ui/button";
import { useTransactionsQuery } from "@/hooks/queries/useTransactionsQuery";
import { Separator } from "@/components/ui/separator";
import { RewardRule } from "@/core/rewards/types";
import { RewardRulesSection } from "./RewardRulesSection";
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

  // Deactivation confirmation state
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);

  const handleToggleClick = () => {
    if (paymentMethod.active) {
      // Show confirmation when deactivating
      setShowDeactivateConfirm(true);
    } else {
      // Reactivate immediately
      onToggleActive(paymentMethod.id);
    }
  };

  const handleConfirmDeactivate = () => {
    onToggleActive(paymentMethod.id);
    setShowDeactivateConfirm(false);
  };

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

  // Calculate current statement period
  const getStatementPeriod = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const statementDay = paymentMethod.statementStartDay || 1;
    const isStatementMonth = paymentMethod.isMonthlyStatement;

    if (!isStatementMonth) {
      // Calendar month: 1st to last day of month
      const firstDay = new Date(currentYear, currentMonth, 1);
      const lastDay = new Date(currentYear, currentMonth + 1, 0);
      const daysRemaining = lastDay.getDate() - today.getDate();
      return {
        start: firstDay,
        end: lastDay,
        daysRemaining: Math.max(0, daysRemaining),
        label: "Calendar month",
      };
    }

    // Statement month: based on statement start day
    let startDate: Date;
    let endDate: Date;

    if (today.getDate() >= statementDay) {
      // Current statement period started this month
      startDate = new Date(currentYear, currentMonth, statementDay);
      endDate = new Date(currentYear, currentMonth + 1, statementDay - 1);
    } else {
      // Current statement period started last month
      startDate = new Date(currentYear, currentMonth - 1, statementDay);
      endDate = new Date(currentYear, currentMonth, statementDay - 1);
    }

    const daysRemaining = Math.ceil(
      (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      start: startDate,
      end: endDate,
      daysRemaining: Math.max(0, daysRemaining),
      label: "Statement month",
    };
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const statementPeriod =
    paymentMethod.type === "credit_card" ? getStatementPeriod() : null;

  return (
    <div className="space-y-6">
      {/* Japandi Header - Clean, restrained */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
        <h2
          className="text-xl font-medium flex items-center"
          style={{
            color: "var(--color-text-primary)",
            letterSpacing: "-0.2px",
          }}
        >
          {paymentMethod.type === "credit_card" ? (
            <CreditCardIcon
              className="h-5 w-5 mr-2"
              style={{
                color: "var(--color-accent)",
                strokeWidth: 2,
              }}
            />
          ) : (
            <BanknoteIcon
              className="h-5 w-5 mr-2"
              style={{
                color: "var(--color-accent)",
                strokeWidth: 2,
              }}
            />
          )}
          {paymentMethod.type === "credit_card"
            ? `${paymentMethod.issuer} ${paymentMethod.name}`
            : paymentMethod.name}
        </h2>

        {/* Japandi Active Status Badge */}
        <button
          onClick={handleToggleClick}
          className="mt-2 sm:mt-0 px-5 py-2 text-sm font-medium transition-all duration-300 ease-out active:scale-[0.98]"
          style={{
            backgroundColor: paymentMethod.active
              ? "var(--color-badge-bg)"
              : "transparent",
            color: paymentMethod.active
              ? "var(--color-badge-text)"
              : "var(--color-text-tertiary)",
            border: `1px solid ${paymentMethod.active ? "var(--color-badge-border)" : "var(--color-border)"}`,
            borderRadius: "20px",
            letterSpacing: "0.5px",
          }}
        >
          <span className="flex items-center">
            {paymentMethod.active ? (
              <ToggleRightIcon
                className="h-4 w-4 mr-2"
                style={{ color: "var(--color-accent)", strokeWidth: 2 }}
              />
            ) : (
              <ToggleLeftIcon
                className="h-4 w-4 mr-2"
                style={{ color: "var(--color-text-tertiary)", strokeWidth: 2 }}
              />
            )}
            {paymentMethod.active ? "active" : "inactive"}
          </span>
        </button>
      </div>

      <Separator
        style={{ backgroundColor: "var(--color-divider)", opacity: 0.4 }}
      />

      {/* Japandi Stats Summary - Card stats section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          className="p-4"
          style={{
            backgroundColor: "var(--color-modal-bg)",
            border: "1px solid var(--color-surface)",
            borderRadius: "10px",
          }}
        >
          <h3
            className="text-[13px] mb-1"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Total Spent
          </h3>
          <p
            className="text-xl font-medium"
            style={{ color: "var(--color-text-primary)" }}
          >
            {CurrencyService.format(totalSpent, paymentMethod.currency)}
          </p>
          <p
            className="text-xs mt-1"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            {paymentMethodTransactions.length} transactions
          </p>
        </div>

        {paymentMethod.type === "credit_card" && (
          <>
            <div
              className="p-4"
              style={{
                backgroundColor: "var(--color-modal-bg)",
                border: "1px solid var(--color-surface)",
                borderRadius: "10px",
              }}
            >
              <h3
                className="text-[13px] mb-1"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                Reward Points
              </h3>
              <p
                className="text-xl font-medium"
                style={{ color: "var(--color-text-primary)" }}
              >
                {totalRewardPoints.toLocaleString()}
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                Total earned points
              </p>
            </div>

            <div
              className="p-4"
              style={{
                backgroundColor: "var(--color-modal-bg)",
                border: "1px solid var(--color-surface)",
                borderRadius: "10px",
              }}
            >
              <h3
                className="text-[13px] mb-1"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                Statement Cycle
              </h3>
              <p
                className="text-xl font-medium"
                style={{ color: "var(--color-text-primary)" }}
              >
                {paymentMethod.statementStartDay
                  ? `Day ${paymentMethod.statementStartDay}`
                  : "Calendar Month"}
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                Billing cycle
              </p>
            </div>
          </>
        )}
      </div>

      {/* Japandi Settings Card */}
      <div
        style={{
          backgroundColor: "var(--color-card-bg)",
          border: "1px solid var(--color-border)",
          borderRadius: "12px",
          boxShadow: "var(--shadow-card)",
          overflow: "hidden",
        }}
      >
        {/* Edit payment method */}
        <div
          className="p-4 cursor-pointer transition-colors duration-300"
          onClick={() => onEdit(paymentMethod)}
          style={{ minHeight: "44px" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "var(--color-surface)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "transparent")
          }
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <EditIcon
                className="h-5 w-5 mr-3"
                style={{
                  color: "var(--color-icon-secondary)",
                  strokeWidth: 2,
                }}
              />
              <div>
                <h3
                  className="font-medium text-sm"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Edit Payment Method
                </h3>
                <p
                  className="text-sm"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Update name, currency, and other details
                </p>
              </div>
            </div>
            <ChevronRightIcon
              className="h-5 w-5"
              style={{
                color: "var(--color-icon-secondary)",
                strokeWidth: 2,
              }}
            />
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            borderTop: "1px solid var(--color-divider)",
            margin: "0 16px",
            opacity: 0.4,
          }}
        />

        {/* Upload card image - only for credit cards */}
        {paymentMethod.type === "credit_card" && (
          <>
            <div
              className="p-4 cursor-pointer transition-colors duration-300"
              onClick={() => onImageUpload(paymentMethod)}
              style={{ minHeight: "44px" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--color-surface)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <ImageIcon
                    className="h-5 w-5 mr-3"
                    style={{
                      color: "var(--color-icon-secondary)",
                      strokeWidth: 2,
                    }}
                  />
                  <div>
                    <h3
                      className="font-medium text-sm"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {paymentMethod.imageUrl
                        ? "Change Card Image"
                        : "Upload Card Image"}
                    </h3>
                    <p
                      className="text-sm"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {paymentMethod.imageUrl
                        ? "Replace or remove current image"
                        : "Add an image of your card"}
                    </p>
                  </div>
                </div>
                <ChevronRightIcon
                  className="h-5 w-5"
                  style={{
                    color: "var(--color-icon-secondary)",
                    strokeWidth: 2,
                  }}
                />
              </div>
            </div>

            {/* Divider */}
            <div
              style={{
                borderTop: "1px solid var(--color-divider)",
                margin: "0 16px",
                opacity: 0.4,
              }}
            />

            {/* Statement details - Enhanced with current period */}
            <div
              className="p-4 transition-colors duration-300"
              style={{ minHeight: "44px" }}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start">
                  <CalendarIcon
                    className="h-5 w-5 mr-3 mt-0.5"
                    style={{
                      color: "var(--color-icon-secondary)",
                      strokeWidth: 2,
                    }}
                  />
                  <div className="space-y-2">
                    <div>
                      <h3
                        className="font-medium text-sm"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        Statement Details
                      </h3>
                      <p
                        className="text-sm"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        {statementPeriod?.label}
                        {paymentMethod.statementStartDay && (
                          <span style={{ color: "var(--color-text-tertiary)" }}>
                            {" "}
                            (starts day {paymentMethod.statementStartDay})
                          </span>
                        )}
                      </p>
                    </div>
                    {/* Current period info */}
                    {statementPeriod && (
                      <div
                        className="text-xs px-3 py-2 rounded-lg"
                        style={{
                          backgroundColor: "var(--color-surface)",
                        }}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <span style={{ color: "var(--color-text-tertiary)" }}>
                            Current period:
                          </span>
                          <span
                            className="font-medium"
                            style={{ color: "var(--color-text-primary)" }}
                          >
                            {formatDate(statementPeriod.start)} -{" "}
                            {formatDate(statementPeriod.end)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4 mt-1">
                          <span style={{ color: "var(--color-text-tertiary)" }}>
                            Days remaining:
                          </span>
                          <span
                            className="font-medium"
                            style={{
                              color:
                                statementPeriod.daysRemaining <= 5
                                  ? "var(--color-warning)"
                                  : "var(--color-text-primary)",
                            }}
                          >
                            {statementPeriod.daysRemaining} day
                            {statementPeriod.daysRemaining !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Unified Reward Rules Section - only for credit cards */}
      {paymentMethod.type === "credit_card" && (
        <RewardRulesSection
          paymentMethod={paymentMethod}
          rewardRules={rewardRules}
          onRulesChanged={onRulesChanged}
        />
      )}

      {/* Deactivation Confirmation Dialog - Japandi style */}
      <AlertDialog
        open={showDeactivateConfirm}
        onOpenChange={setShowDeactivateConfirm}
      >
        <AlertDialogContent
          style={{
            backgroundColor: "var(--color-modal-bg)",
            border: "1px solid var(--color-border)",
            borderRadius: "16px",
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle
              className="flex items-center gap-2"
              style={{ color: "var(--color-text-primary)" }}
            >
              <AlertTriangle
                className="h-5 w-5"
                style={{ color: "var(--color-warning)" }}
              />
              Deactivate{" "}
              {paymentMethod.type === "credit_card"
                ? `${paymentMethod.issuer} ${paymentMethod.name}`
                : paymentMethod.name}
              ?
            </AlertDialogTitle>
            <AlertDialogDescription
              className="space-y-3"
              style={{ color: "var(--color-text-secondary)" }}
            >
              <p>
                You can reactivate this payment method anytime. Your transaction
                history and reward rules will be preserved.
              </p>
              {paymentMethodTransactions.length > 0 && (
                <p
                  className="text-sm px-3 py-2 rounded-lg"
                  style={{
                    backgroundColor: "var(--color-surface)",
                    color: "var(--color-text-tertiary)",
                  }}
                >
                  This card has {paymentMethodTransactions.length} transaction
                  {paymentMethodTransactions.length !== 1 ? "s" : ""} recorded.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              style={{
                backgroundColor: "transparent",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-secondary)",
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeactivate}
              style={{
                backgroundColor: "var(--color-warning)",
                color: "var(--color-bg)",
              }}
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

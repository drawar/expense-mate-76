import React, { useState, useRef, useLayoutEffect, useEffect } from "react";
import { PaymentMethod } from "@/types";
import {
  EditIcon,
  ImageIcon,
  CreditCardIcon,
  BanknoteIcon,
  WalletIcon,
  CalendarIcon,
  AlertTriangle,
} from "lucide-react";
import { Chevron } from "@/components/ui/chevron";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Storage key for the first-visit tooltip hint
const STATUS_DOT_HINT_KEY = "expense-tracker-status-dot-hint-shown";
import { CurrencyService } from "@/core/currency/CurrencyService";
import { useTransactionsQuery } from "@/hooks/queries/useTransactionsQuery";
import { Separator } from "@/components/ui/separator";
import { RewardRule } from "@/core/rewards/types";
import { RewardRulesSection } from "./RewardRulesSection";
import { CapProgressSection } from "./CapProgressSection";
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
  /** Resolved cardTypeId from catalog or generated from issuer/name */
  resolvedCardTypeId?: string;
}

export const PaymentFunctionsList: React.FC<PaymentFunctionsListProps> = ({
  paymentMethod,
  rewardRules,
  onToggleActive,
  onEdit,
  onImageUpload,
  onRulesChanged,
  resolvedCardTypeId,
}) => {
  const { data: allTransactions = [] } = useTransactionsQuery();

  // Count transactions for this payment method (used to trigger cap progress refresh)
  const paymentMethodTransactionCount = allTransactions.filter(
    (t) => t.paymentMethod?.id === paymentMethod.id
  ).length;

  // Deactivation confirmation state
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);

  // Title expansion state
  const [isTitleExpanded, setIsTitleExpanded] = useState(false);
  const [isTitleTruncated, setIsTitleTruncated] = useState(false);
  const [showStatusTooltip, setShowStatusTooltip] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);

  // Get the full card name
  const cardName =
    paymentMethod.type === "credit_card"
      ? `${paymentMethod.issuer} ${paymentMethod.name}`
      : paymentMethod.name;

  // Check if title is truncated on mount and window resize
  useLayoutEffect(() => {
    const checkTruncation = () => {
      if (titleRef.current && !isTitleExpanded) {
        const { scrollWidth, clientWidth } = titleRef.current;
        setIsTitleTruncated(scrollWidth > clientWidth);
      }
    };

    checkTruncation();
    window.addEventListener("resize", checkTruncation);
    return () => window.removeEventListener("resize", checkTruncation);
  }, [cardName, isTitleExpanded]);

  // First-visit tooltip hint
  useEffect(() => {
    const hasSeenHint = localStorage.getItem(STATUS_DOT_HINT_KEY);
    if (!hasSeenHint) {
      const timer = setTimeout(() => {
        setShowStatusTooltip(true);
        localStorage.setItem(STATUS_DOT_HINT_KEY, "true");
        // Auto-dismiss after 3 seconds
        setTimeout(() => setShowStatusTooltip(false), 3000);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Get status dot color based on card state
  const getStatusDotColor = () => {
    if (!paymentMethod.active) {
      return "var(--color-danger)"; // #a86f64 - rust/terracotta for inactive
    }
    return "var(--color-success)"; // #7c9885 - sage green for active
  };

  const getStatusLabel = () => {
    return paymentMethod.active ? "Active" : "Inactive";
  };

  const handleTitleClick = () => {
    if (isTitleTruncated || isTitleExpanded) {
      setIsTitleExpanded(!isTitleExpanded);
    }
  };

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

  // Calculate current statement period based on statementStartDay
  const getStatementPeriod = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const statementDay = paymentMethod.statementStartDay;

    // If no statement day set (or day 1), use calendar month
    if (!statementDay || statementDay === 1) {
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

    // Statement period based on statementStartDay
    const effectiveStatementDay = statementDay;

    // Statement month: based on statement start day
    let startDate: Date;
    let endDate: Date;

    if (today.getDate() >= effectiveStatementDay) {
      // Current statement period started this month
      startDate = new Date(currentYear, currentMonth, effectiveStatementDay);
      endDate = new Date(
        currentYear,
        currentMonth + 1,
        effectiveStatementDay - 1
      );
    } else {
      // Current statement period started last month
      startDate = new Date(
        currentYear,
        currentMonth - 1,
        effectiveStatementDay
      );
      endDate = new Date(currentYear, currentMonth, effectiveStatementDay - 1);
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
      {/* Japandi Header - Clean, restrained with status dot */}
      <div className="flex items-start gap-3 mb-2">
        {/* Card icon */}
        <div className="flex-shrink-0 mt-0.5">
          {paymentMethod.type === "credit_card" ? (
            <CreditCardIcon
              className="h-5 w-5"
              style={{
                color: "var(--color-accent)",
                strokeWidth: 2,
              }}
            />
          ) : paymentMethod.type === "gift_card" ? (
            <WalletIcon
              className="h-5 w-5"
              style={{
                color: "var(--color-accent)",
                strokeWidth: 2,
              }}
            />
          ) : (
            <BanknoteIcon
              className="h-5 w-5"
              style={{
                color: "var(--color-accent)",
                strokeWidth: 2,
              }}
            />
          )}
        </div>

        {/* Title with truncation and expand */}
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={handleTitleClick}
          role={isTitleTruncated || isTitleExpanded ? "button" : undefined}
          tabIndex={isTitleTruncated || isTitleExpanded ? 0 : undefined}
          onKeyDown={(e) => {
            if (
              (e.key === "Enter" || e.key === " ") &&
              (isTitleTruncated || isTitleExpanded)
            ) {
              e.preventDefault();
              handleTitleClick();
            }
          }}
          aria-expanded={isTitleTruncated ? isTitleExpanded : undefined}
        >
          <div className="flex items-center gap-1">
            <h2
              ref={titleRef}
              className={`text-xl font-medium transition-all duration-200 ${
                !isTitleExpanded ? "truncate" : ""
              }`}
              style={{
                color: "var(--color-text-primary)",
                letterSpacing: "-0.2px",
              }}
            >
              {cardName}
            </h2>
            {/* Chevron indicator for truncated names */}
            {(isTitleTruncated || isTitleExpanded) && (
              <Chevron
                direction={isTitleExpanded ? "up" : "down"}
                size="small"
              />
            )}
          </div>
        </div>

        {/* Status dot indicator */}
        <TooltipProvider>
          <Tooltip open={showStatusTooltip} onOpenChange={setShowStatusTooltip}>
            <TooltipTrigger asChild>
              <button
                className="flex-shrink-0 p-2 -m-1 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] transition-all duration-200 active:scale-95"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleClick();
                }}
                aria-label={`Card status: ${getStatusLabel()}. Click to ${paymentMethod.active ? "deactivate" : "activate"}`}
                style={{ minWidth: "44px", minHeight: "44px" }}
              >
                <div
                  className="w-2 h-2 rounded-full mx-auto transition-colors duration-200"
                  style={{ backgroundColor: getStatusDotColor() }}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              align="end"
              className="bg-[var(--color-card-bg)] border-[var(--color-border)] text-[var(--color-text-primary)]"
            >
              <p>Card is {getStatusLabel().toLowerCase()}</p>
              <p className="text-xs text-[var(--color-text-tertiary)]">
                Tap to {paymentMethod.active ? "deactivate" : "activate"}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Separator
        style={{ backgroundColor: "var(--color-divider)", opacity: 0.4 }}
      />

      {/* Cap Progress Section - only for credit cards with capped rules */}
      {paymentMethod.type === "credit_card" &&
        rewardRules.some((r) => r.reward.monthlyCap) && (
          <CapProgressSection
            paymentMethodId={paymentMethod.id}
            rewardRules={rewardRules}
            statementDay={paymentMethod.statementStartDay || 1}
            transactionCount={paymentMethodTransactionCount}
          />
        )}

      {/* Stats Summary - Horizontal 2-column grid */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className="p-3"
          style={{
            backgroundColor: "var(--color-card-bg)",
            border: "1px solid var(--color-border)",
            borderRadius: "10px",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <h3
            className="text-[12px] mb-0.5"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Total Spent
          </h3>
          <p
            className="text-lg font-medium"
            style={{ color: "var(--color-text-primary)" }}
          >
            {CurrencyService.format(totalSpent, paymentMethod.currency)}
          </p>
        </div>

        {paymentMethod.type === "credit_card" && (
          <div
            className="p-3"
            style={{
              backgroundColor: "var(--color-card-bg)",
              border: "1px solid var(--color-border)",
              borderRadius: "10px",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <h3
              className="text-[12px] mb-0.5 truncate"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              {paymentMethod.pointsCurrency || "Reward Points"}
            </h3>
            <p
              className="text-lg font-medium"
              style={{ color: "var(--color-text-primary)" }}
            >
              {totalRewardPoints.toLocaleString()}
            </p>
          </div>
        )}

        {paymentMethod.type === "gift_card" && (
          <div
            className="p-3"
            style={{
              backgroundColor: "var(--color-card-bg)",
              border: "1px solid var(--color-border)",
              borderRadius: "10px",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <h3
              className="text-[12px] mb-0.5"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              Remaining Balance
            </h3>
            <p
              className="text-lg font-medium"
              style={{
                color:
                  paymentMethod.totalLoaded !== undefined &&
                  paymentMethod.totalLoaded - totalSpent <= 0
                    ? "var(--color-danger)"
                    : "var(--color-text-primary)",
              }}
            >
              {paymentMethod.totalLoaded !== undefined
                ? CurrencyService.format(
                    Math.max(0, paymentMethod.totalLoaded - totalSpent),
                    paymentMethod.currency
                  )
                : "Not set"}
            </p>
          </div>
        )}
      </div>

      {/* Primary Actions Card */}
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
          className="px-4 py-3 cursor-pointer transition-colors duration-150"
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
              <span
                className="font-medium text-sm"
                style={{ color: "var(--color-text-primary)" }}
              >
                Edit Payment Method
              </span>
            </div>
            <Chevron direction="right" size="medium" />
          </div>
        </div>

        {/* Upload card image - only for credit cards */}
        {paymentMethod.type === "credit_card" && (
          <>
            {/* Divider */}
            <div
              style={{
                borderTop: "1px solid var(--color-divider)",
                margin: "0 16px",
                opacity: 0.4,
              }}
            />

            <div
              className="px-4 py-3 cursor-pointer transition-colors duration-150"
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
                  <span
                    className="font-medium text-sm"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {paymentMethod.imageUrl
                      ? "Change Card Image"
                      : "Upload Card Image"}
                  </span>
                </div>
                <Chevron direction="right" size="medium" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Statement Period Card - Informational, not actionable */}
      {paymentMethod.type === "credit_card" && statementPeriod && (
        <div
          className="p-4"
          style={{
            backgroundColor: "var(--color-card-bg)",
            border: "1px solid var(--color-border)",
            borderRadius: "12px",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <CalendarIcon
              className="h-4 w-4"
              style={{
                color: "var(--color-icon-secondary)",
                strokeWidth: 2,
              }}
            />
            <span
              className="text-[13px] font-medium"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Statement Period
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-sm font-medium"
              style={{ color: "var(--color-text-primary)" }}
            >
              {formatDate(statementPeriod.start)} –{" "}
              {formatDate(statementPeriod.end)}
            </span>
            <span style={{ color: "var(--color-text-tertiary)" }}>•</span>
            <span
              className="text-sm"
              style={{
                color:
                  statementPeriod.daysRemaining <= 5
                    ? "var(--color-warning)"
                    : "var(--color-text-secondary)",
              }}
            >
              {statementPeriod.daysRemaining} day
              {statementPeriod.daysRemaining !== 1 ? "s" : ""} left
            </span>
          </div>
        </div>
      )}

      {/* Unified Reward Rules Section - only for credit cards */}
      {paymentMethod.type === "credit_card" && (
        <RewardRulesSection
          paymentMethod={paymentMethod}
          rewardRules={rewardRules}
          onRulesChanged={onRulesChanged}
          resolvedCardTypeId={resolvedCardTypeId}
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

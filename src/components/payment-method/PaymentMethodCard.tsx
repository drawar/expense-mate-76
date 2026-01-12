import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { PaymentMethod } from "@/types";
import { CurrencyService } from "@/core/currency";
import {
  EditIcon,
  ImageIcon,
  ShieldIcon,
  CreditCardIcon,
  BanknoteIcon,
  CalendarIcon,
  CoinsIcon,
  WalletIcon,
} from "lucide-react";
import { Chevron } from "@/components/ui/chevron";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import PaymentCardDisplay from "../expense/PaymentCardDisplay";
import { RewardRuleManager } from "@/components/rewards/RewardRuleManager";
import RewardRuleBadge from "./RewardRuleBadge";
import { cardTypeIdService } from "@/core/rewards/CardTypeIdService";

// Storage key for the first-visit tooltip hint
const STATUS_DOT_HINT_KEY = "expense-tracker-status-dot-hint-shown";

interface PaymentMethodCardProps {
  method: PaymentMethod;
  onToggleActive: (id: string) => void;
  onEdit: (method: PaymentMethod) => void;
  onImageUpload: (method: PaymentMethod) => void;
}

const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({
  method,
  onToggleActive,
  onEdit,
  onImageUpload,
}) => {
  const [isRulesDialogOpen, setIsRulesDialogOpen] = useState(false);
  const [isTitleExpanded, setIsTitleExpanded] = useState(false);
  const [isTitleTruncated, setIsTitleTruncated] = useState(false);
  const [showStatusTooltip, setShowStatusTooltip] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);

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
  }, [method.name, isTitleExpanded]);

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

  const icon =
    method.type === "credit_card" ? (
      <CreditCardIcon className="h-5 w-5" style={{ color: method.color }} />
    ) : method.type === "gift_card" ? (
      <WalletIcon className="h-5 w-5" style={{ color: method.color }} />
    ) : (
      <BanknoteIcon className="h-5 w-5" style={{ color: method.color }} />
    );

  // Use CardTypeIdService to generate consistent card type ID
  const getCardTypeId = (): string => {
    if (method.issuer && method.name) {
      return cardTypeIdService.generateCardTypeId(method.issuer, method.name);
    }
    return method.id;
  };

  // Get status dot color based on card state
  const getStatusDotColor = () => {
    if (!method.active) {
      return "var(--color-danger)"; // #a86f64 - rust/terracotta for inactive
    }
    return "var(--color-success)"; // #7c9885 - sage green for active
  };

  const getStatusLabel = () => {
    return method.active ? "Active" : "Inactive";
  };

  const handleTitleClick = () => {
    if (isTitleTruncated || isTitleExpanded) {
      setIsTitleExpanded(!isTitleExpanded);
    }
  };

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all duration-300",
        !method.active && "opacity-70"
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div
              className="p-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: `${method.color}20` }}
            >
              {icon}
            </div>
            <div className="min-w-0 flex-1">
              {/* Clickable title row with truncation and expand */}
              <div
                className={cn(
                  "flex items-center gap-1 cursor-pointer",
                  (isTitleTruncated || isTitleExpanded) && "active:opacity-70"
                )}
                onClick={handleTitleClick}
                role={
                  isTitleTruncated || isTitleExpanded ? "button" : undefined
                }
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
                <CardTitle
                  ref={titleRef}
                  className={cn(
                    "text-lg min-w-0 transition-all duration-200",
                    !isTitleExpanded && "truncate"
                  )}
                >
                  {method.name}
                </CardTitle>
                {/* Chevron indicator for truncated names */}
                {(isTitleTruncated || isTitleExpanded) && (
                  <Chevron
                    direction={isTitleExpanded ? "up" : "down"}
                    size="small"
                  />
                )}
              </div>
              <CardDescription>
                {method.type === "credit_card"
                  ? `${method.issuer} ${method.lastFourDigits ? `•••• ${method.lastFourDigits}` : ""}`
                  : method.type === "gift_card"
                    ? `${method.currency} ${method.lastFourDigits ? `•••• ${method.lastFourDigits}` : ""}`
                    : `${method.currency}`}
              </CardDescription>
            </div>
            {/* Status dot indicator */}
            <TooltipProvider>
              <Tooltip
                open={showStatusTooltip}
                onOpenChange={setShowStatusTooltip}
              >
                <TooltipTrigger asChild>
                  <button
                    className="flex-shrink-0 p-2 -m-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleActive(method.id);
                    }}
                    aria-label={`Card status: ${getStatusLabel()}. Click to ${method.active ? "deactivate" : "activate"}`}
                    style={{ minWidth: "44px", minHeight: "44px" }}
                  >
                    <div
                      className="w-2 h-2 rounded-full mx-auto transition-colors duration-200"
                      style={{ backgroundColor: getStatusDotColor() }}
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  align="end"
                  className="bg-[var(--color-card-bg)] border-[var(--color-border)] text-[var(--color-text-primary)]"
                >
                  <p>Card is {getStatusLabel().toLowerCase()}</p>
                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    Tap to {method.active ? "deactivate" : "activate"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(method)}
              title="Edit"
            >
              <EditIcon className="h-4 w-4" />
            </Button>
            {method.type === "credit_card" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onImageUpload(method)}
                title="Upload Card Image"
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {method.type === "credit_card" && (
          <>
            {method.imageUrl && (
              <div className="mb-3 max-w-[180px]">
                <PaymentCardDisplay
                  paymentMethod={method}
                  customImage={method.imageUrl}
                />
              </div>
            )}
            <div className="flex items-center text-sm">
              <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>
                {method.statementStartDay
                  ? `Statement Cycle: Day ${method.statementStartDay}`
                  : "Calendar Month"}
              </span>
            </div>

            <div className="flex items-center text-sm mt-1">
              <CoinsIcon className="h-4 w-4 mr-2 text-amber-500" />
              <span>
                {method.rewardRules && method.rewardRules.length
                  ? `${method.rewardRules.length} Reward Rules`
                  : "No rewards configured"}
              </span>
            </div>

            {method.rewardRules && method.rewardRules.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {method.rewardRules.slice(0, 2).map((rule) => (
                  <RewardRuleBadge key={rule.id} rule={rule} />
                ))}
                {method.rewardRules.length > 2 && (
                  <span className="text-xs text-muted-foreground self-center">
                    +{method.rewardRules.length - 2} more
                  </span>
                )}
              </div>
            )}
          </>
        )}

        {/* Gift card specific content */}
        {method.type === "gift_card" && (
          <>
            <div className="flex items-center text-sm">
              <WalletIcon className="h-4 w-4 mr-2 text-emerald-500" />
              <span>
                Total Loaded:{" "}
                <strong>
                  {method.totalLoaded !== undefined
                    ? CurrencyService.format(
                        method.totalLoaded,
                        method.currency
                      )
                    : "Not set"}
                </strong>
              </span>
            </div>
            <p
              className="text-xs mt-2"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              Balance is calculated from transactions
            </p>
          </>
        )}
      </CardContent>

      {method.type === "credit_card" && (
        <CardFooter>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setIsRulesDialogOpen(true)}
          >
            <ShieldIcon className="h-4 w-4 mr-2" />
            Manage Reward Rules
          </Button>

          {/* Rules Dialog */}
          <Dialog open={isRulesDialogOpen} onOpenChange={setIsRulesDialogOpen}>
            <DialogContent
              className="max-w-3xl max-h-[85vh] flex flex-col overflow-hidden"
              hideCloseButton
            >
              <DialogHeader showCloseButton>
                <DialogTitle>
                  Manage Reward Rules for {method.issuer} {method.name}
                </DialogTitle>
              </DialogHeader>

              <RewardRuleManager cardTypeId={getCardTypeId()} />
            </DialogContent>
          </Dialog>
        </CardFooter>
      )}
    </Card>
  );
};

export default PaymentMethodCard;

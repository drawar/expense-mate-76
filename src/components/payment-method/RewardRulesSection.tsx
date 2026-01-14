import React, { useState, useCallback } from "react";
import { PaymentMethod } from "@/types";
import { RewardRule } from "@/core/rewards/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  CoinsIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  Settings2,
  Loader2,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Chevron } from "@/components/ui/chevron";
import { SwipeableRow } from "@/components/ui/swipeable-row";
import { RuleRepository } from "@/core/rewards/RuleRepository";
import { RewardRuleEditor } from "@/components/rewards/RewardRuleEditor";
import { cardTypeIdService } from "@/core/rewards/CardTypeIdService";
import {
  getQuickSetupService,
  getQuickSetupConfig,
} from "@/core/rewards/QuickSetupService";
import { toast } from "sonner";

interface RewardRulesSectionProps {
  paymentMethod: PaymentMethod;
  rewardRules: RewardRule[];
  onRulesChanged?: () => void;
  /** Resolved cardTypeId from catalog or generated from issuer/name */
  resolvedCardTypeId?: string;
}

const SWIPE_HINT_STORAGE_KEY = "reward-rules-swipe-hint-shown";

export const RewardRulesSection: React.FC<RewardRulesSectionProps> = ({
  paymentMethod,
  rewardRules,
  onRulesChanged,
  resolvedCardTypeId,
}) => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RewardRule | null>(null);
  const [deleteConfirmRule, setDeleteConfirmRule] = useState<RewardRule | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRunningSetup, setIsRunningSetup] = useState(false);
  const [setupLog, setSetupLog] = useState<string[]>([]);
  const [showSetupLog, setShowSetupLog] = useState(false);
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());
  const [showSwipeHint, setShowSwipeHint] = useState(() => {
    // Only show hint if not previously shown
    return !localStorage.getItem(SWIPE_HINT_STORAGE_KEY);
  });

  const handleSwipeHintComplete = useCallback(() => {
    localStorage.setItem(SWIPE_HINT_STORAGE_KEY, "true");
    setShowSwipeHint(false);
  }, []);

  const toggleRuleExpanded = (ruleId: string) => {
    setExpandedRules((prev) => {
      const next = new Set(prev);
      if (next.has(ruleId)) {
        next.delete(ruleId);
      } else {
        next.add(ruleId);
      }
      return next;
    });
  };

  // Use resolved cardTypeId (from catalog) if provided, otherwise generate from issuer/name
  const cardTypeId =
    resolvedCardTypeId ||
    (paymentMethod.issuer && paymentMethod.name
      ? cardTypeIdService.generateCardTypeId(
          paymentMethod.issuer,
          paymentMethod.name
        )
      : paymentMethod.id);

  const quickSetupConfig = getQuickSetupConfig(paymentMethod);

  const handleAddRule = () => {
    setEditingRule(null);
    setIsEditorOpen(true);
  };

  const handleEditRule = (rule: RewardRule) => {
    setEditingRule(rule);
    setIsEditorOpen(true);
  };

  const handleSaveRule = async (rule: RewardRule) => {
    try {
      const repository = RuleRepository.getInstance();

      if (editingRule) {
        await repository.updateRule(rule);
        toast.success("Rule updated successfully");
      } else {
        await repository.createRule({
          ...rule,
          cardTypeId,
        });
        toast.success("Rule created successfully");
      }

      setIsEditorOpen(false);
      setEditingRule(null);
      onRulesChanged?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error("Failed to save rule", { description: message });
    }
  };

  const handleDeleteRule = async () => {
    if (!deleteConfirmRule) return;

    setIsDeleting(true);
    try {
      const repository = RuleRepository.getInstance();
      await repository.deleteRule(deleteConfirmRule.id);
      toast.success("Rule deleted successfully");
      setDeleteConfirmRule(null);
      onRulesChanged?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error("Failed to delete rule", { description: message });
    } finally {
      setIsDeleting(false);
    }
  };

  const addSetupLog = useCallback((message: string) => {
    setSetupLog((prev) => [...prev, message]);
  }, []);

  /**
   * Handle quick setup using the QuickSetupService
   * All setup logic has been consolidated into QuickSetupService
   */
  const handleQuickSetup = async () => {
    if (!quickSetupConfig) return;

    setIsRunningSetup(true);
    setSetupLog([]);
    setShowSetupLog(true);

    try {
      addSetupLog(`Setting up ${quickSetupConfig.name}...`);
      addSetupLog(`Card Type ID: ${cardTypeId}`);

      const quickSetupService = getQuickSetupService();
      const result = await quickSetupService.runSetup(
        quickSetupConfig.type,
        cardTypeId,
        paymentMethod.id
      );

      if (result.success) {
        addSetupLog(`✅ Created ${result.rulesCreated} reward rule(s)`);
        addSetupLog("");
        addSetupLog("✅ Setup complete!");
        toast.success(
          `${quickSetupConfig.name} rules configured successfully!`
        );
        onRulesChanged?.();
      } else {
        throw new Error(result.error || "Setup failed");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      addSetupLog(`❌ Error: ${message}`);
      toast.error("Setup failed", { description: message });
    } finally {
      setIsRunningSetup(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "var(--color-card-bg)",
        border: "1px solid var(--color-border)",
        borderRadius: "12px",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3
            className="flex items-center text-base font-medium"
            style={{
              color: "var(--color-text-primary)",
              letterSpacing: "0.2px",
            }}
          >
            <CoinsIcon
              className="h-5 w-5 mr-2"
              style={{ color: "var(--color-warning)" }}
            />
            Reward Rules
            {rewardRules.length > 0 && (
              <span
                className="ml-2 text-[13px] font-medium"
                style={{
                  backgroundColor: "rgba(124, 152, 133, 0.15)",
                  color: "#A8C4AF",
                  padding: "2px 8px",
                  borderRadius: "10px",
                }}
              >
                {rewardRules.length}
              </span>
            )}
          </h3>
          <div className="flex gap-1">
            <TooltipProvider delayDuration={300}>
              {/* Show Quick Setup prominently when no rules exist */}
              {quickSetupConfig && rewardRules.length === 0 ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleQuickSetup}
                      disabled={isRunningSetup}
                      className="flex items-center text-sm font-medium transition-all duration-300 ease-out hover:brightness-95 active:scale-[0.98] disabled:opacity-50"
                      style={{
                        backgroundColor: "#7C9885",
                        color: "#1A1D1F",
                        borderRadius: "10px",
                        padding: "16px 24px",
                        letterSpacing: "0.3px",
                        fontWeight: 500,
                      }}
                      aria-label="Quick setup - auto-configure common reward rules"
                    >
                      {isRunningSetup ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Settings2 className="h-4 w-4 mr-2" />
                      )}
                      Quick Setup
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="bg-[var(--color-card-bg)] border-[var(--color-border)] text-[var(--color-text-primary)]"
                  >
                    <p className="font-medium">Auto-configure rules</p>
                    <p className="text-xs text-[var(--color-text-tertiary)]">
                      {quickSetupConfig.description}
                    </p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <>
                  {/* Icon-only Reset Rules button */}
                  {quickSetupConfig && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={handleQuickSetup}
                          disabled={isRunningSetup}
                          className="flex items-center justify-center transition-all duration-300 ease-out active:scale-[0.98] disabled:opacity-50 hover:bg-[var(--color-surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                          style={{
                            backgroundColor: "transparent",
                            border: "none",
                            borderRadius: "8px",
                            width: "44px",
                            height: "44px",
                            outlineColor: "var(--color-accent)",
                          }}
                          aria-label="Reset rules to defaults"
                        >
                          {isRunningSetup ? (
                            <Loader2
                              className="h-[22px] w-[22px] animate-spin"
                              style={{ color: "#7C9885" }}
                            />
                          ) : (
                            <RotateCcw
                              className="h-[22px] w-[22px]"
                              style={{ color: "#A8A5A0" }}
                            />
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        className="bg-[var(--color-card-bg)] border-[var(--color-border)] text-[var(--color-text-primary)]"
                      >
                        <p className="font-medium">Reset Rules</p>
                        <p className="text-xs text-[var(--color-text-tertiary)]">
                          Restore default {quickSetupConfig.name} rules
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {/* Icon-only Add Rule button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={handleAddRule}
                        className="flex items-center justify-center transition-all duration-300 ease-out hover:brightness-95 active:scale-[0.98]"
                        style={{
                          backgroundColor: "#7C9885",
                          borderRadius: "8px",
                          width: "44px",
                          height: "44px",
                        }}
                        aria-label="Add new reward rule"
                      >
                        <PlusIcon
                          className="h-[22px] w-[22px]"
                          style={{ color: "#1A1D1F" }}
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      className="bg-[var(--color-card-bg)] border-[var(--color-border)] text-[var(--color-text-primary)]"
                    >
                      <p className="font-medium">Add Rule</p>
                      <p className="text-xs text-[var(--color-text-tertiary)]">
                        Create a custom reward rule
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </>
              )}
            </TooltipProvider>
          </div>
        </div>
        {/* Onboarding hint when no rules */}
        {rewardRules.length === 0 && quickSetupConfig && (
          <p
            className="mt-2 text-xs"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Quick Setup adds common reward categories for{" "}
            {quickSetupConfig.name} automatically
          </p>
        )}
      </div>
      <div className="px-4 pb-4 space-y-3">
        {/* Setup log - Japandi style */}
        {showSetupLog && setupLog.length > 0 && (
          <div
            className="p-3 font-mono text-xs space-y-1 max-h-32 overflow-y-auto"
            style={{
              backgroundColor: "var(--color-surface)",
              borderRadius: "8px",
            }}
          >
            {setupLog.map((line, i) => (
              <div
                key={i}
                style={{
                  color: line.startsWith("✅")
                    ? "var(--color-success)"
                    : line.startsWith("❌")
                      ? "var(--color-error)"
                      : "var(--color-text-secondary)",
                }}
              >
                {line}
              </div>
            ))}
            {!isRunningSetup && (
              <button
                className="mt-2 text-xs font-medium transition-colors"
                style={{ color: "var(--color-text-tertiary)" }}
                onClick={() => setShowSetupLog(false)}
              >
                Dismiss
              </button>
            )}
          </div>
        )}

        {/* Rules list - Japandi style */}
        {rewardRules.length === 0 ? (
          <div
            className="text-center py-8"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            <AlertCircle
              className="h-10 w-10 mx-auto mb-3"
              style={{ color: "var(--color-accent)", opacity: 0.3 }}
            />
            <p
              className="text-sm font-medium"
              style={{ color: "var(--color-text-secondary)" }}
            >
              No reward rules configured
            </p>
            <p
              className="text-xs mt-1.5"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              {quickSetupConfig
                ? `Use "Quick Setup" for ${quickSetupConfig.name} defaults, or add rules manually.`
                : "Add rules to track reward points for this card."}
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {rewardRules
              .sort((a, b) => b.priority - a.priority)
              .map((rule, index, sortedRules) => (
                <div key={rule.id}>
                  <SwipeableRow
                    actions={[
                      {
                        key: "edit",
                        label: "Edit",
                        icon: <PencilIcon className="h-5 w-5" />,
                        backgroundColor: "#7C9885",
                        color: "#1A1D1F",
                        onClick: () => handleEditRule(rule),
                        width: 80,
                      },
                      {
                        key: "delete",
                        label: "Delete",
                        icon: <TrashIcon className="h-5 w-5" />,
                        backgroundColor: "#A86F64",
                        color: "#E8E6E3",
                        onClick: () => setDeleteConfirmRule(rule),
                        width: 80,
                      },
                    ]}
                    style={{ borderRadius: "8px" }}
                    showHint={index === 0 && showSwipeHint}
                    onHintComplete={handleSwipeHintComplete}
                  >
                    <div
                      className="p-3 cursor-pointer"
                      style={{
                        backgroundColor: "var(--color-surface)",
                        borderRadius: "8px",
                        minHeight: "72px",
                      }}
                      onClick={() => toggleRuleExpanded(rule.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleRuleExpanded(rule.id);
                        }
                      }}
                      aria-expanded={expandedRules.has(rule.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="font-medium text-sm"
                              style={{ color: "var(--color-text-primary)" }}
                            >
                              {rule.name}
                            </span>
                            {rule.reward.monthlyCap && (
                              <span
                                className="text-sm px-2 py-0.5"
                                style={{
                                  color: "var(--color-text-tertiary)",
                                  border: "1px solid var(--color-border)",
                                  borderRadius: "4px",
                                }}
                              >
                                Monthly cap:{" "}
                                {rule.reward.monthlyCapType === "spend_amount"
                                  ? `$${rule.reward.monthlyCap.toLocaleString()}`
                                  : `${rule.reward.monthlyCap.toLocaleString()} pts`}
                              </span>
                            )}
                            {!rule.enabled && (
                              <span
                                className="text-xs px-2 py-0.5"
                                style={{
                                  backgroundColor: "rgba(196, 165, 123, 0.15)",
                                  color: "var(--color-warning)",
                                  borderRadius: "4px",
                                }}
                              >
                                Disabled
                              </span>
                            )}
                          </div>
                          <p
                            className={`text-sm mt-1 ${
                              expandedRules.has(rule.id) ? "" : "line-clamp-2"
                            }`}
                            style={{ color: "var(--color-text-secondary)" }}
                          >
                            {rule.description}
                          </p>
                          {/* Additional info when expanded */}
                          {expandedRules.has(rule.id) && (
                            <div
                              className="mt-3 pt-3 space-y-1"
                              style={{
                                borderTop: "1px solid rgba(58, 61, 63, 0.4)",
                              }}
                            >
                              {rule.conditions.some(
                                (c) => c.type === "currency"
                              ) && (
                                <p
                                  className="text-xs"
                                  style={{
                                    color: "var(--color-text-tertiary)",
                                  }}
                                >
                                  Currency:{" "}
                                  {rule.conditions
                                    .filter((c) => c.type === "currency")
                                    .flatMap((c) => c.values)
                                    .join(", ")}
                                </p>
                              )}
                              <p
                                className="text-xs"
                                style={{ color: "var(--color-text-tertiary)" }}
                              >
                                Priority: {rule.priority}
                              </p>
                              <p
                                className="text-xs"
                                style={{ color: "var(--color-text-tertiary)" }}
                              >
                                Matched by:{" "}
                                {rule.conditions.length > 0
                                  ? rule.conditions
                                      .map((c) => c.type)
                                      .join(", ")
                                  : "All purchases"}
                              </p>
                            </div>
                          )}
                        </div>
                        {/* Chevron indicator */}
                        <Chevron
                          direction={expandedRules.has(rule.id) ? "up" : "down"}
                          size="medium"
                          className="mt-0.5 transition-transform duration-200"
                        />
                      </div>
                    </div>
                  </SwipeableRow>
                  {/* Divider between rules */}
                  {index < sortedRules.length - 1 && (
                    <div
                      style={{
                        borderTop: "1px solid rgba(58, 61, 63, 0.4)",
                        margin: "16px 0",
                      }}
                    />
                  )}
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Rule Editor Dialog */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent
          className="max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
          hideCloseButton
        >
          <DialogHeader showCloseButton>
            <DialogTitle>
              {editingRule ? "Edit Reward Rule" : "Create Reward Rule"}
            </DialogTitle>
          </DialogHeader>
          <RewardRuleEditor
            rule={editingRule || undefined}
            ruleCount={rewardRules.length}
            onSave={handleSaveRule}
            onCancel={() => {
              setIsEditorOpen(false);
              setEditingRule(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog - Japandi style */}
      <AlertDialog
        open={!!deleteConfirmRule}
        onOpenChange={() => setDeleteConfirmRule(null)}
      >
        <AlertDialogContent
          style={{
            backgroundColor: "var(--color-modal-bg)",
            border: "1px solid var(--color-border)",
            borderRadius: "16px",
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Reward Rule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteConfirmRule?.name}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeleting}
              style={{
                backgroundColor: "transparent",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-secondary)",
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRule}
              disabled={isDeleting}
              style={{
                backgroundColor: "var(--color-error)",
                color: "var(--color-bg)",
              }}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RewardRulesSection;

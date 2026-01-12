/**
 * GoalDialog - Form dialog for creating/editing redemption goals
 */

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { CalendarIcon, Loader2, Target } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type {
  PointsGoal,
  PointsGoalInput,
  GoalType,
  CabinClass,
} from "@/core/points/types";
import type { RewardCurrency } from "@/core/currency/types";

const GOAL_TYPES: { value: GoalType; label: string }[] = [
  { value: "flight", label: "Flight Award" },
  { value: "hotel", label: "Hotel Stay" },
  { value: "merchandise", label: "Merchandise" },
  { value: "other", label: "Other" },
];

const CABIN_CLASSES: { value: CabinClass; label: string }[] = [
  { value: "economy", label: "Economy" },
  { value: "premium_economy", label: "Premium Economy" },
  { value: "business", label: "Business" },
  { value: "first", label: "First Class" },
];

const PRIORITY_OPTIONS = [
  { value: 1, label: "High" },
  { value: 2, label: "Medium" },
  { value: 3, label: "Low" },
];

interface GoalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: PointsGoalInput) => Promise<void>;
  rewardCurrencies: RewardCurrency[];
  goal?: PointsGoal; // For editing
  defaultCurrencyId?: string;
  isLoading?: boolean;
}

export function GoalDialog({
  isOpen,
  onClose,
  onSubmit,
  rewardCurrencies,
  goal,
  defaultCurrencyId,
  isLoading = false,
}: GoalDialogProps) {
  const isEditing = !!goal;

  // Form state
  const [rewardCurrencyId, setRewardCurrencyId] = useState(
    defaultCurrencyId || ""
  );
  const [goalName, setGoalName] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [targetPoints, setTargetPoints] = useState("");
  const [goalType, setGoalType] = useState<GoalType | "">("");
  const [priority, setPriority] = useState<number>(2);
  const [targetDate, setTargetDate] = useState<Date | undefined>();

  // Flight-specific goal fields
  const [targetRoute, setTargetRoute] = useState("");
  const [targetCabin, setTargetCabin] = useState<CabinClass | "">("");

  // Reset form when dialog opens/closes or goal changes
  useEffect(() => {
    if (isOpen) {
      if (goal) {
        setRewardCurrencyId(goal.rewardCurrencyId);
        setGoalName(goal.goalName);
        setGoalDescription(goal.goalDescription || "");
        setTargetPoints(String(goal.targetPoints));
        setGoalType(goal.goalType || "");
        setPriority(goal.priority);
        setTargetDate(goal.targetDate);
        setTargetRoute(goal.targetRoute || "");
        setTargetCabin(goal.targetCabin || "");
      } else {
        setRewardCurrencyId(defaultCurrencyId || "");
        setGoalName("");
        setGoalDescription("");
        setTargetPoints("");
        setGoalType("");
        setPriority(2);
        setTargetDate(undefined);
        setTargetRoute("");
        setTargetCabin("");
      }
    }
  }, [isOpen, goal, defaultCurrencyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numTargetPoints = Number(targetPoints);
    if (
      !rewardCurrencyId ||
      !goalName.trim() ||
      isNaN(numTargetPoints) ||
      numTargetPoints <= 0
    ) {
      return;
    }

    await onSubmit({
      rewardCurrencyId,
      goalName: goalName.trim(),
      goalDescription: goalDescription.trim() || undefined,
      targetPoints: numTargetPoints,
      goalType: goalType || undefined,
      priority,
      targetDate,
      targetRoute: targetRoute.trim() || undefined,
      targetCabin: targetCabin || undefined,
    });
  };

  const isFlightGoal = goalType === "flight";
  const selectedCurrency = (rewardCurrencies || []).find(
    (c) => c.id === rewardCurrencyId
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-lg max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden"
        hideCloseButton
      >
        <DialogHeader
          className="border-b flex-shrink-0"
          showCloseButton
          onClose={onClose}
        >
          <DialogTitle className="flex items-center justify-center gap-2">
            <Target className="h-5 w-5" />
            {isEditing ? "Edit Goal" : "Create Redemption Goal"}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 min-h-0 overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
            {/* Goal Name */}
            <div className="space-y-2">
              <Label htmlFor="goalName">Goal Name</Label>
              <Input
                id="goalName"
                placeholder="e.g., Business class to Tokyo"
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
              />
            </div>

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

            {/* Goal Type & Priority */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="type">Goal Type</Label>
                <Select
                  value={goalType}
                  onValueChange={(v) => setGoalType(v as GoalType)}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {GOAL_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={String(priority)}
                  onValueChange={(v) => setPriority(Number(v))}
                >
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Target Points */}
            <div className="space-y-2">
              <Label htmlFor="targetPoints">Target Points</Label>
              <Input
                id="targetPoints"
                type="number"
                min="0"
                step="1"
                placeholder="120000"
                value={targetPoints}
                onChange={(e) => setTargetPoints(e.target.value)}
              />
              {selectedCurrency && targetPoints && (
                <p className="text-sm text-muted-foreground">
                  {Number(targetPoints).toLocaleString()}{" "}
                  {selectedCurrency.displayName}
                </p>
              )}
            </div>

            {/* Flight-specific goal fields */}
            {isFlightGoal && (
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <div className="text-sm font-medium">Flight Goal Details</div>

                {/* Target Route */}
                <div className="space-y-2">
                  <Label htmlFor="route">Target Route</Label>
                  <Input
                    id="route"
                    placeholder="e.g., SFO → NRT"
                    value={targetRoute}
                    onChange={(e) => setTargetRoute(e.target.value)}
                  />
                </div>

                {/* Target Cabin */}
                <div className="space-y-2">
                  <Label htmlFor="cabin">Target Cabin Class</Label>
                  <Select
                    value={targetCabin}
                    onValueChange={(v) => setTargetCabin(v as CabinClass)}
                  >
                    <SelectTrigger id="cabin">
                      <SelectValue placeholder="Select cabin" />
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
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="e.g., Summer 2026 anniversary trip"
                value={goalDescription}
                onChange={(e) => setGoalDescription(e.target.value)}
                rows={2}
              />
            </div>

            {/* Target Date */}
            <div className="space-y-2">
              <Label>Target Date (optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !targetDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {targetDate ? (
                      format(targetDate, "PPP")
                    ) : (
                      <span>Pick a target date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={targetDate}
                    onSelect={setTargetDate}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
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
                !goalName.trim() ||
                !targetPoints ||
                Number(targetPoints) <= 0
              }
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Goal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default GoalDialog;

/**
 * PointsManager - Main page for managing reward points
 *
 * Features:
 * - Balance overview with breakdown (starting + earned - redeemed - transferred)
 * - Manual adjustments for bonuses, corrections
 * - Redemption logging with flight details and CPP tracking
 * - Transfer tracking between programs
 * - Redemption goals with progress tracking
 * - Activity feed of all point movements
 */

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  TrendingUp,
  ArrowRightLeft,
  Target,
  Activity,
  CoinsIcon,
} from "lucide-react";
import { format } from "date-fns";
import { ConversionService } from "@/core/currency";
import type { RewardCurrency } from "@/core/currency/types";
import type {
  PointsBalance,
  PointsGoal,
  PointsAdjustment,
  PointsRedemption,
  PointsTransfer,
  PointsAdjustmentInput,
  PointsRedemptionInput,
  PointsTransferInput,
  PointsGoalInput,
  PointsBalanceInput,
} from "@/core/points/types";

// Hooks
import {
  usePointsBalances,
  useBalanceBreakdown,
  usePointsBalanceMutations,
} from "@/hooks/points/usePointsBalances";
import {
  usePointsAdjustments,
  usePointsAdjustmentMutations,
} from "@/hooks/points/usePointsAdjustments";
import {
  usePointsRedemptions,
  usePointsRedemptionMutations,
} from "@/hooks/points/usePointsRedemptions";
import {
  usePointsTransfers,
  usePointsTransferMutations,
} from "@/hooks/points/usePointsTransfers";
import {
  useActiveGoals,
  usePointsGoalMutations,
} from "@/hooks/points/usePointsGoals";
import { usePointsActivityFeed } from "@/hooks/points/usePointsActivityFeed";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";

// Components
import {
  BalanceCard,
  StartingBalanceDialog,
  AdjustmentDialog,
  AdjustmentDetailDialog,
  AdjustmentsTable,
  RedemptionDialog,
  RedemptionDetailDialog,
  RedemptionsTable,
  TransferDialog,
  TransferDetailDialog,
  TransfersTable,
  GoalDialog,
  ActivityFeedList,
  GoalProgressList,
} from "@/components/points";

type DialogType =
  | "balance"
  | "adjustment"
  | "adjustmentDetail"
  | "redemption"
  | "redemptionDetail"
  | "transfer"
  | "transferDetail"
  | "goal"
  | null;

/**
 * Wrapper component for BalanceCard that handles its own breakdown hook
 * This avoids the dynamic hooks issue where the number of hooks changes
 */
function BalanceCardWithBreakdown({
  balance,
  onEditStartingBalance,
}: {
  balance: PointsBalance;
  onEditStartingBalance: () => void;
}) {
  const { data: breakdown } = useBalanceBreakdown(
    balance.rewardCurrencyId,
    undefined, // cardTypeId deprecated, no longer on PointsBalance
    balance.paymentMethodId
  );

  return (
    <BalanceCard
      balance={balance}
      breakdown={breakdown ?? undefined}
      onEditStartingBalance={onEditStartingBalance}
      cardImageUrl={balance.cardImageUrl}
    />
  );
}

export default function PointsManager() {
  // Fetch reward currencies and conversion rates
  const [rewardCurrencies, setRewardCurrencies] = useState<RewardCurrency[]>(
    []
  );
  const [conversionRates, setConversionRates] = useState<
    Array<{
      sourceCurrencyId: string;
      targetCurrencyId: string;
      rate: number;
      sourceBlock: number | null;
      targetBlock: number | null;
      transferIncrement: number | null;
    }>
  >([]);
  const [currenciesLoading, setCurrenciesLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const conversionService = ConversionService.getInstance();
      const [currencies, rates] = await Promise.all([
        conversionService.getRewardCurrencies(),
        conversionService.getAllConversionRatesWithCurrencies(),
      ]);
      setRewardCurrencies(currencies);
      setConversionRates(rates);
      setCurrenciesLoading(false);
    };
    fetchData();
  }, []);

  // Balances
  const { data: balances = [], isLoading: balancesLoading } =
    usePointsBalances();

  // Payment methods (for card-specific balance selection)
  const { paymentMethods = [] } = usePaymentMethods();

  // Goals
  const { data: activeGoals = [], isLoading: goalsLoading } = useActiveGoals();

  // Activity feed
  const { data: activityFeed = [], isLoading: activityLoading } =
    usePointsActivityFeed({ limit: 20 });

  // All adjustments (for table view)
  const { data: allAdjustments = [], isLoading: adjustmentsLoading } =
    usePointsAdjustments();

  // All redemptions (for table view)
  const { data: allRedemptions = [], isLoading: redemptionsLoading } =
    usePointsRedemptions();

  // All transfers (for table view)
  const { data: allTransfers = [], isLoading: transfersLoading } =
    usePointsTransfers();

  // Mutations
  const { setStartingBalance } = usePointsBalanceMutations();
  const { addAdjustment, updateAdjustment, deleteAdjustment } =
    usePointsAdjustmentMutations();
  const { addRedemption, updateRedemption, deleteRedemption } =
    usePointsRedemptionMutations();
  const { addTransfer, deleteTransfer } = usePointsTransferMutations();
  const { addGoal, completeGoal, cancelGoal } = usePointsGoalMutations();

  // Dialog state
  const [openDialog, setOpenDialog] = useState<DialogType>(null);
  const [selectedCurrencyId, setSelectedCurrencyId] = useState<
    string | undefined
  >();
  const [editingBalance, setEditingBalance] = useState<
    PointsBalance | undefined
  >();
  const [editingGoal, setEditingGoal] = useState<PointsGoal | undefined>();
  const [selectedAdjustment, setSelectedAdjustment] = useState<
    PointsAdjustment | undefined
  >();
  const [selectedRedemption, setSelectedRedemption] = useState<
    PointsRedemption | undefined
  >();
  const [selectedTransfer, setSelectedTransfer] = useState<
    PointsTransfer | undefined
  >();

  // Balance map for goal progress
  const balanceMap = useMemo(() => {
    const map = new Map<string, number>();
    (balances || []).forEach((b) =>
      map.set(b.rewardCurrencyId, b.currentBalance)
    );
    return map;
  }, [balances]);

  // Handlers
  const handleOpenBalanceDialog = (balance?: PointsBalance) => {
    setEditingBalance(balance);
    setSelectedCurrencyId(balance?.rewardCurrencyId);
    setOpenDialog("balance");
  };

  const handleOpenAdjustmentDialog = (currencyId?: string) => {
    setSelectedCurrencyId(currencyId);
    setOpenDialog("adjustment");
  };

  const handleOpenRedemptionDialog = (currencyId?: string) => {
    setSelectedCurrencyId(currencyId);
    setOpenDialog("redemption");
  };

  const handleOpenTransferDialog = (currencyId?: string) => {
    setSelectedCurrencyId(currencyId);
    setOpenDialog("transfer");
  };

  const handleOpenGoalDialog = (goal?: PointsGoal) => {
    setEditingGoal(goal);
    setSelectedCurrencyId(goal?.rewardCurrencyId);
    setOpenDialog("goal");
  };

  const handleCloseDialog = () => {
    setOpenDialog(null);
    setSelectedCurrencyId(undefined);
    setEditingBalance(undefined);
    setEditingGoal(undefined);
    setSelectedAdjustment(undefined);
    setSelectedRedemption(undefined);
    setSelectedTransfer(undefined);
  };

  const handleOpenAdjustmentDetail = (adjustment: PointsAdjustment) => {
    // If it's a starting balance entry, open the balance edit dialog instead
    if (adjustment.adjustmentType === "starting_balance") {
      const balance = balances.find(
        (b) => b.rewardCurrencyId === adjustment.rewardCurrencyId
      );
      if (balance) {
        handleOpenBalanceDialog(balance);
        return;
      }
    }
    setSelectedAdjustment(adjustment);
    setOpenDialog("adjustmentDetail");
  };

  const handleUpdateAdjustment = async (
    id: string,
    input: Partial<PointsAdjustmentInput>
  ) => {
    await updateAdjustment.mutateAsync({ id, input });
    handleCloseDialog();
  };

  const handleDeleteAdjustment = async (id: string) => {
    await deleteAdjustment.mutateAsync(id);
    handleCloseDialog();
  };

  const handleOpenRedemptionDetail = (redemption: PointsRedemption) => {
    setSelectedRedemption(redemption);
    setOpenDialog("redemptionDetail");
  };

  const handleUpdateRedemption = async (
    id: string,
    input: Partial<PointsRedemptionInput>
  ) => {
    await updateRedemption.mutateAsync({ id, input });
    handleCloseDialog();
  };

  const handleDeleteRedemption = async (id: string) => {
    await deleteRedemption.mutateAsync(id);
    handleCloseDialog();
  };

  const handleOpenTransferDetail = (transfer: PointsTransfer) => {
    setSelectedTransfer(transfer);
    setOpenDialog("transferDetail");
  };

  const handleDeleteTransfer = async (id: string) => {
    await deleteTransfer.mutateAsync(id);
    handleCloseDialog();
  };

  const handleSubmitBalance = async (input: PointsBalanceInput) => {
    await setStartingBalance.mutateAsync(input);
    handleCloseDialog();
  };

  const handleSubmitAdjustment = async (input: PointsAdjustmentInput) => {
    await addAdjustment.mutateAsync(input);
    handleCloseDialog();
  };

  const handleSubmitRedemption = async (input: PointsRedemptionInput) => {
    await addRedemption.mutateAsync(input);
    handleCloseDialog();
  };

  const handleSubmitTransfer = async (input: PointsTransferInput) => {
    await addTransfer.mutateAsync(input);
    handleCloseDialog();
  };

  const handleSubmitGoal = async (input: PointsGoalInput) => {
    if (editingGoal) {
      // TODO: implement update goal
    } else {
      await addGoal.mutateAsync(input);
    }
    handleCloseDialog();
  };

  const handleCompleteGoal = async (goal: PointsGoal) => {
    await completeGoal.mutateAsync(goal.id);
  };

  const handleCancelGoal = async (goal: PointsGoal) => {
    await cancelGoal.mutateAsync(goal.id);
  };

  const isLoading = currenciesLoading || balancesLoading;

  return (
    <div className="min-h-screen">
      <div className="container max-w-7xl mx-auto pb-16 px-4 md:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10 mt-4">
          <div>
            <h1 className="text-2xl font-medium tracking-tight text-gradient">
              Points Manager
            </h1>
            <p className="text-muted-foreground mt-1.5 text-sm">
              Track your reward points, redemptions, and goals
            </p>
          </div>
          <div className="flex gap-2 mt-4 sm:mt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenBalanceDialog()}
            >
              <CoinsIcon className="h-4 w-4 mr-1" />
              Set Balance
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenAdjustmentDialog()}
            >
              <TrendingUp className="h-4 w-4 mr-1" />
              Adjustment
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenRedemptionDialog()}
            >
              <Plus className="h-4 w-4 mr-1" />
              Redemption
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleOpenTransferDialog()}
              >
                <ArrowRightLeft className="h-4 w-4 mr-1" />
                Record Transfer
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleOpenGoalDialog()}
              >
                <Target className="h-4 w-4 mr-1" />
                Create Goal
              </Button>
            </div>

            {/* Balance Cards */}
            <div>
              <h2 className="text-lg font-medium mb-4">Your Balances</h2>
              {isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardContent className="pt-6">
                        <Skeleton className="h-10 w-10 rounded-full mb-4" />
                        <Skeleton className="h-8 w-32 mb-2" />
                        <Skeleton className="h-4 w-24" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : !balances || balances.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <CoinsIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">
                      No balances set up yet
                    </p>
                    <Button onClick={() => handleOpenBalanceDialog()}>
                      <Plus className="h-4 w-4 mr-1" />
                      Set Your First Balance
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {(balances || []).map((balance) => (
                    <BalanceCardWithBreakdown
                      key={balance.id}
                      balance={balance}
                      onEditStartingBalance={() =>
                        handleOpenBalanceDialog(balance)
                      }
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Points Adjustments Table */}
            {allAdjustments && allAdjustments.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Points Adjustments
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenAdjustmentDialog()}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Adjustment
                  </Button>
                </div>
                <AdjustmentsTable
                  adjustments={allAdjustments}
                  onRowClick={handleOpenAdjustmentDetail}
                />
              </div>
            )}

            {/* Redemptions Table */}
            {allRedemptions && allRedemptions.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <CoinsIcon className="h-5 w-5" />
                    Redemptions
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenRedemptionDialog()}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Log Redemption
                  </Button>
                </div>
                <RedemptionsTable
                  redemptions={allRedemptions}
                  onRowClick={handleOpenRedemptionDetail}
                />
              </div>
            )}

            {/* Transfers Table */}
            {allTransfers && allTransfers.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <ArrowRightLeft className="h-5 w-5" />
                    Transfers
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenTransferDialog()}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Record Transfer
                  </Button>
                </div>
                <TransfersTable
                  transfers={allTransfers}
                  onRowClick={handleOpenTransferDetail}
                />
              </div>
            )}

            {/* Active Goals Preview */}
            {!goalsLoading && activeGoals && activeGoals.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium">Active Goals</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenGoalDialog()}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Goal
                  </Button>
                </div>
                <GoalProgressList
                  goals={activeGoals.slice(0, 3)}
                  balances={balanceMap}
                  onEditGoal={handleOpenGoalDialog}
                  onCompleteGoal={handleCompleteGoal}
                  onCancelGoal={handleCancelGoal}
                />
              </div>
            )}
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Redemption Goals</h2>
              <Button size="sm" onClick={() => handleOpenGoalDialog()}>
                <Plus className="h-4 w-4 mr-1" />
                Create Goal
              </Button>
            </div>

            {goalsLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2].map((i) => (
                  <Card key={i}>
                    <CardContent className="pt-6">
                      <Skeleton className="h-6 w-40 mb-4" />
                      <Skeleton className="h-2 w-full mb-2" />
                      <Skeleton className="h-4 w-24" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !activeGoals || activeGoals.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    No goals yet. Set a redemption target to track your
                    progress!
                  </p>
                  <Button onClick={() => handleOpenGoalDialog()}>
                    <Plus className="h-4 w-4 mr-1" />
                    Create Your First Goal
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <GoalProgressList
                goals={activeGoals}
                balances={balanceMap}
                onEditGoal={handleOpenGoalDialog}
                onCompleteGoal={handleCompleteGoal}
                onCancelGoal={handleCancelGoal}
              />
            )}
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Activity Feed</h2>
            </div>

            <Card>
              <CardContent className="pt-6">
                {activityLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-32 mb-2" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <ActivityFeedList
                    items={activityFeed}
                    emptyMessage="No activity yet. Record an adjustment, redemption, or transfer to get started."
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <StartingBalanceDialog
          isOpen={openDialog === "balance"}
          onClose={handleCloseDialog}
          onSubmit={handleSubmitBalance}
          rewardCurrencies={rewardCurrencies}
          paymentMethods={paymentMethods}
          existingBalance={editingBalance}
          defaultCurrencyId={selectedCurrencyId}
          isLoading={setStartingBalance.isPending}
        />

        <AdjustmentDialog
          isOpen={openDialog === "adjustment"}
          onClose={handleCloseDialog}
          onSubmit={handleSubmitAdjustment}
          rewardCurrencies={rewardCurrencies}
          defaultCurrencyId={selectedCurrencyId}
          isLoading={addAdjustment.isPending}
        />

        <AdjustmentDetailDialog
          adjustment={selectedAdjustment ?? null}
          isOpen={openDialog === "adjustmentDetail"}
          onClose={handleCloseDialog}
          onUpdate={handleUpdateAdjustment}
          onDelete={handleDeleteAdjustment}
          rewardCurrencies={rewardCurrencies}
          isLoading={updateAdjustment.isPending || deleteAdjustment.isPending}
        />

        <RedemptionDialog
          isOpen={openDialog === "redemption"}
          onClose={handleCloseDialog}
          onSubmit={handleSubmitRedemption}
          rewardCurrencies={rewardCurrencies}
          defaultCurrencyId={selectedCurrencyId}
          isLoading={addRedemption.isPending}
        />

        <RedemptionDetailDialog
          redemption={selectedRedemption ?? null}
          isOpen={openDialog === "redemptionDetail"}
          onClose={handleCloseDialog}
          onUpdate={handleUpdateRedemption}
          onDelete={handleDeleteRedemption}
          rewardCurrencies={rewardCurrencies}
          isLoading={updateRedemption.isPending || deleteRedemption.isPending}
        />

        <TransferDialog
          isOpen={openDialog === "transfer"}
          onClose={handleCloseDialog}
          onSubmit={handleSubmitTransfer}
          rewardCurrencies={rewardCurrencies}
          conversionRates={conversionRates}
          defaultSourceCurrencyId={selectedCurrencyId}
          isLoading={addTransfer.isPending}
          balances={balances}
          sourceBalances={balanceMap}
        />

        <TransferDetailDialog
          transfer={selectedTransfer ?? null}
          isOpen={openDialog === "transferDetail"}
          onClose={handleCloseDialog}
          onDelete={handleDeleteTransfer}
          isLoading={deleteTransfer.isPending}
        />

        <GoalDialog
          isOpen={openDialog === "goal"}
          onClose={handleCloseDialog}
          onSubmit={handleSubmitGoal}
          rewardCurrencies={rewardCurrencies}
          goal={editingGoal}
          defaultCurrencyId={selectedCurrencyId}
          isLoading={addGoal.isPending}
        />
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { SimulatorForm } from "@/components/simulator/SimulatorForm";
import { CardComparisonChart } from "@/components/simulator/CardComparisonChart";
import {
  SimulatorService,
  SimulationInput,
  CardCalculationResult,
} from "@/core/currency/SimulatorService";
import { ConversionService } from "@/core/currency/ConversionService";
import { rewardService } from "@/core/rewards/RewardService";
import { monthlySpendingTracker } from "@/core/rewards/MonthlySpendingTracker";
import { initializeRewardSystem } from "@/core/rewards";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { PaymentMethod } from "@/types";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, CreditCard } from "lucide-react";

/**
 * CardOptimizerSimulator page component
 *
 * Main page component that orchestrates the simulator functionality.
 * Allows users to input transaction details and see reward calculations
 * for all active cards, converted to a common miles currency.
 *
 * Requirements: 1.1, 2.1, 2.2, 2.4, 3.1, 3.5, 4.1, 4.5, 10.1, 10.3, 10.4, 10.5
 */
export default function CardOptimizerSimulator() {
  const navigate = useNavigate();

  // State management
  const [transactionInput, setTransactionInput] =
    useState<SimulationInput | null>(null);
  const [calculationResults, setCalculationResults] = useState<
    CardCalculationResult[]
  >([]);
  const [selectedMilesCurrencyId, setSelectedMilesCurrencyId] =
    useState<string>("");
  const [isCalculating, setIsCalculating] = useState(false);
  const [initializationStatus, setInitializationStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [initError, setInitError] = useState<string | null>(null);

  // Load payment methods
  const {
    paymentMethods,
    isLoading: isLoadingPaymentMethods,
    error: paymentMethodsError,
  } = usePaymentMethods();

  // Use refs to avoid dependency issues in callbacks
  const paymentMethodsRef = useRef<PaymentMethod[]>([]);
  const selectedMilesCurrencyIdRef = useRef<string>(selectedMilesCurrencyId);

  useEffect(() => {
    paymentMethodsRef.current = paymentMethods;
  }, [paymentMethods]);

  useEffect(() => {
    selectedMilesCurrencyIdRef.current = selectedMilesCurrencyId;
  }, [selectedMilesCurrencyId]);

  // Initialize services
  const [simulatorService, setSimulatorService] =
    useState<SimulatorService | null>(null);

  /**
   * Initialize reward system on mount (Requirement 10.3)
   */
  useEffect(() => {
    const initialize = async () => {
      setInitializationStatus("loading");

      try {
        await initializeRewardSystem();

        const conversionService = ConversionService.getInstance();
        const simulator = new SimulatorService(
          rewardService,
          conversionService,
          monthlySpendingTracker
        );

        setSimulatorService(simulator);
        setInitializationStatus("success");
      } catch (error) {
        console.error("Failed to initialize reward system:", error);
        setInitError(
          error instanceof Error
            ? error.message
            : "Unknown initialization error"
        );
        setInitializationStatus("error");
      }
    };

    initialize();
  }, []);

  /**
   * Handle transaction input changes with debouncing (Requirement 1.1)
   * Debouncing is handled in SimulatorForm component
   */
  const handleTransactionChange = useCallback(
    async (input: SimulationInput) => {
      setTransactionInput(input);
    },
    []
  );

  /**
   * Handle miles currency changes (Requirement 3.5)
   */
  const handleMilesCurrencyChange = useCallback((currencyId: string) => {
    setSelectedMilesCurrencyId(currencyId);
  }, []);

  /**
   * Calculate rewards when transaction input or miles currency changes
   * Use JSON.stringify to detect actual changes in transactionInput object
   */
  useEffect(() => {
    if (
      !simulatorService ||
      !transactionInput ||
      paymentMethodsRef.current.length === 0
    ) {
      return;
    }

    const calculateRewards = async () => {
      // Skip if no miles currency selected yet
      if (!selectedMilesCurrencyId) return;

      setIsCalculating(true);
      // Filter to only active credit cards
      const creditCards = paymentMethodsRef.current.filter(
        (pm) => pm.active && pm.type === "credit_card"
      );

      console.log(
        "[CardOptimizerSimulator] Credit cards for simulation:",
        creditCards.map((pm) => ({
          name: pm.name,
          issuer: pm.issuer,
          rewardCurrencyId: pm.rewardCurrencyId,
        }))
      );

      try {
        const results = await simulatorService.simulateAllCardsById(
          transactionInput,
          creditCards,
          selectedMilesCurrencyId
        );

        setCalculationResults(results);
      } catch (error) {
        console.error("Error calculating rewards:", error);
      } finally {
        setIsCalculating(false);
      }
    };

    calculateRewards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    simulatorService,
    JSON.stringify(transactionInput),
    selectedMilesCurrencyId,
  ]);

  /**
   * Retry initialization (Requirement 10.4)
   */
  const handleRetryInitialization = () => {
    setInitializationStatus("idle");
    setInitError(null);
    window.location.reload();
  };

  // Show loading state during initialization
  if (initializationStatus === "loading" || isLoadingPaymentMethods) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            Initializing Card Optimizer...
          </p>
        </div>
      </div>
    );
  }

  // Show initialization error (Requirement 10.4)
  if (initializationStatus === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <h2 className="text-lg font-medium text-foreground">
              Initialization Error
            </h2>
          </div>
          <p className="text-muted-foreground mb-4">
            Failed to initialize the reward calculation system.
          </p>
          {initError && (
            <p className="text-sm text-muted-foreground mb-4 font-mono bg-muted p-2 rounded">
              {initError}
            </p>
          )}
          <Button onClick={handleRetryInitialization} className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry Initialization
          </Button>
        </div>
      </div>
    );
  }

  // Show payment methods error (Requirement 10.4)
  if (paymentMethodsError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <h2 className="text-lg font-medium text-foreground">
              Error Loading Payment Methods
            </h2>
          </div>
          <p className="text-muted-foreground mb-4">
            {paymentMethodsError.message}
          </p>
          <Button onClick={() => window.location.reload()} className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Show empty state when no active credit cards (Requirement 10.5)
  // Filter to only credit cards since other payment types don't earn rewards
  const activePaymentMethods = paymentMethods.filter(
    (pm) => pm.active && pm.type === "credit_card"
  );
  if (!isLoadingPaymentMethods && activePaymentMethods.length === 0) {
    return (
      <div className="min-h-screen">
        <div className="container max-w-7xl mx-auto pb-16">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10 mt-4">
            <div>
              <h1 className="text-2xl font-medium tracking-tight text-gradient">
                Card Optimizer Simulator
              </h1>
              <p className="text-muted-foreground mt-1.5 text-sm">
                Compare rewards across all your cards
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow">
            <CreditCard className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No Active Payment Methods
            </h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md px-4">
              You need to add at least one active payment method to use the Card
              Optimizer Simulator.
            </p>
            <Button onClick={() => navigate("/payment-methods")} size="lg">
              <CreditCard className="w-4 h-4 mr-2" />
              Add Payment Methods
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Main simulator interface
  return (
    <div className="min-h-screen px-4 md:px-0">
      {/* Responsive container: full-width on mobile, centered with max-width on tablet/desktop */}
      <div className="mx-auto w-full md:max-w-[600px] lg:max-w-[640px] pb-16">
        {/* Page Header */}
        <div className="mb-6 md:mb-8 mt-4 md:mt-6">
          <h1 className="text-2xl font-medium tracking-tight text-gradient">
            Card Optimizer Simulator
          </h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            Compare rewards across all your cards
          </p>
        </div>

        {/* Simulator Form - Updated spacing (Requirements 13.3, 4.1-4.3) */}
        <div style={{ marginBottom: "var(--space-xl)" }}>
          <SimulatorForm
            onInputChange={handleTransactionChange}
            initialValues={transactionInput || undefined}
          />
        </div>

        {/* Card Comparison Chart (Requirement 4.1) */}
        <CardComparisonChart
          results={calculationResults}
          selectedMilesCurrencyId={selectedMilesCurrencyId}
          onMilesCurrencyChange={handleMilesCurrencyChange}
          isLoading={isCalculating}
        />
      </div>
    </div>
  );
}

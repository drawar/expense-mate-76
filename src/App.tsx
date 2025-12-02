import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Transactions from "./pages/Transactions";
import AddExpense from "./pages/AddExpense";
import PaymentMethods from "./pages/PaymentMethods";
import RewardPoints from "./pages/RewardPoints";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage";
import DiagnoseRewards from "./pages/DiagnoseRewards";
import CardOptimizerSimulator from "./pages/CardOptimizerSimulator";
import SeedConversionRates from "./pages/SeedConversionRates";
import DeleteMembershipRewards from "./pages/DeleteMembershipRewards";
import Settings from "./pages/Settings";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { initializeRuleRepository } from "@/core/rewards/RuleRepository";
import { toast } from "sonner";

const queryClient = new QueryClient();

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize RuleRepository on app mount
    try {
      console.log("Initializing RuleRepository...");
      initializeRuleRepository(supabase);
      console.log("RuleRepository initialized successfully");
      setIsInitialized(true);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Failed to initialize RuleRepository:", errorMessage);
      setInitError(errorMessage);

      // Show error toast to user
      toast.error("Initialization Error", {
        description:
          "Failed to initialize reward rules system. Some features may not work correctly.",
        duration: 5000,
      });
    }
  }, []);

  // Show loading state while initializing
  if (!isInitialized && !initError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Initializing application...
          </p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route path="/auth" element={<AuthPage />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Index />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/transactions"
                  element={
                    <ProtectedRoute>
                      <Transactions />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/add-expense"
                  element={
                    <ProtectedRoute>
                      <AddExpense />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/payment-methods"
                  element={
                    <ProtectedRoute>
                      <PaymentMethods />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reward-points"
                  element={
                    <ProtectedRoute>
                      <RewardPoints />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/diagnose-rewards"
                  element={
                    <ProtectedRoute>
                      <DiagnoseRewards />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/card-optimizer"
                  element={
                    <ProtectedRoute>
                      <CardOptimizerSimulator />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/seed-conversion-rates"
                  element={
                    <ProtectedRoute>
                      <SeedConversionRates />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/delete-membership-rewards"
                  element={
                    <ProtectedRoute>
                      <DeleteMembershipRewards />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

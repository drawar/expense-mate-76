import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import MainLayout from "@/components/layout/MainLayout";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage";
import { useEffect, useState, lazy, Suspense } from "react";

// Lazy load pages for better initial load performance
const Index = lazy(() => import("./pages/Index"));
const Transactions = lazy(() => import("./pages/Transactions"));
const AddExpense = lazy(() => import("./pages/AddExpense"));
const PaymentMethods = lazy(() => import("./pages/PaymentMethods"));
const RewardPoints = lazy(() => import("./pages/RewardPoints"));
const DiagnoseRewards = lazy(() => import("./pages/DiagnoseRewards"));
const CardOptimizerSimulator = lazy(
  () => import("./pages/CardOptimizerSimulator")
);
const DeleteMembershipRewards = lazy(
  () => import("./pages/DeleteMembershipRewards")
);
const Settings = lazy(() => import("./pages/Settings"));
const PointsManager = lazy(() => import("./pages/PointsManager"));
const Income = lazy(() => import("./pages/Income"));
import { supabase } from "@/integrations/supabase/client";
import { initializeRuleRepository } from "@/core/rewards/RuleRepository";
import { LocaleService } from "@/core/locale";
import { UserPreferencesService } from "@/core/preferences";
import { toast } from "sonner";

// Export queryClient so it can be cleared on logout
export const queryClient = new QueryClient();

// Page loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      // Initialize RuleRepository on app mount
      try {
        console.log("Initializing RuleRepository...");
        initializeRuleRepository(supabase);
        console.log("RuleRepository initialized successfully");
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

      // Mark as initialized immediately - locale detection happens in background
      setIsInitialized(true);

      // Detect user locale in background (non-blocking)
      // LocaleService already loads from localStorage cache synchronously in constructor
      LocaleService.detectLocale()
        .then((locale) => {
          console.log(
            `Locale detected: ${locale.country} → ${locale.currency}`
          );
        })
        .catch((error) => {
          console.warn("Failed to detect locale:", error);
        });

      // Load saved currency preference in background (non-blocking)
      UserPreferencesService.getDefaultCurrency()
        .then((savedCurrency) => {
          if (savedCurrency) {
            LocaleService.setDefaultCurrency(savedCurrency);
            console.log(`Loaded saved currency preference: ${savedCurrency}`);
          }
        })
        .catch((error) => {
          console.warn("Failed to load currency preference:", error);
        });
    };

    initialize();
  }, []);

  // Show loading state while initializing
  if (!isInitialized && !initError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Initializing application...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TooltipProvider>
            <BrowserRouter>
              <AuthProvider>
                <Toaster />
                <Routes>
                  <Route path="/auth" element={<AuthPage />} />
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <MainLayout>
                          <Suspense fallback={<PageLoader />}>
                            <Index />
                          </Suspense>
                        </MainLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/transactions"
                    element={
                      <ProtectedRoute>
                        <MainLayout>
                          <Suspense fallback={<PageLoader />}>
                            <Transactions />
                          </Suspense>
                        </MainLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/add-expense"
                    element={
                      <ProtectedRoute>
                        <MainLayout>
                          <Suspense fallback={<PageLoader />}>
                            <AddExpense />
                          </Suspense>
                        </MainLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/payment-methods"
                    element={
                      <ProtectedRoute>
                        <MainLayout>
                          <Suspense fallback={<PageLoader />}>
                            <PaymentMethods />
                          </Suspense>
                        </MainLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/reward-points"
                    element={
                      <ProtectedRoute>
                        <MainLayout>
                          <Suspense fallback={<PageLoader />}>
                            <RewardPoints />
                          </Suspense>
                        </MainLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/diagnose-rewards"
                    element={
                      <ProtectedRoute>
                        <MainLayout>
                          <Suspense fallback={<PageLoader />}>
                            <DiagnoseRewards />
                          </Suspense>
                        </MainLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/card-optimizer"
                    element={
                      <ProtectedRoute>
                        <MainLayout>
                          <Suspense fallback={<PageLoader />}>
                            <CardOptimizerSimulator />
                          </Suspense>
                        </MainLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/delete-membership-rewards"
                    element={
                      <ProtectedRoute>
                        <MainLayout>
                          <Suspense fallback={<PageLoader />}>
                            <DeleteMembershipRewards />
                          </Suspense>
                        </MainLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <MainLayout>
                          <Suspense fallback={<PageLoader />}>
                            <Settings />
                          </Suspense>
                        </MainLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/points-manager"
                    element={
                      <ProtectedRoute>
                        <MainLayout>
                          <Suspense fallback={<PageLoader />}>
                            <PointsManager />
                          </Suspense>
                        </MainLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/income"
                    element={
                      <ProtectedRoute>
                        <MainLayout>
                          <Suspense fallback={<PageLoader />}>
                            <Income />
                          </Suspense>
                        </MainLayout>
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
    </ErrorBoundary>
  );
}

export default App;

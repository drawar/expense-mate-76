
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { useEffect } from "react";
import Index from "./pages/Index";
import AddExpense from "./pages/AddExpense";
import PaymentMethods from "./pages/PaymentMethods";
import Transactions from "./pages/Transactions";
import NotFound from "./pages/NotFound";
import { initializeStorage } from "./utils/storageUtils";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => {
  // Initialize default data
  useEffect(() => {
    initializeStorage();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="ui-theme">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/add-expense" element={<AddExpense />} />
              <Route path="/payment-methods" element={<PaymentMethods />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;

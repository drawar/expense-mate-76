
import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import Sidebar from '@/components/layout/Sidebar';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

// Remove App.css import to prevent conflicts with Tailwind
import '@/styles/global-enhancements.css';
import Index from '@/pages/Index';
import Transactions from '@/pages/Transactions';
import AddExpense from '@/pages/AddExpense';
import PaymentMethods from '@/pages/PaymentMethods';
import RewardPoints from '@/pages/RewardPoints';
import NotFound from '@/pages/NotFound';

// Configure React Query client with optimal settings
// Use a singleton pattern for QueryClient to ensure it's consistent throughout the app
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const isMobile = useIsMobile();
  
  const toggleSidebar = () => {
    setSidebarExpanded(!sidebarExpanded);
  };
  
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <Router>
          <div className="relative min-h-screen bg-background">
            <Sidebar 
              expanded={sidebarExpanded} 
              onToggle={toggleSidebar} 
              sidebarVisible={sidebarVisible}
              setSidebarVisible={setSidebarVisible}
            />
            <main 
              className={`transition-all duration-300 ${
                isMobile 
                  ? 'ml-0 pt-16' // No left margin but add top padding for horizontal navbar on mobile
                  : (sidebarExpanded ? 'ml-48' : 'ml-20')
              }`}
              onClick={() => {
                if (isMobile && sidebarVisible) {
                  setSidebarVisible(false);
                }
              }}
            >
              <div 
                className={`mx-auto p-6 ${isMobile ? 'px-5 max-w-full pt-4' : 'container px-6 pt-8'}`}
                onClick={() => {
                  if (isMobile && sidebarVisible) {
                    setSidebarVisible(false);
                  }
                }}
              >
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/transactions" element={<Transactions />} />
                  <Route path="/add-expense" element={<AddExpense />} />
                  <Route path="/payment-methods" element={<PaymentMethods />} />
                  <Route path="/reward-points" element={<RewardPoints />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
            </main>
          </div>
        </Router>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

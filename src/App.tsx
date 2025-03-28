import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import Sidebar from '@/components/layout/Sidebar';

import '../styles/global-enhancements.css';
import Index from '@/pages/Index';
import Transactions from '@/pages/Transactions';
import AddExpense from '@/pages/AddExpense';
import PaymentMethods from '@/pages/PaymentMethods';
import RewardPoints from '@/pages/RewardPoints';
import NotFound from '@/pages/NotFound';

function App() {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const isMobile = useIsMobile();
  
  const toggleSidebar = () => {
    setSidebarExpanded(!sidebarExpanded);
  };
  
  return (
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
  );
}

export default App;
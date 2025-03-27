
import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import Sidebar from '@/components/layout/Sidebar';

import Index from '@/pages/Index';
import Transactions from '@/pages/Transactions';
import AddExpense from '@/pages/AddExpense';
import PaymentMethods from '@/pages/PaymentMethods';
import RewardPoints from '@/pages/RewardPoints';
import NotFound from '@/pages/NotFound';

function App() {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  
  const toggleSidebar = () => {
    setSidebarExpanded(!sidebarExpanded);
  };
  
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Router>
        <div className="flex min-h-screen">
          <Sidebar expanded={sidebarExpanded} onToggle={toggleSidebar} />
          <main 
            className={`flex-1 transition-all duration-300 bg-background ${
              sidebarExpanded ? 'ml-48' : 'ml-20'
            }`}
          >
            <div className="container mx-auto p-6 pt-8">
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

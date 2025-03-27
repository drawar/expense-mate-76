
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import Navbar from '@/components/layout/Navbar';

import Index from '@/pages/Index';
import Transactions from '@/pages/Transactions';
import AddExpense from '@/pages/AddExpense';
import PaymentMethods from '@/pages/PaymentMethods';
import RewardPoints from '@/pages/RewardPoints';
import NotFound from '@/pages/NotFound';

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Router>
        <Navbar />
        <main className="min-h-screen bg-background">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/add-expense" element={<AddExpense />} />
            <Route path="/payment-methods" element={<PaymentMethods />} />
            <Route path="/reward-points" element={<RewardPoints />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </Router>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;

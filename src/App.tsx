
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Index from '@/pages/Index';
import Transactions from '@/pages/Transactions';
import AddExpense from '@/pages/AddExpense';
import RewardPoints from '@/pages/RewardPoints';
import PaymentMethods from '@/pages/PaymentMethods';
import NotFound from '@/pages/NotFound';
import { initDatabase } from './services/LocalDatabaseService';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/layout/Navbar';
import { ThemeProvider } from '@/components/theme/theme-provider';

function App() {
  const { toast } = useToast();
  
  // Initialize the local database when the app starts
  useEffect(() => {
    const initializeStorage = async () => {
      try {
        await initDatabase();
        console.log('Local database initialized');
      } catch (error) {
        console.error('Error initializing local database:', error);
        toast({
          title: 'Storage Error',
          description: 'Failed to initialize local database. Some features may not work properly.',
          variant: 'destructive',
        });
      }
    };
    
    initializeStorage();
  }, [toast]);
  
  return (
    <ThemeProvider defaultTheme="system" storageKey="expense-tracker-theme">
      <Router>
        <Navbar />
        <main className="container mx-auto p-4 pt-0">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/add-expense" element={<AddExpense />} />
            <Route path="/reward-points" element={<RewardPoints />} />
            <Route path="/payment-methods" element={<PaymentMethods />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </Router>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;

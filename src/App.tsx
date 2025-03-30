import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Index from '@/pages/Index';
import Transactions from '@/pages/Transactions';
import NewExpense from '@/pages/NewExpense';
import RewardPoints from '@/pages/RewardPoints';
import Settings from '@/pages/Settings';
import { initDatabase } from './services/LocalDatabaseService';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';

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
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/new" element={<NewExpense />} />
          <Route path="/reward-points" element={<RewardPoints />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Router>
      <Toaster />
    </>
  );
}

export default App;

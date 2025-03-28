// src/containers/DashboardContainer.tsx
import React, { Component } from 'react';
import { Transaction, PaymentMethod } from '@/types';
import { getTransactions, getPaymentMethods } from '@/utils/storageUtils';
import { useToast } from '@/components/ui/use-toast';
import { supabase, USE_LOCAL_STORAGE_DEFAULT } from '@/integrations/supabase/client';
import DashboardView from '@/views/DashboardView';

// Type for Supabase real-time payload
interface RealtimePayload {
  new?: { date?: string; [key: string]: any };
  old?: { date?: string; [key: string]: any };
}

interface DashboardContainerProps {
  toast: ReturnType<typeof useToast>;
}

interface DashboardContainerState {
  transactions: Transaction[];
  paymentMethods: PaymentMethod[];
  loading: boolean;
  initialized: boolean;
}

/**
 * Container component responsible for data fetching and state management
 * for the Dashboard page. Implements the container pattern by separating
 * data management from presentation logic.
 */
class DashboardContainerClass extends Component<DashboardContainerProps, DashboardContainerState> {
  private supabaseChannel: any;
  
  constructor(props: DashboardContainerProps) {
    super(props);
    
    this.state = {
      transactions: [],
      paymentMethods: [],
      loading: true,
      initialized: false
    };
  }
  
  /**
   * Lifecycle method to fetch data when component mounts
   */
  componentDidMount() {
    this.loadData();
    this.setupRealtimeSubscription();
  }
  
  /**
   * Lifecycle method to clean up subscriptions when component unmounts
   */
  componentWillUnmount() {
    if (this.supabaseChannel) {
      supabase.removeChannel(this.supabaseChannel);
    }
  }
  
  /**
   * Set up real-time subscription to Supabase for transaction updates
   */
  setupRealtimeSubscription = () => {
    this.supabaseChannel = supabase
      .channel('public:transactions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'transactions'
      }, (payload: RealtimePayload) => {
        // Check if this is a recent transaction before triggering reload
        const payloadDate = payload.new?.date || payload.old?.date;
        if (payloadDate) {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const txDate = new Date(payloadDate);
          
          // Only reload if this is a recent transaction
          if (txDate >= thirtyDaysAgo) {
            this.loadData();
          }
        }
      })
      .subscribe();
  }
  
  /**
   * Load transactions and payment methods data from storage
   */
  loadData = async () => {
    try {
      if (!this.state.initialized) {
        this.setState({ 
          loading: true,
          initialized: true
        });
      }
      
      // Get only recent transactions for homepage (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Get payment methods - these are typically few in number
      const loadedPaymentMethods = await getPaymentMethods();
      
      // Get transactions and filter to recent ones client-side
      const allTransactions = await getTransactions(USE_LOCAL_STORAGE_DEFAULT);
      
      // Filter to only recent transactions (last 30 days) to improve performance
      const loadedTransactions = allTransactions.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate >= thirtyDaysAgo;
      }).slice(0, 50); // Limit to 50 most recent transactions for homepage performance
      
      this.setState({
        transactions: loadedTransactions,
        paymentMethods: loadedPaymentMethods,
        loading: false
      });
    } catch (error) {
      console.error('Error loading data:', error);
      this.props.toast.toast({
        title: 'Error loading data',
        description: 'There was a problem loading your expense data',
        variant: 'destructive'
      });
      this.setState({ loading: false });
    }
  }
  
  /**
   * Render the dashboard view with the loaded data
   */
  render() {
    const { transactions, paymentMethods, loading } = this.state;
    
    return (
      <DashboardView
        transactions={transactions}
        paymentMethods={paymentMethods}
        loading={loading}
      />
    );
  }
}

/**
 * Higher-order component to provide toast to the class component
 */
const DashboardContainer = () => {
  const toast = useToast();
  
  return <DashboardContainerClass toast={toast} />;
};

export default DashboardContainer;

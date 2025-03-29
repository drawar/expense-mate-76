// src/hooks/useDashboardFilters.ts
import { useState, useCallback } from 'react';
import { Currency } from '@/types';
import { TimeframeTab } from '@/utils/transactionProcessor';

/**
 * Custom hook to manage dashboard filter state
 * Centralizes all filter-related state and handlers in one place
 */
export function useDashboardFilters(defaultCurrency: Currency = 'SGD') {
  // Filter state
  const [activeTab, setActiveTab] = useState<TimeframeTab>('thisMonth');
  const [displayCurrency, setDisplayCurrency] = useState<Currency>(defaultCurrency);
  const [useStatementMonth, setUseStatementMonth] = useState(false);
  const [statementCycleDay, setStatementCycleDay] = useState(15);
  
  // Handler functions
  const handleTimeframeChange = useCallback((value: string) => {
    setActiveTab(value as TimeframeTab);
  }, []);
  
  const handleCurrencyChange = useCallback((currency: Currency) => {
    setDisplayCurrency(currency);
  }, []);
  
  const handleStatementMonthToggle = useCallback((value: boolean) => {
    setUseStatementMonth(value);
  }, []);
  
  const handleStatementCycleDayChange = useCallback((day: number) => {
    setStatementCycleDay(day);
  }, []);
  
  return {
    // Filter state
    activeTab,
    displayCurrency,
    useStatementMonth,
    statementCycleDay,
    
    // Handlers
    handleTimeframeChange,
    handleCurrencyChange,
    handleStatementMonthToggle,
    handleStatementCycleDayChange,
    
    // Setter functions (for backward compatibility)
    setActiveTab,
    setDisplayCurrency,
    setUseStatementMonth,
    setStatementCycleDay
  };
}

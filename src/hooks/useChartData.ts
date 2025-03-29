// src/hooks/useChartData.ts
import { useMemo } from 'react';
import { Transaction, Currency } from '@/types';
import { ChartDataItem } from '@/components/dashboard/charts/PieChart';
import { CHART_COLORS } from '@/utils/dashboardCalculations';
import { convertCurrency } from '@/utils/currencyConversion';

/**
 * Hook for processing data for pie charts
 */
export function usePieChartData(
  transactions: Transaction[],
  groupingField: 'paymentMethod' | 'category',
  displayCurrency: Currency
): ChartDataItem[] {
  return useMemo(() => {
    if (transactions.length === 0) return [];

    const groupTotals = new Map<string, number>();
    
    // Group transactions by the specified field
    transactions.forEach(tx => {
      try {
        // Get the appropriate grouping value
        let groupValue = 'Unknown';
        if (groupingField === 'paymentMethod') {
          groupValue = tx.paymentMethod?.name || 'Unknown';
        } else if (groupingField === 'category') {
          groupValue = tx.category || 'Uncategorized';
        }
        
        // Convert currency if needed
        const convertedAmount = convertCurrency(
          tx.amount,
          tx.currency as Currency,
          displayCurrency,
          tx.paymentMethod
        );
        
        // Add to group total
        const current = groupTotals.get(groupValue) || 0;
        groupTotals.set(groupValue, current + convertedAmount);
      } catch (error) {
        console.error(`Error processing ${groupingField} data:`, error);
      }
    });
    
    // Convert to chart data format with colors
    return Array.from(groupTotals.entries())
      .map(([name, value], index) => ({
        name,
        value,
        color: CHART_COLORS[index % CHART_COLORS.length]
      }))
      .sort((a, b) => b.value - a.value); // Sort by value descending
  }, [transactions, groupingField, displayCurrency]);
}

/**
 * Hook for processing time-series data for bar charts
 */
export function useBarChartData(
  transactions: Transaction[],
  period: 'week' | 'month' | 'quarter' | 'year',
  displayCurrency: Currency
) {
  return useMemo(() => {
    if (transactions.length === 0) {
      return { chartData: [], trend: 0, average: 0 };
    }
    
    // Determine the grouping period based on selected time frame
    const periodMapping = {
      week: 'day',
      month: 'week',
      quarter: 'month',
      year: 'month'
    };
    
    const groupBy = periodMapping[period];
    
    // Group transactions by date
    const dateMap = new Map<string, number>();
    
    transactions.forEach(tx => {
      try {
        const txDate = new Date(tx.date);
        let key: string;
        
        // Format the key based on the grouping period
        switch (groupBy) {
          case 'day':
            key = txDate.toISOString().split('T')[0]; // YYYY-MM-DD
            break;
          case 'week':
            // Get the start of the week (Sunday)
            const startOfWeek = new Date(txDate);
            startOfWeek.setDate(txDate.getDate() - txDate.getDay());
            key = startOfWeek.toISOString().split('T')[0];
            break;
          case 'month':
            key = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
            break;
          default:
            key = txDate.toISOString().split('T')[0];
        }
        
        // Convert currency if needed
        const convertedAmount = convertCurrency(
          tx.amount,
          tx.currency as Currency,
          displayCurrency,
          tx.paymentMethod
        );
        
        // Add to date total
        const existingAmount = dateMap.get(key) || 0;
        dateMap.set(key, existingAmount + convertedAmount);
      } catch (error) {
        console.error('Error processing time series data:', error);
      }
    });
    
    // Format keys for display
    const formatKey = (key: string, groupBy: string): string => {
      switch (groupBy) {
        case 'day':
          return new Date(key).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        case 'week':
          const startDate = new Date(key);
          const endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6);
          return `${startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString(undefined, { day: 'numeric' })}`;
        case 'month':
          const [year, month] = key.split('-');
          return new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
        default:
          return key;
      }
    };
    
    // Convert to array and sort chronologically
    const sortedKeys = Array.from(dateMap.keys()).sort();
    const data = sortedKeys.map(key => ({
      period: formatKey(key, groupBy),
      amount: dateMap.get(key) || 0,
      originalKey: key
    }));
    
    // Calculate trend (percentage change)
    let trend = 0;
    if (data.length >= 2) {
      const currentAmount = data[data.length - 1].amount;
      const previousAmount = data[data.length - 2].amount;
      
      if (previousAmount === 0) {
        trend = currentAmount > 0 ? 100 : 0;
      } else {
        trend = ((currentAmount - previousAmount) / previousAmount) * 100;
      }
    }
    
    // Calculate average
    const average = data.length > 0
      ? data.reduce((sum, item) => sum + item.amount, 0) / data.length
      : 0;
    
    return { chartData: data, trend, average };
  }, [transactions, period, displayCurrency]);
}

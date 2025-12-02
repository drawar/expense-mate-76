import { useEffect, useState } from 'react';
import { CardCalculationResult } from '@/core/currency/SimulatorService';
import { MilesCurrency } from '@/core/currency';
import { MilesCurrencySelector } from './MilesCurrencySelector';
import { CardBarRow } from './CardBarRow';
import { 
  getSimulatorTheme,
} from '@/core/currency/SimulatorTheme';
import { useTheme } from '@/components/theme/theme-provider';
import { Loader2, Sparkles, Leaf, Zap } from 'lucide-react';

interface CardComparisonChartProps {
  /**
   * Calculation results for all cards
   */
  results: CardCalculationResult[];
  
  /**
   * Currently selected miles currency
   */
  selectedMilesCurrency: MilesCurrency;
  
  /**
   * Callback when miles currency changes
   */
  onMilesCurrencyChange: (currency: MilesCurrency) => void;
  
  /**
   * Loading state during calculations
   */
  isLoading?: boolean;
}

/**
 * CardComparisonChart displays a horizontal bar chart comparing rewards across all cards
 * 
 * Features:
 * - Full-width panel with theme-aware background
 * - Chart header with olive icon cluster and miles currency selector
 * - Horizontal bar chart with sorted CardBarRow components
 * - Loading state
 * - Empty state (no active cards)
 * - Footer with disclaimer text
 * - Dark slate background (#121417) in dark mode
 * - Moss-green accents throughout
 * 
 * Requirements: 4.1, 4.2, 4.3, 10.5, 11.1, 11.2, 11.4, 11.7
 * 
 * @component
 */
export function CardComparisonChart({
  results,
  selectedMilesCurrency,
  onMilesCurrencyChange,
  isLoading = false,
}: CardComparisonChartProps) {
  const { theme: themeMode } = useTheme();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Determine if dark mode is active
  useEffect(() => {
    if (themeMode === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(systemTheme);
    } else {
      setIsDarkMode(themeMode === 'dark');
    }
  }, [themeMode]);
  
  // Track initial load for animation (Requirement 11.6)
  useEffect(() => {
    if (results.length > 0 && isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [results, isInitialLoad]);
  
  const theme = getSimulatorTheme(isDarkMode);
  
  // Sort results by reward value in descending order (Requirement 9.6)
  const sortedResults = [...results].sort((a, b) => {
    // Handle null values - put them at the end
    if (a.convertedMiles === null && b.convertedMiles === null) return 0;
    if (a.convertedMiles === null) return 1;
    if (b.convertedMiles === null) return -1;
    // Sort by converted miles in descending order
    return b.convertedMiles - a.convertedMiles;
  });
  
  // Calculate max miles for bar width scaling (Requirement 4.1)
  const maxMiles = Math.max(
    ...sortedResults
      .filter(r => r.convertedMiles !== null)
      .map(r => r.convertedMiles || 0),
    1 // Minimum of 1 to avoid division by zero
  );
  
  // Check if we have any results
  const hasResults = sortedResults.length > 0;
  
  return (
    <>
      {/* CSS Animations (Requirement 11.6) */}
      <style>
        {`
          @keyframes barFillIn {
            from {
              width: 0;
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          
          @keyframes glowPulse {
            0%, 100% {
              box-shadow: ${theme.glowColor}, 0 0 0 2px ${theme.accent};
            }
            50% {
              box-shadow: 0 0 30px rgba(163, 177, 138, 0.7), 0 0 0 2px ${theme.accent};
            }
          }
        `}
      </style>
      
      <div
        className="w-full"
        style={{
          backgroundColor: 'var(--color-card-bg)',
          borderRadius: 'var(--radius-card)',
          padding: 'var(--space-xl)',
          boxShadow: 'var(--shadow-card-mobile)',
        }}
      >
      {/* Chart Header with olive icon cluster and miles currency selector (Requirement 11.2) */}
      <div 
        className="flex items-center justify-between"
        style={{ marginBottom: 'var(--space-xl)' }}
      >
        <div className="flex items-center" style={{ gap: 'var(--space-md)' }}>
          {/* Olive icon cluster */}
          <div 
            className="flex items-center" 
            style={{ 
              gap: 'var(--space-xs)',
              color: 'var(--color-accent)',
            }}
          >
            <Leaf className="w-5 h-5" style={{ strokeWidth: 2.5 }} />
            <Sparkles className="w-4 h-4" style={{ strokeWidth: 2.5 }} />
            <Zap className="w-4 h-4" style={{ strokeWidth: 2.5 }} />
          </div>
          
          <h2
            className="font-semibold"
            style={{
              fontSize: 'var(--font-size-section-header)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-text)',
            }}
          >
            Card Comparison
          </h2>
        </div>
        
        {/* Miles Currency Selector (Requirement 3.1) */}
        <div style={{ color: 'var(--color-text)' }}>
          <MilesCurrencySelector
            value={selectedMilesCurrency}
            onChange={onMilesCurrencyChange}
          />
        </div>
      </div>
      
      {/* Horizontal Bar Chart */}
      <div className="min-h-[200px]">
        {/* Loading State (Requirement 10.5) */}
        {isLoading && (
          <div 
            className="flex flex-col items-center justify-center"
            style={{ padding: 'var(--space-2xl) 0' }}
          >
            <Loader2 
              className="w-8 h-8 animate-spin" 
              style={{ 
                color: 'var(--color-accent)',
                marginBottom: 'var(--space-md)',
                strokeWidth: 2.5,
              }}
            />
            <p style={{ 
              color: 'var(--color-text-muted)', 
              fontSize: 'var(--font-size-label)',
            }}>
              Calculating rewards for all cards...
            </p>
          </div>
        )}
        
        {/* Empty State - No results yet (Requirement 10.5) */}
        {!isLoading && !hasResults && (
          <div 
            className="flex flex-col items-center justify-center"
            style={{ padding: 'var(--space-2xl) 0' }}
          >
            <div 
              className="text-center max-w-md"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <p 
                style={{ 
                  fontSize: 'var(--font-size-body)',
                  marginBottom: 'var(--space-sm)',
                }}
              >
                Ready to compare cards
              </p>
              <p style={{ fontSize: 'var(--font-size-label)' }}>
                Enter transaction details above to see which card earns the most rewards
              </p>
            </div>
          </div>
        )}
        
        {/* Bar Chart with sorted CardBarRow components (Requirement 4.1, 4.2, 9.6) */}
        {!isLoading && hasResults && (
          <div className="space-y-0">
            {sortedResults.map((result, index) => (
              <CardBarRow
                key={result.paymentMethod.id}
                card={result.paymentMethod}
                calculation={result.calculation}
                convertedMiles={result.convertedMiles}
                conversionRate={result.conversionRate}
                rank={result.rank}
                isBest={index === 0 && result.convertedMiles !== null}
                maxMiles={maxMiles}
                isDarkMode={isDarkMode}
                isInitialLoad={isInitialLoad}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Footer with disclaimer text (Requirement 11.7) */}
      {!isLoading && hasResults && (
        <div 
          className="text-center"
          style={{
            marginTop: 'var(--space-xl)',
            paddingTop: 'var(--space-lg)',
            borderTop: '1px solid var(--color-border)',
            fontSize: 'var(--font-size-helper)',
            fontWeight: 'var(--font-weight-regular)',
            color: 'var(--color-text-muted)',
          }}
        >
          This tool simulates rewards only — no transaction will be saved
        </div>
      )}
      </div>
    </>
  );
}

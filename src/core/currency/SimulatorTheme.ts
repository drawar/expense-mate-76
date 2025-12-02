/**
 * Visual theme configuration for the Card Optimizer Simulator
 * Provides color palettes and styling utilities for dark and light modes
 */

/**
 * Chart theme interface defining all visual styling properties
 */
export interface ChartTheme {
  background: string;        // Dark slate (#121417) or light equivalent
  panel: string;             // Slightly lighter (#1a1e23)
  text: string;              // Pure white (#f1f3f5) or dark equivalent
  accent: string;            // Moss-green (#a3b18a)
  accentGradient: string;    // Moss-green gradient for bars
  fadedText: string;         // For "no conversion" rows
  glowColor: string;         // Moss-green glow for top card
}

/**
 * Dark mode color palette
 */
export const DARK_MODE_THEME: ChartTheme = {
  background: '#121417',
  panel: '#1a1e23',
  text: '#f1f3f5',
  accent: '#a3b18a',
  accentGradient: 'linear-gradient(90deg, #a3b18a 0%, #b8c5a0 100%)',
  fadedText: '#6b7280',
  glowColor: '0 0 20px rgba(163, 177, 138, 0.5)',
};

/**
 * Light mode color palette
 */
export const LIGHT_MODE_THEME: ChartTheme = {
  background: '#ffffff',
  panel: '#f9fafb',
  text: '#111827',
  accent: '#6b8e23',
  accentGradient: 'linear-gradient(90deg, #6b8e23 0%, #7fa32e 100%)',
  fadedText: '#9ca3af',
  glowColor: '0 0 20px rgba(107, 142, 35, 0.3)',
};

/**
 * Get theme based on current mode
 * 
 * @param isDarkMode - Whether dark mode is active
 * @returns ChartTheme object with appropriate colors
 */
export function getSimulatorTheme(isDarkMode: boolean): ChartTheme {
  return isDarkMode ? DARK_MODE_THEME : LIGHT_MODE_THEME;
}

/**
 * Bar styling configuration
 */
export const BAR_STYLES = {
  standard: {
    height: 24,
    borderRadius: 4,
  },
  topRanked: {
    height: 28,
    borderRadius: 4,
    glowOffset: 4,
  },
} as const;

/**
 * Animation configuration
 */
export const ANIMATION_CONFIG = {
  barFill: {
    duration: 500,
    easing: 'ease-out',
  },
  hoverTooltip: {
    duration: 200,
    easing: 'ease-in',
  },
  currencyChange: {
    duration: 300,
    easing: 'ease-in-out',
  },
  glowPulse: {
    duration: 2000,
    easing: 'ease-in-out',
    iterations: 'infinite',
  },
} as const;

/**
 * Spacing configuration
 */
export const SPACING_CONFIG = {
  chartPadding: 24,
  rowHeight: 48,
  rowGap: 12,
  glowRingOffset: 4,
} as const;

/**
 * Typography configuration
 */
export const TYPOGRAPHY_CONFIG = {
  cardName: {
    fontSize: 14,
    fontWeight: 500,
  },
  milesValue: {
    fontSize: 16,
    fontWeight: 700,
  },
  tooltipText: {
    fontSize: 12,
    fontWeight: 400,
  },
  header: {
    fontSize: 18,
    fontWeight: 600,
  },
  footer: {
    fontSize: 11,
    fontWeight: 400,
  },
} as const;

/**
 * Generate CSS for top-ranked card glow effect
 * 
 * @param theme - Chart theme
 * @returns CSS box-shadow string
 */
export function getTopRankedGlowStyle(theme: ChartTheme): string {
  return `${theme.glowColor}, 0 0 0 2px ${theme.accent}`;
}

/**
 * Generate CSS for bar gradient background
 * 
 * @param theme - Chart theme
 * @returns CSS background string
 */
export function getBarGradientStyle(theme: ChartTheme): string {
  return theme.accentGradient;
}

/**
 * Calculate bar width percentage based on miles value
 * 
 * @param convertedMiles - Miles value for this card
 * @param maxMiles - Maximum miles value across all cards
 * @returns Width percentage (0-100)
 */
export function calculateBarWidth(convertedMiles: number | null, maxMiles: number): number {
  if (convertedMiles === null || maxMiles === 0) {
    return 0;
  }
  return (convertedMiles / maxMiles) * 100;
}

/**
 * Get CSS animation string for bar fill
 * 
 * @returns CSS animation string
 */
export function getBarFillAnimation(): string {
  const { duration, easing } = ANIMATION_CONFIG.barFill;
  return `barFill ${duration}ms ${easing}`;
}

/**
 * Get CSS animation string for currency change transition
 * 
 * @returns CSS transition string
 */
export function getCurrencyChangeTransition(): string {
  const { duration, easing } = ANIMATION_CONFIG.currencyChange;
  return `width ${duration}ms ${easing}`;
}

/**
 * Get CSS animation string for glow pulse
 * 
 * @returns CSS animation string
 */
export function getGlowPulseAnimation(): string {
  const { duration, easing, iterations } = ANIMATION_CONFIG.glowPulse;
  return `glowPulse ${duration}ms ${easing} ${iterations}`;
}

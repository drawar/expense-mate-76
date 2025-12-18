/**
 * Unit tests for Simulator type definitions and theme configuration
 * Validates that all required types are properly defined and theme utilities work correctly
 */

import { describe, it, expect } from '@jest/globals';
import {
  type MilesCurrency,
  type ConversionRateMatrix,
  type DbConversionRate,
  type SimulationInput,
  type CardCalculationResult,
  type ChartTheme,
  DARK_MODE_THEME,
  LIGHT_MODE_THEME,
  getSimulatorTheme,
  BAR_STYLES,
  ANIMATION_CONFIG,
  SPACING_CONFIG,
  TYPOGRAPHY_CONFIG,
  getTopRankedGlowStyle,
  getBarGradientStyle,
  calculateBarWidth,
  getBarFillAnimation,
  getCurrencyChangeTransition,
  getGlowPulseAnimation,
} from '@/core/currency';

describe('Simulator Type Definitions', () => {
  it('should have all required MilesCurrency options', () => {
    const currencies: MilesCurrency[] = [
      'KrisFlyer',
      'AsiaMiles',
      'Avios',
      'FlyingBlue',
      'Aeroplan',
      'Velocity',
    ];
    
    // Type check - this will fail at compile time if types are wrong
    expect(currencies).toHaveLength(6);
  });

  it('should define ConversionRateMatrix structure', () => {
    const matrix: ConversionRateMatrix = {
      'Citi ThankYou Points': {
        KrisFlyer: 1.0,
        AsiaMiles: 0.8,
      },
      'Amex Membership Rewards': {
        Avios: 1.0,
      },
    };
    
    expect(matrix['Citi ThankYou Points']?.KrisFlyer).toBe(1.0);
    expect(matrix['Amex Membership Rewards']?.Avios).toBe(1.0);
  });

  it('should define DbConversionRate structure', () => {
    const dbRate: DbConversionRate = {
      id: 'test-id',
      reward_currency: 'Citi ThankYou Points',
      miles_currency: 'KrisFlyer',
      conversion_rate: 1.0,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };
    
    expect(dbRate.reward_currency).toBe('Citi ThankYou Points');
    expect(dbRate.conversion_rate).toBe(1.0);
  });

  it('should define SimulationInput structure', () => {
    const input: SimulationInput = {
      merchantName: 'Test Merchant',
      merchantAddress: '123 Test St',
      mcc: '5411',
      isOnline: false,
      amount: 100,
      currency: 'USD',
      convertedAmount: 100,
      convertedCurrency: 'CAD',
      isContactless: true,
      date: new Date(),
    };
    
    expect(input.merchantName).toBe('Test Merchant');
    expect(input.amount).toBe(100);
  });

  it('should define ChartTheme structure', () => {
    const theme: ChartTheme = {
      background: '#121417',
      panel: '#1a1e23',
      text: '#f1f3f5',
      accent: '#a3b18a',
      accentGradient: 'linear-gradient(90deg, #a3b18a 0%, #b8c5a0 100%)',
      fadedText: '#6b7280',
      glowColor: '0 0 20px rgba(163, 177, 138, 0.5)',
    };
    
    expect(theme.background).toBe('#121417');
    expect(theme.accent).toBe('#a3b18a');
  });
});

describe('Theme Configuration', () => {
  it('should provide dark mode theme with correct colors', () => {
    expect(DARK_MODE_THEME.background).toBe('#121417');
    expect(DARK_MODE_THEME.panel).toBe('#1a1e23');
    expect(DARK_MODE_THEME.text).toBe('#f1f3f5');
    expect(DARK_MODE_THEME.accent).toBe('#a3b18a');
    expect(DARK_MODE_THEME.accentGradient).toBe('linear-gradient(90deg, #a3b18a 0%, #b8c5a0 100%)');
    expect(DARK_MODE_THEME.fadedText).toBe('#6b7280');
    expect(DARK_MODE_THEME.glowColor).toBe('0 0 20px rgba(163, 177, 138, 0.5)');
  });

  it('should provide light mode theme with correct colors', () => {
    expect(LIGHT_MODE_THEME.background).toBe('#ffffff');
    expect(LIGHT_MODE_THEME.panel).toBe('#f9fafb');
    expect(LIGHT_MODE_THEME.text).toBe('#111827');
    expect(LIGHT_MODE_THEME.accent).toBe('#6b8e23');
    expect(LIGHT_MODE_THEME.accentGradient).toBe('linear-gradient(90deg, #6b8e23 0%, #7fa32e 100%)');
    expect(LIGHT_MODE_THEME.fadedText).toBe('#9ca3af');
    expect(LIGHT_MODE_THEME.glowColor).toBe('0 0 20px rgba(107, 142, 35, 0.3)');
  });

  it('should return dark theme when isDarkMode is true', () => {
    const theme = getSimulatorTheme(true);
    expect(theme).toEqual(DARK_MODE_THEME);
  });

  it('should return light theme when isDarkMode is false', () => {
    const theme = getSimulatorTheme(false);
    expect(theme).toEqual(LIGHT_MODE_THEME);
  });
});

describe('Bar Styles Configuration', () => {
  it('should define standard bar styles', () => {
    expect(BAR_STYLES.standard.height).toBe(24);
    expect(BAR_STYLES.standard.borderRadius).toBe(4);
  });

  it('should define top-ranked bar styles with increased height', () => {
    expect(BAR_STYLES.topRanked.height).toBe(28);
    expect(BAR_STYLES.topRanked.borderRadius).toBe(4);
    expect(BAR_STYLES.topRanked.glowOffset).toBe(4);
  });
});

describe('Animation Configuration', () => {
  it('should define bar fill animation config', () => {
    expect(ANIMATION_CONFIG.barFill.duration).toBe(500);
    expect(ANIMATION_CONFIG.barFill.easing).toBe('ease-out');
  });

  it('should define hover tooltip animation config', () => {
    expect(ANIMATION_CONFIG.hoverTooltip.duration).toBe(200);
    expect(ANIMATION_CONFIG.hoverTooltip.easing).toBe('ease-in');
  });

  it('should define currency change animation config', () => {
    expect(ANIMATION_CONFIG.currencyChange.duration).toBe(300);
    expect(ANIMATION_CONFIG.currencyChange.easing).toBe('ease-in-out');
  });

  it('should define glow pulse animation config', () => {
    expect(ANIMATION_CONFIG.glowPulse.duration).toBe(2000);
    expect(ANIMATION_CONFIG.glowPulse.easing).toBe('ease-in-out');
    expect(ANIMATION_CONFIG.glowPulse.iterations).toBe('infinite');
  });
});

describe('Spacing Configuration', () => {
  it('should define spacing values', () => {
    expect(SPACING_CONFIG.chartPadding).toBe(24);
    expect(SPACING_CONFIG.rowHeight).toBe(48);
    expect(SPACING_CONFIG.rowGap).toBe(12);
    expect(SPACING_CONFIG.glowRingOffset).toBe(4);
  });
});

describe('Typography Configuration', () => {
  it('should define card name typography', () => {
    expect(TYPOGRAPHY_CONFIG.cardName.fontSize).toBe(14);
    expect(TYPOGRAPHY_CONFIG.cardName.fontWeight).toBe(500);
  });

  it('should define miles value typography', () => {
    expect(TYPOGRAPHY_CONFIG.milesValue.fontSize).toBe(16);
    expect(TYPOGRAPHY_CONFIG.milesValue.fontWeight).toBe(700);
  });

  it('should define tooltip text typography', () => {
    expect(TYPOGRAPHY_CONFIG.tooltipText.fontSize).toBe(12);
    expect(TYPOGRAPHY_CONFIG.tooltipText.fontWeight).toBe(400);
  });

  it('should define header typography', () => {
    expect(TYPOGRAPHY_CONFIG.header.fontSize).toBe(18);
    expect(TYPOGRAPHY_CONFIG.header.fontWeight).toBe(600);
  });

  it('should define footer typography', () => {
    expect(TYPOGRAPHY_CONFIG.footer.fontSize).toBe(11);
    expect(TYPOGRAPHY_CONFIG.footer.fontWeight).toBe(400);
  });
});

describe('Theme Utility Functions', () => {
  it('should generate top-ranked glow style', () => {
    const glowStyle = getTopRankedGlowStyle(DARK_MODE_THEME);
    expect(glowStyle).toContain('0 0 20px rgba(163, 177, 138, 0.5)');
    expect(glowStyle).toContain('0 0 0 2px #a3b18a');
  });

  it('should generate bar gradient style', () => {
    const gradientStyle = getBarGradientStyle(DARK_MODE_THEME);
    expect(gradientStyle).toBe('linear-gradient(90deg, #a3b18a 0%, #b8c5a0 100%)');
  });

  it('should calculate bar width correctly', () => {
    expect(calculateBarWidth(100, 200)).toBe(50);
    expect(calculateBarWidth(200, 200)).toBe(100);
    expect(calculateBarWidth(50, 200)).toBe(25);
  });

  it('should return 0 width for null miles', () => {
    expect(calculateBarWidth(null, 200)).toBe(0);
  });

  it('should return 0 width when maxMiles is 0', () => {
    expect(calculateBarWidth(100, 0)).toBe(0);
  });

  it('should generate bar fill animation string', () => {
    const animation = getBarFillAnimation();
    expect(animation).toBe('barFill 500ms ease-out');
  });

  it('should generate currency change transition string', () => {
    const transition = getCurrencyChangeTransition();
    expect(transition).toBe('width 300ms ease-in-out');
  });

  it('should generate glow pulse animation string', () => {
    const animation = getGlowPulseAnimation();
    expect(animation).toBe('glowPulse 2000ms ease-in-out infinite');
  });
});

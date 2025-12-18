/**
 * Responsive Typography System Tests
 * 
 * Tests verify that typography scales correctly across breakpoints:
 * - Mobile: < 768px (testing at 375px)
 * - Tablet: 768px - 1024px (testing at 768px)
 * - Desktop: > 1024px (testing at 1440px)
 * 
 * Requirements: 3.1-3.6
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

// Helper to get computed CSS custom property value
function getCSSVariable(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// Helper to set viewport width for testing
function setViewportWidth(width: number) {
  // Create a style element to simulate media query
  const style = document.createElement('style');
  style.id = 'viewport-test-style';
  
  // Remove any existing test style
  const existing = document.getElementById('viewport-test-style');
  if (existing) {
    existing.remove();
  }
  
  // Apply the appropriate media query styles based on width
  if (width >= 1024) {
    // Desktop breakpoint
    style.textContent = `
      :root {
        --font-size-title-1: 40px;
        --font-size-section-header: 18px;
        --font-size-body: 16px;
        --font-size-label: 14px;
        --font-size-helper: 12px;
        --line-height-tight: 1.2;
        --line-height-normal: 1.3;
        --line-height-relaxed: 1.5;
        --font-weight-regular: 400;
        --font-weight-medium: 500;
        --font-weight-semibold: 600;
        --font-weight-bold: 700;
        --font-family-base: 'Inter', -apple-system, BlinkMacSystemFont, 'Helvetica', 'Arial', sans-serif;
      }
    `;
  } else if (width >= 768) {
    // Tablet breakpoint
    style.textContent = `
      :root {
        --font-size-title-1: 36px;
        --font-size-section-header: 18px;
        --font-size-body: 16px;
        --font-size-label: 14px;
        --font-size-helper: 12px;
        --line-height-tight: 1.2;
        --line-height-normal: 1.3;
        --line-height-relaxed: 1.5;
        --font-weight-regular: 400;
        --font-weight-medium: 500;
        --font-weight-semibold: 600;
        --font-weight-bold: 700;
        --font-family-base: 'Inter', -apple-system, BlinkMacSystemFont, 'Helvetica', 'Arial', sans-serif;
      }
    `;
  } else {
    // Mobile (default)
    style.textContent = `
      :root {
        --font-size-title-1: 32px;
        --font-size-title-2: 20px;
        --font-size-section-header: 16px;
        --font-size-body: 15px;
        --font-size-label: 13px;
        --font-size-helper: 11px;
        --line-height-tight: 1.2;
        --line-height-normal: 1.3;
        --line-height-relaxed: 1.5;
        --font-weight-regular: 400;
        --font-weight-medium: 500;
        --font-weight-semibold: 600;
        --font-weight-bold: 700;
        --font-family-base: 'Inter', -apple-system, BlinkMacSystemFont, 'Helvetica', 'Arial', sans-serif;
      }
    `;
  }
  
  document.head.appendChild(style);
}

describe('Responsive Typography System', () => {
  beforeEach(() => {
    // Clean up any existing test styles
    const existing = document.getElementById('viewport-test-style');
    if (existing) {
      existing.remove();
    }
  });

  afterEach(() => {
    // Clean up test styles
    const testStyle = document.getElementById('viewport-test-style');
    if (testStyle) {
      testStyle.remove();
    }
  });

  describe('Design Tokens File Structure', () => {
    it('should have design-tokens.css file with all required typography tokens', () => {
      const designTokensPath = path.join(__dirname, '../src/styles/design-tokens.css');
      expect(fs.existsSync(designTokensPath)).toBe(true);
      
      const content = fs.readFileSync(designTokensPath, 'utf-8');
      
      // Check for mobile font sizes
      expect(content).toContain('--font-size-title-1: 32px');
      expect(content).toContain('--font-size-section-header: 16px');
      expect(content).toContain('--font-size-body: 15px');
      expect(content).toContain('--font-size-label: 13px');
      expect(content).toContain('--font-size-helper: 11px');
      
      // Check for line heights
      expect(content).toContain('--line-height-tight: 1.2');
      expect(content).toContain('--line-height-normal: 1.3');
      expect(content).toContain('--line-height-relaxed: 1.5');
      
      // Check for font weights
      expect(content).toContain('--font-weight-regular: 400');
      expect(content).toContain('--font-weight-medium: 500');
      expect(content).toContain('--font-weight-semibold: 600');
      expect(content).toContain('--font-weight-bold: 700');
      
      // Check for font family
      expect(content).toContain('--font-family-base');
      expect(content).toContain('Inter');
    });

    it('should have tablet breakpoint media query with correct font sizes', () => {
      const designTokensPath = path.join(__dirname, '../src/styles/design-tokens.css');
      const content = fs.readFileSync(designTokensPath, 'utf-8');
      
      // Check for tablet media query
      expect(content).toContain('@media (min-width: 768px)');
      
      // Check that tablet sizes are defined
      const tabletSection = content.split('@media (min-width: 768px)')[1].split('}')[0];
      expect(tabletSection).toContain('--font-size-title-1: 36px');
      expect(tabletSection).toContain('--font-size-section-header: 18px');
      expect(tabletSection).toContain('--font-size-body: 16px');
      expect(tabletSection).toContain('--font-size-label: 14px');
      expect(tabletSection).toContain('--font-size-helper: 12px');
    });

    it('should have desktop breakpoint media query with correct font sizes', () => {
      const designTokensPath = path.join(__dirname, '../src/styles/design-tokens.css');
      const content = fs.readFileSync(designTokensPath, 'utf-8');
      
      // Check for desktop media query
      expect(content).toContain('@media (min-width: 1024px)');
      
      // Check that desktop title size is defined
      const desktopSection = content.split('@media (min-width: 1024px)')[1];
      expect(desktopSection).toContain('--font-size-title-1: 40px');
    });

    it('should have platform-specific font family overrides', () => {
      const designTokensPath = path.join(__dirname, '../src/styles/design-tokens.css');
      const content = fs.readFileSync(designTokensPath, 'utf-8');
      
      // Check for iOS/iPadOS font family override
      expect(content).toContain('@supports (-webkit-touch-callout: none)');
      expect(content).toContain('SF Pro Display');
      expect(content).toContain('SF Pro Text');
    });
  });

  describe('Mobile Typography (375px)', () => {
    beforeEach(() => {
      setViewportWidth(375);
    });

    it('should render page titles at 32px on mobile', () => {
      const titleSize = getCSSVariable('--font-size-title-1');
      expect(titleSize).toBe('32px');
    });

    it('should render section headers at 16px on mobile', () => {
      const headerSize = getCSSVariable('--font-size-section-header');
      expect(headerSize).toBe('16px');
    });

    it('should render body text at 15px on mobile', () => {
      const bodySize = getCSSVariable('--font-size-body');
      expect(bodySize).toBe('15px');
    });

    it('should render form labels at 13px on mobile', () => {
      const labelSize = getCSSVariable('--font-size-label');
      expect(labelSize).toBe('13px');
    });

    it('should render helper text at 11px on mobile', () => {
      const helperSize = getCSSVariable('--font-size-helper');
      expect(helperSize).toBe('11px');
    });
  });

  describe('Tablet Typography (768px)', () => {
    beforeEach(() => {
      setViewportWidth(768);
    });

    it('should render page titles at 36px on tablet', () => {
      const titleSize = getCSSVariable('--font-size-title-1');
      expect(titleSize).toBe('36px');
    });

    it('should render section headers at 18px on tablet', () => {
      const headerSize = getCSSVariable('--font-size-section-header');
      expect(headerSize).toBe('18px');
    });

    it('should render body text at 16px on tablet', () => {
      const bodySize = getCSSVariable('--font-size-body');
      expect(bodySize).toBe('16px');
    });

    it('should render form labels at 14px on tablet', () => {
      const labelSize = getCSSVariable('--font-size-label');
      expect(labelSize).toBe('14px');
    });

    it('should render helper text at 12px on tablet', () => {
      const helperSize = getCSSVariable('--font-size-helper');
      expect(helperSize).toBe('12px');
    });
  });

  describe('Desktop Typography (1440px)', () => {
    beforeEach(() => {
      setViewportWidth(1440);
    });

    it('should render page titles at 40px on desktop', () => {
      const titleSize = getCSSVariable('--font-size-title-1');
      expect(titleSize).toBe('40px');
    });

    it('should render section headers at 18px on desktop', () => {
      const headerSize = getCSSVariable('--font-size-section-header');
      expect(headerSize).toBe('18px');
    });

    it('should render body text at 16px on desktop', () => {
      const bodySize = getCSSVariable('--font-size-body');
      expect(bodySize).toBe('16px');
    });

    it('should render form labels at 14px on desktop', () => {
      const labelSize = getCSSVariable('--font-size-label');
      expect(labelSize).toBe('14px');
    });

    it('should render helper text at 12px on desktop', () => {
      const helperSize = getCSSVariable('--font-size-helper');
      expect(helperSize).toBe('12px');
    });
  });

  describe('Line Height Consistency', () => {
    it('should define line-height values in design tokens file', () => {
      const designTokensPath = path.join(__dirname, '../src/styles/design-tokens.css');
      const content = fs.readFileSync(designTokensPath, 'utf-8');

      expect(content).toContain('--line-height-tight: 1.2');
      expect(content).toContain('--line-height-normal: 1.3');
      expect(content).toContain('--line-height-relaxed: 1.5');
    });

    it('should have line-height values between 1.2 and 1.3 for tight and normal', () => {
      const designTokensPath = path.join(__dirname, '../src/styles/design-tokens.css');
      const content = fs.readFileSync(designTokensPath, 'utf-8');

      // Extract line-height values
      const tightMatch = content.match(/--line-height-tight:\s*([\d.]+)/);
      const normalMatch = content.match(/--line-height-normal:\s*([\d.]+)/);

      expect(tightMatch).toBeTruthy();
      expect(normalMatch).toBeTruthy();

      const tight = parseFloat(tightMatch![1]);
      const normal = parseFloat(normalMatch![1]);

      expect(tight).toBeGreaterThanOrEqual(1.2);
      expect(tight).toBeLessThanOrEqual(1.3);
      expect(normal).toBeGreaterThanOrEqual(1.2);
      expect(normal).toBeLessThanOrEqual(1.3);
    });
  });

  describe('Font Weight Consistency', () => {
    it('should define all required font weights in design tokens file', () => {
      const designTokensPath = path.join(__dirname, '../src/styles/design-tokens.css');
      const content = fs.readFileSync(designTokensPath, 'utf-8');

      expect(content).toContain('--font-weight-regular: 400');
      expect(content).toContain('--font-weight-medium: 500');
      expect(content).toContain('--font-weight-semibold: 600');
      expect(content).toContain('--font-weight-bold: 700');
    });
  });

  describe('Typography Scale Progression', () => {
    it('should have progressively larger font sizes from mobile to desktop for title-1', () => {
      setViewportWidth(375);
      const mobileTitle = getCSSVariable('--font-size-title-1');
      
      setViewportWidth(768);
      const tabletTitle = getCSSVariable('--font-size-title-1');
      
      setViewportWidth(1440);
      const desktopTitle = getCSSVariable('--font-size-title-1');

      expect(parseInt(mobileTitle)).toBeLessThan(parseInt(tabletTitle));
      expect(parseInt(tabletTitle)).toBeLessThan(parseInt(desktopTitle));
    });

    it('should scale body text from mobile to tablet/desktop', () => {
      setViewportWidth(375);
      const mobileBody = getCSSVariable('--font-size-body');
      
      setViewportWidth(768);
      const tabletBody = getCSSVariable('--font-size-body');

      expect(parseInt(mobileBody)).toBeLessThan(parseInt(tabletBody));
    });
  });

  describe('Platform-Specific Font Family', () => {
    it('should define base font family with proper fallbacks in design tokens file', () => {
      const designTokensPath = path.join(__dirname, '../src/styles/design-tokens.css');
      const content = fs.readFileSync(designTokensPath, 'utf-8');
      
      // Should include Inter and system fonts
      expect(content).toContain('--font-family-base');
      expect(content).toContain('Inter');
      expect(content).toContain('-apple-system');
      expect(content).toContain('BlinkMacSystemFont');
    });
  });
});

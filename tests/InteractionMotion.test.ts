/**
 * Interaction and Motion Enhancement Tests
 * 
 * Validates Requirements 10.1-10.5:
 * - Button press scale effect (98%)
 * - Card hover lift effect for desktop
 * - All animations use smooth cubic-bezier timing
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Interaction and Motion Enhancements', () => {
  describe('Design Token Verification', () => {
    it('should define button press scale token', () => {
      const designTokensPath = path.join(process.cwd(), 'src/styles/design-tokens.css');
      const content = fs.readFileSync(designTokensPath, 'utf-8');
      
      expect(content).toContain('--button-press-scale: 0.98');
    });

    it('should define card hover lift token', () => {
      const designTokensPath = path.join(process.cwd(), 'src/styles/design-tokens.css');
      const content = fs.readFileSync(designTokensPath, 'utf-8');
      
      expect(content).toContain('--card-hover-lift: -2px');
    });

    it('should define smooth cubic-bezier timing function', () => {
      const designTokensPath = path.join(process.cwd(), 'src/styles/design-tokens.css');
      const content = fs.readFileSync(designTokensPath, 'utf-8');
      
      expect(content).toContain('--transition-smooth: cubic-bezier(0.35, 0, 0.15, 1)');
    });

    it('should define duration tokens', () => {
      const designTokensPath = path.join(process.cwd(), 'src/styles/design-tokens.css');
      const content = fs.readFileSync(designTokensPath, 'utf-8');
      
      expect(content).toContain('--duration-fast: 150ms');
      expect(content).toContain('--duration-normal: 300ms');
    });
  });

  describe('Button Press Scale Effect', () => {
    it('should apply press scale effect to button component', () => {
      const buttonPath = path.join(process.cwd(), 'src/components/ui/button.tsx');
      const content = fs.readFileSync(buttonPath, 'utf-8');
      
      // Check for active:scale-[0.98] in button variants
      expect(content).toContain('active:scale-[0.98]');
    });

    it('should apply press scale effect to moss-button class', () => {
      const themePath = path.join(process.cwd(), 'src/styles/moss-dark-theme.css');
      const content = fs.readFileSync(themePath, 'utf-8');
      
      expect(content).toContain('.moss-button:active:not(:disabled)');
      expect(content).toContain('transform: scale(var(--button-press-scale))');
    });

    it('should have button-press utility class', () => {
      const themePath = path.join(process.cwd(), 'src/styles/moss-dark-theme.css');
      const content = fs.readFileSync(themePath, 'utf-8');
      
      expect(content).toContain('.button-press');
      expect(content).toContain('.button-press:active:not(:disabled)');
    });
  });

  describe('Card Hover Lift Effect', () => {
    it('should apply hover lift effect to moss-card', () => {
      const themePath = path.join(process.cwd(), 'src/styles/moss-dark-theme.css');
      const content = fs.readFileSync(themePath, 'utf-8');
      
      expect(content).toContain('.moss-card-hover:hover');
      expect(content).toContain('transform: translateY(var(--card-hover-lift))');
    });

    it('should only apply hover lift on desktop (min-width: 1024px)', () => {
      const themePath = path.join(process.cwd(), 'src/styles/moss-dark-theme.css');
      const content = fs.readFileSync(themePath, 'utf-8');
      
      // Check that hover effect is wrapped in desktop media query
      const desktopMediaQuery = /@media \(min-width: 1024px\)[\s\S]*\.moss-card-hover:hover/;
      expect(content).toMatch(desktopMediaQuery);
    });

    it('should have hover-lift utility class', () => {
      const themePath = path.join(process.cwd(), 'src/styles/moss-dark-theme.css');
      const content = fs.readFileSync(themePath, 'utf-8');
      
      expect(content).toContain('.hover-lift');
      expect(content).toContain('.hover-lift:hover');
    });
  });

  describe('Animation Timing Functions', () => {
    it('should use smooth cubic-bezier for moss-card transitions', () => {
      const themePath = path.join(process.cwd(), 'src/styles/moss-dark-theme.css');
      const content = fs.readFileSync(themePath, 'utf-8');
      
      // Check moss-card uses transition-smooth
      const mossCardSection = content.match(/\.moss-card\s*\{[\s\S]+?\}/)?.[0] || '';
      expect(mossCardSection).toContain('var(--transition-smooth)');
    });

    it('should use smooth cubic-bezier for moss-button transitions', () => {
      const themePath = path.join(process.cwd(), 'src/styles/moss-dark-theme.css');
      const content = fs.readFileSync(themePath, 'utf-8');
      
      // Check moss-button uses transition-smooth
      const mossButtonSection = content.match(/\.moss-button\s*\{[\s\S]+?\}/)?.[0] || '';
      expect(mossButtonSection).toContain('var(--transition-smooth)');
    });

    it('should use smooth cubic-bezier for collapsible sections', () => {
      const themePath = path.join(process.cwd(), 'src/styles/moss-dark-theme.css');
      const content = fs.readFileSync(themePath, 'utf-8');
      
      // Check collapsible-content uses transition-smooth
      const collapsibleSection = content.match(/\.collapsible-content\s*\{[\s\S]+?\}/)?.[0] || '';
      expect(collapsibleSection).toContain('var(--transition-smooth)');
    });

    it('should use smooth cubic-bezier for bar chart animations', () => {
      const themePath = path.join(process.cwd(), 'src/styles/moss-dark-theme.css');
      const content = fs.readFileSync(themePath, 'utf-8');
      
      // Check bar-fill uses transition-smooth
      const barFillSection = content.match(/\.bar-fill\s*\{[\s\S]+?\}/)?.[0] || '';
      expect(barFillSection).toContain('var(--transition-smooth)');
    });

    it('should use smooth cubic-bezier for toggle switches', () => {
      const themePath = path.join(process.cwd(), 'src/styles/moss-dark-theme.css');
      const content = fs.readFileSync(themePath, 'utf-8');
      
      // Check moss-switch uses transition-smooth
      const switchSection = content.match(/\.moss-switch\s*\{[\s\S]+?\}/)?.[0] || '';
      expect(switchSection).toContain('var(--transition-smooth)');
    });

    it('should use smooth cubic-bezier for input fields', () => {
      const themePath = path.join(process.cwd(), 'src/styles/moss-dark-theme.css');
      const content = fs.readFileSync(themePath, 'utf-8');
      
      // Check moss-input uses transition-smooth
      const inputSection = content.match(/\.moss-input\s*\{[\s\S]+?\}/)?.[0] || '';
      expect(inputSection).toContain('var(--transition-smooth)');
    });

    it('should use smooth cubic-bezier in global-enhancements.css', () => {
      const globalPath = path.join(process.cwd(), 'src/styles/global-enhancements.css');
      const content = fs.readFileSync(globalPath, 'utf-8');
      
      // Check that transitions use var(--transition-smooth)
      expect(content).toContain('var(--transition-smooth)');
      
      // Ensure no hardcoded ease or ease-out in transitions (except for pulse animation)
      const transitionLines = content.split('\n').filter(line => 
        line.includes('transition:') && !line.includes('pulse')
      );
      
      transitionLines.forEach(line => {
        if (line.includes('transition:')) {
          expect(line).toContain('var(--transition-smooth)');
        }
      });
    });
  });

  describe('Transition Durations', () => {
    it('should use 150ms for fast interactions', () => {
      const themePath = path.join(process.cwd(), 'src/styles/moss-dark-theme.css');
      const content = fs.readFileSync(themePath, 'utf-8');
      
      // Check that fast interactions use --duration-fast
      expect(content).toContain('var(--duration-fast)');
    });

    it('should use 300ms for normal animations', () => {
      const themePath = path.join(process.cwd(), 'src/styles/moss-dark-theme.css');
      const content = fs.readFileSync(themePath, 'utf-8');
      
      // Check that normal animations use --duration-normal
      expect(content).toContain('var(--duration-normal)');
    });
  });

  describe('Button Component Integration', () => {
    it('should use transition-all for smooth multi-property transitions', () => {
      const buttonPath = path.join(process.cwd(), 'src/components/ui/button.tsx');
      const content = fs.readFileSync(buttonPath, 'utf-8');
      
      // Check that button uses transition-all instead of just transition-colors
      expect(content).toContain('transition-all');
    });
  });
});

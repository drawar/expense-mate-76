# Implementation Plan

- [x] 1. Create database schema and migration for conversion rates
  - Create migration file for conversion_rates table with proper schema
  - Add RLS policies for authenticated user access
  - Add indexes for performance optimization
  - _Requirements: 6.3_

- [x] 2. Implement ConversionService for currency conversion logic
  - [x] 2.1 Create ConversionService class with core methods
    - Implement convertToMiles method
    - Implement getConversionRate method
    - Implement getConversionRatesForRewardCurrency method
    - Implement getAllConversionRates method
    - Implement updateConversionRate method
    - Implement batchUpdateConversionRates method
    - Add in-memory caching for conversion rates
    - _Requirements: 3.2, 3.3, 6.2, 6.3, 6.4_

  - [ ]* 2.2 Write property test for conversion determinism
    - **Property 2: Conversion determinism**
    - **Validates: Requirements 3.2**

  - [ ]* 2.3 Write property test for conversion rate positivity
    - **Property 4: Conversion rate positivity**
    - **Validates: Requirements 6.2**

  - [ ]* 2.4 Write unit tests for ConversionService
    - Test conversion with valid rates
    - Test handling of missing rates
    - Test rate validation
    - Test batch updates
    - _Requirements: 3.2, 3.3, 6.2_

- [ ] 3. Implement SimulatorService for multi-card calculations
  - [x] 3.1 Create SimulatorService class with orchestration logic
    - Implement simulateAllCards method
    - Implement simulateSingleCard method
    - Implement rankResults method
    - Implement getMonthlySpending method
    - Add error handling for individual card failures
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 4.1, 4.2, 4.3, 7.1, 7.2, 7.3_

  - [ ]* 3.2 Write property test for calculation consistency
    - **Property 1: Calculation consistency**
    - **Validates: Requirements 2.2**

  - [ ]* 3.3 Write property test for ranking monotonicity
    - **Property 3: Ranking monotonicity**
    - **Validates: Requirements 4.1**

  - [ ]* 3.4 Write property test for missing conversion handling
    - **Property 5: Missing conversion handling**
    - **Validates: Requirements 3.3, 4.3**

  - [ ]* 3.5 Write property test for monthly spending consideration
    - **Property 6: Monthly spending consideration**
    - **Validates: Requirements 7.2, 7.3**

  - [ ]* 3.6 Write property test for active card filtering
    - **Property 8: Active card filtering**
    - **Validates: Requirements 2.1**

  - [ ]* 3.7 Write unit tests for SimulatorService
    - Test single card simulation
    - Test multi-card simulation with failures
    - Test ranking with various values
    - Test monthly spending retrieval
    - _Requirements: 2.1, 2.2, 4.1, 7.1_

- [x] 4. Create type definitions and theme configuration for simulator
  - [x] 4.1 Create type definitions
    - Create SimulationInput interface
    - Create MilesCurrency type (KrisFlyer, AsiaMiles, Avios, FlyingBlue, Aeroplan, Velocity)
    - Create CardCalculationResult interface
    - Create ConversionRateMatrix interface
    - Create DbConversionRate interface
    - Create ChartTheme interface
    - _Requirements: 1.3, 3.1, 3.2, 4.1_

  - [x] 4.2 Create theme configuration
    - Define dark mode color palette (dark slate #121417, moss-green #a3b18a, etc.)
    - Define light mode color palette
    - Create theme utility functions for dynamic theme switching
    - Define gradient configurations for bars
    - Define glow effect styles
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [x] 5. Implement MilesCurrencySelector component
  - [x] 5.1 Create MilesCurrencySelector component
    - Implement compact single-line dropdown with "Miles currency:" label
    - Add currency options: KrisFlyer, Asia Miles, Avios, Flying Blue, Aeroplan, Velocity
    - Set default selection to Aeroplan
    - Apply moss-green highlight to selected item
    - Handle selection change events
    - _Requirements: 3.1, 3.5_

  - [ ]* 5.2 Write unit tests for MilesCurrencySelector
    - Test rendering of currency options
    - Test default selection
    - Test selection change handling
    - _Requirements: 3.1_

- [x] 6. Implement CardBarRow component
  - [x] 6.1 Create CardBarRow component
    - Display card name and issuer on the left
    - Render horizontal progress bar in center with moss-green gradient
    - Display converted miles value on the right
    - Calculate bar width proportional to miles value
    - Apply moss-green glow ring and "#1 Best Option" badge for top-ranked card
    - Make top-ranked bar slightly thicker (28px vs 24px)
    - Handle "no conversion available" case with faded styling
    - Implement hover tooltip with detailed breakdown
    - _Requirements: 4.1, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 5.5, 11.2, 11.3_

  - [x] 6.2 Create HoverTooltip component for CardBarRow
    - Display base points, bonus points, total points
    - Show reward currency name
    - Show conversion rate used
    - Display tier or cap information
    - Show contactless/online bonuses if applicable
    - Implement smooth fade-in animation
    - _Requirements: 5.2, 5.4, 5.5, 11.5_

  - [ ]* 6.3 Write unit tests for CardBarRow
    - Test rendering with complete data
    - Test rendering with missing conversion
    - Test top-ranked visual styling
    - Test bar width calculation
    - Test tooltip content
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 7. Implement CardComparisonChart component
  - [x] 7.1 Create CardComparisonChart component
    - Create full-width panel with theme-aware background
    - Render chart header with olive icon cluster
    - Embed MilesCurrencySelector in header
    - Render HorizontalBarChart with sorted CardBarRow components
    - Handle loading state
    - Handle empty state (no active cards)
    - Render footer with disclaimer text
    - Apply dark slate background (#121417) in dark mode
    - Apply moss-green accents throughout
    - _Requirements: 4.1, 4.2, 4.3, 10.5, 11.1, 11.2, 11.4, 11.7_

  - [x] 7.2 Implement bar animation system
    - Add smooth 0.5s ease-out animation on initial load
    - Add 0.3s transition when bars re-rank
    - Implement subtle 2s infinite pulse on top card glow
    - _Requirements: 11.6_

  - [ ]* 7.3 Write uni t tests for CardComparisonChart
    - Test rendering of multiple cards
    - Test sorting by rank
    - Test loading state
    - Test empty state
    - Test theme styling
    - _Requirements: 4.1, 10.5, 11.1_

- [x] 8. Implement SimulatorForm component
  - [x] 8.1 Create SimulatorForm component
    - Integrate MerchantDetailsSection
    - Integrate TransactionDetailsSection
    - Implement form state management
    - Add form validation
    - Trigger calculation on input change with debouncing
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ]* 8.2 Write property test for form validation consistency
    - **Property 7: Form validation consistency**
    - **Validates: Requirements 9.3**

  - [ ]* 8.3 Write unit tests for SimulatorForm
    - Test form rendering
    - Test validation
    - Test input change handling
    - _Requirements: 1.1, 1.3, 9.3_

- [x] 9. Implement CardOptimizerSimulator page component
  - [x] 9.1 Create CardOptimizerSimulator page component
    - Initialize reward system on mount
    - Load active payment methods
    - Render SimulatorForm
    - Render CardComparisonChart (which includes MilesCurrencySelector)
    - Handle transaction input changes with debouncing
    - Handle miles currency changes
    - Orchestrate calculations via SimulatorService
    - Handle initialization errors
    - Handle calculation errors per card
    - _Requirements: 1.1, 2.1, 2.2, 2.4, 3.1, 3.5, 4.1, 4.5, 10.1, 10.3, 10.4, 10.5_

  - [ ]* 9.2 Write property test for re-ranking on currency change
    - **Property 10: Re-ranking on currency change**
    - **Validates: Requirements 3.5, 4.5**

  - [ ]* 9.3 Write property test for currency conversion application
    - **Property 9: Currency conversion application**
    - **Validates: Requirements 8.3**

  - [ ]* 9.4 Write property test for bar width proportionality
    - **Property 11: Bar width proportionality**
    - **Validates: Requirements 4.1**

  - [ ]* 9.5 Write property test for top-ranked visual distinction
    - **Property 12: Top-ranked visual distinction**
    - **Validates: Requirements 4.4, 11.3**

  - [ ]* 9.6 Write integration test for end-to-end simulation flow
    - Test loading page
    - Test filling form
    - Test calculations appearing
    - Test currency change and re-ranking
    - Test visual styling and animations
    - _Requirements: 1.1, 2.1, 3.5, 4.5, 11.6_

- [x] 10. Add routing and navigation for simulator page
  - Add route for /card-optimizer in routing configuration
  - Add navigation link in main navigation menu
  - Add page title and description
  - _Requirements: 10.1, 10.2_

- [-] 11. Implement ConversionRateManager component (settings)
  - [x] 11.1 Create ConversionRateManager component
    - Display conversion rate matrix table
    - Implement inline editing for rates
    - Add validation for rate values
    - Implement save functionality
    - Handle save errors with retry
    - Show loading and saving states
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ]* 11.2 Write unit tests for ConversionRateManager
    - Test table rendering
    - Test inline editing
    - Test validation
    - Test save functionality
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 12. Add conversion rate management to settings/navigation
  - Add link to ConversionRateManager in settings or admin area
  - Add route for conversion rate management page
  - _Requirements: 6.1_

- [x] 13. Seed initial conversion rates
  - Create script to populate common conversion rates
  - Add rates for major reward currencies (Citi ThankYou, Amex MR, Chase UR, etc.)
  - Add rates for major miles programs (KrisFlyer, Asia Miles, Avios, Flying Blue)
  - _Requirements: 6.5_

- [ ] 14. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Handle foreign currency transactions
  - [x] 15.1 Add converted amount field to SimulatorForm
    - Show converted amount field when foreign currency selected
    - Add validation for converted amount
    - Pass converted amount to calculation
    - Display warning when conversion not provided
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 15.2 Write unit tests for foreign currency handling
    - Test converted amount field visibility
    - Test validation
    - Test warning display
    - _Requirements: 8.1, 8.2, 8.5_

- [x] 16. Add empty state handling
  - Display message when no active payment methods exist
  - Add link to payment methods page
  - Handle initialization failures with retry button
  - _Requirements: 10.4, 10.5_

- [ ] 17. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

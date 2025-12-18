# Implementation Plan

- [x] 1. Set up design token system
  - Create CSS custom properties file with all color, spacing, typography, and motion tokens
  - Add responsive breakpoint overrides for typography scaling
  - Add iOS/iPadOS font family detection and override
  - Integrate design tokens into Tailwind config
  - _Requirements: 2.1-2.8, 3.1-3.6, 11.1-11.5, 15.1-15.2_

- [x] 2. Create core UI components
  - _Requirements: 1.3, 1.5, 1.7, 5.1-5.6, 6.1-6.7, 8.1-8.6_

- [x] 2.1 Implement CollapsibleSection component
  - Create component with expand/collapse animation
  - Add chevron icon with rotation animation
  - Implement 150ms smooth animation timing
  - Add optional sessionStorage persistence for state
  - _Requirements: 1.3, 1.5, 1.7, 8.1-8.6, 10.1_

- [ ]* 2.2 Write property test for CollapsibleSection
  - **Property 1: Progressive disclosure preserves form data**
  - **Validates: Requirements 1.3, 1.5, 1.7**

- [x] 2.3 Implement MossCard component
  - Create card with design token styling
  - Add responsive shadow (mobile vs desktop)
  - Implement optional hover effect for desktop
  - _Requirements: 5.1-5.6_

- [ ]* 2.4 Write property test for MossCard shadows
  - **Property 5: Card shadow consistency**
  - **Validates: Requirements 5.4, 5.5**

- [x] 2.5 Implement MossInput component
  - Create input with design token styling
  - Add focus state with accent color
  - Style placeholder text
  - _Requirements: 6.1-6.7_

- [ ]* 2.6 Write property test for MossInput styling
  - **Property 6: Input field styling consistency**
  - **Validates: Requirements 6.1-6.7**

- [x] 3. Update MerchantDetailsSection with progressive disclosure
  - Add minimal prop to enable progressive disclosure mode
  - Keep merchant name, online toggle, and category selector always visible
  - Wrap merchant address and notes in CollapsibleSection
  - Update styling to use MossCard and MossInput
  - _Requirements: 1.1, 1.2, 1.3, 12.3_

- [ ]* 3.1 Write property test for merchant section data preservation
  - **Property 14: Form submission preserves all data**
  - **Validates: Requirements 1.1, 1.2, 1.3**

- [x] 4. Update TransactionDetailsSection with progressive disclosure
  - Keep amount, currency, and date always visible
  - Wrap reimbursement amount and contactless toggle in CollapsibleSection
  - Move notes field to collapsible section
  - Update styling to use MossCard and MossInput
  - _Requirements: 1.4, 1.5, 12.4_

- [ ]* 4.1 Write property test for transaction section data preservation
  - **Property 14: Form submission preserves all data**
  - **Validates: Requirements 1.4, 1.5**

- [x] 5. Update PaymentDetailsSection with progressive disclosure
  - Keep payment method selector always visible
  - Wrap card metadata and issuer notes in CollapsibleSection
  - Update styling to use MossCard and MossInput
  - _Requirements: 1.6, 1.7, 12.5_

- [ ]* 5.1 Write property test for payment section data preservation
  - **Property 14: Form submission preserves all data**
  - **Validates: Requirements 1.6, 1.7**

- [x] 6. Update toggle components with Moss Dark styling
  - Apply moss-green color to active state
  - Ensure neutral gray for inactive state
  - Add platform-specific styling (iOS vs web)
  - _Requirements: 7.1-7.5_

- [ ]* 6.1 Write property test for toggle state colors
  - **Property 7: Toggle state visual feedback**
  - **Validates: Requirements 7.1, 7.2, 7.3**

- [x] 7. Update CardBarRow component
  - Apply design token colors and spacing
  - Implement bar track and fill with proper styling
  - Add width animation (0 to final value over 300ms)
  - Add "BEST" badge styling
  - Add glow effect for best card
  - _Requirements: 9.1-9.5_

- [ ]* 7.1 Write property test for bar chart best card emphasis
  - **Property 10: Best card visual emphasis**
  - **Validates: Requirements 9.4, 9.5**

- [x] 8. Update CardComparisonChart component
  - Sort results by reward value in descending order
  - Pass isBest prop to CardBarRow for highest value
  - Update container styling with design tokens
  - _Requirements: 9.6, 13.4_

- [ ]* 8.1 Write property test for bar chart sorting
  - **Property 9: Bar chart sorting order**
  - **Validates: Requirements 9.6**

- [x] 9. Update AddExpense page layout
  - Update page header with new typography scale
  - Apply responsive container widths
  - Update spacing between sections
  - Ensure all sections use updated components
  - _Requirements: 12.1, 12.2, 4.1-4.3_

- [ ]* 9.1 Write property test for responsive layout constraints
  - **Property 4: Responsive layout constraints**
  - **Validates: Requirements 4.1, 4.2, 4.3**

- [x] 10. Update CardOptimizerSimulator page layout
  - Update page header with new typography scale
  - Apply responsive container widths
  - Update spacing between sections
  - Ensure simulator form uses updated components
  - _Requirements: 13.1, 13.2, 13.3, 4.1-4.3_

- [x] 11. Implement responsive typography system
  - Add media query breakpoints for font size scaling
  - Test typography at mobile (375px), tablet (768px), desktop (1440px)
  - Verify line-height consistency
  - _Requirements: 3.1-3.6_

- [ ]* 11.1 Write property test for typography scaling
  - **Property 3: Typography scaling across breakpoints**
  - **Validates: Requirements 3.1-3.6**

- [x] 12. Add interaction and motion enhancements
  - Implement button press scale effect (98%)
  - Add card hover lift effect for desktop
  - Verify all animations use smooth cubic-bezier timing
  - _Requirements: 10.1-10.5_

- [ ]* 12.1 Write property test for animation timing
  - **Property 8: Disclosure animation timing**
  - **Validates: Requirements 8.4, 10.1**

- [ ] 13. Implement accessibility features
  - Add ARIA labels to collapsible sections
  - Ensure keyboard navigation works (Tab, Enter, Space)
  - Add visible focus indicators
  - Verify minimum tap target sizes (44px on mobile)
  - _Requirements: 14.1-14.5_

- [ ]* 13.1 Write property test for tap target sizes
  - **Property 13: Minimum tap target size**
  - **Validates: Requirements 14.1**

- [ ] 14. Add platform-specific adaptations
  - Detect iOS/iPadOS and apply SF Pro font family
  - Use Inter font family for web/desktop
  - Implement native iOS-style toggles for mobile/tablet
  - Enable hover states only on desktop
  - Add keyboard shortcut support for desktop (Cmd+Enter)
  - _Requirements: 15.1-15.5_

- [ ]* 14.1 Write property test for platform-specific fonts
  - **Property 12: Platform-specific font family**
  - **Validates: Requirements 15.1, 15.2**

- [ ] 15. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 16. Visual regression testing
  - Capture screenshots at mobile, tablet, and desktop widths
  - Compare before/after for Add Expense page
  - Compare before/after for Card Optimizer Simulator page
  - Verify color accuracy and spacing

- [ ]* 17. Integration testing
  - Test complete Add Expense flow with progressive disclosure
  - Test Card Optimizer Simulator with new UI
  - Verify form validation works with collapsed sections
  - Test keyboard navigation through all collapsible sections

- [ ] 18. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

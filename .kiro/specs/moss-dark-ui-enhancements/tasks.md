# Implementation Plan

- [x] 1. Update design token system with WCAG AA colors
  - Update CSS custom properties with new text color palette (#F2F2F7, #D1D1D6, #A1A1A6, #8E8E93, #3A3A3C)
  - Update accent colors to new moss-green palette (#9CBF6E, #B5C892, #9CBF6E55)
  - Add new icon colors (#E5E5EA, #A7A7AD)
  - Update card and surface colors (#161719, #1F2023)
  - Add border-subtle token (rgba(255,255,255,0.12))
  - Add shadow-card-lift token
  - Update radius-pill token (18px) and add radius-pill-full (9999px)
  - _Requirements: 1.1-1.5, 2.1-2.3, 4.1, 4.3, 5.1-5.5, 7.1-7.2_

- [ ]* 1.1 Write property test for text contrast
  - **Property 1: Text contrast meets WCAG AA standards**
  - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**

- [ ]* 1.2 Write property test for accent color consistency
  - **Property 2: Accent color consistency**
  - **Validates: Requirements 2.1-2.8**

- [x] 2. Update MossCard component with enhanced styling
  - Update background color to #161719
  - Add border with color rgba(255,255,255,0.12)
  - Increase padding from space-lg to space-xl
  - Update hover effect to use shadow-card-lift
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ]* 2.1 Write property test for card styling consistency
  - **Property 4: Card container styling consistency**
  - **Validates: Requirements 4.1, 4.3, 4.4**

- [x] 3. Update MossInput component with enhanced styling
  - Update text color to use text-primary token
  - Update border to use border-subtle token
  - Update placeholder color to use text-helper token
  - Add minHeight 44px for tap target size
  - Add disabled state styling with text-disabled color
  - _Requirements: 5.1-5.6_

- [ ]* 3.1 Write property test for form field styling consistency
  - **Property 5: Form field styling consistency**
  - **Validates: Requirements 5.1-5.5**

- [ ]* 3.2 Write property test for tap target size
  - **Property 6: Minimum tap target size on mobile**
  - **Validates: Requirements 5.6**

- [x] 4. Update CollapsibleSection component with enhanced styling
  - Update trigger color to use new accent token
  - Add minHeight 44px for tap target size
  - Update chevron icon color to icon-secondary
  - Increase chevron strokeWidth to 2.5px for visibility
  - Add aria-expanded and aria-controls attributes
  - _Requirements: 2.4, 2.5, 6.1-6.7, 7.2, 7.3_

- [x] 5. Create RewardPointsPanel component
  - Create new component file with TypeScript interface
  - Implement pill-style container with full width
  - Add background color #1F2023
  - Add border with color rgba(255,255,255,0.12)
  - Add border-radius 18-22px
  - Add padding 12-16px
  - Implement icon display (💳)
  - Implement "Reward Points" label
  - _Requirements: 9.3, 9.4, 9.5, 9.6, 9.7_

- [x] 5.1 Implement total points badge
  - Create badge with moss-green styling
  - Apply accent-subtle background
  - Apply accent border
  - Apply accent text color
  - Format points with currency label
  - _Requirements: 9.8_

- [x] 5.2 Implement bonus points badge
  - Create conditional badge for bonus points
  - Apply accent-soft colors
  - Format as "+X bonus"
  - _Requirements: 9.9_

- [x] 5.3 Add accessibility attributes
  - Add role="status" to panel
  - Add aria-live="polite" for updates
  - Add aria-label for screen readers
  - _Requirements: 9.1_

- [ ]* 5.4 Write property test for panel styling
  - **Property 11: Reward Points Panel styling**
  - **Validates: Requirements 9.3-9.7**

- [ ]* 5.5 Write property test for badge styling
  - **Property 12: Reward Points Panel badge styling**
  - **Validates: Requirements 9.8, 9.9**

- [x] 6. Integrate RewardPointsPanel into AddExpense page
  - Import RewardPointsPanel component
  - Add state for reward points display data
  - Position panel after PaymentDetailsSection
  - Ensure panel is always rendered (not conditional)
  - Add spacing between sections (space-xl)
  - _Requirements: 9.1, 9.2, 9.12_

- [ ]* 6.1 Write property test for panel visibility
  - **Property 9: Reward Points Panel always visible**
  - **Validates: Requirements 9.1, 9.12**

- [ ]* 6.2 Write property test for panel positioning
  - **Property 10: Reward Points Panel positioning**
  - **Validates: Requirements 9.2**

- [ ] 7. Connect reward calculation to RewardPointsPanel
  - Add useEffect to calculate rewards on form changes
  - Subscribe to changes in selectedCard, amount, selectedMCC
  - Call rewardService.calculateRewards with transaction data
  - Update panel state with totalPoints, bonusPoints, currency
  - Handle loading and error states
  - _Requirements: 9.10_

- [ ]* 7.1 Write property test for immediate updates
  - **Property 13: Reward Points Panel updates immediately**
  - **Validates: Requirements 9.10**

- [ ] 8. Update section headers with enhanced styling
  - Update font-weight to semibold (600)
  - Increase spacing before headers
  - Update header icon colors to #E5E5EA
  - Ensure consistent hierarchy across all sections
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ]* 8.1 Write property test for section header styling
  - **Property 3: Section header styling consistency**
  - **Validates: Requirements 3.2, 3.3**

- [x] 9. Update icon styling across all components
  - Update primary icon color to #E5E5EA
  - Update secondary icon color to #A7A7AD
  - Increase icon stroke-width to 2.5px minimum
  - Apply to chevrons, form icons, and UI icons
  - _Requirements: 7.1, 7.2, 7.3_

- [ ]* 9.1 Write property test for icon styling
  - **Property 7: Icon color consistency**
  - **Validates: Requirements 7.1, 7.2, 7.3**

- [x] 10. Verify spacing token usage across all components
  - Audit all margin and padding values
  - Replace arbitrary values with spacing tokens
  - Ensure consistent use of 4px, 8px, 12px, 16px, 24px, 32px
  - Update component styles to use CSS custom properties
  - _Requirements: 8.1, 8.2, 8.3_

- [ ]* 10.1 Write property test for spacing token usage
  - **Property 8: Spacing token usage**
  - **Validates: Requirements 8.1**

- [ ] 11. Implement responsive behavior for RewardPointsPanel
  - Add flex-wrap for mobile viewports
  - Adjust badge font-size and padding on mobile
  - Test panel at mobile (375px), tablet (768px), desktop (1440px)
  - Ensure panel doesn't break layout at any width
  - _Requirements: 10.1, 10.2, 10.3, 10.5, 10.7_

- [ ]* 11.1 Write property test for responsive layout
  - **Property 14: Responsive layout constraints**
  - **Validates: Requirements 10.1, 10.5, 10.7**

- [x] 12. Update MerchantDetailsSection with new colors
  - Update text colors to use new palette
  - Update disclosure trigger to use new accent color
  - Verify form labels use text-secondary (#D1D1D6)
  - Verify helper text uses text-helper (#8E8E93)
  - _Requirements: 1.1-1.4, 2.5_

- [x] 13. Update TransactionDetailsSection with new colors
  - Update text colors to use new palette
  - Update disclosure trigger to use new accent color
  - Verify form labels use text-secondary (#D1D1D6)
  - Verify helper text uses text-helper (#8E8E93)
  - _Requirements: 1.1-1.4, 2.5_

- [x] 14. Update PaymentDetailsSection with new colors
  - Update text colors to use new palette
  - Update disclosure trigger to use new accent color
  - Verify form labels use text-secondary (#D1D1D6)
  - Verify helper text uses text-helper (#8E8E93)
  - _Requirements: 1.1-1.4, 2.5_

- [ ] 15. Update CardBarRow component with new accent colors
  - Update bar fill color to #9CBF6E
  - Update "BEST" badge to use new accent colors
  - Update glow effect to use #9CBF6E55
  - _Requirements: 2.1, 2.3, 2.6_

- [ ] 16. Update toggle components with new accent color
  - Update active state to use #9CBF6E
  - Verify inactive state uses neutral gray
  - Test on mobile, tablet, and desktop
  - _Requirements: 2.4_

- [ ] 17. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 18. Accessibility testing
  - Run automated contrast checker on all text elements
  - Verify WCAG AA compliance (4.5:1 minimum)
  - Test with screen readers (VoiceOver, NVDA)
  - Verify keyboard navigation works
  - Test focus indicators with new colors
  - Test with color blindness simulators

- [ ]* 19. Visual regression testing
  - Capture screenshots at mobile, tablet, and desktop widths
  - Compare before/after for Add Expense page
  - Verify Reward Points Panel displays correctly
  - Verify new color palette renders accurately
  - Test with different reward calculation scenarios

- [ ]* 20. Integration testing
  - Test complete Add Expense flow with reward calculation
  - Verify panel updates when card is changed
  - Verify panel updates when amount is changed
  - Verify panel updates when merchant category is changed
  - Test with zero rewards scenario
  - Test with bonus points scenario
  - Verify panel remains visible during form validation errors

- [ ] 21. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.


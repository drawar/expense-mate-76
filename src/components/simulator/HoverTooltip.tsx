import { PaymentMethod } from "@/types";
import { CalculationResult } from "@/core/rewards/types";
import {
  getSimulatorTheme,
  TYPOGRAPHY_CONFIG,
  ANIMATION_CONFIG,
} from "@/core/currency/SimulatorTheme";

interface HoverTooltipProps {
  /**
   * Payment method (card) information
   */
  card: PaymentMethod;

  /**
   * Reward calculation result
   */
  calculation: CalculationResult;

  /**
   * Converted miles value
   */
  convertedMiles: number | null;

  /**
   * Conversion rate used
   */
  conversionRate: number | null;

  /**
   * Whether dark mode is active
   */
  isDarkMode?: boolean;

  /**
   * FX rate used for currency conversion (transaction → card currency)
   */
  fxRate?: number;

  /**
   * Amount after FX conversion to card currency
   */
  fxConvertedAmount?: number;

  /**
   * Transaction currency
   */
  transactionCurrency?: string;

  /**
   * Card's base currency
   */
  cardCurrency?: string;
}

/**
 * HoverTooltip displays detailed reward breakdown on hover
 *
 * Features:
 * - Base points, bonus points, total points
 * - Reward currency name
 * - Conversion rate used
 * - Tier or cap information
 * - Contactless/online bonuses if applicable
 * - Smooth fade-in animation
 *
 * Requirements: 5.2, 5.4, 5.5, 11.5
 *
 * @component
 */
export function HoverTooltip({
  card,
  calculation,
  convertedMiles,
  conversionRate,
  isDarkMode = false,
  fxRate,
  fxConvertedAmount,
  transactionCurrency,
  cardCurrency,
}: HoverTooltipProps) {
  const theme = getSimulatorTheme(isDarkMode);

  // Format numbers for display
  const formatNumber = (num: number) => Math.round(num).toLocaleString();

  // Build tier/cap information message
  const getTierCapInfo = (): string[] => {
    const info: string[] = [];

    // Add tier information if available (Requirement 5.4)
    if (calculation.appliedTier) {
      const tier = calculation.appliedTier;
      if (tier.name) {
        info.push(`Tier: ${tier.name}`);
      } else if (tier.description) {
        info.push(`Tier: ${tier.description}`);
      } else if (tier.multiplier) {
        info.push(`Tier: ${tier.multiplier}x multiplier applied`);
      }
    }

    // Add cap information if available (Requirement 5.4)
    if (
      calculation.monthlyCap !== undefined &&
      calculation.remainingMonthlyBonusPoints !== undefined
    ) {
      const remaining = calculation.remainingMonthlyBonusPoints;
      info.push(`Remaining monthly cap: ${formatNumber(remaining)} points`);
    }

    // Add minimum spend information if not met
    if (!calculation.minSpendMet) {
      info.push("Minimum spend requirement not met");
    }

    // Add any additional messages from calculation (Requirement 5.5)
    if (calculation.messages && calculation.messages.length > 0) {
      info.push(...calculation.messages);
    }

    return info;
  };

  const tierCapInfo = getTierCapInfo();

  return (
    <>
      <style>
        {`
          @keyframes fadeInTooltip {
            from {
              opacity: 0;
              transform: translateY(-4px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
      <div
        className="absolute left-0 right-0 top-full mt-2 z-50 pointer-events-none"
        style={{
          animation: `fadeInTooltip ${ANIMATION_CONFIG.hoverTooltip.duration}ms ${ANIMATION_CONFIG.hoverTooltip.easing}`,
        }}
      >
        <div
          className="rounded-lg shadow-lg p-4 max-w-md"
          style={{
            backgroundColor: theme.panel,
            border: `1px solid ${theme.accent}`,
            color: theme.text,
            fontSize: `${TYPOGRAPHY_CONFIG.tooltipText.fontSize}px`,
            fontWeight: TYPOGRAPHY_CONFIG.tooltipText.fontWeight,
          }}
        >
          {/* Card name header */}
          <div
            className="font-medium mb-3 pb-2 border-b"
            style={{
              borderColor: isDarkMode
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.1)",
              fontSize: `${TYPOGRAPHY_CONFIG.tooltipText.fontSize + 2}px`,
            }}
          >
            {card.name}
          </div>

          {/* FX Rate section - shown when currency conversion occurred */}
          {fxRate &&
            fxConvertedAmount &&
            transactionCurrency &&
            cardCurrency && (
              <div
                className="mb-3 pb-3 border-b"
                style={{
                  borderColor: isDarkMode
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.1)",
                }}
              >
                <div className="flex justify-between mb-1">
                  <span style={{ color: theme.fadedText }}>FX rate:</span>
                  <span className="font-medium">
                    1 {transactionCurrency} = {fxRate.toFixed(4)} {cardCurrency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: theme.fadedText }}>
                    Statement amount:
                  </span>
                  <span className="font-medium">
                    {fxConvertedAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    {cardCurrency}
                  </span>
                </div>
              </div>
            )}

          {/* Points breakdown (Requirement 5.2) */}
          <div className="space-y-2 mb-3">
            <div className="flex justify-between">
              <span style={{ color: theme.fadedText }}>Base points:</span>
              <span className="font-medium">
                {formatNumber(calculation.basePoints)}
              </span>
            </div>

            <div className="flex justify-between">
              <span style={{ color: theme.fadedText }}>Bonus points:</span>
              <span className="font-medium">
                {formatNumber(calculation.bonusPoints)}
              </span>
            </div>

            <div
              className="flex justify-between pt-2 border-t"
              style={{
                borderColor: isDarkMode
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(0, 0, 0, 0.1)",
              }}
            >
              <span style={{ color: theme.fadedText }}>Total points:</span>
              <span className="font-medium">
                {formatNumber(calculation.totalPoints)}
              </span>
            </div>
          </div>

          {/* Reward currency (Requirement 5.2) */}
          <div className="mb-3">
            <div className="flex justify-between">
              <span style={{ color: theme.fadedText }}>Currency:</span>
              <span className="font-medium">{calculation.pointsCurrency}</span>
            </div>
          </div>

          {/* Conversion information (Requirement 5.2) */}
          {conversionRate !== null && convertedMiles !== null && (
            <div
              className="mb-3 pb-3 border-b"
              style={{
                borderColor: isDarkMode
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(0, 0, 0, 0.1)",
              }}
            >
              <div className="flex justify-between mb-1">
                <span style={{ color: theme.fadedText }}>Conversion rate:</span>
                <span className="font-medium">
                  {conversionRate.toFixed(2)} : 1
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: theme.fadedText }}>Converted miles:</span>
                <span className="font-medium" style={{ color: theme.accent }}>
                  {formatNumber(convertedMiles)}
                </span>
              </div>
            </div>
          )}

          {/* Tier/cap information and messages (Requirement 5.4, 5.5) */}
          {tierCapInfo.length > 0 && (
            <div className="space-y-1">
              {tierCapInfo.map((info, index) => (
                <div
                  key={index}
                  className="text-xs"
                  style={{
                    color: theme.fadedText,
                    fontStyle: info.includes("not met") ? "italic" : "normal",
                  }}
                >
                  {info}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

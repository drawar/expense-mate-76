import { useState } from "react";
import { PaymentMethod } from "@/types";
import { CalculationResult } from "@/core/rewards/types";
import { HoverTooltip } from "./HoverTooltip";
import { cn } from "@/lib/utils";

interface CardBarRowProps {
  /**
   * Payment method (card) information
   */
  card: PaymentMethod;

  /**
   * Reward calculation result
   */
  calculation: CalculationResult;

  /**
   * Converted miles value (null if no conversion available)
   */
  convertedMiles: number | null;

  /**
   * Conversion rate used (null if no conversion available)
   */
  conversionRate: number | null;

  /**
   * Rank of this card (1 = best)
   */
  rank: number;

  /**
   * Whether this is the best card (highest reward value)
   */
  isBest: boolean;

  /**
   * Maximum miles value across all cards (for bar width scaling)
   */
  maxMiles: number;

  /**
   * Whether dark mode is active
   */
  isDarkMode?: boolean;

  /**
   * Whether this is the initial load (for animation)
   */
  isInitialLoad?: boolean;
}

/**
 * CardBarRow displays a single card's earning potential as a horizontal bar
 *
 * Features:
 * - Card name and issuer on the left
 * - Horizontal progress bar with moss-green color
 * - Converted miles value on the right
 * - Top-ranked card gets glow effect and "BEST" badge
 * - Hover tooltip with detailed breakdown
 * - Uses Moss Dark UI design tokens
 * - Width animation from 0 to final value over 300ms
 *
 * Requirements: 9.1-9.5
 *
 * @component
 */
export function CardBarRow({
  card,
  calculation,
  convertedMiles,
  conversionRate,
  rank,
  isBest,
  maxMiles,
  isDarkMode = false,
  isInitialLoad = false,
}: CardBarRowProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Check if conversion is available
  const hasConversion = convertedMiles !== null && conversionRate !== null;

  // Calculate bar width percentage (Requirement 9.1)
  const barWidth =
    hasConversion && maxMiles > 0 ? (convertedMiles / maxMiles) * 100 : 0;

  // Format miles value for display
  const formattedMiles =
    convertedMiles !== null ? Math.round(convertedMiles).toLocaleString() : "—";

  return (
    <div
      className="relative"
      style={{
        marginBottom: "var(--space-sm)",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Container with optional glow effect for best card (Requirement 9.4) */}
      <div
        className={cn(
          "card-bar-row",
          isBest && "card-bar-row-best",
          !hasConversion && "opacity-50"
        )}
        style={{
          padding: "var(--space-md)",
          borderRadius: "var(--radius-input)",
          backgroundColor: "var(--color-surface)",
          ...(isBest && {
            boxShadow: "var(--shadow-glow-accent)",
          }),
        }}
      >
        {/* Card name, issuer, and badge row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="flex flex-col">
              <span
                className="font-medium"
                style={{
                  color: "var(--color-text)",
                  fontSize: "var(--font-size-body)",
                }}
              >
                {card.name}
              </span>
              {card.issuer && (
                <span
                  style={{
                    color: "var(--color-text-muted)",
                    fontSize: "var(--font-size-helper)",
                  }}
                >
                  {card.issuer}
                </span>
              )}
            </div>

            {/* BEST badge for best card (Requirement 9.5) */}
            {isBest && hasConversion && (
              <span
                className="best-badge"
                style={{
                  padding: "var(--space-xs) var(--space-sm)",
                  borderRadius: "var(--radius-pill)",
                  border: "1px solid var(--color-accent)",
                  backgroundColor: "var(--color-accent-subtle)",
                  color: "var(--color-accent)",
                  fontSize: "var(--font-size-helper)",
                  fontWeight: "var(--font-weight-semibold)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                BEST
              </span>
            )}
          </div>

          {/* Miles value */}
          {hasConversion && (
            <span
              className="font-semibold"
              style={{
                color: "var(--color-text)",
                fontSize: "var(--font-size-body)",
              }}
            >
              {formattedMiles}
            </span>
          )}
        </div>

        {/* Bar track and fill (Requirements 9.1, 9.2, 9.3) */}
        {hasConversion ? (
          <div
            className="bar-track"
            style={{
              height: "6px",
              backgroundColor: "var(--color-track)",
              borderRadius: "var(--radius-pill)",
              overflow: "hidden",
            }}
          >
            {/* Bar fill with animation (Requirement 9.3) */}
            <div
              className={cn("bar-fill", isBest && "bar-fill-best")}
              style={{
                height: "100%",
                width: `${barWidth}%`,
                backgroundColor: "var(--color-accent)",
                borderRadius: "var(--radius-pill)",
                transition:
                  "width var(--duration-normal) var(--transition-smooth)",
              }}
            />
          </div>
        ) : (
          <div
            className="flex items-center justify-center"
            style={{
              height: "6px",
              backgroundColor: "var(--color-track)",
              borderRadius: "var(--radius-pill)",
              color: "var(--color-text-muted)",
              fontSize: "var(--font-size-helper)",
            }}
          >
            No conversion available
          </div>
        )}
      </div>

      {/* Hover tooltip with detailed breakdown */}
      {isHovered && hasConversion && (
        <HoverTooltip
          card={card}
          calculation={calculation}
          convertedMiles={convertedMiles}
          conversionRate={conversionRate}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
}

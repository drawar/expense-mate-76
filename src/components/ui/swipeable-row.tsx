import React, { useState, useRef, useCallback, useEffect } from "react";

export interface SwipeAction {
  key: string;
  label: string;
  icon?: React.ReactNode;
  backgroundColor: string;
  color: string;
  onClick: () => void;
  width?: number;
}

interface SwipeableRowProps {
  children: React.ReactNode;
  actions: SwipeAction[];
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  /** Show a subtle swipe hint animation on mount */
  showHint?: boolean;
  /** Callback when hint animation completes */
  onHintComplete?: () => void;
}

const DEFAULT_ACTION_WIDTH = 72;
const SWIPE_THRESHOLD = 0.3; // 30% of total actions width to trigger snap open
const VELOCITY_THRESHOLD = 0.5; // pixels per millisecond
const HINT_PEEK_AMOUNT = 48; // pixels to peek during hint
const HINT_DELAY = 600; // ms delay before hint starts
const HINT_DURATION = 400; // ms for each direction of hint

export const SwipeableRow: React.FC<SwipeableRowProps> = ({
  children,
  actions,
  className = "",
  style,
  disabled = false,
  showHint = false,
  onHintComplete,
}) => {
  const [translateX, setTranslateX] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isHinting, setIsHinting] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const currentXRef = useRef(0);
  const startTimeRef = useRef(0);
  const isVerticalScrollRef = useRef<boolean | null>(null);
  const hintTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Hint animation effect
  useEffect(() => {
    if (!showHint || disabled) return;

    // Start hint animation after delay
    hintTimeoutRef.current = setTimeout(() => {
      setIsHinting(true);
      setTranslateX(-HINT_PEEK_AMOUNT);

      // Return to original position
      setTimeout(() => {
        setTranslateX(0);

        // Mark hint as complete after animation finishes
        setTimeout(() => {
          setIsHinting(false);
          onHintComplete?.();
        }, HINT_DURATION);
      }, HINT_DURATION);
    }, HINT_DELAY);

    return () => {
      if (hintTimeoutRef.current) {
        clearTimeout(hintTimeoutRef.current);
      }
    };
  }, [showHint, disabled, onHintComplete]);

  const totalActionsWidth = actions.reduce(
    (sum, action) => sum + (action.width || DEFAULT_ACTION_WIDTH),
    0
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return;

      const touch = e.touches[0];
      startXRef.current = touch.clientX;
      startYRef.current = touch.clientY;
      currentXRef.current = translateX;
      startTimeRef.current = Date.now();
      isVerticalScrollRef.current = null;
      setIsDragging(true);
    },
    [disabled, translateX]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || !isDragging) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - startXRef.current;
      const deltaY = touch.clientY - startYRef.current;

      // Determine scroll direction on first significant movement
      if (isVerticalScrollRef.current === null) {
        if (Math.abs(deltaY) > 10 || Math.abs(deltaX) > 10) {
          isVerticalScrollRef.current = Math.abs(deltaY) > Math.abs(deltaX);
        }
      }

      // If vertical scroll, don't handle swipe
      if (isVerticalScrollRef.current) {
        return;
      }

      // Prevent page scroll when swiping horizontally
      e.preventDefault();

      let newTranslateX = currentXRef.current + deltaX;

      // Clamp to allowed range: -totalActionsWidth to 0
      // Add resistance when swiping right past 0
      if (newTranslateX > 0) {
        newTranslateX = newTranslateX * 0.3;
      }
      // Add resistance when swiping left past actions width
      if (newTranslateX < -totalActionsWidth) {
        const overflow = newTranslateX + totalActionsWidth;
        newTranslateX = -totalActionsWidth + overflow * 0.3;
      }

      setTranslateX(newTranslateX);
    },
    [disabled, isDragging, totalActionsWidth]
  );

  const handleTouchEnd = useCallback(() => {
    if (disabled || !isDragging) return;

    setIsDragging(false);

    // Calculate velocity
    const endTime = Date.now();
    const duration = endTime - startTimeRef.current;
    const velocity = Math.abs(translateX - currentXRef.current) / duration;

    // Determine if we should snap open or closed
    const shouldOpen =
      velocity > VELOCITY_THRESHOLD
        ? translateX < currentXRef.current // Fast swipe left
        : Math.abs(translateX) > totalActionsWidth * SWIPE_THRESHOLD;

    if (shouldOpen) {
      setTranslateX(-totalActionsWidth);
      setIsOpen(true);
    } else {
      setTranslateX(0);
      setIsOpen(false);
    }
  }, [disabled, isDragging, translateX, totalActionsWidth]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;

      startXRef.current = e.clientX;
      currentXRef.current = translateX;
      startTimeRef.current = Date.now();
      setIsDragging(true);

      // Prevent text selection while dragging
      e.preventDefault();
    },
    [disabled, translateX]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (disabled || !isDragging) return;

      const deltaX = e.clientX - startXRef.current;
      let newTranslateX = currentXRef.current + deltaX;

      // Clamp with resistance
      if (newTranslateX > 0) {
        newTranslateX = newTranslateX * 0.3;
      }
      if (newTranslateX < -totalActionsWidth) {
        const overflow = newTranslateX + totalActionsWidth;
        newTranslateX = -totalActionsWidth + overflow * 0.3;
      }

      setTranslateX(newTranslateX);
    },
    [disabled, isDragging, totalActionsWidth]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;

    setIsDragging(false);

    const endTime = Date.now();
    const duration = endTime - startTimeRef.current;
    const velocity = Math.abs(translateX - currentXRef.current) / duration;

    const shouldOpen =
      velocity > VELOCITY_THRESHOLD
        ? translateX < currentXRef.current
        : Math.abs(translateX) > totalActionsWidth * SWIPE_THRESHOLD;

    if (shouldOpen) {
      setTranslateX(-totalActionsWidth);
      setIsOpen(true);
    } else {
      setTranslateX(0);
      setIsOpen(false);
    }
  }, [isDragging, translateX, totalActionsWidth]);

  const handleMouseLeave = useCallback(() => {
    if (isDragging) {
      handleMouseUp();
    }
  }, [isDragging, handleMouseUp]);

  const close = useCallback(() => {
    setTranslateX(0);
    setIsOpen(false);
  }, []);

  const handleActionClick = useCallback(
    (action: SwipeAction) => {
      action.onClick();
      close();
    },
    [close]
  );

  // Close when clicking outside or on the content when open
  const handleContentClick = useCallback(() => {
    if (isOpen && !isDragging) {
      close();
    }
  }, [isOpen, isDragging, close]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={style}
      onMouseLeave={handleMouseLeave}
    >
      {/* Actions container - positioned behind content */}
      <div
        className="absolute inset-y-0 right-0 flex"
        style={{
          width: totalActionsWidth,
        }}
      >
        {actions.map((action) => (
          <button
            key={action.key}
            className="flex flex-col items-center justify-center h-full transition-opacity"
            style={{
              width: action.width || DEFAULT_ACTION_WIDTH,
              backgroundColor: action.backgroundColor,
              color: action.color,
              opacity: Math.min(
                1,
                Math.abs(translateX) / (totalActionsWidth * 0.5)
              ),
            }}
            onClick={() => handleActionClick(action)}
            aria-label={action.label}
          >
            {action.icon && <span className="mb-1">{action.icon}</span>}
            <span className="text-xs font-medium">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Main content - slides left to reveal actions */}
      <div
        className="relative bg-inherit"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isDragging
            ? "none"
            : isHinting
              ? `transform ${HINT_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`
              : "transform 0.3s ease-out",
          backgroundColor: "var(--color-surface)",
          touchAction: "pan-y",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleContentClick}
      >
        {children}
      </div>
    </div>
  );
};

export default SwipeableRow;

// components/common/PullToRefresh.tsx
import React, { useState, useRef, useCallback } from "react";
import { RefreshCw } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
  threshold?: number;
}

/**
 * Pull-to-refresh wrapper component for mobile
 * Adds swipe-down gesture to trigger refresh
 */
const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  className = "",
  threshold = 80,
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only allow pull when scrolled to top (check both window and container scroll)
    const isAtTop =
      window.scrollY === 0 ||
      (containerRef.current && containerRef.current.scrollTop === 0);
    if (isAtTop) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isPulling || isRefreshing) return;

      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;

      // Only pull down, not up
      if (diff > 0) {
        // Apply resistance - the further you pull, the harder it gets
        const resistance = 0.4;
        const distance = Math.min(diff * resistance, threshold * 1.5);
        setPullDistance(distance);
      }
    },
    [isPulling, isRefreshing, threshold]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;

    setIsPulling(false);

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold);

      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh]);

  const isReady = pullDistance >= threshold;
  const progress = Math.min(pullDistance / threshold, 1);

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className="absolute left-0 right-0 flex items-center justify-center overflow-hidden transition-all duration-200 ease-out pointer-events-none z-10"
        style={{
          height: pullDistance,
          top: 0,
        }}
      >
        <div
          className={`flex items-center justify-center rounded-full p-2 transition-all duration-200 ${
            isReady || isRefreshing
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
          style={{
            opacity: Math.min(progress * 1.5, 1),
            transform: `scale(${0.5 + progress * 0.5})`,
          }}
        >
          <RefreshCw
            className={`h-5 w-5 transition-transform duration-200 ${
              isRefreshing ? "animate-spin" : ""
            }`}
            style={{
              transform: isRefreshing
                ? undefined
                : `rotate(${progress * 180}deg)`,
            }}
          />
        </div>
      </div>

      {/* Content with pull offset */}
      <div
        className="transition-transform duration-200 ease-out"
        style={{
          transform: `translateY(${pullDistance}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default React.memo(PullToRefresh);

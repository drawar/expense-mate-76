import React, { useEffect, useState, useRef } from "react";
import { PaymentMethod } from "@/types";
import { cn } from "@/lib/utils";
import { PaymentCardFace } from "./PaymentCardFace";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

// Haptic feedback utility
const haptic = {
  light: () => navigator.vibrate?.(10),
  medium: () => navigator.vibrate?.(20),
};

interface PaymentCarouselProps {
  paymentMethods: PaymentMethod[];
  selectedMethod: PaymentMethod | null;
  onSelectMethod: (method: PaymentMethod) => void;
}

export const PaymentCarousel: React.FC<PaymentCarouselProps> = ({
  paymentMethods,
  selectedMethod,
  onSelectMethod,
}) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const prevIndexRef = useRef<number>(0);

  useEffect(() => {
    if (!api) return;

    // Set up event listeners for the carousel
    const onSelect = () => {
      const newIndex = api.selectedScrollSnap();
      // Trigger haptic feedback when snapping to a different card
      if (newIndex !== prevIndexRef.current) {
        haptic.medium();
        prevIndexRef.current = newIndex;
      }
      setCurrent(newIndex);
      if (paymentMethods[newIndex]) {
        onSelectMethod(paymentMethods[newIndex]);
      }
    };

    api.on("select", onSelect);
    api.on("reInit", onSelect);

    // Set the initial counts
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api, paymentMethods, onSelectMethod]);

  // When selectedMethod changes externally, update the carousel position
  useEffect(() => {
    if (!api || !selectedMethod) return;

    const index = paymentMethods.findIndex((m) => m.id === selectedMethod.id);
    if (index >= 0 && index !== current) {
      api.scrollTo(index);
    }
  }, [selectedMethod, paymentMethods, current, api]);

  return (
    <div className="relative py-4">
      {/* Card count indicator - Japandi style */}
      <div
        className="absolute top-0 right-4 text-[13px]"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {current + 1} of {count}
      </div>

      <Carousel
        setApi={setApi}
        className="w-full max-w-[600px] mx-auto"
        opts={{
          align: "center",
          loop: false,
        }}
      >
        <CarouselContent>
          {paymentMethods.map((method, index) => (
            <CarouselItem
              key={method.id}
              className="basis-[70%] sm:basis-[60%] md:basis-1/2 lg:basis-[45%]"
            >
              <div
                className={cn(
                  "transition-all duration-300 ease-out px-2 cursor-pointer",
                  index === current ? "scale-100" : "scale-[0.85] opacity-60",
                  !method.active && "opacity-50"
                )}
                onClick={() => onSelectMethod(method)}
                style={{
                  transform: index === current ? "scale(1)" : "scale(0.85)",
                }}
              >
                <PaymentCardFace paymentMethod={method} />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        <CarouselPrevious
          className="absolute -left-4 sm:-left-2 md:left-2 transition-all duration-300"
          style={{
            backgroundColor: "var(--color-card-bg)",
            borderColor: "var(--color-border)",
            color: "var(--color-icon-secondary)",
          }}
          onClick={() => haptic.light()}
        />
        <CarouselNext
          className="absolute -right-4 sm:-right-2 md:right-2 transition-all duration-300"
          style={{
            backgroundColor: "var(--color-card-bg)",
            borderColor: "var(--color-border)",
            color: "var(--color-icon-secondary)",
          }}
          onClick={() => haptic.light()}
        />
      </Carousel>

      {/* Japandi Pagination Dots */}
      <div className="flex justify-center mt-4" style={{ gap: "8px" }}>
        {paymentMethods.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              haptic.light();
              api?.scrollTo(index);
            }}
            className="transition-all duration-300 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "4px",
              backgroundColor:
                index === current
                  ? "var(--color-accent)"
                  : "var(--color-text-disabled)",
              outlineColor: "var(--color-accent)",
            }}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

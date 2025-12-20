import React, { useEffect, useState } from "react";
import { PaymentMethod } from "@/types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PaymentCardFace } from "./PaymentCardFace";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

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

  useEffect(() => {
    if (!api) return;

    // Set up event listeners for the carousel
    const onSelect = () => {
      setCurrent(api.selectedScrollSnap());
      if (paymentMethods[api.selectedScrollSnap()]) {
        onSelectMethod(paymentMethods[api.selectedScrollSnap()]);
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
                  "transition-all duration-300 px-2 cursor-pointer",
                  index === current ? "scale-100" : "scale-[0.85] opacity-60",
                  !method.active && "opacity-50"
                )}
                onClick={() => onSelectMethod(method)}
              >
                <PaymentCardFace paymentMethod={method} />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        <CarouselPrevious className="absolute -left-4 sm:-left-2 md:left-2" />
        <CarouselNext className="absolute -right-4 sm:-right-2 md:right-2" />
      </Carousel>
    </div>
  );
};

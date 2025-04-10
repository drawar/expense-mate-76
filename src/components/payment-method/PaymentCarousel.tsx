import React, { useEffect, useState } from 'react';
import { PaymentMethod } from '@/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PaymentCardFace } from './PaymentCardFace';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi
} from '@/components/ui/carousel';

interface PaymentCarouselProps {
  paymentMethods: PaymentMethod[];
  selectedMethod: PaymentMethod | null;
  onSelectMethod: (method: PaymentMethod) => void;
}

export const PaymentCarousel: React.FC<PaymentCarouselProps> = ({
  paymentMethods,
  selectedMethod,
  onSelectMethod
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
    
    const index = paymentMethods.findIndex(m => m.id === selectedMethod.id);
    if (index >= 0 && index !== current) {
      api.scrollTo(index);
    }
  }, [selectedMethod, paymentMethods, current, api]);

  return (
    <div className="relative py-4">
      <Carousel
        setApi={setApi}
        className="w-full max-w-[90%] mx-auto"
        opts={{
          align: "center",
          loop: false,
        }}
      >
        <CarouselContent>
          {paymentMethods.map((method, index) => (
            <CarouselItem key={method.id} className="md:basis-1/2 lg:basis-1/3">
              <div 
                className={cn(
                  "transition-all duration-300 px-2",
                  index === current ? "scale-105" : "scale-95 opacity-70",
                  !method.active && "opacity-50"
                )}
                onClick={() => onSelectMethod(method)}
              >
                <PaymentCardFace paymentMethod={method} />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        <CarouselPrevious 
          className="absolute -left-12 sm:-left-6 md:left-0 lg:left-4"
        />
        <CarouselNext 
          className="absolute -right-12 sm:-right-6 md:right-0 lg:right-4"
        />
      </Carousel>
    </div>
  );
};

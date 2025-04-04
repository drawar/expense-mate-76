
import React from 'react';
import { PaymentMethod } from '@/types';
import Flicking from "@egjs/react-flicking";
import "@egjs/react-flicking/dist/flicking.css";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PaymentCardFace } from './PaymentCardFace';

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
  const flickingRef = React.useRef<Flicking | null>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [showLeftArrow, setShowLeftArrow] = React.useState(false);
  const [showRightArrow, setShowRightArrow] = React.useState(true);

  React.useEffect(() => {
    if (selectedMethod && flickingRef.current) {
      const index = paymentMethods.findIndex(m => m.id === selectedMethod.id);
      if (index >= 0 && index !== activeIndex) {
        flickingRef.current.moveTo(index);
      }
    }
  }, [selectedMethod, paymentMethods, activeIndex]);

  const handlePrev = () => {
    flickingRef.current?.prev();
  };

  const handleNext = () => {
    flickingRef.current?.next();
  };

  const handleChange = (e: any) => {
    const index = e.index;
    setActiveIndex(index);
    onSelectMethod(paymentMethods[index]);
    
    // Update arrow visibility
    if (flickingRef.current) {
      setShowLeftArrow(index > 0);
      setShowRightArrow(index < paymentMethods.length - 1);
    }
  };

  return (
    <div className="relative py-4">
      {showLeftArrow && (
        <Button 
          variant="outline" 
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full shadow-md bg-background/80 backdrop-blur-sm"
          onClick={handlePrev}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      )}
      
      <Flicking
        ref={flickingRef}
        className="overflow-visible"
        align="prev"
        onChanged={handleChange}
        circular={false}
        gap={20}
        bound={true}
      >
        {paymentMethods.map((method) => (
          <div 
            key={method.id}
            className={cn(
              "min-w-[300px] sm:min-w-[340px] transition-all duration-300",
              method.id === selectedMethod?.id ? "scale-105" : "scale-95 opacity-70",
              !method.active && "opacity-50"
            )}
            onClick={() => onSelectMethod(method)}
          >
            <PaymentCardFace paymentMethod={method} />
          </div>
        ))}
      </Flicking>

      {showRightArrow && (
        <Button 
          variant="outline" 
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full shadow-md bg-background/80 backdrop-blur-sm"
          onClick={handleNext}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
};

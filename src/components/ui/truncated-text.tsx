import * as React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface TruncatedTextProps {
  text: string;
  className?: string;
}

/**
 * Text component that truncates with ellipsis and shows full text on tap/click.
 * Works on both mobile (tap) and desktop (click).
 */
const TruncatedText: React.FC<TruncatedTextProps> = ({ text, className }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <p
          className={cn(
            "font-medium truncate cursor-pointer active:opacity-70",
            className
          )}
        >
          {text}
        </p>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto max-w-[280px] p-2 text-sm"
        side="top"
        align="start"
      >
        <p className="break-words">{text}</p>
      </PopoverContent>
    </Popover>
  );
};

export { TruncatedText };

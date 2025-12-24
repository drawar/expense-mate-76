import { cn } from "@/lib/utils";

interface ClairoLogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

/**
 * Clairo logo component - minimalist text-based logo
 * Shows a stylized "C" icon, optionally with "lairo" text
 */
export function ClairoLogo({
  size = 24,
  showText = false,
  className,
}: ClairoLogoProps) {
  return (
    <div className={cn("flex items-center", className)}>
      {/* Stylized C in a rounded square */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Rounded square background */}
        <rect
          x="2"
          y="2"
          width="28"
          height="28"
          rx="8"
          className="fill-[#7C9885]"
        />
        {/* Stylized C letter */}
        <path
          d="M20.5 10.5C19.2 9.2 17.3 8.5 15.5 8.5C11.4 8.5 8 11.9 8 16C8 20.1 11.4 23.5 15.5 23.5C17.3 23.5 19.2 22.8 20.5 21.5"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      {showText && (
        <span className="font-medium text-foreground tracking-tight">
          lairo
        </span>
      )}
    </div>
  );
}

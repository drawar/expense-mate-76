import { cn } from "@/lib/utils";

const LOGO_URL =
  "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/assets/logo_2.png";

interface ClairoLogoProps {
  size?: number;
  className?: string;
}

/**
 * Clairo logo component
 * Size sets the height, width auto-scales to preserve aspect ratio
 */
export function ClairoLogo({ size = 24, className }: ClairoLogoProps) {
  return (
    <img
      src={LOGO_URL}
      alt="Clairo"
      height={size}
      className={cn("flex-shrink-0 rounded-md object-contain", className)}
      style={{ height: size, width: "auto" }}
    />
  );
}

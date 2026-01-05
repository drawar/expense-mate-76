import { cn } from "@/lib/utils";

const LOGO_URL =
  "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/assets/logo_2.png";

interface ClairoLogoProps {
  size?: number;
  className?: string;
}

/**
 * Clairo logo component
 */
export function ClairoLogo({ size = 24, className }: ClairoLogoProps) {
  return (
    <img
      src={LOGO_URL}
      alt="Clairo"
      width={size}
      height={size}
      className={cn("flex-shrink-0 rounded-md", className)}
    />
  );
}

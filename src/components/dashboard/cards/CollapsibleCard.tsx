// components/dashboard/cards/CollapsibleCard.tsx
/**
 * A wrapper component that makes any content collapsible with a header
 */

import React, { useState } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface CollapsibleCardProps {
  title: string;
  defaultCollapsed?: boolean;
  className?: string;
  children: React.ReactNode;
}

const CollapsibleCard: React.FC<CollapsibleCardProps> = ({
  title,
  defaultCollapsed = false,
  className = "",
  children,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <Card className={className}>
      <CardHeader
        className="py-3 cursor-pointer select-none hover:bg-muted/50 transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isCollapsed ? (
              <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="font-medium">{title}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {isCollapsed ? "expand" : "collapse"}
          </span>
        </div>
      </CardHeader>
      {!isCollapsed && <CardContent className="pt-0">{children}</CardContent>}
    </Card>
  );
};

export default React.memo(CollapsibleCard);

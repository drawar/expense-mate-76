
import { CSSProperties, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SummaryCardProps {
  title: string;
  value?: string;
  description?: ReactNode;
  icon?: ReactNode;
  className?: string;
  style?: CSSProperties;
  customContent?: ReactNode;
}

const SummaryCard = ({ title, value, description, icon, className, style, customContent }: SummaryCardProps) => {
  return (
    <Card className={`summary-card overflow-hidden ${className || ''}`} style={style}>
      <CardHeader className="pb-2">
        {/* Title component - consistent across all cards */}
        <CardDescription className="text-xs font-medium text-muted-foreground/90 uppercase tracking-wider">
          {title}
        </CardDescription>
        
        {/* Body component - either custom content or standard value */}
        <div className="mt-2">
          {customContent ? (
            customContent
          ) : (
            <CardTitle className="text-3xl font-bold truncate" title={value}>
              {value}
            </CardTitle>
          )}
        </div>
      </CardHeader>
      
      {/* Footnote component - consistent across all cards */}
      <CardContent className="pt-0">
        {description && (
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            {icon && <span className="text-primary/80">{icon}</span>}
            <span className="truncate">{description}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SummaryCard;

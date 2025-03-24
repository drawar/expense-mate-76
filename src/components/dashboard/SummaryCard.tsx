
import { CSSProperties, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SummaryCardProps {
  title: string;
  value: string;
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
        <CardDescription className="text-xs font-medium text-muted-foreground/90 uppercase tracking-wider">{title}</CardDescription>
        {customContent ? (
          <div className="mt-2">
            {customContent}
          </div>
        ) : (
          <CardTitle className="text-2xl font-bold mt-2 truncate" title={value}>
            {value}
          </CardTitle>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
          {icon && <span className="text-primary/80">{icon}</span>}
          <span className="truncate">{description}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default SummaryCard;

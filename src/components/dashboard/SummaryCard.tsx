
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
        <CardDescription className="text-sm font-medium text-muted-foreground/80">{title}</CardDescription>
        {customContent ? (
          <div className="overflow-visible">
            {customContent}
          </div>
        ) : (
          <CardTitle className="text-2xl font-bold mt-1 truncate" title={value}>
            {value}
          </CardTitle>
        )}
      </CardHeader>
      <CardContent className="pt-2">
        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
          {icon}
          <span className="truncate">{description}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default SummaryCard;

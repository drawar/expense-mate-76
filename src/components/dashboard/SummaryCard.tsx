
import { CSSProperties, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SummaryCardProps {
  title: string;
  value: string;
  description?: ReactNode;
  icon?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

const SummaryCard = ({ title, value, description, icon, className, style }: SummaryCardProps) => {
  return (
    <Card className={`summary-card overflow-hidden ${className || ''}`} style={style}>
      <CardHeader className="pb-2">
        <CardDescription className="text-sm font-medium">{title}</CardDescription>
        <CardTitle className="text-xl sm:text-2xl truncate" title={value}>
          {value}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          {icon}
          <span className="truncate">{description}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default SummaryCard;

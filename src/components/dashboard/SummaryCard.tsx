
import { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SummaryCardProps {
  title: string;
  value: string;
  description?: ReactNode;
  icon?: ReactNode;
}

const SummaryCard = ({ title, value, description, icon }: SummaryCardProps) => {
  return (
    <Card className="summary-card overflow-hidden">
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

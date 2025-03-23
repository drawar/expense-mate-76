
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
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl line-clamp-1">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-xs text-muted-foreground flex items-center">
          {icon}
          {description}
        </div>
      </CardContent>
    </Card>
  );
};

export default SummaryCard;

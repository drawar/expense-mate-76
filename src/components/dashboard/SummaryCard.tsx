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
  cardColor?: string;
  valueColor?: string;
}

const SummaryCard = ({ 
  title, 
  value, 
  description, 
  icon, 
  className, 
  style, 
  customContent,
  cardColor = "bg-card",
  valueColor = "text-foreground"
}: SummaryCardProps) => {
  return (
    <Card 
      className={`summary-card overflow-hidden ${cardColor} ${className || ''}`}
      style={style}
    >
      <CardHeader className="pb-2">
        {/* Title component with icon */}
        <CardDescription className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center">
          {icon && <span className="mr-1.5">{icon}</span>}
          {title}
        </CardDescription>
        
        {/* Body component - either custom content or standard value */}
        <div className="mt-2">
          {customContent ? (
            customContent
          ) : (
            <CardTitle className={`text-2xl font-bold truncate ${valueColor}`} title={value}>
              {value}
            </CardTitle>
          )}
        </div>
      </CardHeader>
      
      {/* Footnote component - consistent across all cards */}
      <CardContent className="pt-0">
        {description && (
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            {description}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SummaryCard;

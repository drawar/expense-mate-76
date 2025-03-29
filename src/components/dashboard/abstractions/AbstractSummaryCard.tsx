// src/components/dashboard/abstractions/AbstractSummaryCard.tsx
import React, { Component, createElement } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CSSProperties, ReactNode } from 'react';

/**
 * Base props interface for all summary cards
 */
export interface SummaryCardProps {
  title: string;
  icon?: React.ComponentType<any>; // Icon component (e.g., Lucide icon)
  value?: string;
  description?: ReactNode;
  className?: string;
  style?: CSSProperties;
  cardColor?: string;
  valueColor?: string;
}

/**
 * Abstract base class for all summary cards
 * Provides consistent structure and styling while allowing
 * subclasses to define their specific content
 */
abstract class AbstractSummaryCard<P extends SummaryCardProps> extends Component<P> {
  /**
   * Abstract method that subclasses must implement to provide card-specific value content
   */
  protected abstract renderCardValue(): React.ReactNode;
  
  /**
   * Optional method subclasses can override to provide additional content
   */
  protected renderCardDescription(): React.ReactNode {
    const { description } = this.props;
    
    if (!description) return null;
    
    return (
      <div className="text-xs text-muted-foreground flex items-center gap-1">
        {description}
      </div>
    );
  }
  
  /**
   * Renders the card with consistent styling and structure
   */
  render() {
    const { 
      title, 
      icon: Icon, 
      className = '',
      style,
      cardColor = "bg-card"
    } = this.props;
    
    return (
      <Card 
        className={`summary-card overflow-hidden ${cardColor} ${className}`}
        style={style}
      >
        <CardHeader className="pb-2">
          {/* Title component with icon */}
          <CardDescription className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center">
            {Icon && <span className="mr-1.5">{createElement(Icon, { className: "h-4 w-4 text-primary" })}</span>}
            {title}
          </CardDescription>
          
          {/* Body component - value content */}
          <div className="mt-2">
            {this.renderCardValue()}
          </div>
        </CardHeader>
        
        {/* Footnote component - description */}
        <CardContent className="pt-0">
          {this.renderCardDescription()}
        </CardContent>
      </Card>
    );
  }
}

export default AbstractSummaryCard;

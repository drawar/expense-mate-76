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
  descriptionClassName?: string; // Added to support custom description styling
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
   * Method that returns the description content - can be overridden by subclasses
   * By default returns the description prop
   */
  protected getDescriptionContent(): ReactNode {
    return this.props.description;
  }
  
  /**
   * Method for rendering the card description with consistent styling
   * Uses the descriptionClassName prop for styling flexibility
   */
  protected renderCardDescription(): React.ReactNode {
    const content = this.getDescriptionContent();
    const { descriptionClassName = "text-xs text-muted-foreground flex items-center gap-1" } = this.props;
    
    if (!content) return null;
    
    return (
      <div className={descriptionClassName}>
        {content}
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
        <CardHeader className="pb-2 flex flex-col min-h-[80px]">
          {/* Title component with icon - fixed height and ellipsis for overflow */}
          <CardDescription className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center min-h-[20px] w-full">
            {Icon && <span className="mr-1.5 flex-shrink-0">{createElement(Icon, { className: "h-4 w-4 text-primary" })}</span>}
            <span className="truncate">{title}</span>
          </CardDescription>
          
          {/* Body component - value content with fixed position */}
          <div className="mt-2 flex-grow flex items-center min-h-[40px]">
            {this.renderCardValue()}
          </div>
        </CardHeader>
        
        {/* Footnote component - description with fixed height */}
        <CardContent className="pt-0 min-h-[24px]">
          {this.renderCardDescription()}
        </CardContent>
      </Card>
    );
  }
}

export default AbstractSummaryCard;

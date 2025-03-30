// src/components/dashboard/abstractions/AbstractSummaryCard.tsx
import React, { Component, createElement } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CSSProperties, ReactNode } from 'react';
import summaryCardConfig, { commonCardStyles, SummaryCardType } from '@/config/summaryCardConfig';

/**
 * Base props interface for all summary cards
 */
export interface SummaryCardProps {
  cardType?: SummaryCardType;
  title?: string; 
  icon?: React.ComponentType<any>;
  value?: string;
  description?: ReactNode;
  className?: string;
  style?: CSSProperties;
  cardColor?: string;
  valueColor?: string;
  descriptionClassName?: string;
}

/**
 * Abstract base class for all summary cards
 * Provides consistent structure and styling while allowing
 * subclasses to define their specific content
 */
abstract class AbstractSummaryCard<P extends SummaryCardProps> extends Component<P> {
  /**
   * Get the config for this card type, with prop overrides
   */
  protected getCardConfig(): SummaryCardProps {
    const { cardType } = this.props;
    let baseConfig: Partial<SummaryCardProps> = {};
    
    // Get config from predefined types if cardType is provided
    if (cardType && summaryCardConfig[cardType]) {
      const typeConfig = summaryCardConfig[cardType];
      baseConfig = {
        title: typeConfig.title,
        icon: typeConfig.icon,
        cardColor: typeConfig.cardColor,
        valueColor: typeConfig.valueColor,
        className: typeConfig.cardClassName || commonCardStyles.card,
        style: { animationDelay: typeConfig.animationDelay }
      };
    }
    
    // Merge with props (props take precedence over config)
    return {
      ...baseConfig,
      ...this.props
    };
  }

  /**
   * Default implementation of renderCardValue that child classes can override
   * Provides consistent styling while allowing customization of content
   */
  protected renderCardValue(): React.ReactNode {
    const config = this.getCardConfig();
    const valueColor = config.valueColor || "text-foreground";
    
    return (
      <div className={`${commonCardStyles.value} ${valueColor} max-w-full`}>
        {config.value || this.getCardValueContent()}
      </div>
    );
  }
  
  /**
   * Abstract method that subclasses must implement to provide card-specific value content
   * This separates the content generation from the styling
   */
  protected abstract getCardValueContent(): React.ReactNode;
  
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
    const config = this.getCardConfig();
    const descriptionClassName = config.descriptionClassName || commonCardStyles.description;
    
    if (!content) return null;
    
    return (
      <div className={`${descriptionClassName} w-full overflow-hidden`}>
        {content}
      </div>
    );
  }
  
  /**
   * Renders the card with consistent styling and structure
   */
  render() {
    const config = this.getCardConfig();
    const title = config.title || "Summary";
    const Icon = config.icon;
    const cardColor = config.cardColor || "bg-card";
    const className = config.className || "";
    const style = config.style || {};
    
    return (
      <Card 
        className={`summary-card overflow-hidden ${cardColor} ${className}`}
        style={style}
      >
        <CardHeader className="pb-2 flex flex-col">
          {/* Title component with icon - use line-clamp for text overflow */}
          <CardDescription className={`${commonCardStyles.title} flex items-center w-full min-h-[24px]`}>
            {Icon && <span className="mr-1.5 flex-shrink-0">{createElement(Icon, { className: "h-4 w-4 text-primary" })}</span>}
            <span className="overflow-hidden text-ellipsis">{title}</span>
          </CardDescription>
          
          {/* Body component - value content with adaptive sizing */}
          <div className="mt-2 w-full min-h-[48px] flex items-center overflow-hidden">
            {this.renderCardValue()}
          </div>
        </CardHeader>
        
        {/* Footnote component - description with word wrapping */}
        <CardContent className="pt-0">
          <div className="min-h-[24px] w-full overflow-hidden">
            {this.renderCardDescription()}
          </div>
        </CardContent>
      </Card>
    );
  }
}

export default AbstractSummaryCard;

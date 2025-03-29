// src/components/dashboard/abstractions/AbstractCard.tsx
import React, { Component, createElement } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CSSProperties, ReactNode } from 'react';

/**
 * Base props interface for all card components
 */
export interface AbstractCardProps {
  title: string;
  icon?: React.ComponentType<any>; // Icon component (e.g., Lucide icon)
  className?: string;
  style?: CSSProperties;
}

/**
 * Abstract base class for all card components
 * Provides common structure and styling while allowing
 * subclasses to define their specific content
 */
abstract class AbstractCard<P extends AbstractCardProps> extends Component<P> {
  /**
   * Abstract method that subclasses must implement to provide card-specific content
   */
  protected abstract renderCardContent(): React.ReactNode;
  
  /**
   * Optional method subclasses can override to provide additional header content
   */
  protected renderHeaderActions(): React.ReactNode {
    return null;
  }
  
  /**
   * Optional method subclasses can override to customize the header title rendering
   */
  protected renderHeaderTitle(): React.ReactNode {
    const { title, icon: Icon } = this.props;
    
    return (
      <CardTitle className="text-xl flex items-center gap-2">
        {Icon && createElement(Icon, { className: "h-5 w-5 text-primary" })}
        {title}
      </CardTitle>
    );
  }
  
  /**
   * Renders the card with consistent styling and structure
   */
  render() {
    const { className = '', style } = this.props;
    
    return (
      <Card 
        className={`rounded-xl border border-border/50 bg-card hover:shadow-md transition-all ${className}`}
        style={style}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            {this.renderHeaderTitle()}
            {this.renderHeaderActions()}
          </div>
        </CardHeader>
        <CardContent>
          {this.renderCardContent()}
        </CardContent>
      </Card>
    );
  }
}

export default AbstractCard;

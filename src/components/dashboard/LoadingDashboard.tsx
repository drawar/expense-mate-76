// src/components/dashboard/LoadingDashboard.tsx
import React, { Component } from 'react';

/**
 * Component that displays a loading state for the dashboard
 * Uses skeleton loading pattern for better UX
 */
class LoadingDashboard extends Component {
  /**
   * Render the header skeleton
   */
  private renderHeaderSkeleton() {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10 mt-4">
        <div className="animate-pulse bg-muted h-10 w-48 rounded-md"></div>
        <div className="animate-pulse bg-muted h-10 w-32 rounded-md mt-4 sm:mt-0"></div>
      </div>
    );
  }
  
  /**
   * Render the card grid skeleton
   */
  private renderCardGridSkeleton() {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="animate-pulse bg-muted h-48 rounded-xl"></div>
        ))}
      </div>
    );
  }
  
  render() {
    return (
      <div className="min-h-screen">  
        <div className="container max-w-7xl mx-auto pb-16">
          {this.renderHeaderSkeleton()}
          {this.renderCardGridSkeleton()}
        </div>
      </div>
    );
  }
}

export default LoadingDashboard;

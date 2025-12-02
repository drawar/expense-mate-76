import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component to catch and handle errors in the component tree
 * Prevents entire application from crashing due to errors in a single component
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      error 
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error);
    console.error('Component stack:', errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="p-6 border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800/40 rounded-lg">
          <div className="flex items-center mb-4">
            <AlertTriangle 
              className="h-6 w-6 text-red-500 mr-2" 
              style={{ strokeWidth: 2.5 }}
            />
            <h3 className="text-lg font-medium text-red-800 dark:text-red-200">Something went wrong</h3>
          </div>
          <div className="text-red-600 dark:text-red-300">
            <p>We've encountered an error loading this component.</p>
            <p className="mt-2 text-sm font-mono bg-red-100 dark:bg-red-900/40 p-2 rounded overflow-auto">
              {this.state.error?.message || 'Unknown error'}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;

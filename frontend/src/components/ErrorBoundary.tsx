import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    });

    // Report error to monitoring service
    this.reportError(error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  reportError = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      // Get user context
      const userContext = this.getUserContext();

      // Report to backend error service
      await fetch("/api/errors/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          userId: userContext.userId,
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          errorId: this.state.errorId,
          context: {
            props: this.getSerializableProps(),
            state: this.getSerializableState(),
            userContext,
          },
        }),
      });
    } catch (reportError) {
      console.error("Failed to report error:", reportError);
    }
  };

  getUserContext = () => {
    try {
      // Try to get user context from localStorage or context
      const userString = localStorage.getItem("user");
      const user = userString ? JSON.parse(userString) : null;

      return {
        userId: user?.id || null,
        email: user?.email || null,
        role: user?.role || null,
        organization: user?.organization || null,
      };
    } catch {
      return {
        userId: null,
        email: null,
        role: null,
        organization: null,
      };
    }
  };

  getSerializableProps = () => {
    try {
      return JSON.parse(
        JSON.stringify(this.props, (_key, value) => {
          if (typeof value === "function") return "[Function]";
          if (typeof value === "object" && value !== null) {
            if (value instanceof Element) return "[DOM Element]";
            if (value instanceof Date) return value.toISOString();
          }
          return value;
        })
      );
    } catch {
      return "[Cannot serialize props]";
    }
  };

  getSerializableState = () => {
    try {
      return JSON.parse(
        JSON.stringify(this.state, (_key, value) => {
          if (typeof value === "function") return "[Function]";
          if (typeof value === "object" && value !== null) {
            if (value instanceof Element) return "[DOM Element]";
            if (value instanceof Date) return value.toISOString();
          }
          return value;
        })
      );
    } catch {
      return "[Cannot serialize state]";
    }
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  handleReportBug = () => {
    const { error, errorInfo, errorId } = this.state;
    const userContext = this.getUserContext();

    const bugReport = {
      errorId,
      message: error?.message || "Unknown error",
      stack: error?.stack || "No stack trace",
      componentStack: errorInfo?.componentStack || "No component stack",
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userContext,
    };

    // Copy to clipboard
    navigator.clipboard
      .writeText(JSON.stringify(bugReport, null, 2))
      .then(() => {
        alert(
          "Bug report copied to clipboard. Please paste it in your bug report."
        );
      });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            {/* Error Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </div>

            {/* Error Message */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Oops! Something went wrong
              </h1>
              <p className="text-gray-600 mb-4">
                We've encountered an unexpected error. Don't worry, we've been
                notified and are working on fixing it.
              </p>

              {/* Error ID */}
              {this.state.errorId && (
                <div className="bg-gray-100 rounded-md p-3 mb-4">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Error ID:</span>{" "}
                    {this.state.errorId}
                  </p>
                </div>
              )}

              {/* Error Details (for development) */}
              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="text-left bg-gray-100 rounded-md p-3 mb-4">
                  <summary className="font-medium text-gray-700 cursor-pointer">
                    Error Details (Development)
                  </summary>
                  <div className="mt-2 text-sm text-gray-600">
                    <p className="font-medium">Message:</p>
                    <p className="mb-2">{this.state.error.message}</p>

                    <p className="font-medium">Stack:</p>
                    <pre className="text-xs bg-gray-200 p-2 rounded overflow-x-auto">
                      {this.state.error.stack}
                    </pre>

                    {this.state.errorInfo && (
                      <>
                        <p className="font-medium mt-2">Component Stack:</p>
                        <pre className="text-xs bg-gray-200 p-2 rounded overflow-x-auto">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </>
                    )}
                  </div>
                </details>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </button>

              <div className="flex space-x-3">
                <button
                  onClick={this.handleGoHome}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors flex items-center justify-center"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </button>

                <button
                  onClick={this.handleReload}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors flex items-center justify-center"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload
                </button>
              </div>

              <button
                onClick={this.handleReportBug}
                className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center"
              >
                <Bug className="w-4 h-4 mr-2" />
                Report Bug
              </button>
            </div>

            {/* Help Text */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                If the problem persists, please contact our support team.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for functional components
export function withErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  return function WrappedComponent(props: T) {
    return (
      <ErrorBoundary fallback={fallback} onError={onError}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

// Hook for error reporting
export function useErrorHandler() {
  const reportError = React.useCallback(
    (error: Error, context?: Record<string, any>) => {
      try {
        // Get user context
        const userString = localStorage.getItem("user");
        const user = userString ? JSON.parse(userString) : null;

        // Report to backend
        fetch("/api/errors/report", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: error.message,
            stack: error.stack,
            userId: user?.id || null,
            userAgent: navigator.userAgent,
            url: window.location.href,
            timestamp: new Date().toISOString(),
            context: {
              ...context,
              userContext: {
                userId: user?.id || null,
                email: user?.email || null,
                role: user?.role || null,
                organization: user?.organization || null,
              },
            },
          }),
        });
      } catch (reportError) {
        console.error("Failed to report error:", reportError);
      }
    },
    []
  );

  return { reportError };
}

export default ErrorBoundary;

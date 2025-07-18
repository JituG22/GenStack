import React, { useState } from "react";
import { ErrorBoundary, PerformanceMonitor } from "../components";
import { Activity, AlertTriangle, Bug, Shield } from "lucide-react";

// Test component that can throw errors
const ErrorProneComponent: React.FC<{ shouldError: boolean }> = ({
  shouldError,
}) => {
  if (shouldError) {
    throw new Error("This is a test error to demonstrate error boundaries");
  }

  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
      <div className="flex items-center">
        <Shield className="w-5 h-5 text-green-600 mr-2" />
        <span className="text-green-800">Component is working correctly!</span>
      </div>
    </div>
  );
};

// Component that simulates performance issues
const PerformanceTestComponent: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  const simulateSlowOperation = () => {
    setIsLoading(true);
    // Simulate a slow operation
    setTimeout(() => {
      setIsLoading(false);
    }, 3000);
  };

  const simulateMemoryLeak = () => {
    // Create a large array to simulate memory usage
    const largeArray = new Array(1000000).fill("memory leak simulation");
    console.log("Created large array:", largeArray.length, "items");
  };

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h3 className="font-semibold text-blue-800 mb-3">
        Performance Test Component
      </h3>
      <div className="space-y-2">
        <button
          onClick={simulateSlowOperation}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? "Processing..." : "Simulate Slow Operation"}
        </button>
        <button
          onClick={simulateMemoryLeak}
          className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
        >
          Simulate Memory Usage
        </button>
      </div>
    </div>
  );
};

export const MonitoringDemo: React.FC = () => {
  const [shouldError, setShouldError] = useState(false);
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);

  const handleErrorTest = () => {
    setShouldError(true);
    // Reset after a short delay to test error boundary recovery
    setTimeout(() => setShouldError(false), 100);
  };

  const customErrorHandler = (error: Error, errorInfo: React.ErrorInfo) => {
    console.log("Custom error handler called:", error.message);
    console.log("Error info:", errorInfo);

    // You could send this to an analytics service here
    // analytics.track('error_boundary_triggered', {
    //   error: error.message,
    //   stack: error.stack,
    //   componentStack: errorInfo.componentStack
    // });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Error Boundary & Performance Monitoring Demo
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Error Boundary Demo */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <AlertTriangle className="w-6 h-6 mr-2 text-red-500" />
                Error Boundary Demo
              </h2>

              <div className="space-y-3">
                <button
                  onClick={handleErrorTest}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center"
                >
                  <Bug className="w-4 h-4 mr-2" />
                  Trigger Test Error
                </button>

                <ErrorBoundary
                  onError={customErrorHandler}
                  fallback={
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center">
                        <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                        <span className="text-red-800">
                          Custom fallback UI!
                        </span>
                      </div>
                    </div>
                  }
                >
                  <ErrorProneComponent shouldError={shouldError} />
                </ErrorBoundary>
              </div>
            </div>

            {/* Performance Monitor Demo */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <Activity className="w-6 h-6 mr-2 text-blue-500" />
                Performance Monitor Demo
              </h2>

              <div className="space-y-3">
                <button
                  onClick={() => setShowPerformanceMonitor(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Open Performance Monitor
                </button>

                <PerformanceTestComponent />
              </div>
            </div>
          </div>

          {/* Features List */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Features Implemented
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">
                  Error Boundary
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Catches JavaScript errors in component tree</li>
                  <li>• Provides fallback UI with error details</li>
                  <li>• Reports errors to backend monitoring service</li>
                  <li>• Includes user context and environment info</li>
                  <li>• Supports custom error handlers</li>
                  <li>• HOC wrapper for functional components</li>
                  <li>• Hook for manual error reporting</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-2">
                  Performance Monitor
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Real-time performance metrics</li>
                  <li>• Browser performance API integration</li>
                  <li>• Memory usage tracking</li>
                  <li>• Page load time monitoring</li>
                  <li>• Alert system for threshold breaches</li>
                  <li>• Auto-refresh with configurable intervals</li>
                  <li>• Visual trend indicators</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Usage Examples */}
          <div className="mt-6 bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Usage Examples
            </h3>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">
                  Error Boundary Usage
                </h4>
                <pre className="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto">
                  {`// Wrap components with error boundary
<ErrorBoundary
  onError={(error, errorInfo) => {
    console.error('Error caught:', error);
    // Report to analytics
  }}
>
  <YourComponent />
</ErrorBoundary>

// Or use HOC
const SafeComponent = withErrorBoundary(YourComponent);

// Manual error reporting
const { reportError } = useErrorHandler();
reportError(new Error('Custom error'), { context: 'user-action' });`}
                </pre>
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-2">
                  Performance Monitor Usage
                </h4>
                <pre className="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto">
                  {`// Add to your app
const [showMonitor, setShowMonitor] = useState(false);

<PerformanceMonitor
  isOpen={showMonitor}
  onClose={() => setShowMonitor(false)}
  autoRefresh={true}
  refreshInterval={5000}
/>`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Monitor Modal */}
      <PerformanceMonitor
        isOpen={showPerformanceMonitor}
        onClose={() => setShowPerformanceMonitor(false)}
        autoRefresh={true}
        refreshInterval={5000}
      />
    </div>
  );
};

export default MonitoringDemo;

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('ErrorBoundary caught error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.group('Error Boundary');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();
    this.setState({ errorInfo });
  }

  handleReset = () => {
    console.log('Resetting error boundary');
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="min-h-screen bg-terminal-dark flex items-center justify-center p-8">
          <div className="max-w-2xl w-full bg-terminal-panel border border-terminal-border rounded-lg p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-red-500/20 rounded-full">
                <AlertTriangle className="text-red-500" size={32} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
                <p className="text-terminal-muted text-sm">The application encountered an error</p>
              </div>
            </div>

            <div className="bg-black/50 border border-terminal-border rounded p-4 mb-6">
              <div className="text-xs text-red-400 font-mono">
                <div className="font-bold mb-2">Error:</div>
                {this.state.error?.message}
              </div>

              {this.state.errorInfo && (
                <details className="mt-4">
                  <summary className="text-xs text-terminal-muted cursor-pointer hover:text-white">
                    Show details
                  </summary>
                  <pre className="text-[10px] text-terminal-muted mt-2 overflow-auto max-h-64">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>

            <button
              onClick={this.handleReset}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-terminal-accent text-white font-bold rounded hover:bg-red-600 transition-colors"
            >
              <RefreshCw size={16} />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

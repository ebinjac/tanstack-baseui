/**
 * Error Boundary Components
 *
 * Reusable error boundaries for graceful error handling.
 * Follows React best practices for error handling.
 *
 * @see skills/react-best-practices/rules/err-boundaries.md
 */

import { AlertTriangle, ArrowLeft, Home, RefreshCw } from "lucide-react";
import type { ErrorInfo, ReactNode } from "react";
import { Component } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
  resetKeys?: Array<unknown>;
}

export interface ErrorFallbackProps {
  className?: string;
  error: Error;
  message?: string;
  resetErrorBoundary: () => void;
  showBackLink?: boolean;
  showHomeLink?: boolean;
  title?: string;
}

// ============================================================================
// Error Fallback Component
// ============================================================================

export function ErrorFallback({
  error,
  resetErrorBoundary,
  title = "Something went wrong",
  message,
  showHomeLink = false,
  showBackLink = true,
  className,
}: ErrorFallbackProps) {
  const displayMessage =
    message || error.message || "An unexpected error occurred";

  return (
    <div className={cn("flex items-center justify-center p-8", className)}>
      <Card className="w-full max-w-lg border-destructive/20 bg-card/50 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground text-sm">
            {displayMessage}
          </p>

          {process.env.NODE_ENV === "development" && (
            <details className="rounded-lg bg-muted/50 p-3 text-muted-foreground text-xs">
              <summary className="cursor-pointer font-medium">
                Error Details
              </summary>
              <pre className="mt-2 overflow-auto whitespace-pre-wrap">
                {error.stack}
              </pre>
            </details>
          )}

          <div className="flex flex-col justify-center gap-2 sm:flex-row">
            <Button className="gap-2" onClick={resetErrorBoundary}>
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>

            {showBackLink && (
              <Button
                className="gap-2"
                onClick={() => window.history.back()}
                variant="outline"
              >
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </Button>
            )}

            {showHomeLink && (
              <a
                className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-input bg-background px-4 py-2 font-medium text-sm ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                href="/"
              >
                <Home className="h-4 w-4" />
                Home
              </a>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// Error Boundary Class Component
// ============================================================================

interface ErrorBoundaryState {
  error: Error | null;
  hasError: boolean;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.onError?.(error, errorInfo);

    // Log error in development
    if (process.env.NODE_ENV === "development") {
      console.error("Error caught by boundary:", error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys } = this.props;
    const { hasError } = this.state;

    if (
      hasError &&
      resetKeys &&
      prevProps.resetKeys &&
      resetKeys.some((key, i) => key !== prevProps.resetKeys?.[i])
    ) {
      this.reset();
    }
  }

  reset = () => {
    this.props.onReset?.();
    this.setState({ hasError: false, error: null });
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      if (fallback) {
        return fallback;
      }

      return <ErrorFallback error={error} resetErrorBoundary={this.reset} />;
    }

    return children;
  }
}

// ============================================================================
// Tool-Specific Error Boundaries
// ============================================================================

/**
 * Error boundary for Scorecard tool
 */
export function ScorecardErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <ErrorFallback
          error={new Error("Failed to load scorecard")}
          message="Unable to load scorecard data. Please try again."
          resetErrorBoundary={() => window.location.reload()}
          showHomeLink
          title="Scorecard Error"
        />
      }
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Error boundary for Turnover tool
 */
export function TurnoverErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <ErrorFallback
          error={new Error("Failed to load turnover")}
          message="Unable to load turnover data. Please try again."
          resetErrorBoundary={() => window.location.reload()}
          showHomeLink
          title="Turnover Error"
        />
      }
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Error boundary for Link Manager tool
 */
export function LinkManagerErrorBoundary({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ErrorBoundary
      fallback={
        <ErrorFallback
          error={new Error("Failed to load links")}
          message="Unable to load link data. Please try again."
          resetErrorBoundary={() => window.location.reload()}
          showHomeLink
          title="Link Manager Error"
        />
      }
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Error boundary for Admin pages
 */
export function AdminErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <ErrorFallback
          error={new Error("Failed to load admin data")}
          message="Unable to load admin data. Please try again."
          resetErrorBoundary={() => window.location.reload()}
          showHomeLink
          title="Admin Error"
        />
      }
    >
      {children}
    </ErrorBoundary>
  );
}

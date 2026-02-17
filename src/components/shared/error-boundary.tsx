/**
 * Error Boundary Components
 * 
 * Reusable error boundaries for graceful error handling.
 * Follows React best practices for error handling.
 * 
 * @see skills/react-best-practices/rules/err-boundaries.md
 */

import { Component, type ReactNode, type ErrorInfo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

export interface ErrorBoundaryProps {
    children: ReactNode
    fallback?: ReactNode
    onError?: (error: Error, errorInfo: ErrorInfo) => void
    onReset?: () => void
    resetKeys?: unknown[]
}

export interface ErrorFallbackProps {
    error: Error
    resetErrorBoundary: () => void
    title?: string
    message?: string
    showHomeLink?: boolean
    showBackLink?: boolean
    className?: string
}

// ============================================================================
// Error Fallback Component
// ============================================================================

export function ErrorFallback({
    error,
    resetErrorBoundary,
    title = 'Something went wrong',
    message,
    showHomeLink = false,
    showBackLink = true,
    className,
}: ErrorFallbackProps) {
    const displayMessage = message || error.message || 'An unexpected error occurred'

    return (
        <div className={cn('flex items-center justify-center p-8', className)}>
            <Card className="max-w-lg w-full bg-card/50 backdrop-blur-sm border-destructive/20">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                        <AlertTriangle className="h-8 w-8 text-destructive" />
                    </div>
                    <CardTitle className="text-xl">{title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground text-center">
                        {displayMessage}
                    </p>
                    
                    {process.env.NODE_ENV === 'development' && (
                        <details className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                            <summary className="cursor-pointer font-medium">
                                Error Details
                            </summary>
                            <pre className="mt-2 whitespace-pre-wrap overflow-auto">
                                {error.stack}
                            </pre>
                        </details>
                    )}
                    
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                        <Button
                            onClick={resetErrorBoundary}
                            className="gap-2"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Try Again
                        </Button>
                        
                        {showBackLink && (
                            <Button
                                variant="outline"
                                onClick={() => window.history.back()}
                                className="gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Go Back
                            </Button>
                        )}
                        
                        {showHomeLink && (
                            <a
                                href="/"
                                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                            >
                                <Home className="h-4 w-4" />
                                Home
                            </a>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

// ============================================================================
// Error Boundary Class Component
// ============================================================================

interface ErrorBoundaryState {
    hasError: boolean
    error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.props.onError?.(error, errorInfo)
        
        // Log error in development
        if (process.env.NODE_ENV === 'development') {
            console.error('Error caught by boundary:', error, errorInfo)
        }
    }

    componentDidUpdate(prevProps: ErrorBoundaryProps) {
        const { resetKeys } = this.props
        const { hasError } = this.state
        
        if (hasError && resetKeys && prevProps.resetKeys) {
            if (resetKeys.some((key, i) => key !== prevProps.resetKeys?.[i])) {
                this.reset()
            }
        }
    }

    reset = () => {
        this.props.onReset?.()
        this.setState({ hasError: false, error: null })
    }

    render() {
        const { hasError, error } = this.state
        const { children, fallback } = this.props

        if (hasError && error) {
            if (fallback) {
                return fallback
            }
            
            return (
                <ErrorFallback
                    error={error}
                    resetErrorBoundary={this.reset}
                />
            )
        }

        return children
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
                    error={new Error('Failed to load scorecard')}
                    resetErrorBoundary={() => window.location.reload()}
                    title="Scorecard Error"
                    message="Unable to load scorecard data. Please try again."
                    showHomeLink
                />
            }
        >
            {children}
        </ErrorBoundary>
    )
}

/**
 * Error boundary for Turnover tool
 */
export function TurnoverErrorBoundary({ children }: { children: ReactNode }) {
    return (
        <ErrorBoundary
            fallback={
                <ErrorFallback
                    error={new Error('Failed to load turnover')}
                    resetErrorBoundary={() => window.location.reload()}
                    title="Turnover Error"
                    message="Unable to load turnover data. Please try again."
                    showHomeLink
                />
            }
        >
            {children}
        </ErrorBoundary>
    )
}

/**
 * Error boundary for Link Manager tool
 */
export function LinkManagerErrorBoundary({ children }: { children: ReactNode }) {
    return (
        <ErrorBoundary
            fallback={
                <ErrorFallback
                    error={new Error('Failed to load links')}
                    resetErrorBoundary={() => window.location.reload()}
                    title="Link Manager Error"
                    message="Unable to load link data. Please try again."
                    showHomeLink
                />
            }
        >
            {children}
        </ErrorBoundary>
    )
}

/**
 * Error boundary for Admin pages
 */
export function AdminErrorBoundary({ children }: { children: ReactNode }) {
    return (
        <ErrorBoundary
            fallback={
                <ErrorFallback
                    error={new Error('Failed to load admin data')}
                    resetErrorBoundary={() => window.location.reload()}
                    title="Admin Error"
                    message="Unable to load admin data. Please try again."
                    showHomeLink
                />
            }
        >
            {children}
        </ErrorBoundary>
    )
}
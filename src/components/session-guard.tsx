// components/session-guard.tsx
// Centralized session initialization guard that handles loading and error states globally

import { useEffect, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { AlertTriangle, Database, Layers, RefreshCw } from 'lucide-react'
import { useAuthBlueSSO } from './use-authblue-sso'
import type { SessionData } from '@/lib/auth/config'
import { loginUser } from '@/app/ssr/auth'

type SessionStatus = 'idle' | 'loading' | 'success' | 'error'

interface SessionGuardProps {
  session: SessionData | null
  children: React.ReactNode
}

export function SessionGuard({ session, children }: SessionGuardProps) {
  const ssoUser = useAuthBlueSSO()
  const router = useRouter()

  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [hasAttemptedInit, setHasAttemptedInit] = useState(false)
  const [ssoReady, setSsoReady] = useState(false)

  // Track when SSO hook has resolved (either with user or determined no user)
  useEffect(() => {
    // Give the SSO hook a brief moment to initialize
    // If we already have a session, SSO isn't needed
    if (session) {
      setSsoReady(true)
      return
    }

    // Wait a tiny bit for SSO hook to resolve, then mark as ready
    const timer = setTimeout(() => {
      setSsoReady(true)
    }, 50) // Small delay to allow SSO hook to resolve

    return () => clearTimeout(timer)
  }, [session])

  // Determine if we need to show loading state
  // Show loading if:
  // 1. SSO not ready yet (waiting for SSO hook) and no session
  // 2. We have SSO user but no session, and we haven't errored out yet
  const waitingForSSO = !session && !ssoReady
  const needsSessionInit =
    !session &&
    ssoUser &&
    sessionStatus !== 'error' &&
    sessionStatus !== 'success'
  const isLoading =
    sessionStatus === 'loading' || needsSessionInit || waitingForSSO

  // Session initialization effect
  useEffect(() => {
    const initSession = async () => {
      // Only initialize if we don't have a session but we have SSO user data
      if (!session && ssoUser && !hasAttemptedInit) {
        setHasAttemptedInit(true)
        setSessionStatus('loading')
        setErrorMessage(null)
        try {
          await loginUser({ data: ssoUser })
          setSessionStatus('success')
          router.invalidate()
        } catch (error) {
          console.error('Failed to create session:', error)
          setSessionStatus('error')
          // Extract meaningful error message
          if (error instanceof Error) {
            if (
              error.message.includes('Failed query') ||
              error.message.includes('database')
            ) {
              setErrorMessage(
                'Unable to connect to the Faze database. Please try again later or contact support if the issue persists.',
              )
            } else {
              setErrorMessage(
                error.message ||
                  'An unexpected error occurred while establishing your session.',
              )
            }
          } else {
            setErrorMessage(
              'An unexpected error occurred while establishing your session.',
            )
          }
        }
      }
    }

    initSession()
  }, [session, ssoUser, router, hasAttemptedInit])

  // Reset hasAttemptedInit when retryCount changes (for retry functionality)
  useEffect(() => {
    if (retryCount > 0) {
      setHasAttemptedInit(false)
      setSessionStatus('idle')
    }
  }, [retryCount])

  // Handler to retry session initialization
  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
  }

  // Show loading screen while session is being initialized
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="fixed inset-0 pointer-events-none -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-background to-background" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center gap-8 max-w-md text-center px-6"
        >
          {/* Animated Logo */}
          <div className="relative w-24 h-24">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary"
            />
            <div className="absolute inset-2 bg-gradient-to-br from-primary/10 to-transparent rounded-full flex items-center justify-center">
              <Layers className="w-10 h-10 text-primary" />
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight">
              Initializing Session
            </h2>
            <p className="text-muted-foreground">
              Connecting to Ensemble and verifying your permissions...
            </p>
          </div>

          {/* Loading dots */}
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
                className="w-3 h-3 rounded-full bg-primary"
              />
            ))}
          </div>
        </motion.div>
      </div>
    )
  }

  // Show error screen if session initialization failed
  if (sessionStatus === 'error') {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="fixed inset-0 pointer-events-none -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/10 via-background to-background" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center gap-8 max-w-lg text-center px-6"
        >
          {/* Error Icon */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Database className="w-12 h-12 text-red-500" />
              </motion.div>
            </div>
            <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-red-500 flex items-center justify-center shadow-lg">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight text-red-500">
              Connection Failed
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {errorMessage}
            </p>
          </div>

          {/* Status Card */}
          <div className="w-full bg-card border border-border/50 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-left">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-medium">
                Database Service:{' '}
                <span className="text-red-500">Unavailable</span>
              </span>
            </div>
            <div className="border-t border-border/50 pt-4">
              <p className="text-xs text-muted-foreground">
                The Faze database is currently unreachable. This is required to
                establish your session and load team permissions.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <button
              onClick={handleRetry}
              className="flex-1 h-12 px-6 rounded-xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            <a
              href="mailto:support@ensemble.amex.com"
              className="flex-1 h-12 px-6 rounded-xl bg-secondary text-secondary-foreground font-medium flex items-center justify-center gap-2 hover:bg-secondary/80 transition-colors border border-border/50"
            >
              Contact Support
            </a>
          </div>
        </motion.div>
      </div>
    )
  }

  // Session is available or not required, render children normally
  return <>{children}</>
}

// components/session-guard.tsx
// Centralized session initialization guard that handles loading and error states globally

import { useRouter } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { AlertTriangle, Database, Layers, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { loginUser } from "@/app/ssr/auth";
import type { SessionData } from "@/lib/auth/config";
import { useAuthBlueSSO } from "./use-authblue-sso";

type SessionStatus = "idle" | "loading" | "success" | "error";

interface SessionGuardProps {
  children: React.ReactNode;
  session: SessionData | null;
}

export function SessionGuard({ session, children }: SessionGuardProps) {
  const ssoUser = useAuthBlueSSO();
  const router = useRouter();

  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [hasAttemptedInit, setHasAttemptedInit] = useState(false);
  const [ssoReady, setSsoReady] = useState(false);

  // Track when SSO hook has resolved (either with user or determined no user)
  useEffect(() => {
    // Give the SSO hook a brief moment to initialize
    // If we already have a session, SSO isn't needed
    if (session) {
      setSsoReady(true);
      return;
    }

    // Wait a tiny bit for SSO hook to resolve, then mark as ready
    const timer = setTimeout(() => {
      setSsoReady(true);
    }, 50); // Small delay to allow SSO hook to resolve

    return () => clearTimeout(timer);
  }, [session]);

  // Determine if we need to show loading state
  // Show loading if:
  // 1. SSO not ready yet (waiting for SSO hook) and no session
  // 2. We have SSO user but no session, and we haven't errored out yet
  const waitingForSSO = !(session || ssoReady);
  const needsSessionInit =
    !session &&
    ssoUser &&
    sessionStatus !== "error" &&
    sessionStatus !== "success";
  const isLoading =
    sessionStatus === "loading" || needsSessionInit || waitingForSSO;

  // Session initialization effect
  useEffect(() => {
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: session init requires nested error handling
    const initSession = async () => {
      // Only initialize if we don't have a session but we have SSO user data
      if (!session && ssoUser && !hasAttemptedInit) {
        setHasAttemptedInit(true);
        setSessionStatus("loading");
        setErrorMessage(null);
        try {
          await loginUser({ data: ssoUser });
          setSessionStatus("success");
          router.invalidate();
        } catch (error) {
          console.error("Failed to create session:", error);
          setSessionStatus("error");
          // Extract meaningful error message
          if (error instanceof Error) {
            if (
              error.message.includes("Failed query") ||
              error.message.includes("database")
            ) {
              setErrorMessage(
                "Unable to connect to the Faze database. Please try again later or contact support if the issue persists."
              );
            } else {
              setErrorMessage(
                error.message ||
                  "An unexpected error occurred while establishing your session."
              );
            }
          } else {
            setErrorMessage(
              "An unexpected error occurred while establishing your session."
            );
          }
        }
      }
    };

    initSession();
  }, [session, ssoUser, router, hasAttemptedInit]);

  // Reset hasAttemptedInit when retryCount changes (for retry functionality)
  useEffect(() => {
    if (retryCount > 0) {
      setHasAttemptedInit(false);
      setSessionStatus("idle");
    }
  }, [retryCount]);

  // Handler to retry session initialization
  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
  };

  // Show loading screen while session is being initialized
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-background to-background" />

        <motion.div
          animate={{ opacity: 1, scale: 1 }}
          className="flex max-w-md flex-col items-center gap-8 px-6 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.5 }}
        >
          {/* Animated Logo */}
          <div className="relative h-24 w-24">
            <motion.div
              animate={{ rotate: 360 }}
              className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary"
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
            />
            <div className="absolute inset-2 flex items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-transparent">
              <Layers className="h-10 w-10 text-primary" />
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="font-bold text-2xl tracking-tight">
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
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                className="h-3 w-3 rounded-full bg-primary"
                key={i}
                transition={{
                  duration: 1,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // Show error screen if session initialization failed
  if (sessionStatus === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/10 via-background to-background" />

        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="flex max-w-lg flex-col items-center gap-8 px-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
        >
          {/* Error Icon */}
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-500/10">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              >
                <Database className="h-12 w-12 text-red-500" />
              </motion.div>
            </div>
            <div className="absolute -top-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 shadow-lg">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="font-bold text-2xl text-red-500 tracking-tight">
              Connection Failed
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {errorMessage}
            </p>
          </div>

          {/* Status Card */}
          <div className="w-full space-y-4 rounded-2xl border border-border/50 bg-card p-6">
            <div className="flex items-center gap-3 text-left">
              <div className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
              <span className="font-medium text-sm">
                Database Service:{" "}
                <span className="text-red-500">Unavailable</span>
              </span>
            </div>
            <div className="border-border/50 border-t pt-4">
              <p className="text-muted-foreground text-xs">
                The Faze database is currently unreachable. This is required to
                establish your session and load team permissions.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex w-full flex-col gap-4 sm:flex-row">
            <button
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90"
              onClick={handleRetry}
              type="button"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
            <a
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-border/50 bg-secondary px-6 font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
              href="mailto:support@ensemble.amex.com"
            >
              Contact Support
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  // Session is available or not required, render children normally
  return <>{children}</>;
}

import { useRouter, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";

/**
 * GlobalNavigationProgress
 *
 * A slim progress bar that appears at the very top of the viewport during
 * route transitions. Uses TanStack Router's `status` to determine visibility
 * and framer-motion for smooth animation.
 *
 * Mount once inside <ThemeProvider> in __root.tsx so it picks up CSS vars.
 */
export function GlobalNavigationProgress() {
  const isLoading = useRouterState({ select: (s) => s.status === "pending" });
  const router = useRouter();
  const progressRef = useRef(0);

  // Subscribe to router events to ensure we catch every navigation
  useEffect(() => {
    const unsub1 = router.subscribe("onBeforeNavigate", () => {
      progressRef.current = 0;
    });
    const unsub2 = router.subscribe("onResolved", () => {
      progressRef.current = 0;
    });
    return () => {
      unsub1();
      unsub2();
    };
  }, [router]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          animate={{ opacity: 1 }}
          className="pointer-events-none fixed top-0 right-0 left-0 z-[9999] h-[2px]"
          exit={{ opacity: 0, transition: { duration: 0.3, delay: 0.1 } }}
          initial={{ opacity: 0 }}
        >
          {/* Track */}
          <div className="relative h-full w-full overflow-hidden bg-primary/10">
            {/* Indeterminate bar */}
            <motion.div
              animate={{
                x: ["0%", "100%"],
                width: ["0%", "60%", "20%"],
              }}
              className="absolute inset-y-0 left-0 rounded-full bg-primary shadow-[0_0_8px_2px] shadow-primary/50"
              style={{ width: "40%" }}
              transition={{
                duration: 1.4,
                ease: "easeInOut",
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "loop",
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

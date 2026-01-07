// app/components/AuthSync.tsx
import { useEffect, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { useAuthBlueSSO } from "./use-authblue-sso";
import { loginUser } from "@/app/ssr/auth";

export function AuthSync() {
    const ssoUser = useAuthBlueSSO();
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // 1. Wait until the hook actually provides a user
        if (!ssoUser) return;

        const syncSession = async () => {
            try {
                console.log("🔄 Syncing SSO Session with Server...");

                // 2. Send client SSO data to Server Function to create HttpOnly cookie
                await loginUser({ data: ssoUser });

                // 3. Invalidate the router. 
                // This forces TanStack Router to re-run 'beforeLoad', 
                // finding the new cookie and rendering the actual page.
                await router.invalidate();
            } catch (err) {
                console.error("Session Sync Failed", err);
                setError("Failed to synchronize session permissions.");
            }
        };

        syncSession();
    }, [ssoUser, router]);

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center text-red-500">
                {error}
            </div>
        );
    }

    // Show a minimalist loading state while the handshake happens
    return (
        <div className="flex h-screen items-center justify-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-900 border-t-transparent" />
            <span className="text-sm font-medium text-gray-600">
                Verifying Ensemble Permissions...
            </span>
        </div>
    );
}
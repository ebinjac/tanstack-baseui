import { useEffect, useState } from "react";
import type { SSOUser } from "@/lib/zod/auth.schema";

// Mock SSO user data for development
const mockSSOUser: SSOUser = {
  attributes: {
    firstName: "Ensemble",
    lastName: "Test",
    fullName: "Ensemble Test",
    adsId: "ensemble",
    guid: "@fca9376056149663519865855188315",
    employeeId: "8229989",
    email: "ensemble.tester-test@gmail.com",
  },
  groups: ["SSO_ENSEMBLE_E1"],
};

export function useAuthBlueSSO() {
  const [user, setUser] = useState<SSOUser | null>(null);

  useEffect(() => {
    // Simulate SSO callback delay
    const timer = setTimeout(() => {
      if (process.env.NODE_ENV === "development") {
        setUser(mockSSOUser);
      }
      // In production, real SSO data would be fetched here
    }, 10);

    return () => clearTimeout(timer);
  }, []);

  return user;
}

"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const AuthWrapper = ({ children }) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const handleAuthFlow = async () => {
      console.log("AuthWrapper: Status:", status, "Session:", session);

      // If still loading, wait
      if (status === "loading") {
        return;
      }

      // If not authenticated, allow access to auth page, redirect others to auth
      if (status === "unauthenticated") {
        if (window.location.pathname !== "/auth") {
          console.log(
            "AuthWrapper: User not authenticated, redirecting to /auth"
          );
          router.push("/auth");
        }
        setIsChecking(false);
        return;
      }

      // If authenticated, handle routing based on session data
      if (status === "authenticated" && session) {
        console.log("AuthWrapper: User authenticated, checking routing");

        // If user is on auth page, redirect them away
        if (window.location.pathname === "/auth") {
          console.log(
            "AuthWrapper: Authenticated user on auth page, redirecting"
          );
          if (session.user?.onboardingCompleted) {
            router.push("/dashboard");
          } else {
            router.push("/onboarding");
          }
          setIsChecking(false);
          return;
        }
        if (session.user?.role === "admin" || session.user?.role === "super_admin") {
          router.push("/admin/dashboard");
        }

        // Check onboarding status for other pages
        if (session.user?.onboardingCompleted) {
          // User has completed onboarding, allow access to all protected pages
          // No need to redirect - let them access any page they want
        } else {
          // User hasn't completed onboarding, redirect to onboarding
          if (window.location.pathname !== "/onboarding") {
            console.log(
              "AuthWrapper: Onboarding not completed, redirecting to /onboarding"
            );
            router.push("/onboarding");
          }
        }
      }

      setIsChecking(false);
    };

    handleAuthFlow();
  }, [status, session, router]);

  // Show loading while checking authentication and onboarding status
  if (status === "loading" || isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-200 via-purple-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, only render children if on auth page
  if (status === "unauthenticated") {
    if (window.location.pathname === "/auth") {
      return children;
    }
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-200 via-purple-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // If authenticated, render children
  return children;
};

export default AuthWrapper;

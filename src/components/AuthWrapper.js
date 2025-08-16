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
        return;
      }

      // If authenticated, redirect away from auth page and check onboarding status
      if (status === "authenticated" && session) {
        // If user is on auth page, redirect them away
        if (window.location.pathname === "/auth") {
          console.log(
            "AuthWrapper: Authenticated user on auth page, redirecting"
          );
          try {
            const sessionResponse = await fetch("/api/auth/session");
            if (sessionResponse.ok) {
              const sessionData = await sessionResponse.json();

              // Check if session response is empty object and log out user
              if (sessionData && Object.keys(sessionData).length === 0) {
                console.log(
                  "AuthWrapper: Empty session response, logging out user"
                );
                await signOut({ redirect: false });
                router.push("/auth");
                return;
              }

              if (sessionData.user?.onboardingCompleted) {
                router.push("/dashboard");
              } else {
                router.push("/onboarding");
              }
            } else {
              router.push("/onboarding");
            }
          } catch (error) {
            console.error("AuthWrapper: Error checking session:", error);
            router.push("/onboarding");
          }
          return;
        }

        try {
          console.log(
            "AuthWrapper: User authenticated, checking onboarding status"
          );
          // Fetch fresh session data to ensure we have the latest onboarding status
          const sessionResponse = await fetch("/api/auth/session");
          if (sessionResponse.ok) {
            const sessionData = await sessionResponse.json();
            console.log("AuthWrapper: Session data:", sessionData);

            if (sessionData && Object.keys(sessionData).length === 0) {
              console.log(
                "AuthWrapper: Empty session response, logging out user"
              );
              await signOut({ redirect: false });
              router.push("/auth");
              return;
            }

            if (sessionData.user?.onboardingCompleted) {
              // User has completed onboarding, redirect to dashboard
              if (window.location.pathname !== "/dashboard") {
                console.log(
                  "AuthWrapper: Onboarding completed, redirecting to /dashboard"
                );
                router.push("/dashboard");
              }
            } else {
              // User hasn't completed onboarding, redirect to onboarding
              if (window.location.pathname !== "/onboarding") {
                console.log(
                  "AuthWrapper: Onboarding not completed, redirecting to /onboarding"
                );
                router.push("/onboarding");
              }
            }
          } else {
            // Fallback: if session fetch fails, redirect to onboarding
            console.log(
              "AuthWrapper: Session fetch failed, redirecting to /onboarding"
            );
            if (window.location.pathname !== "/onboarding") {
              router.push("/onboarding");
            }
          }
        } catch (error) {
          console.error("AuthWrapper: Error checking session:", error);
          // Fallback: if error occurs, redirect to onboarding
          if (window.location.pathname !== "/onboarding") {
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
    return null;
  }

  // If authenticated, render children
  return children;
};

export default AuthWrapper;

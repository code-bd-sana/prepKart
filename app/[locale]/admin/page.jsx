"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import * as React from "react";

export default function AdminDashboardPage({ params }) {
  const router = useRouter();
  const { locale } = React.use(params);

  // Get Redux state
  const authState = useSelector((state) => state.auth);
  const { user, isAuthenticated, loading: authLoading } = authState;
  const [pageLoading, setPageLoading] = useState(true);

  // Check admin status
  const isAdmin = user?.tier === "tier3" || user?.tier === "admin";

  useEffect(() => {
    // Early return if still loading
    if (authLoading) {
      // console.log("Auth still loading...");
      return;
    }

    // Handle authentication and admin checks
    let shouldRedirect = false;
    let redirectPath = `/${locale}/login`;

    if (!isAuthenticated) {
      // Check localStorage
      const storedUser = localStorage.getItem("user");
      const token =
        localStorage.getItem("token") || localStorage.getItem("accessToken");

      if (storedUser && token) {
        try {
          const parsedUser = JSON.parse(storedUser);
          // console.log("Parsed user:", parsedUser);

          // Check if this user is admin
          if (parsedUser.tier === "tier3" || parsedUser.tier === "admin") {
          } else {
            shouldRedirect = true;
            redirectPath = `/${locale}`;
          }
        } catch (error) {
          console.error("Failed to parse localStorage user:", error);
          shouldRedirect = true;
        }
      } else {
        shouldRedirect = true;
      }
    } else if (!user) {
      shouldRedirect = true;
    } else if (!isAdmin) {
      shouldRedirect = true;
      redirectPath = `/${locale}`;
    }

    // Perform redirect if needed
    if (shouldRedirect) {
      console.log(`Redirecting to: ${redirectPath}`);
      router.push(redirectPath);
      return;
    }
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 0);

    return () => clearTimeout(timer);
  }, [isAuthenticated, user, authLoading, locale, router, authState, isAdmin]);

  if (authLoading || pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking admin access...</p>
          <p className="text-sm text-gray-500 mt-2">
            Redux: {isAuthenticated ? "Authenticated" : "Not authenticated"}
            <br />
            User tier: {user?.tier || "None"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 ml-64">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="bg-green-50 border border-green-100 rounded-xl p-6 mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="text-center p-4 bg-white rounded-lg">
            <div className="text-xl font-bold">User: {user?.email}</div>
            <div className="text-sm text-gray-600">Email</div>
          </div>
        </div>
      </div>
    </div>
  );
}

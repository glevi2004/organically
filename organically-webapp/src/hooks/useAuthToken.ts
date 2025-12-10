"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useCallback } from "react";

/**
 * Hook to get the current user's Firebase ID token for Server Actions
 *
 * Usage:
 * ```tsx
 * const { getToken } = useAuthToken();
 *
 * const handlePublish = async () => {
 *   const token = await getToken();
 *   if (!token) return;
 *   const result = await publishToInstagram(token, postId, orgId);
 * };
 * ```
 */
export function useAuthToken() {
  const { user } = useAuth();

  const getToken = useCallback(async (): Promise<string | null> => {
    if (!user) {
      console.warn("[useAuthToken] No user logged in");
      return null;
    }

    try {
      return await user.getIdToken();
    } catch (error) {
      console.error("[useAuthToken] Failed to get token:", error);
      return null;
    }
  }, [user]);

  return {
    getToken,
    isAuthenticated: !!user,
  };
}


"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Profile } from "@/types/profile";
import {
  getUserProfiles,
  createProfile as createProfileService,
} from "@/services/profileService";
import { uploadProfileImage } from "@/services/imageUploadService";
import { useAuth } from "./AuthContext";

interface ProfileContextType {
  activeProfile: Profile | null;
  profiles: Profile[];
  loading: boolean;
  error: Error | null;
  setActiveProfile: (profileId: string) => Promise<void>;
  createProfile: (data: { name: string; imageFile?: File }) => Promise<string>;
  refreshProfiles: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType>({
  activeProfile: null,
  profiles: [],
  loading: true,
  error: null,
  setActiveProfile: async () => {},
  createProfile: async () => "",
  refreshProfiles: async () => {},
});

const ACTIVE_PROFILE_KEY = "organically_active_profile";

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [activeProfile, setActiveProfileState] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load profiles when user is authenticated
  useEffect(() => {
    async function loadProfiles() {
      if (authLoading) return;

      if (!user) {
        setProfiles([]);
        setActiveProfileState(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const userProfiles = await getUserProfiles(user.uid);
        setProfiles(userProfiles);

        // Try to restore active profile from localStorage
        const savedProfileId =
          typeof window !== "undefined"
            ? localStorage.getItem(ACTIVE_PROFILE_KEY)
            : null;

        if (savedProfileId) {
          const savedProfile = userProfiles.find(
            (p) => p.id === savedProfileId
          );
          if (savedProfile) {
            setActiveProfileState(savedProfile);
          } else if (userProfiles.length > 0) {
            // If saved profile not found, use first profile
            setActiveProfileState(userProfiles[0]);
            localStorage.setItem(ACTIVE_PROFILE_KEY, userProfiles[0].id);
          }
        } else if (userProfiles.length > 0) {
          // No saved profile, use first one
          setActiveProfileState(userProfiles[0]);
          localStorage.setItem(ACTIVE_PROFILE_KEY, userProfiles[0].id);
        }
      } catch (err) {
        console.error("Error loading profiles:", err);
        setError(
          err instanceof Error ? err : new Error("Failed to load profiles")
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfiles();
  }, [user, authLoading]);

  const setActiveProfile = async (profileId: string) => {
    const profile = profiles.find((p) => p.id === profileId);
    if (profile) {
      setActiveProfileState(profile);
      if (typeof window !== "undefined") {
        localStorage.setItem(ACTIVE_PROFILE_KEY, profileId);
      }
    }
  };

  const createProfile = async (data: {
    name: string;
    imageFile?: File;
  }): Promise<string> => {
    if (!user) {
      throw new Error("User must be authenticated to create a profile");
    }

    try {
      // First create the profile without image
      const profileId = await createProfileService(user.uid, {
        name: data.name,
      });

      // If image file provided, upload it and update profile
      if (data.imageFile) {
        try {
          const imageUrl = await uploadProfileImage(
            user.uid,
            profileId,
            data.imageFile
          );
          // Update profile with image URL
          const { updateProfile } = await import("@/services/profileService");
          await updateProfile(profileId, { imageUrl });
        } catch (imageError) {
          console.error("Error uploading profile image:", imageError);
          // Profile created successfully, just without image
        }
      }

      await refreshProfiles();

      // Set as active profile
      const newProfile = profiles.find((p) => p.id === profileId);
      if (newProfile) {
        await setActiveProfile(profileId);
      }

      return profileId;
    } catch (err) {
      console.error("Error creating profile:", err);
      throw err;
    }
  };

  const refreshProfiles = async () => {
    if (!user) return;

    try {
      const userProfiles = await getUserProfiles(user.uid);
      setProfiles(userProfiles);

      // Update active profile if it changed
      if (activeProfile) {
        const updatedActive = userProfiles.find(
          (p) => p.id === activeProfile.id
        );
        if (updatedActive) {
          setActiveProfileState(updatedActive);
        }
      }
    } catch (err) {
      console.error("Error refreshing profiles:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to refresh profiles")
      );
    }
  };

  return (
    <ProfileContext.Provider
      value={{
        activeProfile,
        profiles,
        loading,
        error,
        setActiveProfile,
        createProfile,
        refreshProfiles,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
}

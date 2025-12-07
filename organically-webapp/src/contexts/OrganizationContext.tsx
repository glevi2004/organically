"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Organization } from "@/types/organization";
import {
  getUserOrganizations,
  createOrganization as createOrganizationService,
} from "@/services/organizationService";
import { uploadOrganizationImage } from "@/services/imageUploadService";
import { useAuth } from "./AuthContext";

interface OrganizationContextType {
  activeOrganization: Organization | null;
  organizations: Organization[];
  loading: boolean;
  error: Error | null;
  setActiveOrganization: (organizationId: string) => Promise<void>;
  createOrganization: (data: { name: string; imageFile?: File }) => Promise<string>;
  refreshOrganizations: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType>({
  activeOrganization: null,
  organizations: [],
  loading: true,
  error: null,
  setActiveOrganization: async () => {},
  createOrganization: async () => "",
  refreshOrganizations: async () => {},
});

const ACTIVE_ORGANIZATION_KEY = "organically_active_organization";

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [activeOrganization, setActiveOrganizationState] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load organizations when user is authenticated
  useEffect(() => {
    async function loadOrganizations() {
      if (authLoading) return;

      if (!user) {
        setOrganizations([]);
        setActiveOrganizationState(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const userOrganizations = await getUserOrganizations(user.uid);
        setOrganizations(userOrganizations);

        // Try to restore active organization from localStorage
        const savedOrganizationId =
          typeof window !== "undefined"
            ? localStorage.getItem(ACTIVE_ORGANIZATION_KEY)
            : null;

        if (savedOrganizationId) {
          const savedOrganization = userOrganizations.find(
            (o) => o.id === savedOrganizationId
          );
          if (savedOrganization) {
            setActiveOrganizationState(savedOrganization);
          } else if (userOrganizations.length > 0) {
            // If saved organization not found, use first organization
            setActiveOrganizationState(userOrganizations[0]);
            localStorage.setItem(ACTIVE_ORGANIZATION_KEY, userOrganizations[0].id);
          }
        } else if (userOrganizations.length > 0) {
          // No saved organization, use first one
          setActiveOrganizationState(userOrganizations[0]);
          localStorage.setItem(ACTIVE_ORGANIZATION_KEY, userOrganizations[0].id);
        }
      } catch (err) {
        console.error("Error loading organizations:", err);
        setError(
          err instanceof Error ? err : new Error("Failed to load organizations")
        );
      } finally {
        setLoading(false);
      }
    }

    loadOrganizations();
  }, [user, authLoading]);

  const setActiveOrganization = async (organizationId: string) => {
    const organization = organizations.find((o) => o.id === organizationId);
    if (organization) {
      setActiveOrganizationState(organization);
      if (typeof window !== "undefined") {
        localStorage.setItem(ACTIVE_ORGANIZATION_KEY, organizationId);
      }
    }
  };

  const createOrganization = async (data: {
    name: string;
    imageFile?: File;
  }): Promise<string> => {
    if (!user) {
      throw new Error("User must be authenticated to create an organization");
    }

    try {
      // First create the organization without image
      const organizationId = await createOrganizationService(user.uid, {
        name: data.name,
      });

      // If image file provided, upload it and update organization
      if (data.imageFile) {
        try {
          const imageUrl = await uploadOrganizationImage(
            user.uid,
            organizationId,
            data.imageFile
          );
          // Update organization with image URL
          const { updateOrganization } = await import("@/services/organizationService");
          await updateOrganization(organizationId, { imageUrl });
        } catch (imageError) {
          console.error("Error uploading organization image:", imageError);
          // Organization created successfully, just without image
        }
      }

      await refreshOrganizations();

      // Set as active organization
      const newOrganization = organizations.find((o) => o.id === organizationId);
      if (newOrganization) {
        await setActiveOrganization(organizationId);
      }

      return organizationId;
    } catch (err) {
      console.error("Error creating organization:", err);
      throw err;
    }
  };

  const refreshOrganizations = async () => {
    if (!user) return;

    try {
      const userOrganizations = await getUserOrganizations(user.uid);
      setOrganizations(userOrganizations);

      // Update active organization if it changed
      if (activeOrganization) {
        const updatedActive = userOrganizations.find(
          (o) => o.id === activeOrganization.id
        );
        if (updatedActive) {
          setActiveOrganizationState(updatedActive);
        }
      }
    } catch (err) {
      console.error("Error refreshing organizations:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to refresh organizations")
      );
    }
  };

  return (
    <OrganizationContext.Provider
      value={{
        activeOrganization,
        organizations,
        loading,
        error,
        setActiveOrganization,
        createOrganization,
        refreshOrganizations,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error("useOrganization must be used within an OrganizationProvider");
  }
  return context;
}

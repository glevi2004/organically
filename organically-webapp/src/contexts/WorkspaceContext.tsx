"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Workspace } from "@/types/workspace";
import {
  getUserWorkspaces,
  createWorkspace as createWorkspaceService,
} from "@/services/workspaceService";
import { useAuth } from "./AuthContext";

interface WorkspaceContextType {
  activeWorkspace: Workspace | null;
  workspaces: Workspace[];
  loading: boolean;
  error: Error | null;
  setActiveWorkspace: (workspaceId: string) => Promise<void>;
  createWorkspace: (data: {
    name: string;
    description?: string;
    icon: string;
  }) => Promise<string>;
  refreshWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType>({
  activeWorkspace: null,
  workspaces: [],
  loading: true,
  error: null,
  setActiveWorkspace: async () => {},
  createWorkspace: async () => "",
  refreshWorkspaces: async () => {},
});

const ACTIVE_WORKSPACE_KEY = "organically_active_workspace";

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [activeWorkspace, setActiveWorkspaceState] = useState<Workspace | null>(
    null
  );
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load workspaces when user is authenticated
  useEffect(() => {
    async function loadWorkspaces() {
      if (authLoading) return;

      if (!user) {
        setWorkspaces([]);
        setActiveWorkspaceState(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const userWorkspaces = await getUserWorkspaces(user.uid);
        setWorkspaces(userWorkspaces);

        // Try to restore active workspace from localStorage
        const savedWorkspaceId =
          typeof window !== "undefined"
            ? localStorage.getItem(ACTIVE_WORKSPACE_KEY)
            : null;

        if (savedWorkspaceId) {
          const savedWorkspace = userWorkspaces.find(
            (w) => w.id === savedWorkspaceId
          );
          if (savedWorkspace) {
            setActiveWorkspaceState(savedWorkspace);
          } else if (userWorkspaces.length > 0) {
            // If saved workspace not found, use first workspace
            setActiveWorkspaceState(userWorkspaces[0]);
            localStorage.setItem(ACTIVE_WORKSPACE_KEY, userWorkspaces[0].id);
          }
        } else if (userWorkspaces.length > 0) {
          // No saved workspace, use first one
          setActiveWorkspaceState(userWorkspaces[0]);
          localStorage.setItem(ACTIVE_WORKSPACE_KEY, userWorkspaces[0].id);
        }
      } catch (err) {
        console.error("Error loading workspaces:", err);
        setError(
          err instanceof Error ? err : new Error("Failed to load workspaces")
        );
      } finally {
        setLoading(false);
      }
    }

    loadWorkspaces();
  }, [user, authLoading]);

  const setActiveWorkspace = async (workspaceId: string) => {
    const workspace = workspaces.find((w) => w.id === workspaceId);
    if (workspace) {
      setActiveWorkspaceState(workspace);
      if (typeof window !== "undefined") {
        localStorage.setItem(ACTIVE_WORKSPACE_KEY, workspaceId);
      }
    }
  };

  const createWorkspace = async (data: {
    name: string;
    description?: string;
    icon: string;
  }): Promise<string> => {
    if (!user) {
      throw new Error("User must be authenticated to create a workspace");
    }

    try {
      const workspaceId = await createWorkspaceService(user.uid, data);
      await refreshWorkspaces();

      // Set as active workspace
      const newWorkspace = workspaces.find((w) => w.id === workspaceId);
      if (newWorkspace) {
        await setActiveWorkspace(workspaceId);
      }

      return workspaceId;
    } catch (err) {
      console.error("Error creating workspace:", err);
      throw err;
    }
  };

  const refreshWorkspaces = async () => {
    if (!user) return;

    try {
      const userWorkspaces = await getUserWorkspaces(user.uid);
      setWorkspaces(userWorkspaces);

      // Update active workspace if it changed
      if (activeWorkspace) {
        const updatedActive = userWorkspaces.find(
          (w) => w.id === activeWorkspace.id
        );
        if (updatedActive) {
          setActiveWorkspaceState(updatedActive);
        }
      }
    } catch (err) {
      console.error("Error refreshing workspaces:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to refresh workspaces")
      );
    }
  };

  return (
    <WorkspaceContext.Provider
      value={{
        activeWorkspace,
        workspaces,
        loading,
        error,
        setActiveWorkspace,
        createWorkspace,
        refreshWorkspaces,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}

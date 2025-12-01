import { getWorkspace } from "@/services/workspaceService";
import { Workspace } from "@/types/workspace";

/**
 * Validates that a user has access to a specific workspace
 * @param userId - The authenticated user's ID
 * @param workspaceId - The workspace ID to validate
 * @returns true if user has access, false otherwise
 */
export async function validateWorkspaceAccess(
  userId: string,
  workspaceId: string
): Promise<boolean> {
  try {
    const workspace = await getWorkspace(workspaceId);
    
    if (!workspace) {
      return false;
    }

    // Check if the workspace belongs to the user
    return workspace.userId === userId;
  } catch (error) {
    console.error("Error validating workspace access:", error);
    return false;
  }
}

/**
 * Extracts workspace ID from the current URL pathname
 * @param pathname - The current pathname (from usePathname())
 * @returns workspace ID or null if not found
 */
export function getWorkspaceFromUrl(pathname: string): string | null {
  const match = pathname.match(/\/workspace\/([^\/]+)/);
  return match ? match[1] : null;
}

/**
 * Generates a redirect URL for a specific workspace
 * @param workspaceId - The workspace ID
 * @param page - Optional page within the workspace (defaults to 'dashboard')
 * @returns The full URL path
 */
export function getWorkspaceUrl(
  workspaceId: string,
  page: string = "dashboard"
): string {
  return `/workspace/${workspaceId}/${page}`;
}

/**
 * Checks if a given pathname is a workspace route
 * @param pathname - The pathname to check
 * @returns true if the pathname is a workspace route
 */
export function isWorkspaceRoute(pathname: string): boolean {
  return pathname.startsWith("/workspace/");
}

/**
 * Gets the current page/section from a workspace URL
 * @param pathname - The current pathname
 * @returns The page name (e.g., 'dashboard', 'analytics', etc.)
 */
export function getWorkspacePageFromUrl(pathname: string): string | null {
  const match = pathname.match(/\/workspace\/[^\/]+\/([^\/]+)/);
  return match ? match[1] : null;
}


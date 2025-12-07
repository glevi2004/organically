"use client";

import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase/firebaseConfig";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/theme/mode-toggle";
import { toast } from "sonner";

export function Navbar() {
  const router = useRouter();
  const { user } = useAuth();
  const { organizations } = useOrganization();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success("Signed out successfully");
      router.push("/");
    } catch (error) {
      toast.error("Failed to sign out. Please try again.");
      console.error("Error signing out:", error);
    }
  };

  return (
    <nav className="p-1 fixed top-0 left-0 right-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center hover:opacity-80 transition-opacity"
          >
            <span className="text-2xl font-bold">🌱 Organically</span>
          </button>

          {/* Right side - Auth buttons + Theme Toggle */}
          <div className="flex items-center gap-3">
            <ModeToggle />
            {user ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-transparent hover:bg-primary/10"
                  onClick={() => {
                    if (organizations.length > 0) {
                      router.push(`/organization/${organizations[0].id}/home`);
                    } else {
                      router.push("/onboarding");
                    }
                  }}
                >
                  Home
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-transparent hover:bg-primary/10"
                  onClick={handleSignOut}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="bg-transparent hover:bg-primary/10"
                onClick={() => router.push("/auth")}
              >
                Get Started
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

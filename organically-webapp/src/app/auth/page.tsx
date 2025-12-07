"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  linkWithCredential,
  AuthCredential,
  fetchSignInMethodsForEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { auth } from "@/firebase/firebaseConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Account linking dialog state
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkEmail, setLinkEmail] = useState("");
  const [linkPassword, setLinkPassword] = useState("");
  const [pendingCredential, setPendingCredential] =
    useState<AuthCredential | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      toast.success("Welcome back! Signed in successfully.");

      // Import services dynamically to avoid circular dependencies
      const { getUserOrganizations } = await import(
        "@/services/organizationService"
      );
      const organizations = await getUserOrganizations(userCredential.user.uid);

      if (organizations.length === 0) {
        router.push("/onboarding");
      } else {
        router.push(`/organization/${organizations[0].id}/home`);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Create user profile in Firestore
      const { createUserProfile } = await import("@/services/userService");
      await createUserProfile(userCredential.user.uid, {
        email: userCredential.user.email || email,
        displayName: userCredential.user.displayName || undefined,
        photoURL: userCredential.user.photoURL || undefined,
      });

      toast.success("Account created successfully! Welcome to Organically.");
      router.push("/onboarding");
    } catch (error: any) {
      toast.error(error.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      const result = await signInWithPopup(auth, provider);
      const email = result.user.email;

      if (!email) {
        toast.error("Google account has no email.");
        return;
      }

      // Always check sign-in methods
      const methods = await fetchSignInMethodsForEmail(auth, email);

      // If password account already exists → link
      const alreadyHasPasswordAccount = methods.includes("password");

      if (alreadyHasPasswordAccount) {
        const credential = GoogleAuthProvider.credentialFromResult(result);

        if (credential) {
          setPendingCredential(credential);
          setLinkEmail(email);
          setShowLinkDialog(true);

          toast.info(
            `An existing password account was found for ${email}. Enter your password to link it with Google.`
          );

          // IMPORTANT — stop here!
          setLoading(false);
          return;
        }
      }

      // If no password account → normal Google login
      // Check if this is a new user or existing user
      const { checkUserExists, createUserProfile } = await import(
        "@/services/userService"
      );
      const userExists = await checkUserExists(result.user.uid);

      if (!userExists) {
        // New user - create profile
        await createUserProfile(result.user.uid, {
          email: result.user.email || email,
          displayName: result.user.displayName || undefined,
          photoURL: result.user.photoURL || undefined,
        });
      }

      // Check for organizations
      const { getUserOrganizations } = await import(
        "@/services/organizationService"
      );
      const organizations = await getUserOrganizations(result.user.uid);

      toast.success("Signed in with Google!");

      if (organizations.length === 0) {
        router.push("/onboarding");
      } else {
        router.push(`/organization/${organizations[0].id}/home`);
      }
    } catch (error: any) {
      // Handles the classic linking error case
      if (error.code === "auth/account-exists-with-different-credential") {
        const email = error.customData?.email;
        const cred = GoogleAuthProvider.credentialFromError(error);

        if (email && cred) {
          setPendingCredential(cred);
          setLinkEmail(email);
          setShowLinkDialog(true);

          toast.info(
            `This email is already used with another sign-in method. Enter your password to link it.`
          );
        }
        return;
      }

      if (error.code !== "auth/popup-closed-by-user") {
        toast.error(error.message || "Failed to sign in with Google");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLinkAccounts = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!pendingCredential || !auth.currentUser) {
        toast.error("No account to link. Please try signing in again.");
        setShowLinkDialog(false);
        return;
      }

      // Reauthenticate the Google user using email + password
      const passwordCred = EmailAuthProvider.credential(
        linkEmail,
        linkPassword
      );
      await reauthenticateWithCredential(auth.currentUser, passwordCred);

      // Link the Google credential to the current user
      await linkWithCredential(auth.currentUser, pendingCredential);

      toast.success(
        "Accounts linked successfully! You can now sign in with Google."
      );

      // Close dialog and redirect
      setShowLinkDialog(false);
      setLinkPassword("");
      setPendingCredential(null);

      // Check for organizations
      const { getUserOrganizations } = await import(
        "@/services/organizationService"
      );
      const organizations = await getUserOrganizations(auth.currentUser.uid);

      if (organizations.length === 0) {
        router.push("/onboarding");
      } else {
        router.push(`/organization/${organizations[0].id}/home`);
      }
    } catch (error: any) {
      if (error.code === "auth/wrong-password") {
        toast.error("Incorrect password. Please try again.");
      } else if (error.code === "auth/invalid-credential") {
        toast.error("Invalid password. Please try again.");
      } else {
        toast.error(error.message || "Failed to link accounts");
        console.error("Linking error:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background relative overflow-hidden">
      {/* Background Gradient Effect */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/3 top-1/4 w-[500px] h-[500px] bg-green-500/10 blur-3xl rounded-full" />
        <div className="absolute right-1/3 bottom-1/4 w-[500px] h-[500px] bg-teal-500/10 blur-3xl rounded-full" />
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <span className="text-3xl font-bold">🌱 Organically</span>
          </button>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          {/* Login Tab */}
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Welcome back</CardTitle>
                <CardDescription>
                  Sign in to your account to continue
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-linear-to-r from-green-600 via-emerald-500 to-teal-600 text-white hover:opacity-90"
                    disabled={loading}
                  >
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Sign in with Google
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sign Up Tab */}
          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Create an account</CardTitle>
                <CardDescription>
                  Start growing organically today
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-linear-to-r from-green-600 via-emerald-500 to-teal-600 text-white hover:opacity-90"
                    disabled={loading}
                  >
                    {loading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Sign up with Google
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Account Linking Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Your Accounts</DialogTitle>
            <DialogDescription>
              An account with <strong>{linkEmail}</strong> already exists. Enter
              your password to link your Google account.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLinkAccounts} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="link-password">Password</Label>
              <Input
                id="link-password"
                type="password"
                placeholder="Enter your password"
                value={linkPassword}
                onChange={(e) => setLinkPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowLinkDialog(false);
                  setLinkPassword("");
                  setPendingCredential(null);
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-linear-to-r from-green-600 via-emerald-500 to-teal-600 text-white hover:opacity-90"
                disabled={loading}
              >
                {loading ? "Linking..." : "Link Accounts"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

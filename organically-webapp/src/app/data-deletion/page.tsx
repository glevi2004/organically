"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface DeletionStatus {
  confirmationCode: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  requestedAt: string;
  completedAt?: string;
  channelsRemoved?: number;
}

export default function DataDeletionPage() {
  const searchParams = useSearchParams();
  const codeFromUrl = searchParams.get("code");
  
  const [confirmationCode, setConfirmationCode] = useState(codeFromUrl || "");
  const [status, setStatus] = useState<DeletionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  // Auto-check status if code is in URL
  useEffect(() => {
    if (codeFromUrl && !checked) {
      checkStatus();
      setChecked(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeFromUrl]);

  const checkStatus = async () => {
    if (!confirmationCode.trim()) {
      setError("Please enter a confirmation code");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/user-data-deletion/status?code=${encodeURIComponent(confirmationCode)}`);
      
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      } else if (response.status === 404) {
        setError("Deletion request not found. Please check your confirmation code.");
        setStatus(null);
      } else {
        setError("Failed to check status. Please try again.");
        setStatus(null);
      }
    } catch {
      setError("Failed to connect to server. Please try again.");
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (statusValue: string) => {
    switch (statusValue) {
      case "completed":
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case "pending":
      case "in_progress":
        return <Clock className="w-8 h-8 text-yellow-500" />;
      case "failed":
        return <AlertCircle className="w-8 h-8 text-red-500" />;
      default:
        return <Clock className="w-8 h-8 text-muted-foreground" />;
    }
  };

  const getStatusText = (statusValue: string) => {
    switch (statusValue) {
      case "completed":
        return "Your data has been successfully deleted.";
      case "pending":
        return "Your deletion request is pending processing.";
      case "in_progress":
        return "Your data deletion is currently in progress.";
      case "failed":
        return "There was an issue processing your request. Please contact support.";
      default:
        return "Unknown status";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <Link 
          href="/" 
          className="text-sm text-muted-foreground hover:text-foreground mb-8 inline-block"
        >
          ← Back to Home
        </Link>

        <h1 className="text-4xl font-bold mb-4">Data Deletion</h1>
        <p className="text-muted-foreground mb-8">
          Check the status of your data deletion request or learn how to request deletion of your data.
        </p>

        {/* Status Check Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Check Deletion Status</CardTitle>
            <CardDescription>
              Enter your confirmation code to check the status of your data deletion request.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="Enter confirmation code (e.g., del_1234567890_abc123)"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                className="flex-1"
              />
              <Button onClick={checkStatus} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  "Check Status"
                )}
              </Button>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {status && (
              <div className="mt-6 p-6 bg-muted/50 rounded-lg">
                <div className="flex items-start gap-4">
                  {getStatusIcon(status.status)}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">
                      {status.status === "completed" ? "Deletion Complete" : "Deletion Status"}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {getStatusText(status.status)}
                    </p>
                    <dl className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Confirmation Code:</dt>
                        <dd className="font-mono">{status.confirmationCode}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Requested:</dt>
                        <dd>{new Date(status.requestedAt).toLocaleString()}</dd>
                      </div>
                      {status.completedAt && (
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Completed:</dt>
                          <dd>{new Date(status.completedAt).toLocaleString()}</dd>
                        </div>
                      )}
                      {status.channelsRemoved !== undefined && (
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Instagram Accounts Removed:</dt>
                          <dd>{status.channelsRemoved}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* How to Request Deletion */}
        <Card>
          <CardHeader>
            <CardTitle>How to Request Data Deletion</CardTitle>
            <CardDescription>
              There are several ways to request deletion of your data from Organically.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Option 1: Through Instagram Settings</h3>
              <p className="text-muted-foreground text-sm">
                Go to your Instagram app → Settings → Security → Apps and Websites → 
                Remove Organically. This will automatically trigger a data deletion request.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Option 2: Through Facebook Settings</h3>
              <p className="text-muted-foreground text-sm">
                Go to Facebook → Settings → Apps and Websites → Find Organically → 
                Remove App. Select &quot;Delete all data&quot; when prompted.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Option 3: From Within Organically</h3>
              <p className="text-muted-foreground text-sm">
                Log in to your Organically account → Settings → Connected Accounts → 
                Disconnect your Instagram account, then delete your Organically account.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Option 4: Contact Support</h3>
              <p className="text-muted-foreground text-sm">
                Email us at{" "}
                <a href="mailto:privacy@organically.app" className="text-primary hover:underline">
                  privacy@organically.app
                </a>{" "}
                with your request. Please include your email address and Instagram username. 
                We will process your request within 30 days.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* What Gets Deleted */}
        <div className="mt-8 p-6 bg-muted/30 rounded-lg">
          <h3 className="font-semibold mb-3">What Data Gets Deleted?</h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• Your Instagram access tokens and account connection</li>
            <li>• Scheduled posts and automation workflows</li>
            <li>• Message and comment history processed by automations</li>
            <li>• Analytics data associated with your account</li>
            <li>• Your Organically user profile (if account deletion is requested)</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-4">
            Note: Data already published to Instagram remains on Instagram and is subject to 
            Instagram&apos;s own data policies.
          </p>
        </div>
      </div>
    </div>
  );
}


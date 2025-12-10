"use client";

import { useState } from "react";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Shield, ExternalLink } from "lucide-react";

interface StepTermsData {
  termsAccepted: boolean;
  privacyAccepted: boolean;
}

interface StepTermsProps {
  data: StepTermsData;
  onDataChange: (data: StepTermsData) => void;
}

export function StepTerms({ data, onDataChange }: StepTermsProps) {
  const [expandedSection, setExpandedSection] = useState<"terms" | "privacy" | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Welcome to Organically</h2>
        <p className="text-muted-foreground">
          Before we get started, please review and accept our Terms of Service and Privacy Policy.
        </p>
      </div>

      {/* Terms of Service Section */}
      <div className="border rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setExpandedSection(expandedSection === "terms" ? null : "terms")}
          className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <FileText className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-left">
              <p className="font-medium">Terms of Service</p>
              <p className="text-sm text-muted-foreground">
                Rules and guidelines for using Organically
              </p>
            </div>
          </div>
          <Link
            href="/terms"
            target="_blank"
            onClick={(e) => e.stopPropagation()}
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            Open full page
            <ExternalLink className="w-3 h-3" />
          </Link>
        </button>

        {expandedSection === "terms" && (
          <ScrollArea className="h-48 border-t">
            <div className="p-4 text-sm text-muted-foreground space-y-3">
              <p>
                <strong>1. Acceptance of Terms</strong><br />
                By accessing or using Organically, you agree to be bound by these Terms of Service.
              </p>
              <p>
                <strong>2. Description of Service</strong><br />
                Organically provides Instagram automation tools including content scheduling, 
                automated responses to comments and direct messages, and AI-powered content assistance.
              </p>
              <p>
                <strong>3. Instagram Account Connection</strong><br />
                By connecting your Instagram account, you authorize us to access your account through 
                Meta&apos;s official APIs and perform actions on your behalf.
              </p>
              <p>
                <strong>4. Acceptable Use</strong><br />
                You agree not to use the Service to violate any laws, send spam, or violate 
                Instagram&apos;s terms of service or community guidelines.
              </p>
              <p>
                <strong>5. Content Responsibility</strong><br />
                You are solely responsible for all content you create, schedule, or publish 
                through the Service.
              </p>
              <p className="pt-2">
                <Link href="/terms" target="_blank" className="text-primary hover:underline">
                  Read the complete Terms of Service →
                </Link>
              </p>
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Privacy Policy Section */}
      <div className="border rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setExpandedSection(expandedSection === "privacy" ? null : "privacy")}
          className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Shield className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-left">
              <p className="font-medium">Privacy Policy</p>
              <p className="text-sm text-muted-foreground">
                How we collect, use, and protect your data
              </p>
            </div>
          </div>
          <Link
            href="/privacy"
            target="_blank"
            onClick={(e) => e.stopPropagation()}
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            Open full page
            <ExternalLink className="w-3 h-3" />
          </Link>
        </button>

        {expandedSection === "privacy" && (
          <ScrollArea className="h-48 border-t">
            <div className="p-4 text-sm text-muted-foreground space-y-3">
              <p>
                <strong>Information We Collect</strong><br />
                We collect account information (email, name), organization details, content you create, 
                and data from your connected Instagram account.
              </p>
              <p>
                <strong>How We Use Your Information</strong><br />
                We use your information to provide and maintain our services, process your automation 
                workflows, schedule content, and send automated responses.
              </p>
              <p>
                <strong>Data Security</strong><br />
                We implement industry-standard security measures including encryption of sensitive data 
                (access tokens) using AES-256-GCM and secure HTTPS connections.
              </p>
              <p>
                <strong>Your Rights</strong><br />
                You have the right to access, rectify, and delete your data. You can disconnect your 
                Instagram account and request data deletion at any time.
              </p>
              <p className="pt-2">
                <Link href="/privacy" target="_blank" className="text-primary hover:underline">
                  Read the complete Privacy Policy →
                </Link>
              </p>
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Acceptance Checkboxes */}
      <div className="space-y-4 pt-4 border-t">
        <div className="flex items-start gap-3">
          <Checkbox
            id="terms-checkbox"
            checked={data.termsAccepted}
            onCheckedChange={(checked) =>
              onDataChange({ ...data, termsAccepted: checked === true })
            }
            className="mt-0.5"
          />
          <Label htmlFor="terms-checkbox" className="text-sm leading-relaxed cursor-pointer">
            I have read and agree to the{" "}
            <Link href="/terms" target="_blank" className="text-primary hover:underline">
              Terms of Service
            </Link>
            <span className="text-destructive"> *</span>
          </Label>
        </div>

        <div className="flex items-start gap-3">
          <Checkbox
            id="privacy-checkbox"
            checked={data.privacyAccepted}
            onCheckedChange={(checked) =>
              onDataChange({ ...data, privacyAccepted: checked === true })
            }
            className="mt-0.5"
          />
          <Label htmlFor="privacy-checkbox" className="text-sm leading-relaxed cursor-pointer">
            I have read and agree to the{" "}
            <Link href="/privacy" target="_blank" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            <span className="text-destructive"> *</span>
          </Label>
        </div>
      </div>

      {/* Helper text */}
      <p className="text-xs text-muted-foreground">
        By clicking Continue, you confirm that you have read, understood, and agree to our Terms 
        of Service and Privacy Policy. You must accept both to use Organically.
      </p>
    </div>
  );
}


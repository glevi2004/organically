"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { updateUserProfile } from "@/services/userService";
import {
  saveOnboardingProgress,
  completeOnboarding,
  getOnboardingData,
} from "@/services/onboardingService";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { Step1Basics } from "@/components/onboarding/steps/Step1Basics";
import { Organization } from "@/types/organization";

const TOTAL_STEPS = 1;

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { createOrganization, organizations, refreshOrganizations } =
    useOrganization();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  // Step 1 data (Basics)
  const [step1Data, setStep1Data] = useState<{
    name: string;
    imageFile?: File | null;
    currentImageUrl?: string;
    description?: string;
    brandVoice?: string;
    valuesMission?: string;
  }>({
    name: "",
    imageFile: null,
    description: "",
    brandVoice: "",
    valuesMission: "",
  });

  // Check for existing organization to resume
  useEffect(() => {
    const checkExistingOrganization = async () => {
      const organizationIdParam = searchParams.get("organizationId");

      // If organizationId in URL, load that organization
      if (organizationIdParam) {
        await loadOrganizationData(organizationIdParam);
      } else if (organizations.length > 0 && !organizationId) {
        // Check if any existing organization has incomplete onboarding
        const incompleteOrganization = organizations.find(
          (o) => !o.onboardingCompleted
        );

        if (incompleteOrganization) {
          await loadOrganizationData(incompleteOrganization.id);
        }
      }
    };

    checkExistingOrganization();
  }, [searchParams, organizations]);

  // Helper function to load and pre-fill organization data
  const loadOrganizationData = async (organizationIdToLoad: string) => {
    setOrganizationId(organizationIdToLoad);

    try {
      const organizationData = await getOnboardingData(organizationIdToLoad);

      if (organizationData) {
        // Pre-fill Step 1 data
        setStep1Data({
          name: organizationData.name || "",
          imageFile: null,
          currentImageUrl: organizationData.imageUrl,
          description: organizationData.description || "",
          brandVoice: organizationData.brandVoice || "",
          valuesMission: organizationData.valuesMission || "",
        });

        // Resume from the next incomplete step
        const nextStep = (organizationData.onboardingStep || 0) + 1;
        setCurrentStep(Math.min(nextStep, TOTAL_STEPS));
      }
    } catch (error) {
      console.error("Error loading organization data:", error);
      toast.error("Failed to load organization data");
    }
  };

  const validateStep = (): boolean => {
    if (!step1Data.name.trim()) {
      toast.error("Please enter an organization name");
      return false;
    }
    return true;
  };

  const handleNext = async () => {
    if (!validateStep()) {
      return;
    }

    setLoading(true);

    try {
      // Create organization if not exists
      let currentOrganizationId = organizationId;
      if (!currentOrganizationId) {
        currentOrganizationId = await createOrganization({
          name: step1Data.name.trim(),
          imageFile: step1Data.imageFile || undefined,
        });
        setOrganizationId(currentOrganizationId);
      }

      // Save progress and complete onboarding
      if (currentOrganizationId) {
        const updateData: Partial<Organization> = {
          description: step1Data.description || undefined,
          brandVoice: step1Data.brandVoice || undefined,
          valuesMission: step1Data.valuesMission || undefined,
        };

        await saveOnboardingProgress(currentOrganizationId, 1, updateData);

        // Complete onboarding
        if (user) {
          await completeOnboarding(currentOrganizationId);

          // Update user profile (non-blocking - don't fail if this errors)
          try {
            await updateUserProfile(
              user.uid,
              {
                onboardingCompleted: true,
              },
              user.email || undefined
            );
          } catch (userProfileError) {
            console.warn(
              "Failed to update user profile, but continuing:",
              userProfileError
            );
          }

          // Refresh organizations to update the active organization with onboardingCompleted: true
          await refreshOrganizations();

          toast.success("Setup complete! Welcome to Organically.");
          router.push(`/organization/${currentOrganizationId}/home`);
        }
      }
    } catch (error) {
      console.error("Error saving progress:", error);
      toast.error("Failed to save progress. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    // No back for single step
  };

  const handleSkip = async () => {
    if (organizationId) {
      toast.info("You can complete setup later from your home");
      router.push(`/organization/${organizationId}/home`);
    } else {
      toast.error("Please complete at least the first step");
    }
  };

  return (
    <OnboardingLayout
      currentStep={currentStep}
      totalSteps={TOTAL_STEPS}
      onNext={handleNext}
      onBack={handleBack}
      onSkip={handleSkip}
      canGoBack={false}
      canGoNext={true}
      isLoading={loading}
    >
      <Step1Basics data={step1Data} onDataChange={setStep1Data} />
    </OnboardingLayout>
  );
}

export default function OnboardingPage() {
  return (
    <ProtectedRoute>
      <OnboardingContent />
    </ProtectedRoute>
  );
}

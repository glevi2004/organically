"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/contexts/ProfileContext";
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
import { Step2Platforms } from "@/components/onboarding/steps/Step2Platforms";
import { Step3Consistency } from "@/components/onboarding/steps/Step3Consistency";
import { Step4Audience } from "@/components/onboarding/steps/Step4Audience";
import { Step5ContentTypes } from "@/components/onboarding/steps/Step5ContentTypes";
import { Profile } from "@/types/profile";

const TOTAL_STEPS = 5;

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { createProfile, profiles, refreshProfiles } = useProfile();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  // Step 1 data
  const [step1Data, setStep1Data] = useState<{
    name: string;
    imageFile?: File | null;
    currentImageUrl?: string;
  }>({
    name: "",
    imageFile: null,
  });

  // Step 2 data
  const [step2Data, setStep2Data] = useState({
    platforms: [] as string[],
  });

  // Step 3 data
  const [step3Data, setStep3Data] = useState({
    consistencyLevel: "",
  });

  // Step 4 data
  const [step4Data, setStep4Data] = useState({
    targetAudience: {
      ageRanges: [] as string[],
      genders: [] as string[],
    },
  });

  // Step 5 data
  const [step5Data, setStep5Data] = useState({
    contentTypes: [] as string[],
  });

  // Check for existing profile to resume
  useEffect(() => {
    const checkExistingProfile = async () => {
      const profileIdParam = searchParams.get("profileId");

      // If profileId in URL, load that profile
      if (profileIdParam) {
        await loadProfileData(profileIdParam);
      } else if (profiles.length > 0 && !profileId) {
        // Check if any existing profile has incomplete onboarding
        const incompleteProfile = profiles.find(
          (p) => !p.onboardingCompleted
        );

        if (incompleteProfile) {
          await loadProfileData(incompleteProfile.id);
        }
      }
    };

    checkExistingProfile();
  }, [searchParams, profiles]);

  // Helper function to load and pre-fill profile data
  const loadProfileData = async (profileIdToLoad: string) => {
    setProfileId(profileIdToLoad);

    try {
      const profileData = await getOnboardingData(profileIdToLoad);

      if (profileData) {
        // Pre-fill Step 1 data
        setStep1Data({
          name: profileData.name || "",
          imageFile: null,
          currentImageUrl: profileData.imageUrl,
        });

        // Pre-fill Step 2 data
        setStep2Data({
          platforms: profileData.platforms || [],
        });

        // Pre-fill Step 3 data
        setStep3Data({
          consistencyLevel: profileData.consistencyLevel || "",
        });

        // Pre-fill Step 4 data
        setStep4Data({
          targetAudience: {
            ageRanges: profileData.targetAudience?.ageRanges || [],
            genders: profileData.targetAudience?.genders || [],
          },
        });

        // Pre-fill Step 5 data
        setStep5Data({
          contentTypes: profileData.contentTypes || [],
        });

        // Resume from the next incomplete step
        const nextStep = (profileData.onboardingStep || 0) + 1;
        setCurrentStep(Math.min(nextStep, TOTAL_STEPS));
      }
    } catch (error) {
      console.error("Error loading profile data:", error);
      toast.error("Failed to load profile data");
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!step1Data.name.trim()) {
          toast.error("Please enter a profile name");
          return false;
        }
        return true;
      case 2:
        if (step2Data.platforms.length === 0) {
          toast.error("Please select at least one platform");
          return false;
        }
        return true;
      case 3:
        if (!step3Data.consistencyLevel) {
          toast.error("Please select a consistency level");
          return false;
        }
        return true;
      case 4:
        if (step4Data.targetAudience.ageRanges.length === 0) {
          toast.error("Please select at least one age range");
          return false;
        }
        if (step4Data.targetAudience.genders.length === 0) {
          toast.error("Please select at least one gender option");
          return false;
        }
        return true;
      case 5:
        if (step5Data.contentTypes.length === 0) {
          toast.error("Please select at least one content type");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create profile if not exists
      if (currentStep === 1 && !profileId) {
        const newProfileId = await createProfile({
          name: step1Data.name.trim(),
          imageFile: step1Data.imageFile || undefined,
        });
        setProfileId(newProfileId);
      }

      // Save progress for current step
      if (profileId) {
        const updateData: Partial<Profile> = {};

        switch (currentStep) {
          case 2:
            updateData.platforms = step2Data.platforms;
            break;
          case 3:
            updateData.consistencyLevel = step3Data.consistencyLevel as any;
            break;
          case 4:
            updateData.targetAudience = step4Data.targetAudience;
            break;
          case 5:
            updateData.contentTypes = step5Data.contentTypes;
            break;
        }

        await saveOnboardingProgress(profileId, currentStep, updateData);
      }

      // Move to next step or complete
      if (currentStep < TOTAL_STEPS) {
        setCurrentStep(currentStep + 1);
      } else {
        // Complete onboarding
        if (profileId && user) {
          await completeOnboarding(profileId);
          await updateUserProfile(user.uid, {
            onboardingCompleted: true,
          });

          // Refresh profiles to update the active profile with onboardingCompleted: true
          await refreshProfiles();

          toast.success("Setup complete! Welcome to Organically.");
          router.push(`/profile/${profileId}/home`);
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
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    if (profileId) {
      toast.info("You can complete setup later from your home");
      router.push(`/profile/${profileId}/home`);
    } else {
      toast.error("Please complete at least the first step");
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1Basics data={step1Data} onDataChange={setStep1Data} />;
      case 2:
        return <Step2Platforms data={step2Data} onDataChange={setStep2Data} />;
      case 3:
        return (
          <Step3Consistency data={step3Data} onDataChange={setStep3Data} />
        );
      case 4:
        return <Step4Audience data={step4Data} onDataChange={setStep4Data} />;
      case 5:
        return (
          <Step5ContentTypes data={step5Data} onDataChange={setStep5Data} />
        );
      default:
        return null;
    }
  };

  return (
    <OnboardingLayout
      currentStep={currentStep}
      totalSteps={TOTAL_STEPS}
      onNext={handleNext}
      onBack={handleBack}
      onSkip={handleSkip}
      canGoBack={currentStep > 1}
      canGoNext={true}
      isLoading={loading}
    >
      {renderStep()}
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

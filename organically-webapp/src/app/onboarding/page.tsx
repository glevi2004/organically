"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { updateUserProfile } from "@/services/userService";
import { saveOnboardingProgress, completeOnboarding } from "@/services/onboardingService";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { Step1Basics } from "@/components/onboarding/steps/Step1Basics";
import { Step2ProjectType } from "@/components/onboarding/steps/Step2ProjectType";
import { Step3Platforms } from "@/components/onboarding/steps/Step3Platforms";
import { Step4GrowthGoals } from "@/components/onboarding/steps/Step4GrowthGoals";
import { Step5ContentTypes } from "@/components/onboarding/steps/Step5ContentTypes";
import { Step6TargetAudience } from "@/components/onboarding/steps/Step6TargetAudience";
import { Step7ContentThemes } from "@/components/onboarding/steps/Step7ContentThemes";
import { Step8PostingSchedule } from "@/components/onboarding/steps/Step8PostingSchedule";
import { Workspace } from "@/types/workspace";

const TOTAL_STEPS = 8;

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { createWorkspace, workspaces } = useWorkspace();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  
  // Step 1 data
  const [step1Data, setStep1Data] = useState({
    name: "",
    icon: "🌱",
    description: "",
  });
  
  // Step 2 data
  const [step2Data, setStep2Data] = useState({
    projectType: "",
    projectTypeOther: "",
  });
  
  // Step 3 data
  const [step3Data, setStep3Data] = useState({
    platforms: [] as string[],
    primaryPlatform: "",
  });
  
  // Step 4 data
  const [step4Data, setStep4Data] = useState({
    growthGoals: [] as string[],
    followerGoal: "",
    timeframe: "",
  });
  
  // Step 5 data
  const [step5Data, setStep5Data] = useState({
    contentTypes: [] as string[],
    contentFormats: [] as string[],
  });
  
  // Step 6 data
  const [step6Data, setStep6Data] = useState({
    targetAudience: {
      ageRange: "",
      gender: "",
      interests: [] as string[],
      painPoints: [] as string[],
    },
  });
  
  // Step 7 data
  const [step7Data, setStep7Data] = useState({
    contentThemes: [] as string[],
    brandVoice: "",
  });
  
  // Step 8 data
  const [step8Data, setStep8Data] = useState({
    postingFrequency: {} as { [key: string]: number },
    preferredPostingTimes: [] as string[],
    selectedPlatforms: [] as string[],
  });

  // Check for existing workspace to resume
  useEffect(() => {
    const checkExistingWorkspace = async () => {
      const workspaceIdParam = searchParams.get("workspaceId");
      
      // If workspaceId in URL, load that workspace
      if (workspaceIdParam) {
        await loadWorkspaceData(workspaceIdParam);
      } else if (workspaces.length > 0 && !workspaceId) {
        // Check if any existing workspace has incomplete onboarding
        const incompleteWorkspace = workspaces.find(
          (w) => !w.onboardingCompleted
        );
        
        if (incompleteWorkspace) {
          await loadWorkspaceData(incompleteWorkspace.id);
        }
      }
    };
    
    checkExistingWorkspace();
  }, [searchParams, workspaces]);
  
  // Helper function to load and pre-fill workspace data
  const loadWorkspaceData = async (workspaceIdToLoad: string) => {
    setWorkspaceId(workspaceIdToLoad);
    
    try {
      const { getOnboardingData } = await import("@/services/onboardingService");
      const workspaceData = await getOnboardingData(workspaceIdToLoad);
      
      if (workspaceData) {
        // Pre-fill Step 1 data
        setStep1Data({
          name: workspaceData.name || "",
          icon: workspaceData.icon || "🌱",
          description: workspaceData.description || "",
        });
        
        // Pre-fill Step 2 data
        setStep2Data({
          projectType: workspaceData.projectType || "",
          projectTypeOther: workspaceData.projectTypeOther || "",
        });
        
        // Pre-fill Step 3 data
        setStep3Data({
          platforms: workspaceData.platforms || [],
          primaryPlatform: workspaceData.primaryPlatform || "",
        });
        
        // Pre-fill Step 4 data
        setStep4Data({
          growthGoals: workspaceData.growthGoals || [],
          followerGoal: workspaceData.followerGoal || "",
          timeframe: workspaceData.timeframe || "",
        });
        
        // Pre-fill Step 5 data
        setStep5Data({
          contentTypes: workspaceData.contentTypes || [],
          contentFormats: workspaceData.contentFormats || [],
        });
        
        // Pre-fill Step 6 data
        setStep6Data({
          targetAudience: workspaceData.targetAudience || {
            ageRange: "",
            gender: "",
            interests: [],
            painPoints: [],
          },
        });
        
        // Pre-fill Step 7 data
        setStep7Data({
          contentThemes: workspaceData.contentThemes || [],
          brandVoice: workspaceData.brandVoice || "",
        });
        
        // Pre-fill Step 8 data
        setStep8Data({
          postingFrequency: workspaceData.postingFrequency || {},
          preferredPostingTimes: workspaceData.preferredPostingTimes || [],
          selectedPlatforms: workspaceData.platforms || [],
        });
        
        // Resume from the next incomplete step
        const nextStep = (workspaceData.onboardingStep || 0) + 1;
        setCurrentStep(Math.min(nextStep, TOTAL_STEPS));
      }
    } catch (error) {
      console.error("Error loading workspace data:", error);
      toast.error("Failed to load workspace data");
    }
  };

  // Update Step 8 with selected platforms from Step 3
  useEffect(() => {
    setStep8Data((prev) => ({
      ...prev,
      selectedPlatforms: step3Data.platforms,
    }));
  }, [step3Data.platforms]);

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!step1Data.name.trim()) {
          toast.error("Please enter a workspace name");
          return false;
        }
        return true;
      case 2:
        if (!step2Data.projectType) {
          toast.error("Please select a project type");
          return false;
        }
        if (step2Data.projectType === "other" && !step2Data.projectTypeOther.trim()) {
          toast.error("Please specify your project type");
          return false;
        }
        return true;
      case 3:
        if (step3Data.platforms.length === 0) {
          toast.error("Please select at least one platform");
          return false;
        }
        return true;
      case 4:
        if (step4Data.growthGoals.length === 0) {
          toast.error("Please select at least one growth goal");
          return false;
        }
        return true;
      case 5:
        if (step5Data.contentTypes.length === 0) {
          toast.error("Please select at least one content type");
          return false;
        }
        if (step5Data.contentFormats.length === 0) {
          toast.error("Please select at least one content style");
          return false;
        }
        return true;
      case 6:
        return true; // All fields optional
      case 7:
        if (step7Data.contentThemes.length === 0) {
          toast.error("Please add at least one content theme");
          return false;
        }
        if (!step7Data.brandVoice) {
          toast.error("Please select a brand voice");
          return false;
        }
        return true;
      case 8:
        return true; // Posting schedule is optional
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
      // Step 1: Create workspace if not exists
      if (currentStep === 1 && !workspaceId) {
        const newWorkspaceId = await createWorkspace({
          name: step1Data.name.trim(),
          description: step1Data.description.trim(),
          icon: step1Data.icon,
        });
        setWorkspaceId(newWorkspaceId);
      }

      // Save progress for current step
      if (workspaceId) {
        const updateData: Partial<Workspace> = {};
        
        switch (currentStep) {
          case 2:
            updateData.projectType = step2Data.projectType as any;
            if (step2Data.projectType === "other") {
              updateData.projectTypeOther = step2Data.projectTypeOther;
            }
            break;
          case 3:
            updateData.platforms = step3Data.platforms;
            updateData.primaryPlatform = step3Data.primaryPlatform;
            break;
          case 4:
            updateData.growthGoals = step4Data.growthGoals;
            updateData.followerGoal = step4Data.followerGoal;
            updateData.timeframe = step4Data.timeframe;
            break;
          case 5:
            updateData.contentTypes = step5Data.contentTypes;
            updateData.contentFormats = step5Data.contentFormats;
            break;
          case 6:
            updateData.targetAudience = step6Data.targetAudience;
            break;
          case 7:
            updateData.contentThemes = step7Data.contentThemes;
            updateData.brandVoice = step7Data.brandVoice;
            break;
          case 8:
            updateData.postingFrequency = step8Data.postingFrequency;
            updateData.preferredPostingTimes = step8Data.preferredPostingTimes;
            break;
        }

        await saveOnboardingProgress(workspaceId, currentStep, updateData);
      }

      // Move to next step or complete
      if (currentStep < TOTAL_STEPS) {
        setCurrentStep(currentStep + 1);
      } else {
        // Complete onboarding
        if (workspaceId && user) {
          await completeOnboarding(workspaceId);
          await updateUserProfile(user.uid, {
            onboardingCompleted: true,
          });
          
          toast.success("Setup complete! Welcome to Organically.");
          router.push(`/workspace/${workspaceId}/dashboard`);
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
    if (workspaceId) {
      toast.info("You can complete setup later from your dashboard");
      router.push(`/workspace/${workspaceId}/dashboard`);
    } else {
      toast.error("Please complete at least the first step");
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1Basics data={step1Data} onDataChange={setStep1Data} />;
      case 2:
        return <Step2ProjectType data={step2Data} onDataChange={setStep2Data} />;
      case 3:
        return <Step3Platforms data={step3Data} onDataChange={setStep3Data} />;
      case 4:
        return <Step4GrowthGoals data={step4Data} onDataChange={setStep4Data} />;
      case 5:
        return <Step5ContentTypes data={step5Data} onDataChange={setStep5Data} />;
      case 6:
        return <Step6TargetAudience data={step6Data} onDataChange={setStep6Data} />;
      case 7:
        return <Step7ContentThemes data={step7Data} onDataChange={setStep7Data} />;
      case 8:
        return <Step8PostingSchedule data={step8Data} onDataChange={setStep8Data} />;
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


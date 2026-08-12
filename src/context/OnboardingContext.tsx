import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../services/supabase';

export interface OnboardingProfile {
  fullName: string;
  preferredName: string;
  background: string;
  roleType: string;
  goals: string;
  opportunityTypes: string[];
  theme: string;
  extensionInstalled: boolean;
}

export interface OnboardingState {
  completed: boolean;
  step: number;
  profile: OnboardingProfile;
  spotlightCompleted: boolean;
  spotlightStep: number;
}

interface OnboardingContextValue extends OnboardingState {
  loading: boolean;
  updateProfile: (patch: Partial<OnboardingProfile>) => void;
  setStep: (step: number) => void;
  setCompleted: (completed: boolean) => void;
  setSpotlightStep: (step: number) => void;
  setSpotlightCompleted: (completed: boolean) => void;
  saveProfile: (overrides?: Partial<OnboardingState>) => Promise<void>;
  resetOnboarding: () => Promise<void>;
  tips: Record<string, boolean>;
  dismissTip: (tipId: string) => Promise<void>;
  hasTip: (tipId: string) => boolean;
}

const DEFAULT_PROFILE: OnboardingProfile = {
  fullName: '',
  preferredName: '',
  background: '',
  roleType: '',
  goals: '',
  opportunityTypes: [],
  theme: 'warm',
  extensionInstalled: false,
};

const DEFAULT_STATE: OnboardingState = {
  completed: false,
  step: 0,
  profile: DEFAULT_PROFILE,
  spotlightCompleted: false,
  spotlightStep: 0,
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<OnboardingState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);
  const [tips, setTips] = useState<Record<string, boolean>>({});

  // Load profile from Supabase
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profile) {
          setState({
            completed: profile.onboarding_completed ?? false,
            step: profile.onboarding_step ?? 0,
            profile: {
              fullName: profile.full_name || '',
              preferredName: profile.preferred_name || '',
              background: profile.background || '',
              roleType: profile.role_type || '',
              goals: profile.goals || '',
              opportunityTypes: profile.opportunity_types || [],
              theme: profile.theme || 'warm',
              extensionInstalled: profile.extension_installed ?? false,
            },
            spotlightCompleted: profile.spotlight_tour_completed ?? false,
            spotlightStep: profile.spotlight_tour_step ?? 0,
          });
        }

        // Load tips
        const { data: tipsData } = await supabase
          .from('user_tips')
          .select('tip_id, dismissed')
          .eq('user_id', user.id);

        if (tipsData) {
          const tipsMap: Record<string, boolean> = {};
          for (const t of tipsData) {
            tipsMap[t.tip_id] = t.dismissed;
          }
          setTips(tipsMap);
        }
      } catch (err) {
        console.error('Failed to load onboarding state:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  const updateProfile = useCallback((patch: Partial<OnboardingProfile>) => {
    setState((prev) => ({
      ...prev,
      profile: { ...prev.profile, ...patch },
    }));
  }, []);

  const setStep = useCallback((step: number) => {
    setState((prev) => ({ ...prev, step }));
  }, []);

  const setCompleted = useCallback((completed: boolean) => {
    setState((prev) => ({ ...prev, completed }));
  }, []);

  const setSpotlightStep = useCallback((spotlightStep: number) => {
    setState((prev) => ({ ...prev, spotlightStep }));
  }, []);

  const setSpotlightCompleted = useCallback((spotlightCompleted: boolean) => {
    setState((prev) => ({ ...prev, spotlightCompleted }));
  }, []);

  const saveProfile = useCallback(async (overrides: Partial<OnboardingState> = {}) => {
    if (!user) return;
    const nextState = { ...state, ...overrides };
    const { profile, completed, step, spotlightCompleted, spotlightStep } = nextState;
    const { error } = await supabase.from('user_profiles').upsert({
      user_id: user.id,
      full_name: profile.fullName || null,
      preferred_name: profile.preferredName || null,
      background: profile.background || null,
      role_type: profile.roleType || null,
      goals: profile.goals || null,
      opportunity_types: profile.opportunityTypes.length > 0 ? profile.opportunityTypes : null,
      theme: profile.theme || null,
      onboarding_completed: completed,
      onboarding_step: step,
      extension_installed: profile.extensionInstalled,
      spotlight_tour_completed: spotlightCompleted,
      spotlight_tour_step: spotlightStep,
    }, { onConflict: 'user_id' });
    if (error) console.error('Failed to save profile:', error);
  }, [user, state]);

  const resetOnboarding = useCallback(async () => {
    if (!user) return;
    setState({
      ...DEFAULT_STATE,
      profile: { ...DEFAULT_STATE.profile },
    });
    setTips({});
    await supabase.from('user_profiles').upsert({
      user_id: user.id,
      onboarding_completed: false,
      onboarding_step: 0,
      spotlight_tour_completed: false,
      spotlight_tour_step: 0,
    }, { onConflict: 'user_id' });
    await supabase.from('user_tips').delete().eq('user_id', user.id);
  }, [user]);

  const dismissTip = useCallback(async (tipId: string) => {
    if (!user) return;
    setTips((prev) => ({ ...prev, [tipId]: true }));
    await supabase.from('user_tips').upsert({
      user_id: user.id,
      tip_id: tipId,
      dismissed: true,
    }, { onConflict: 'user_id, tip_id' });
  }, [user]);

  const hasTip = useCallback((tipId: string) => {
    return !tips[tipId];
  }, [tips]);

  return (
    <OnboardingContext.Provider
      value={{
        ...state,
        loading,
        updateProfile,
        setStep,
        setCompleted,
        setSpotlightStep,
        setSpotlightCompleted,
        saveProfile,
        resetOnboarding,
        tips,
        dismissTip,
        hasTip,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider');
  return ctx;
}

export const ONBOARDING_STEPS = [
  'Welcome',
  'Profile Basics',
  'What You Want',
  'Extension Setup',
  'Theme & Preferences',
  "You're Ready",
];

export const ROLE_TYPES = [
  'Founder',
  'Entrepreneur',
  'Builder',
  'Student',
  'Researcher',
  'Professional',
  'Freelancer',
];

export const OPPORTUNITY_TYPES = [
  'Fellowships',
  'Grants',
  'Jobs',
  'Accelerators',
  'Conferences',
  'Internships',
  'Scholarships',
  'Awards',
];

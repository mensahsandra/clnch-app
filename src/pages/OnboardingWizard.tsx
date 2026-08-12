import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding, ONBOARDING_STEPS, ROLE_TYPES, OPPORTUNITY_TYPES } from '../context/OnboardingContext';
import { useTheme } from '../context/ThemeContext';
import {
  Rocket,
  User,
  Target,
  Download,
  Palette,
  Sparkles,
  Check,
  ArrowRight,
  ArrowLeft,
  SkipForward,
  Monitor,
  Globe,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

const STEP_ICONS = [Rocket, User, Target, Download, Palette, Sparkles];

const THEMES = [
  { id: 'warm' as const, label: 'Warm Cream', description: 'Soft, warm tones.', swatches: ['#FDFBF7', '#F5F2ED', '#EBE8E2'] },
  { id: 'forest' as const, label: 'Forest', description: 'Deep greens and sage.', swatches: ['#d3d6d1', '#bcd1ca', '#0a1611'] },
  { id: 'clay' as const, label: 'Clay', description: 'Warm terracotta & earth.', swatches: ['#c3b6a9', '#655b4d', '#d4b096'] },
  { id: 'system' as const, label: 'System', description: 'Follows your OS setting.', swatches: ['#f0f0f0', '#888888', '#1a1a1a'] },
];

export default function OnboardingWizard() {
  const { profile, step, setStep, setCompleted, updateProfile, saveProfile } = useOnboarding();
  const { setTheme: setAppTheme } = useTheme();
  const navigate = useNavigate();
  const [animating, setAnimating] = useState(false);
  const [extensionStep, setExtensionStep] = useState(0);
  const [language, setLanguage] = useState('English');
  const [calendarSync, setCalendarSync] = useState(false);

  const totalSteps = ONBOARDING_STEPS.length;
  const Icon = STEP_ICONS[step];

  const handleStep = useCallback(
    async (nextStep: number) => {
      if (animating) return;
      setAnimating(true);
      setStep(nextStep);
      await saveProfile({ step: nextStep });
      setTimeout(() => setAnimating(false), 400);
    },
    [animating, setStep, saveProfile]
  );

  const handleNext = useCallback(() => {
    if (step < totalSteps - 1) {
      handleStep(step + 1);
    }
  }, [step, totalSteps, handleStep]);

  const handleBack = useCallback(() => {
    if (step > 0) {
      handleStep(step - 1);
    }
  }, [step, handleStep]);

  const handleSkip = useCallback(async () => {
    setCompleted(true);
    await saveProfile({ completed: true });
    navigate('/');
  }, [setCompleted, saveProfile, navigate]);

  const handleFinish = useCallback(async () => {
    setCompleted(true);
    await saveProfile({ completed: true });
    navigate('/');
  }, [setCompleted, saveProfile, navigate]);

  const handleThemeSelect = useCallback(
    (themeId: string) => {
      updateProfile({ theme: themeId });
      setAppTheme(themeId as 'warm' | 'forest' | 'clay' | 'system');
    },
    [updateProfile, setAppTheme]
  );

  const handleRoleToggle = useCallback(
    (role: string) => {
      const current = profile.roleType;
      updateProfile({ roleType: current === role ? '' : role });
    },
    [profile.roleType, updateProfile]
  );

  const handleOppTypeToggle = useCallback(
    (type: string) => {
      const current = profile.opportunityTypes;
      if (current.includes(type)) {
        updateProfile({ opportunityTypes: current.filter((t) => t !== type) });
      } else {
        updateProfile({ opportunityTypes: [...current, type] });
      }
    },
    [profile.opportunityTypes, updateProfile]
  );

  const handleExtensionInstalled = useCallback(() => {
    updateProfile({ extensionInstalled: true });
    setExtensionStep(1);
  }, [updateProfile]);

  useEffect(() => {
    if (profile.theme) {
      setAppTheme(profile.theme as 'warm' | 'forest' | 'clay' | 'system');
    }
  }, [profile.theme, setAppTheme]);

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-card-border z-50">
        <div
          className="h-full bg-burnt-orange transition-all duration-300 ease-out"
          style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
        />
      </div>

      {/* Step counter */}
      <div className="fixed top-4 right-6 z-50 text-xs text-slate font-medium">
        Step {step + 1} of {totalSteps}
      </div>

      {/* Skip button */}
      {step < totalSteps - 1 && (
        <button
          onClick={handleSkip}
          className="fixed top-4 left-6 z-50 flex items-center gap-1.5 text-xs text-slate hover:text-burnt-orange transition-colors"
        >
          <SkipForward className="w-3.5 h-3.5" />
          Skip for now
        </button>
      )}

      {/* Main card */}
      <div className="w-full max-w-lg">
        {/* Step header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-burnt-orange/10 rounded-2xl flex items-center justify-center mx-auto mb-3 animate-fade-in">
            <Icon className="w-7 h-7 text-burnt-orange" />
          </div>
          <h1 className="text-xl font-bold text-charcoal animate-fade-in">
            {ONBOARDING_STEPS[step]}
          </h1>
        </div>

        {/* Step content */}
        <div className="bg-card-white border border-card-border rounded-2xl p-6 shadow-sm min-h-[320px] overflow-hidden">
          <div className={`transition-all duration-300 ${animating ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}`}>
            {/* Step 1: Welcome */}
            {step === 0 && (
              <div className="text-center py-4">
                <p className="text-sm text-slate leading-relaxed mb-6">
                  CLNCH helps you discover, track, and apply to opportunities that matter.
                  From fellowships to grants, accelerators to jobs — we keep your pipeline
                  organized and your deadlines in check.
                </p>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {[
                    { icon: Target, label: 'Track Opportunities', desc: 'Never miss a deadline' },
                    { icon: Monitor, label: 'Monitor Changes', desc: 'Watch for updates' },
                    { icon: Globe, label: 'Fast Capture', desc: 'Clip any link instantly' },
                    { icon: Calendar, label: 'AI Coaching', desc: 'Write better applications' },
                  ].map(({ icon: I, label, desc }) => (
                    <div key={label} className="bg-cream-fill rounded-xl p-3 text-left">
                      <I className="w-4 h-4 text-burnt-orange mb-1.5" />
                      <p className="text-xs font-semibold text-charcoal">{label}</p>
                      <p className="text-[10px] text-slate">{desc}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate/70">
                  Let's get your profile set up. This takes about 2 minutes.
                </p>
              </div>
            )}

            {/* Step 2: Profile Basics */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate mb-1 block">Full Name</label>
                  <input
                    value={profile.fullName}
                    onChange={(e) => updateProfile({ fullName: e.target.value })}
                    className="input-field"
                    placeholder="e.g. Sandra Mensah"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate mb-1 block">Preferred Name</label>
                  <input
                    value={profile.preferredName}
                    onChange={(e) => updateProfile({ preferredName: e.target.value })}
                    className="input-field"
                    placeholder="What should we call you?"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate mb-1 block">Background Summary</label>
                  <textarea
                    value={profile.background}
                    onChange={(e) => updateProfile({ background: e.target.value })}
                    className="input-field resize-none"
                    rows={3}
                    placeholder="Describe your professional background, current role, and areas of focus..."
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate mb-2 block">Your Role</label>
                  <div className="flex flex-wrap gap-2">
                    {ROLE_TYPES.map((role) => (
                      <button
                        key={role}
                        onClick={() => handleRoleToggle(role)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                          profile.roleType === role
                            ? 'bg-burnt-orange text-white border-burnt-orange'
                            : 'bg-card-white text-slate border-card-border hover:bg-cream-fill'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: What You Want */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate mb-2 block">
                    What types of opportunities are you looking for?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {OPPORTUNITY_TYPES.map((type) => (
                      <button
                        key={type}
                        onClick={() => handleOppTypeToggle(type)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border flex items-center gap-1.5 ${
                          profile.opportunityTypes.includes(type)
                            ? 'bg-burnt-orange text-white border-burnt-orange'
                            : 'bg-card-white text-slate border-card-border hover:bg-cream-fill'
                        }`}
                      >
                        {profile.opportunityTypes.includes(type) && (
                          <CheckCircle2 className="w-3 h-3" />
                        )}
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate mb-1 block">Goals & Aspirations</label>
                  <textarea
                    value={profile.goals}
                    onChange={(e) => updateProfile({ goals: e.target.value })}
                    className="input-field resize-none"
                    rows={3}
                    placeholder="e.g. Apply to 3 fellowships, secure funding for my startup, land a senior role..."
                  />
                </div>
              </div>
            )}

            {/* Step 4: Extension Setup */}
            {step === 3 && (
              <div className="space-y-4">
                {extensionStep === 0 ? (
                  <>
                    <p className="text-sm text-slate leading-relaxed">
                      The CLNCH Chrome extension lets you capture any opportunity link directly from
                      your browser with one click. No more copy-pasting URLs.
                    </p>
                    <div className="bg-cream-fill rounded-xl p-4 space-y-3">
                      <p className="text-xs font-semibold text-charcoal">How to install:</p>
                      <ol className="space-y-2 text-xs text-slate">
                        <li className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-burnt-orange/10 text-burnt-orange text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                          Download the CLNCH extension ZIP from your account.
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-burnt-orange/10 text-burnt-orange text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                          Unzip the file and open chrome://extensions in your browser.
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-burnt-orange/10 text-burnt-orange text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                          Enable "Developer mode" and click "Load unpacked".
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-burnt-orange/10 text-burnt-orange text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
                          Select the unzipped CLNCH extension folder.
                        </li>
                      </ol>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleExtensionInstalled}
                        className="btn-primary flex-1 text-sm py-2.5"
                      >
                        <Check className="w-4 h-4 inline mr-1" />
                        I've installed it
                      </button>
                      <button
                        onClick={() => setExtensionStep(2)}
                        className="flex-1 py-2.5 px-4 border border-card-border rounded-lg text-sm font-medium text-slate hover:bg-cream-fill transition-colors"
                      >
                        Skip for now
                      </button>
                    </div>
                  </>
                ) : extensionStep === 1 ? (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="text-sm font-semibold text-charcoal mb-1">Extension installed!</p>
                    <p className="text-xs text-slate">
                      You can always install it later from Settings if you skipped it.
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 bg-cream-fill rounded-full flex items-center justify-center mx-auto mb-4">
                      <Download className="w-8 h-8 text-slate" />
                    </div>
                    <p className="text-sm font-semibold text-charcoal mb-1">You can install it later</p>
                    <p className="text-xs text-slate">
                      Go to Settings → Connectors to install the extension anytime.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 5: Theme & Preferences */}
            {step === 4 && (
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-medium text-slate mb-2 block">Choose a theme</label>
                  <div className="grid grid-cols-2 gap-3">
                    {THEMES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => handleThemeSelect(t.id)}
                        className={`relative p-3 rounded-xl border-2 text-left transition-all duration-200 ${
                          profile.theme === t.id
                            ? 'border-burnt-orange shadow-sm shadow-burnt-orange/20'
                            : 'border-card-border hover:border-card-border/80 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex gap-1 mb-2">
                          {t.swatches.map((color, i) => (
                            <div
                              key={i}
                              className="h-5 rounded-md flex-1 border border-black/5"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <p className="text-xs font-semibold text-charcoal">{t.label}</p>
                        <p className="text-[10px] text-slate mt-0.5">{t.description}</p>
                        {profile.theme === t.id && (
                          <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-burnt-orange flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate mb-1.5 block">Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="input-field"
                  >
                    {['English', 'French', 'Spanish', 'Portuguese', 'Arabic', 'Swahili', 'Hausa', 'Yoruba'].map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-charcoal">Sync Deadline Reminders</p>
                    <p className="text-xs text-slate">Add application deadlines to your calendar</p>
                  </div>
                  <button
                    onClick={() => setCalendarSync(!calendarSync)}
                    className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
                      calendarSync ? 'bg-burnt-orange' : 'bg-card-border'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                        calendarSync ? 'translate-x-5' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* Step 6: You're Ready */}
            {step === 5 && (
              <div className="text-center py-4">
                <div className="w-20 h-20 bg-burnt-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-10 h-10 text-burnt-orange" />
                </div>
                <p className="text-lg font-bold text-charcoal mb-2">You're all set, {profile.preferredName || 'there'}!</p>
                <p className="text-sm text-slate leading-relaxed mb-6">
                  Here's what you can do with CLNCH:
                </p>
                <div className="space-y-2 mb-6">
                  {[
                    'Capture any opportunity with a link or Ctrl+Shift+V',
                    'Track your pipeline and never miss a deadline',
                    'Monitor opportunity pages for changes',
                    'Get AI coaching for your applications',
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-charcoal text-left">
                      <div className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-green-600" />
                      </div>
                      {item}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate/70 mb-4">
                  A quick tour will guide you through the app. You can skip it anytime.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={handleBack}
            disabled={step === 0}
            className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
              step === 0 ? 'text-slate/30 cursor-not-allowed' : 'text-slate hover:text-charcoal'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {step === totalSteps - 1 ? (
            <button onClick={handleFinish} className="btn-primary flex items-center gap-2 text-sm py-2.5 px-6">
              Start Building
              <Rocket className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleNext} className="btn-primary flex items-center gap-2 text-sm py-2.5 px-6">
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

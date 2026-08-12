import { useCallback, useEffect, useState, useRef } from 'react';
import { useOnboarding } from '../context/OnboardingContext';
import { X, ArrowRight, ArrowLeft, RotateCcw, MapPin } from 'lucide-react';

export interface TourStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

export const DEFAULT_TOUR_STEPS: TourStep[] = [
  {
    id: 'pipeline',
    title: 'Your Pipeline',
    description: 'All your captured opportunities live here, organized by status. This is your Found page.',
    targetSelector: '[data-tour="pipeline"]',
    placement: 'bottom',
  },
  {
    id: 'fast-capture',
    title: 'Fast Capture',
    description: 'Copy any opportunity link, then press Ctrl+Shift+V or click this button to capture it instantly.',
    targetSelector: '[data-tour="fast-capture"]',
    placement: 'left',
  },
  {
    id: 'discover',
    title: 'Discover',
    description: 'Find new opportunities in our curated Discover feed. Browse by category, region, or deadline.',
    targetSelector: '[data-tour="discover"]',
    placement: 'right',
  },
  {
    id: 'detail-panel',
    title: 'Opportunity Details',
    description: 'Click any card to see full details, requirements, and start your application.',
    targetSelector: '[data-tour="detail-panel"]',
    placement: 'left',
  },
  {
    id: 'chats',
    title: 'AI Coaching',
    description: 'Use the AI Chat to get help writing applications, answers, and cover letters.',
    targetSelector: '[data-tour="chats"]',
    placement: 'right',
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'Customize your profile, preferences, themes, and connectors anytime.',
    targetSelector: '[data-tour="settings"]',
    placement: 'right',
  },
];

interface SpotlightTourProps {
  steps?: TourStep[];
  onComplete?: () => void;
  onSkip?: () => void;
}

export default function SpotlightTour({ steps = DEFAULT_TOUR_STEPS, onComplete, onSkip }: SpotlightTourProps) {
  const { spotlightStep, spotlightCompleted, setSpotlightStep, setSpotlightCompleted, saveProfile } = useOnboarding();
  const [active, setActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(spotlightStep);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const stepRef = useRef(currentStep);
  stepRef.current = currentStep;
  const completedRef = useRef(spotlightCompleted);

  // Only activate once, after profile has loaded and tour hasn't been completed
  useEffect(() => {
    if (!spotlightCompleted && !completedRef.current) {
      const timer = setTimeout(() => setActive(true), 600);
      return () => clearTimeout(timer);
    }
  }, [spotlightCompleted]);

  const totalSteps = steps.length;
  const step = steps[currentStep];

  const updateTarget = useCallback(() => {
    if (!step) return;
    const el = document.querySelector(step.targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
      calculateTooltipPos(rect, step.placement || 'bottom');
    } else {
      setTargetRect(null);
    }
  }, [step]);

  const calculateTooltipPos = (rect: DOMRect, placement: string) => {
    const tooltipWidth = 320;
    const tooltipHeight = 160;
    const padding = 16;
    let x = 0;
    let y = 0;

    switch (placement) {
      case 'bottom':
        x = rect.left + rect.width / 2 - tooltipWidth / 2;
        y = rect.bottom + padding;
        break;
      case 'top':
        x = rect.left + rect.width / 2 - tooltipWidth / 2;
        y = rect.top - tooltipHeight - padding;
        break;
      case 'left':
        x = rect.left - tooltipWidth - padding;
        y = rect.top + rect.height / 2 - tooltipHeight / 2;
        break;
      case 'right':
        x = rect.right + padding;
        y = rect.top + rect.height / 2 - tooltipHeight / 2;
        break;
      default:
        x = rect.left + rect.width / 2 - tooltipWidth / 2;
        y = rect.bottom + padding;
    }

    x = Math.max(padding, Math.min(x, window.innerWidth - tooltipWidth - padding));
    y = Math.max(padding, Math.min(y, window.innerHeight - tooltipHeight - padding));

    setTooltipPos({ x, y });
  };

  useEffect(() => {
    if (!active) return;
    updateTarget();
    const handleResize = () => updateTarget();
    const handleScroll = () => updateTarget();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [active, updateTarget]);

  const handleNext = useCallback(async () => {
    if (currentStep < totalSteps - 1) {
      const next = currentStep + 1;
      setCurrentStep(next);
      setSpotlightStep(next);
      await saveProfile({ spotlightStep: next });
    } else {
      setSpotlightCompleted(true);
      setActive(false);
      await saveProfile({ spotlightCompleted: true, spotlightStep: totalSteps - 1 });
      onComplete?.();
    }
  }, [currentStep, totalSteps, setSpotlightStep, setSpotlightCompleted, saveProfile, onComplete]);

  const handleBack = useCallback(async () => {
    if (currentStep > 0) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      setSpotlightStep(prev);
      await saveProfile();
    }
  }, [currentStep, setSpotlightStep, saveProfile]);

  const handleSkip = useCallback(async () => {
    setSpotlightCompleted(true);
    setActive(false);
    await saveProfile({ spotlightCompleted: true });
    onSkip?.();
  }, [setSpotlightCompleted, saveProfile, onSkip]);

  const handleRestart = useCallback(() => {
    setCurrentStep(0);
    setSpotlightStep(0);
    setSpotlightCompleted(false);
    setActive(true);
  }, [setSpotlightStep, setSpotlightCompleted]);

  if (!active || !step) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Dark overlay with cutout */}
      <svg className="absolute inset-0 w-full h-full pointer-events-auto">
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - 4}
                y={targetRect.top - 4}
                width={targetRect.width + 8}
                height={targetRect.height + 8}
                rx={8}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#spotlight-mask)" />
      </svg>

      {/* Highlight border around target */}
      {targetRect && (
        <div
          className="absolute pointer-events-auto border-2 border-burnt-orange rounded-lg shadow-lg shadow-burnt-orange/20 transition-all duration-300"
          style={{
            left: targetRect.left - 4,
            top: targetRect.top - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className="absolute pointer-events-auto bg-card-white border border-card-border rounded-xl shadow-2xl p-4 w-80 transition-all duration-300"
        style={{ left: tooltipPos.x, top: tooltipPos.y }}
      >
        {/* Step indicator */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-burnt-orange/10 flex items-center justify-center">
              <MapPin className="w-3 h-3 text-burnt-orange" />
            </div>
            <span className="text-xs font-semibold text-burnt-orange">
              Step {currentStep + 1} of {totalSteps}
            </span>
          </div>
          <button
            onClick={handleSkip}
            className="text-slate/50 hover:text-slate transition-colors pointer-events-auto"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <h3 className="text-sm font-bold text-charcoal mb-1.5">{step.title}</h3>
        <p className="text-xs text-slate leading-relaxed mb-4">{step.description}</p>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5 mb-4">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i <= currentStep ? 'bg-burnt-orange w-4' : 'bg-card-border w-1.5'
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className={`flex items-center gap-1 text-xs font-medium transition-colors ${
              currentStep === 0 ? 'text-slate/20 cursor-not-allowed' : 'text-slate hover:text-charcoal'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSkip}
              className="text-xs text-slate hover:text-charcoal transition-colors"
            >
              Skip tour
            </button>
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-burnt-orange text-white text-xs font-semibold rounded-lg hover:bg-burnt-orange/90 transition-colors"
            >
              {currentStep === totalSteps - 1 ? 'Finish' : 'Next'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TourRestartButton({ onClick }: { onClick?: () => void }) {
  const { spotlightCompleted, setSpotlightCompleted, setSpotlightStep, saveProfile } = useOnboarding();

  const handleRestart = useCallback(async () => {
    setSpotlightStep(0);
    setSpotlightCompleted(false);
    await saveProfile({ spotlightCompleted: false, spotlightStep: 0 });
    onClick?.();
  }, [setSpotlightStep, setSpotlightCompleted, saveProfile, onClick]);

  if (!spotlightCompleted) return null;

  return (
    <button
      onClick={handleRestart}
      className="flex items-center gap-2 text-xs text-slate hover:text-burnt-orange transition-colors"
    >
      <RotateCcw className="w-3.5 h-3.5" />
      Restart tour
    </button>
  );
}

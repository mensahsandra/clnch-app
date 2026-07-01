import { useEffect, useState } from 'react';
import { useOnboarding } from '../context/OnboardingContext';
import { X, Lightbulb } from 'lucide-react';

export interface QuickTipDef {
  id: string;
  message: string;
  target: string;
  condition?: () => boolean;
}

export const QUICK_TIPS: QuickTipDef[] = [
  {
    id: 'paste-capture',
    message: 'Did you know? Press Ctrl/Cmd + Shift + V to paste-capture a URL from anywhere.',
    target: 'fast-capture',
  },
  {
    id: 'monitor-opp',
    message: 'Click the "Monitor" button on any card to watch for deadline or eligibility changes.',
    target: 'monitor',
  },
  {
    id: 'ai-chat',
    message: 'Use the AI Chat to get help writing your application answers.',
    target: 'chats',
  },
  {
    id: 'detail-click',
    message: 'Click any opportunity card to open the detail panel and start applying.',
    target: 'detail-panel',
  },
];

interface QuickTipProps {
  tipId: string;
  className?: string;
}

export default function QuickTip({ tipId, className = '' }: QuickTipProps) {
  const { hasTip, dismissTip } = useOnboarding();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const show = hasTip(tipId);

  useEffect(() => {
    if (!show || dismissed) {
      setVisible(false);
      return;
    }
    const timer = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(timer);
  }, [show, dismissed]);

  const handleDismiss = async () => {
    setVisible(false);
    setDismissed(true);
    await dismissTip(tipId);
  };

  if (!visible) return null;

  return (
    <div
      className={`relative inline-flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 shadow-sm animate-tip-in ${className}`}
    >
      <Lightbulb className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
      <p className="text-xs text-amber-800 leading-snug">
        {QUICK_TIPS.find((t) => t.id === tipId)?.message}
      </p>
      <button
        onClick={handleDismiss}
        className="text-amber-600/50 hover:text-amber-700 transition-colors flex-shrink-0 mt-0.5"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

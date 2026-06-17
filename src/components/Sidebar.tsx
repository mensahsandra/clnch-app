import { useState, useRef } from 'react';
import {
  X,
  Settings,
  Copy,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Clock,
  Flame,
  Building2,
  Link as LinkIcon,
  FileText,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import VoiceProfileCapture from './VoiceProfileCapture';

interface SidebarProps {
  onClose: () => void;
  onOpenCapture: () => void;
}

interface Opportunity {
  link: string;
  organization: string;
  requirements: string[];
}

const defaultOpportunity: Opportunity = {
  link: 'https://example.com/fellowship-program-2024',
  organization: 'TechForward Institute',
  requirements: [
    'Graduate or postgraduate student status',
    'Minimum 3.5 GPA',
    'Research focus in AI/ML or sustainability',
    'Two letters of recommendation',
    'Personal statement (500 words max)',
    'CV/Resume submission',
  ],
};

const aiResponse = `Based on your profile and this opportunity, here's a tailored approach:

Your background in machine learning aligns well with their research focus. I recommend emphasizing your recent project on sustainable AI models in your personal statement.

The deadline is tight — prioritize getting your recommenders confirmed this week. Draft your personal statement focusing on how your research interests intersect with the Institute's sustainability initiatives.

Key differentiator: They value interdisciplinary work, so highlight any cross-domain projects or collaborations.`;

export default function Sidebar({ onClose }: SidebarProps) {
  const [opportunity, setOpportunity] = useState<Opportunity>(defaultOpportunity);
  const [requirementsExpanded, setRequirementsExpanded] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFiled, setIsFiled] = useState(false);
  const [copied, setCopied] = useState(false);

  const voiceRef = useRef<HTMLDivElement>(null);

  const handleMarkAsFiled = async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsFiled(true);
  };

  const handleCopyDraft = () => {
    navigator.clipboard.writeText(aiResponse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scrollToVoice = () => {
    voiceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="fixed right-0 top-0 h-screen w-[360px] bg-cream shadow-2xl z-50 flex flex-col animate-slide-in">
      {/* Sticky Header */}
      <header className="sticky top-0 bg-cream/95 backdrop-blur-sm z-10 px-4 py-3 border-b border-card-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-burnt-orange to-orange-400 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-charcoal font-bold text-lg tracking-wide uppercase">
              CLNCH
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              className="p-2 rounded-lg hover:bg-cream-fill transition-colors"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4 text-slate" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-cream-fill transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4 text-slate" />
            </button>
          </div>
        </div>
      </header>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-4">
        {/* Live Metadata Badges */}
        <div className="grid grid-cols-2 gap-2">
          <div className="card px-3 py-2.5 flex items-center gap-2">
            <Clock className="w-4 h-4 text-burnt-orange" />
            <div>
              <div className="text-xs text-slate font-medium">Days Left</div>
              <div className="text-charcoal font-semibold text-sm">12 Days</div>
            </div>
          </div>
          <div className="card px-3 py-2.5 flex items-center gap-2">
            <Flame className="w-4 h-4 text-burnt-orange" />
            <div>
              <div className="text-xs text-slate font-medium">Urgency</div>
              <div className="text-charcoal font-semibold text-sm">High</div>
            </div>
          </div>
        </div>

        {/* Opportunity Link */}
        <div className="card p-3 space-y-1.5">
          <label className="text-xs font-medium text-slate flex items-center gap-1.5">
            <LinkIcon className="w-3.5 h-3.5" />
            Opportunity Link
          </label>
          <input
            type="url"
            value={opportunity.link}
            onChange={(e) =>
              setOpportunity({ ...opportunity, link: e.target.value })
            }
            className="input-field text-xs"
          />
        </div>

        {/* Organization */}
        <div className="card p-3 space-y-1.5">
          <label className="text-xs font-medium text-slate flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" />
            Organization/Issuer
          </label>
          <input
            type="text"
            value={opportunity.organization}
            onChange={(e) =>
              setOpportunity({ ...opportunity, organization: e.target.value })
            }
            className="input-field"
          />
        </div>

        {/* Extracted Requirements */}
        <div className="card overflow-hidden">
          <button
            onClick={() => setRequirementsExpanded(!requirementsExpanded)}
            className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-cream-fill/50 transition-colors"
          >
            <span className="text-xs font-medium text-slate flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Extracted Requirements
              <span className="text-xs text-slate/60">
                ({opportunity.requirements.length})
              </span>
            </span>
            {requirementsExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate" />
            )}
          </button>
          {requirementsExpanded && (
            <div className="px-3 pb-3 space-y-1.5">
              {opportunity.requirements.map((req, index) => (
                <div key={index} className="flex items-start gap-2 text-sm text-charcoal">
                  <span className="text-burnt-orange mt-0.5">&#8226;</span>
                  <span>{req}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Coach Chat Box */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-burnt-orange to-orange-400 rounded-md flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-medium text-charcoal">AI Coach</span>
          </div>
          <div className="text-sm text-charcoal/90 leading-relaxed whitespace-pre-line">
            {aiResponse}
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleCopyDraft}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-cream-fill text-sm font-medium text-charcoal hover:bg-cream-fill/80 transition-colors"
            >
              {copied ? (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copied ? 'Copied!' : 'Copy Draft'}
            </button>
            <button
              onClick={scrollToVoice}
              className="p-2 rounded-lg bg-cream-fill text-charcoal hover:bg-burnt-orange/10 hover:text-burnt-orange transition-colors"
              aria-label="Open voice profile"
              title="Calibrate your voice profile"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            </button>
          </div>
        </div>

        {/* Voice Profile Capture */}
        <div ref={voiceRef}>
          <VoiceProfileCapture />
        </div>
      </div>

      {/* Fixed Bottom Action Button */}
      <div className="sticky bottom-0 bg-cream/95 backdrop-blur-sm border-t border-card-border px-4 py-3">
        <button
          onClick={handleMarkAsFiled}
          disabled={isSubmitting || isFiled}
          className={`btn-primary flex items-center justify-center gap-2 ${
            isFiled ? 'bg-green-600 hover:bg-green-600' : ''
          }`}
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isFiled ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : null}
          {isSubmitting
            ? 'Processing...'
            : isFiled
            ? 'Filed Successfully'
            : 'Mark as Filed'}
        </button>
      </div>
    </div>
  );
}

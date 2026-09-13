import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
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
  Maximize2,
  ExternalLink,
  MapPin,
  Mail,
  Send,
  Mic,
  MicOff,
  ArrowUpRight,
  Target,
  AlertCircle,
} from 'lucide-react';
import { type Opportunity } from '../types';
import { chatWithAssistant, assessFit, type AssessmentResult } from '../services/intelligenceService';

interface RightPanelProps {
  opp?: Opportunity;
  onClose: () => void;
  panelWidth: number;
  onWidthChange: (w: number) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  fellowship: 'Fellowship',
  grant: 'Grant',
  accelerator: 'Accelerator',
  job: 'Job',
  conference: 'Conference',
  internship: 'Internship',
  events: 'Events',
};

const STATUS_LABELS: Record<string, string> = {
  saved: 'Saved',
  pending: 'Pending',
  in_progress: 'In Progress',
  applied: 'Applied',
  shortlisted: 'Shortlisted',
  rejected: 'Rejected',
  awarded: 'Awarded',
  filed: 'Filed',
  archived: 'Archived',
};

const STATUS_COLORS: Record<string, string> = {
  saved: 'bg-slate/10 text-slate',
  pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  in_progress: 'bg-blue-50 text-blue-700 border border-blue-200',
  applied: 'bg-blue-100 text-blue-800',
  shortlisted: 'bg-green-50 text-green-700 border border-green-200',
  rejected: 'bg-red-50 text-red-600',
  awarded: 'bg-green-100 text-green-700',
  filed: 'bg-green-50 text-green-700',
  archived: 'bg-slate/10 text-slate',
};

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

export default function RightPanel({ opp, onClose, panelWidth, onWidthChange }: RightPanelProps) {
  const [requirementsExpanded, setRequirementsExpanded] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFiled, setIsFiled] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: `I've reviewed the requirements for this opportunity. What aspect would you like help with — personal statement, recommenders, or your research focus?`,
      createdAt: new Date(Date.now() - 60000),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatTyping, setIsChatTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null);
  const [assessing, setAssessing] = useState(false);
  const [assessError, setAssessError] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const opportunity: Opportunity = opp ?? {
    id: 'demo',
    title: 'No opportunity selected',
    org: '—',
    category: 'fellowship',
    status: 'saved',
    urgency: 'Low',
    daysLeft: 30,
  };

  useEffect(() => {
    const el = chatContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chatMessages, isChatTyping]);

  useEffect(() => {
    scrollContainerRef.current?.scrollTo({ top: 0 });
    setAssessment(null);
    setAssessError(null);
  }, [opp?.id]);

  const handleMarkAsFiled = async () => {
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1200));
    setIsSubmitting(false);
    setIsFiled(true);
  };

  const handleApplyNow = () => {
    if (opportunity.link) {
      window.open(opportunity.link, '_blank');
    }
    window.postMessage({ type: 'CLNCH_ACTIVATE_ON_TAB', payload: { url: opportunity.link } }, '*');
  };

  const handleAssess = async () => {
    if (assessing || !opp) return;
    setAssessing(true);
    setAssessError(null);
    try {
      const result = await assessFit({
        title: opportunity.title,
        org: opportunity.org,
        category: opportunity.category,
        deadline: opportunity.deadline,
        requirements: opportunity.requirements,
        description: opportunity.description,
        location: opportunity.location,
        link: opportunity.link,
      });
      setAssessment(result.assessment);
    } catch (err) {
      setAssessError(err instanceof Error ? err.message : 'Assessment failed');
    } finally {
      setAssessing(false);
    }
  };

  const handleChatSend = async () => {
    const text = chatInput.trim();
    if (!text || isChatTyping || !opp) return;

    setChatError(null);
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      createdAt: new Date(),
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsChatTyping(true);

    try {
      const conversationHistory = chatMessages.map((m) => ({ role: m.role, content: m.content }));
      const result = await chatWithAssistant(
        text,
        {
          title: opportunity.title,
          org: opportunity.org,
          category: opportunity.category,
          deadline: opportunity.deadline,
          requirements: opportunity.requirements,
          description: opportunity.description,
          location: opportunity.location,
          link: opportunity.link,
        },
        conversationHistory
      );

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.reply,
        createdAt: new Date(),
      };
      setChatMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get response';
      setChatError(errorMsg);
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I ran into an issue: ${errorMsg}. Please try again.`,
        createdAt: new Date(),
      };
      setChatMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setIsChatTyping(false);
    }
  };

  const toggleMic = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SR =
      (window as typeof window & { SpeechRecognition?: typeof globalThis.SpeechRecognition; webkitSpeechRecognition?: typeof globalThis.SpeechRecognition })
        .SpeechRecognition ??
      (window as typeof window & { webkitSpeechRecognition?: typeof globalThis.SpeechRecognition })
        .webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = Array.from(e.results).map((r) => r[0].transcript).join('');
      setChatInput(transcript);
    };
    rec.onend = () => setIsListening(false);
    rec.start();
    recognitionRef.current = rec;
    setIsListening(true);
  };

  const daysLeftNum = opportunity.daysLeft ?? (
    opportunity.deadline
      ? Math.max(0, Math.ceil((new Date(opportunity.deadline).getTime() - Date.now()) / 86400000))
      : null
  );

  const fitColor = assessment?.fit_rating === 'strong' ? 'text-green-600' : assessment?.fit_rating === 'moderate' ? 'text-amber-600' : 'text-red-600';
  const fitBg = assessment?.fit_rating === 'strong' ? 'bg-green-50 border-green-200' : assessment?.fit_rating === 'moderate' ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';

  return (
    <div className="h-full flex flex-col relative" data-tour="detail-panel">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-cream-fill transition-colors z-10"
      >
        <X className="w-4 h-4 text-slate" />
      </button>

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="px-4 pt-4 pb-2 space-y-3">

          {/* Opportunity title */}
          <div className="min-w-0">
            <h2 className="text-[15px] font-bold text-charcoal leading-snug mb-2">
              {opportunity.title}
            </h2>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-burnt-orange/10 text-burnt-orange">
                {CATEGORY_LABELS[opportunity.category] ?? opportunity.category}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_COLORS[opportunity.status] ?? 'bg-gray-100 text-slate'}`}>
                {STATUS_LABELS[opportunity.status] ?? opportunity.status}
              </span>
            </div>
          </div>

          {/* Deadline & Urgency */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-cream rounded-lg px-3 py-2.5">
              <p className="text-[10px] text-slate font-medium uppercase tracking-wide mb-0.5">Deadline</p>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-burnt-orange flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-charcoal truncate">
                    {opportunity.deadline ?? '—'}
                  </p>
                  {daysLeftNum !== null && (
                    <p className="text-[10px] text-slate">{daysLeftNum} days remaining</p>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-cream rounded-lg px-3 py-2.5">
              <p className="text-[10px] text-slate font-medium uppercase tracking-wide mb-0.5">Urgency</p>
              <div className="flex items-center gap-1.5">
                <Flame className={`w-3.5 h-3.5 flex-shrink-0 ${
                  opportunity.urgency === 'High' ? 'text-red-500' :
                  opportunity.urgency === 'Medium' ? 'text-amber-500' : 'text-green-500'
                }`} />
                <p className={`text-xs font-semibold ${
                  opportunity.urgency === 'High' ? 'text-red-600' :
                  opportunity.urgency === 'Medium' ? 'text-amber-600' : 'text-green-600'
                }`}>
                  {opportunity.urgency}
                </p>
              </div>
            </div>
          </div>

          {/* Organization */}
          <div className="bg-card-white border border-card-border rounded-lg p-3">
            <p className="text-[10px] text-slate font-medium uppercase tracking-wide flex items-center gap-1.5 mb-1">
              <Building2 className="w-3 h-3" />
              Organization / Issuer
            </p>
            <p className="text-sm font-semibold text-charcoal">{opportunity.org}</p>
          </div>

          {/* Description */}
          {opportunity.description && (
            <div className="bg-card-white border border-card-border rounded-lg p-3">
              <p className="text-[10px] text-slate font-medium uppercase tracking-wide mb-1">Summary</p>
              <p className="text-xs text-charcoal leading-relaxed">{opportunity.description}</p>
            </div>
          )}

          {/* Source Link */}
          {opportunity.link && (
            <div className="bg-card-white border border-card-border rounded-lg p-3">
              <p className="text-[10px] text-slate font-medium uppercase tracking-wide flex items-center gap-1.5 mb-1">
                <LinkIcon className="w-3 h-3" />
                Opportunity Link
              </p>
              <a
                href={opportunity.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-burnt-orange hover:underline flex items-center gap-1 break-all"
              >
                {opportunity.link}
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
              </a>
            </div>
          )}

          {/* Requirements */}
          {opportunity.requirements && opportunity.requirements.length > 0 && (
            <div className="bg-card-white border border-card-border rounded-lg overflow-hidden">
              <button
                onClick={() => setRequirementsExpanded(!requirementsExpanded)}
                className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-cream-fill/50 transition-colors"
              >
                <span className="text-[10px] font-medium text-slate uppercase tracking-wide flex items-center gap-1.5">
                  <FileText className="w-3 h-3" />
                  Requirements ({opportunity.requirements.length})
                </span>
                {requirementsExpanded
                  ? <ChevronUp className="w-3.5 h-3.5 text-slate" />
                  : <ChevronDown className="w-3.5 h-3.5 text-slate" />
                }
              </button>
              {requirementsExpanded && (
                <div className="px-3 pb-3 space-y-1.5">
                  {opportunity.requirements.map((req, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-burnt-orange flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-charcoal">{req}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Location & Contact */}
          {(opportunity.location || opportunity.contact) && (
            <div className="bg-card-white border border-card-border rounded-lg p-3 space-y-2">
              {opportunity.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate flex-shrink-0" />
                  <span className="text-xs text-charcoal">{opportunity.location}</span>
                </div>
              )}
              {opportunity.contact && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate flex-shrink-0" />
                  <a href={`mailto:${opportunity.contact}`} className="text-xs text-burnt-orange hover:underline">
                    {opportunity.contact}
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Fit Assessment */}
          {opp && (
            <div className="bg-card-white border border-card-border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] text-slate font-medium uppercase tracking-wide flex items-center gap-1.5">
                  <Target className="w-3 h-3" />
                  Fit Assessment
                </p>
                {!assessment && !assessing && (
                  <button
                    onClick={handleAssess}
                    className="text-[10px] font-medium text-burnt-orange hover:underline"
                  >
                    Assess my fit →
                  </button>
                )}
              </div>
              {assessing && (
                <div className="flex items-center gap-2 py-2">
                  <Loader2 className="w-3 h-3 animate-spin text-burnt-orange" />
                  <span className="text-xs text-slate">Analyzing your profile against requirements…</span>
                </div>
              )}
              {assessError && (
                <div className="flex items-center gap-2 py-1">
                  <AlertCircle className="w-3 h-3 text-red-500" />
                  <span className="text-xs text-red-600">{assessError}</span>
                </div>
              )}
              {assessment && !assessing && (
                <div className="space-y-2">
                  <div className={`rounded-lg px-3 py-2 border ${fitBg}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold uppercase ${fitColor}`}>
                        {assessment.fit_rating} fit
                      </span>
                    </div>
                    <p className="text-xs text-charcoal leading-relaxed">{assessment.summary}</p>
                  </div>
                  {assessment.matching_criteria.length > 0 && (
                    <div>
                      <p className="text-[10px] font-medium text-green-700 mb-1">Matches</p>
                      {assessment.matching_criteria.map((c, i) => (
                        <div key={i} className="flex items-start gap-1.5 mb-1">
                          <CheckCircle2 className="w-3 h-3 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-xs text-charcoal">{c}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {assessment.missing_criteria.length > 0 && (
                    <div>
                      <p className="text-[10px] font-medium text-red-700 mb-1">Gaps</p>
                      {assessment.missing_criteria.map((c, i) => (
                        <div key={i} className="flex items-start gap-1.5 mb-1">
                          <AlertCircle className="w-3 h-3 text-red-500 flex-shrink-0 mt-0.5" />
                          <span className="text-xs text-charcoal">{c}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {assessment.recommendations.length > 0 && (
                    <div>
                      <p className="text-[10px] font-medium text-burnt-orange mb-1">Recommendations</p>
                      {assessment.recommendations.map((r, i) => (
                        <div key={i} className="flex items-start gap-1.5 mb-1">
                          <span className="text-xs text-burnt-orange font-medium flex-shrink-0">{i + 1}.</span>
                          <span className="text-xs text-charcoal">{r}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Primary Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleApplyNow}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-burnt-orange text-white font-medium text-xs rounded-lg hover:bg-burnt-orange/90 active:scale-[0.98] transition-all"
            >
              <ArrowUpRight className="w-3 h-3" />
              Apply via CLNCH Coach
            </button>
            <button
              onClick={() => navigate(`/chat/${opportunity.id}`)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-cream-fill text-charcoal font-medium text-xs rounded-lg hover:bg-cream transition-colors"
            >
              <Maximize2 className="w-3 h-3" />
              Open Conversation
            </button>
          </div>
        </div>

        {/* Divider + Embedded Chat */}
        <div className="px-4 pt-1 pb-4">
          <div className="flex items-center gap-2 my-3">
            <div className="flex-1 h-px bg-card-border" />
            <span className="text-[10px] text-slate uppercase tracking-widest font-medium">AI Coach</span>
            <div className="flex-1 h-px bg-card-border" />
          </div>

          <div ref={chatContainerRef} className="space-y-3 mb-3 max-h-64 overflow-y-auto scrollbar-thin">
            {chatMessages.map((msg) => (
              <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 bg-gradient-to-br from-burnt-orange to-orange-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                )}
                <div
                  className={`rounded-xl px-3 py-2 text-xs leading-relaxed max-w-[85%] ${
                    msg.role === 'user'
                      ? 'bg-card-white border border-card-border text-charcoal ml-auto'
                      : 'bg-cream-fill text-charcoal'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isChatTyping && (
              <div className="flex gap-2 items-center">
                <div className="w-6 h-6 bg-gradient-to-br from-burnt-orange to-orange-400 rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
                <div className="bg-cream-fill rounded-xl px-3 py-2.5">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-slate/40 animate-bounce"
                        style={{ animationDelay: `${i * 150}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            {chatError && (
              <div className="flex items-center gap-2 text-xs text-red-600 px-1">
                <AlertCircle className="w-3 h-3" />
                {chatError}
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          <div className="flex items-end gap-2 bg-cream border border-card-border rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-burnt-orange/20 focus-within:border-burnt-orange/30 transition-all">
            <button
              onClick={toggleMic}
              className={`p-1 rounded-md flex-shrink-0 transition-colors ${
                isListening ? 'text-red-600 bg-red-50 animate-pulse' : 'text-slate hover:text-burnt-orange'
              }`}
            >
              {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleChatSend(); }}
              placeholder="Ask your AI coach anything..."
              className="flex-1 bg-transparent text-xs text-charcoal placeholder:text-slate/50 focus:outline-none"
            />
            <button
              onClick={handleChatSend}
              disabled={!chatInput.trim() || isChatTyping}
              className="p-1.5 rounded-lg bg-burnt-orange text-white flex-shrink-0 hover:bg-burnt-orange/90 disabled:opacity-40 transition-all"
            >
              <Send className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="flex-shrink-0 border-t border-card-border px-4 py-2.5 bg-card-white">
        <button
          onClick={handleMarkAsFiled}
          disabled={isSubmitting || isFiled}
          className={`w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-medium text-xs transition-all ${
            isFiled
              ? 'bg-green-600 text-white cursor-default'
              : 'bg-charcoal text-white hover:bg-charcoal/90 active:scale-[0.98]'
          } disabled:opacity-60`}
        >
          {isSubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
          {isFiled && <CheckCircle2 className="w-3 h-3" />}
          {isSubmitting ? 'Processing...' : isFiled ? 'Filed' : 'Mark as Filed'}
        </button>
      </div>
    </div>
  );
}

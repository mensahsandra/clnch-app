import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Copy,
  CheckCircle2,
  Send,
  Mic,
  MicOff,
  Sparkles,
  RefreshCw,
  CheckCheck,
  Bookmark,
  ExternalLink,
  Clock,
  Flame,
  Loader2,
  FileText,
  X,
  Building2,
  MapPin,
  Mail,
  Link as LinkIcon,
  Share2,
} from 'lucide-react';
import { supabase } from '../services/supabase';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

const MOCK_OPP = {
  id: 'demo',
  title: 'TechForward Research Fellowship',
  org: 'TechForward Institute',
  deadline: '2026-06-24',
  urgency: 'High',
  link: 'https://example.com/fellowship',
  requirements: [
    'Graduate or postgraduate student status',
    'Minimum 3.5 GPA',
    'Research focus in AI/ML',
    'Two letters of recommendation',
    'Personal statement (500 words)',
    'CV/Resume submission',
  ],
  progress: 2,
  total: 6,
};

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: `Welcome to your CLNCH coaching workspace for **${MOCK_OPP.org}**.

I've reviewed the fellowship requirements and your voice profile. Here's your tailored strategy:

**Personal Statement Focus:**
Lead with your interdisciplinary ML + sustainability research. Their program emphasises cross-domain impact — your work on sustainable AI models is a direct match.

**Recommender Priority:**
Confirm Prof. Amoah and Dr. Chen this week. Request letters emphasising your leadership in the lab and publication track.

**Differentiation Hook:**
Most applicants describe research goals abstractly. You should open with a concrete result: "My recent model reduced inference energy use by 34%."

What would you like to work on first?`,
    createdAt: new Date(Date.now() - 120000),
  },
];

const MIN_PANEL_WIDTH = 260;
const MAX_PANEL_WIDTH = 520;
const DEFAULT_PANEL_WIDTH = 300;

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showDetail, setShowDetail] = useState(true);
  const [detailWidth, setDetailWidth] = useState(DEFAULT_PANEL_WIDTH);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isInjecting, setIsInjecting] = useState(false);
  const [injectComplete, setInjectComplete] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    initSession();
  }, [id]);

  // Esc to close panel
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowDetail(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleDragMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartX.current = e.clientX;
    dragStartWidth.current = detailWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [detailWidth]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const delta = dragStartX.current - e.clientX;
      const newWidth = Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, dragStartWidth.current + delta));
      setDetailWidth(newWidth);
    };
    const onUp = () => {
      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    if (isDragging) {
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging]);

  const initSession = async () => {
    const { data, error } = await supabase
      .from('application_sessions')
      .insert({
        opportunity_title: MOCK_OPP.title,
        opportunity_org: MOCK_OPP.org,
        opportunity_link: MOCK_OPP.link,
        status: 'active',
        last_message_preview: INITIAL_MESSAGES[0].content.slice(0, 120),
        last_active_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle();
    if (!error && data) setSessionId(data.id);
  };

  const saveMessage = async (msg: Message) => {
    if (!sessionId) return;
    await supabase.from('application_answers').insert({
      session_id: sessionId,
      role: msg.role,
      content: msg.content,
    });
    await supabase
      .from('application_sessions')
      .update({ last_message_preview: msg.content.slice(0, 120), last_active_at: new Date().toISOString() })
      .eq('id', sessionId);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, createdAt: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    saveMessage(userMsg);

    await new Promise((r) => setTimeout(r, 1800));

    const replies = [
      `Great point. Let me refine your draft around that angle:\n\n**Refined Draft:**\n\n"My research at the intersection of machine learning and environmental systems has produced measurable outcomes — including a 34% reduction in model inference energy consumption. At TechForward, I aim to extend this work into real-time ecological monitoring systems, bridging the gap between algorithmic efficiency and planetary-scale sustainability."\n\nWould you like me to [Refine further], or shall we move on to the recommendation letter brief?`,
      `Understood. Here's a sharper version that leads with your unique value:\n\n"I don't just study sustainable AI — I build it. My recent work demonstrated that model compression techniques can reduce inference costs by over a third without accuracy loss. TechForward's mission to operationalise climate-aligned technology is precisely where I see this research reaching its highest impact."\n\nThis version is more assertive and concrete. Ready to [Accept and Fill] or want another iteration?`,
      `Good instinct. I've reframed it to emphasise collaborative leadership:\n\n"Beyond individual research, I've led a team of 5 graduate students in producing two peer-reviewed papers on energy-aware neural architecture search. This collaborative model — rigorous, inclusive, and impact-driven — reflects the ethos TechForward embodies."\n\nHow does this land?`,
    ];

    const assistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: replies[Math.floor(Math.random() * replies.length)],
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, assistantMsg]);
    setIsTyping(false);
    saveMessage(assistantMsg);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShare = () => {
    const url = `${window.location.origin}/chat/${MOCK_OPP.id}`;
    navigator.clipboard.writeText(url);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  const handleInjectField = async (content: string) => {
    setIsInjecting(true);
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage(
          { type: 'CLNCH_INJECT_TEXT', payload: { refinedText: content } },
          (response) => {
            if (response?.success) { setInjectComplete(true); setTimeout(() => setInjectComplete(false), 3000); }
          }
        );
      }
      window.postMessage({ type: 'CLNCH_INJECT_TEXT', payload: { refinedText: content } }, '*');
    } catch { /* extension unavailable */ }
    setIsInjecting(false);
  };

  const toggleMic = () => {
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }
    const SR =
      (window as typeof window & { SpeechRecognition?: typeof globalThis.SpeechRecognition; webkitSpeechRecognition?: typeof globalThis.SpeechRecognition })
        .SpeechRecognition ??
      (window as typeof window & { webkitSpeechRecognition?: typeof globalThis.SpeechRecognition })
        .webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = (e) => {
      const transcript = Array.from(e.results).map((r) => r[0].transcript).join('');
      setInput(transcript);
    };
    rec.onend = () => setIsListening(false);
    rec.start();
    recognitionRef.current = rec;
    setIsListening(true);
  };

  const appendRefinement = (action: string) => {
    setInput(`[${action}]: `);
    inputRef.current?.focus();
  };

  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');

  return (
    <div className="flex h-full bg-cream overflow-hidden">
      {/* Chat Column */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        {/* Breadcrumb */}
        <div className="h-[52px] bg-card-white border-b border-card-border flex items-center justify-between px-5 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate('/')}
              className="p-1.5 rounded-lg hover:bg-cream-fill transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4 text-slate" />
            </button>
            <span className="text-sm font-semibold text-charcoal truncate">
              {MOCK_OPP.org} — {MOCK_OPP.title}
            </span>
          </div>
          {/* Files button now opens detail panel */}
          <button
            onClick={() => setShowDetail((v) => !v)}
            title="Opportunity details"
            className={`p-1.5 rounded-lg transition-colors ${
              showDetail ? 'bg-burnt-orange/10 text-burnt-orange' : 'text-slate hover:bg-cream-fill hover:text-charcoal'
            }`}
          >
            <FileText className="w-4 h-4" />
          </button>
        </div>

        {/* Message Timeline */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5 space-y-5">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              copied={copiedId === msg.id}
              onCopy={() => handleCopy(msg.id, msg.content)}
            />
          ))}

          {isTyping && (
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-gradient-to-br from-burnt-orange to-orange-400 rounded-full flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="bg-card-white border border-card-border rounded-2xl px-4 py-2.5">
                <div className="flex gap-1 items-center">
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

          {!isTyping && lastAssistant && (
            <div className="flex items-center gap-2 flex-wrap pl-10">
              <button
                onClick={() => appendRefinement('Refine further')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-card-border bg-card-white text-slate hover:border-burnt-orange/40 hover:text-burnt-orange transition-all"
              >
                <RefreshCw className="w-3 h-3" />
                Refine further
              </button>
              <button
                onClick={() => handleInjectField(lastAssistant.content)}
                disabled={isInjecting || injectComplete}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  injectComplete ? 'bg-green-600 text-white' : 'bg-burnt-orange text-white hover:bg-burnt-orange/90'
                } disabled:opacity-50`}
              >
                {isInjecting ? (
                  <><Loader2 className="w-3 h-3 animate-spin" /> Injecting...</>
                ) : injectComplete ? (
                  <><CheckCircle2 className="w-3 h-3" /> Injected</>
                ) : (
                  <><CheckCheck className="w-3 h-3" /> Accept and Fill</>
                )}
              </button>
              <button
                onClick={() => appendRefinement('Keep Draft')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-card-border bg-card-white text-slate hover:bg-cream-fill transition-all"
              >
                <Bookmark className="w-3 h-3" />
                Keep Draft
              </button>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input Bar */}
        <div className="flex-shrink-0 border-t border-card-border bg-card-white px-5 py-3">
          <div className="flex items-end gap-3 bg-cream border border-card-border rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-burnt-orange/20 focus-within:border-burnt-orange/30 transition-all">
            <button
              onClick={toggleMic}
              className={`p-1.5 rounded-lg flex-shrink-0 transition-colors ${
                isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'text-slate hover:bg-cream-fill hover:text-burnt-orange'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your draft, raw ideas, or speak with the mic..."
              rows={1}
              className="flex-1 bg-transparent text-sm text-charcoal placeholder:text-slate/50 resize-none focus:outline-none leading-relaxed"
              style={{ maxHeight: 120, overflowY: 'auto' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="p-1.5 rounded-lg bg-burnt-orange text-white flex-shrink-0 hover:bg-burnt-orange/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate/50 text-center mt-1.5">
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>

      {/* Draggable splitter + Detail panel */}
      {showDetail && (
        <>
          {/* Drag handle */}
          <div
            onMouseDown={handleDragMouseDown}
            className={`w-1 flex-shrink-0 cursor-col-resize transition-colors ${
              isDragging ? 'bg-burnt-orange' : 'bg-card-border hover:bg-burnt-orange/40'
            }`}
          />

          {/* Detail Panel — no header, just floating buttons */}
          <div
            style={{ width: detailWidth, transition: isDragging ? 'none' : undefined }}
            className="relative flex-shrink-0 bg-card-white border-l border-card-border flex flex-col overflow-hidden"
          >
            {/* Floating action buttons top-right */}
            <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
              <button
                onClick={handleShare}
                title="Share opportunity link"
                className="p-1.5 rounded-md hover:bg-cream-fill transition-colors"
              >
                {shareCopied
                  ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                  : <Share2 className="w-4 h-4 text-slate" />
                }
              </button>
              <button
                onClick={() => setShowDetail(false)}
                className="p-1.5 rounded-md hover:bg-cream-fill transition-colors"
              >
                <X className="w-4 h-4 text-slate" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin p-4 pt-12 space-y-3">
              {/* Progress tracker */}
              <div className="bg-burnt-orange/5 border border-burnt-orange/20 rounded-xl p-3">
                <p className="text-xs font-semibold text-burnt-orange mb-1.5">Application Progress</p>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-charcoal font-medium">{MOCK_OPP.progress} / {MOCK_OPP.total} sections</span>
                  <span className="text-xs text-slate">{Math.round((MOCK_OPP.progress / MOCK_OPP.total) * 100)}%</span>
                </div>
                <div className="h-1.5 bg-cream rounded-full overflow-hidden">
                  <div
                    className="h-full bg-burnt-orange rounded-full transition-all"
                    style={{ width: `${(MOCK_OPP.progress / MOCK_OPP.total) * 100}%` }}
                  />
                </div>
              </div>

              {/* Open form */}
              <a
                href={MOCK_OPP.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-burnt-orange text-white text-xs font-semibold rounded-lg hover:bg-burnt-orange/90 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open application form →
              </a>

              <div className="border-t border-card-border" />

              {/* Metadata */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <Clock className="w-3.5 h-3.5 text-burnt-orange flex-shrink-0" />
                  <span className="text-slate">Deadline:</span>
                  <span className="font-medium text-charcoal">{MOCK_OPP.deadline}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Flame className="w-3.5 h-3.5 text-burnt-orange flex-shrink-0" />
                  <span className="text-slate">Urgency:</span>
                  <span className="font-medium text-red-600">{MOCK_OPP.urgency}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Building2 className="w-3.5 h-3.5 text-slate flex-shrink-0" />
                  <span className="text-slate">Org:</span>
                  <span className="font-medium text-charcoal truncate">{MOCK_OPP.org}</span>
                </div>
              </div>

              <div className="border-t border-card-border" />

              {/* Requirements */}
              <div>
                <p className="text-xs font-semibold text-charcoal mb-2">Requirements</p>
                <div className="space-y-1.5">
                  {MOCK_OPP.requirements.map((req, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className={`w-3.5 h-3.5 rounded flex-shrink-0 mt-0.5 flex items-center justify-center border ${
                        i < MOCK_OPP.progress ? 'bg-burnt-orange border-burnt-orange' : 'border-card-border'
                      }`}>
                        {i < MOCK_OPP.progress && <CheckCheck className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <span className="text-xs text-charcoal leading-snug">{req}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-card-border" />

              {/* Source */}
              <div>
                <p className="text-[10px] text-slate uppercase tracking-widest font-medium mb-2">Source</p>
                <a
                  href={MOCK_OPP.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-burnt-orange hover:underline break-all"
                >
                  <LinkIcon className="w-3 h-3 flex-shrink-0" />
                  {MOCK_OPP.link}
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </a>
              </div>

              {/* Contact */}
              <div className="flex flex-wrap gap-3 pt-1">
                <div className="flex items-center gap-1.5 text-xs text-slate">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  Accra, Ghana (Remote eligible)
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate">
                  <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                  applications@techforward.org
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MessageBubble({ msg, copied, onCopy }: { msg: Message; copied: boolean; onCopy: () => void }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 group ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && (
        <div className="w-7 h-7 bg-gradient-to-br from-burnt-orange to-orange-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
      )}
      <div className={`relative max-w-[80%] ${isUser ? 'ml-auto' : ''}`}>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser ? 'bg-card-white border border-card-border text-charcoal' : 'bg-cream-fill text-charcoal'
        }`}>
          {msg.content}
        </div>
        <div className={`flex items-center gap-2 mt-1 ${isUser ? 'justify-end' : ''}`}>
          <span className="text-xs text-slate/50">{formatTime(msg.createdAt)}</span>
          <button onClick={onCopy} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate/50 hover:text-slate">
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}

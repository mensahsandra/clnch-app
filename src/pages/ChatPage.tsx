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
  AlertCircle,
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { useOpportunities } from '../context/OpportunitiesContext';
import { chatWithAssistant } from '../services/intelligenceService';
import type { Opportunity } from '../types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

const MIN_PANEL_WIDTH = 260;
const MAX_PANEL_WIDTH = 520;
const DEFAULT_PANEL_WIDTH = 300;

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { opportunities, loading: oppLoading } = useOpportunities();

  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [chatTitle, setChatTitle] = useState('Loading…');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [detailWidth, setDetailWidth] = useState(DEFAULT_PANEL_WIDTH);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isInjecting, setIsInjecting] = useState(false);
  const [injectComplete, setInjectComplete] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [pageContent, setPageContent] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);

  // Find the opportunity from context or by ID
  useEffect(() => {
    if (oppLoading) return;

    if (id) {
      const found = opportunities.find((o) => o.id === id);
      if (found) {
        setOpportunity(found);
        setChatTitle(`${found.org} — ${found.title}`);
      } else {
        setChatTitle('Opportunity not found');
      }
    } else if (opportunities.length > 0) {
      setOpportunity(opportunities[0]);
      setChatTitle(`${opportunities[0].org} — ${opportunities[0].title}`);
    } else {
      setOpportunity(null);
      setChatTitle('No opportunity selected');
    }
  }, [id, opportunities, oppLoading]);

  // Initialize session and welcome message when opportunity is set
  useEffect(() => {
    if (!opportunity) return;

    const initSession = async () => {
      const welcomeContent = `I've loaded **${opportunity.title}** from ${opportunity.org}. Ask me anything about the requirements, your fit, or how to approach the application.`;

      const initialMessage: Message = {
        id: '1',
        role: 'assistant',
        content: welcomeContent,
        createdAt: new Date(Date.now() - 120000),
      };
      setMessages([initialMessage]);

      const { data, error: sessionError } = await supabase
        .from('application_sessions')
        .insert({
          opportunity_id: opportunity.id !== 'demo' ? opportunity.id : null,
          opportunity_title: opportunity.title,
          opportunity_org: opportunity.org,
          opportunity_link: opportunity.link,
          status: 'active',
          last_message_preview: welcomeContent.slice(0, 120),
          last_active_at: new Date().toISOString(),
        })
        .select()
        .maybeSingle();

      if (!sessionError && data) {
        setSessionId(data.id);
      }
    };

    initSession();
  }, [opportunity]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

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
    if (!text || isTyping || !opportunity) return;

    setError(null);
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, createdAt: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    saveMessage(userMsg);

    try {
      const conversationHistory = messages.map((m) => ({ role: m.role, content: m.content }));

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
        conversationHistory,
        pageContent
      );

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.reply,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      saveMessage(assistantMsg);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get response';
      setError(errorMsg);
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I ran into an issue: ${errorMsg}. Please try again.`,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      saveMessage(assistantMsg);
    } finally {
      setIsTyping(false);
    }
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
    setShowShareMenu(!showShareMenu);
  };

  const shareVia = (platform: string) => {
    const url = `${window.location.origin}/chat/${opportunity?.id ?? 'demo'}`;
    const text = `Check out my CLNCH coaching workspace for ${opportunity?.title ?? 'this opportunity'} at ${opportunity?.org ?? ''}`;
    let shareUrl = '';
    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
        break;
      case 'x':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case 'tiktok':
        shareUrl = `https://www.tiktok.com/`;
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
        setShowShareMenu(false);
        return;
    }
    if (shareUrl) window.open(shareUrl, '_blank', 'width=600,height=500');
    setShowShareMenu(false);
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

  useEffect(() => {
    const ta = inputRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    const newHeight = Math.min(ta.scrollHeight, 160);
    ta.style.height = `${newHeight}px`;
  }, [input]);

  if (oppLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-cream">
        <Loader2 className="w-6 h-6 animate-spin text-burnt-orange" />
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-cream gap-3">
        <AlertCircle className="w-8 h-8 text-slate" />
        <p className="text-sm text-slate">No opportunity found. Capture one from a URL first.</p>
        <button onClick={() => navigate('/found')} className="text-sm text-burnt-orange hover:underline">
          Go to Found page
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-cream overflow-hidden">
      {/* Chat Column */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        {/* Breadcrumb */}
        <div className="h-[52px] bg-card-white border-b border-card-border flex items-center justify-between px-5 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              onClick={() => navigate('/chats')}
              className="p-1.5 rounded-lg hover:bg-cream-fill transition-colors flex-shrink-0"
              title="Back to conversations"
            >
              <ArrowLeft className="w-4 h-4 text-slate" />
            </button>
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                value={chatTitle}
                onChange={(e) => setChatTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setIsEditingTitle(false);
                  if (e.key === 'Escape') { setIsEditingTitle(false); setChatTitle(`${opportunity.org} — ${opportunity.title}`); }
                }}
                className="flex-1 text-sm font-semibold text-charcoal bg-cream-fill border border-card-border rounded-lg px-3 py-1 outline-none focus:ring-2 focus:ring-burnt-orange/20"
                autoFocus
              />
            ) : (
              <button
                onClick={() => { setIsEditingTitle(true); setTimeout(() => titleInputRef.current?.focus(), 0); }}
                className="text-sm font-semibold text-charcoal truncate hover:bg-cream-fill rounded-lg px-2 py-1 transition-colors text-left"
                title="Click to rename"
              >
                {chatTitle}
              </button>
            )}
          </div>
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

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600 px-2">
              <AlertCircle className="w-3.5 h-3.5" />
              {error}
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
              placeholder="Ask about this opportunity, your fit, or how to apply..."
              rows={1}
              className="flex-1 bg-transparent text-sm text-charcoal placeholder:text-slate/50 resize-none focus:outline-none leading-relaxed min-h-[24px]"
              style={{ maxHeight: 160, overflowY: 'auto' }}
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
          <div
            onMouseDown={handleDragMouseDown}
            className="w-2 flex-shrink-0 cursor-col-resize transition-colors flex items-center justify-center group bg-card-border hover:bg-burnt-orange/30"
          >
            <div className="w-6 h-10 rounded-full bg-card-white border border-card-border shadow-sm flex items-center justify-center cursor-col-resize group-hover:border-burnt-orange/40 group-hover:shadow-md transition-all">
              <svg className="w-3 h-3 text-slate/50 group-hover:text-burnt-orange transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="19" r="1"/></svg>
            </div>
          </div>

          <div
            style={{ width: detailWidth, transition: isDragging ? 'none' : undefined }}
            className="relative flex-shrink-0 bg-card-white border-l border-card-border flex flex-col overflow-hidden"
          >
            <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
              <div className="relative">
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
                {showShareMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowShareMenu(false)} />
                    <div className="absolute top-full right-0 mt-2 bg-card-white border border-card-border rounded-xl shadow-2xl py-2 z-50 w-48">
                      <p className="px-3 py-1 text-[10px] font-semibold text-slate uppercase tracking-wider">Share via</p>
                      <button onClick={() => shareVia('whatsapp')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-charcoal hover:bg-cream-fill transition-colors">
                        <span className="w-5 text-center">📱</span> WhatsApp
                      </button>
                      <button onClick={() => shareVia('x')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-charcoal hover:bg-cream-fill transition-colors">
                        <span className="w-5 text-center">𝕏</span> X / Twitter
                      </button>
                      <button onClick={() => shareVia('linkedin')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-charcoal hover:bg-cream-fill transition-colors">
                        <span className="w-5 text-center">💼</span> LinkedIn
                      </button>
                      <button onClick={() => shareVia('tiktok')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-charcoal hover:bg-cream-fill transition-colors">
                        <span className="w-5 text-center">🎵</span> TikTok
                      </button>
                      <div className="border-t border-card-border mx-3 my-1" />
                      <button onClick={() => shareVia('copy')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-charcoal hover:bg-cream-fill transition-colors">
                        <span className="w-5 text-center">📋</span> Copy link
                      </button>
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={() => setShowDetail(false)}
                className="p-1.5 rounded-md hover:bg-cream-fill transition-colors"
              >
                <X className="w-4 h-4 text-slate" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin p-4 pt-12 space-y-3">
              {/* Metadata */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <Clock className="w-3.5 h-3.5 text-burnt-orange flex-shrink-0" />
                  <span className="text-slate">Deadline:</span>
                  <span className="font-medium text-charcoal">{opportunity.deadline ?? '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Flame className="w-3.5 h-3.5 text-burnt-orange flex-shrink-0" />
                  <span className="text-slate">Urgency:</span>
                  <span className="font-medium text-red-600">{opportunity.urgency}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Building2 className="w-3.5 h-3.5 text-slate flex-shrink-0" />
                  <span className="text-slate">Org:</span>
                  <span className="font-medium text-charcoal truncate">{opportunity.org}</span>
                </div>
              </div>

              {opportunity.description && (
                <>
                  <div className="border-t border-card-border" />
                  <div>
                    <p className="text-[10px] text-slate uppercase tracking-widest font-medium mb-1.5">Summary</p>
                    <p className="text-xs text-charcoal leading-relaxed">{opportunity.description}</p>
                  </div>
                </>
              )}

              <div className="border-t border-card-border" />

              {/* Requirements */}
              {opportunity.requirements && opportunity.requirements.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-charcoal mb-2">Requirements</p>
                  <div className="space-y-1.5">
                    {opportunity.requirements.map((req, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="w-3.5 h-3.5 rounded flex-shrink-0 mt-0.5 flex items-center justify-center border border-card-border">
                          <CheckCheck className="w-2.5 h-2.5 text-burnt-orange" />
                        </div>
                        <span className="text-xs text-charcoal leading-snug">{req}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-card-border" />

              {/* Source */}
              {opportunity.link && (
                <div>
                  <p className="text-[10px] text-slate uppercase tracking-widest font-medium mb-2">Source</p>
                  <a
                    href={opportunity.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-burnt-orange hover:underline break-all"
                  >
                    <LinkIcon className="w-3 h-3 flex-shrink-0" />
                    {opportunity.link}
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                </div>
              )}

              {/* Location & Contact */}
              <div className="flex flex-wrap gap-3 pt-1">
                {opportunity.location && (
                  <div className="flex items-center gap-1.5 text-xs text-slate">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    {opportunity.location}
                  </div>
                )}
                {opportunity.contact && (
                  <div className="flex items-center gap-1.5 text-xs text-slate">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                    {opportunity.contact}
                  </div>
                )}
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

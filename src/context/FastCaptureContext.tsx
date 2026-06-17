import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle, Link2 } from 'lucide-react';
import {
  scrapeOpportunityUrl,
  extractUrlFromText,
  daysUntil,
  urgencyFromDays,
} from '../services/firecrawlService';
import { useOpportunities } from './OpportunitiesContext';
import type { Opportunity } from '../types';

type CaptureStatus = 'idle' | 'processing' | 'success' | 'error';

interface CaptureContext {
  description?: string;
  categoryHints?: string[];
  screenshots?: File[];
}

interface FastCaptureContextValue {
  status: CaptureStatus;
  message: string;
  captureFromClipboard: () => Promise<void>;
  captureUrl: (url: string, context?: CaptureContext) => Promise<void>;
}

const FastCaptureContext = createContext<FastCaptureContextValue | null>(null);

function CaptureToast({
  status,
  message,
  onDismiss,
}: {
  status: CaptureStatus;
  message: string;
  onDismiss: () => void;
}) {
  if (status === 'idle') return null;

  const styles = {
    processing: 'bg-charcoal text-white border-charcoal',
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-800 border-red-200',
  };

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl text-sm font-medium max-w-md animate-slide-in ${styles[status as keyof typeof styles] ?? styles.processing}`}
      style={{ marginLeft: 28 }}
    >
      {status === 'processing' && <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />}
      {status === 'success' && <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
      {status === 'error' && <AlertCircle className="w-4 h-4 flex-shrink-0" />}
      <span className="flex-1">{message}</span>
      {status !== 'processing' && (
        <button onClick={onDismiss} className="text-xs opacity-60 hover:opacity-100">
          Dismiss
        </button>
      )}
    </div>
  );
}

export function FastCaptureProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<CaptureStatus>('idle');
  const [message, setMessage] = useState('');
  const { addOpportunity } = useOpportunities();
  const navigate = useNavigate();

  const dismiss = useCallback(() => {
    setStatus('idle');
    setMessage('');
  }, []);

  const runCapture = useCallback(
    async (url: string, context?: CaptureContext) => {
      setStatus('processing');
      setMessage(`Scraping ${new URL(url).hostname}…`);

      try {
        const scraped = await scrapeOpportunityUrl(url, {
          description: context?.description,
          categoryHints: context?.categoryHints,
          screenshots: context?.screenshots,
        });
        const days = daysUntil(scraped.deadline);

        const opp: Opportunity = {
          id: `fc-${Date.now()}`,
          title: scraped.title,
          org: scraped.org,
          category: scraped.category,
          status: 'saved',
          urgency: urgencyFromDays(days),
          daysLeft: days,
          deadline: scraped.deadline,
          link: scraped.link,
          requirements: scraped.requirements,
          location: scraped.location,
          description: scraped.description,
        };

        addOpportunity(opp);
        setStatus('success');
        setMessage(`Captured: ${scraped.title}`);
        navigate('/');
        setTimeout(dismiss, 4000);
      } catch (err) {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Capture failed');
        setTimeout(dismiss, 5000);
      }
    },
    [addOpportunity, navigate, dismiss]
  );

  const captureUrl = useCallback(
    async (url: string, context?: CaptureContext) => {
      const normalized = extractUrlFromText(url);
      if (!normalized) {
        setStatus('error');
        setMessage('No valid URL found');
        setTimeout(dismiss, 3000);
        return;
      }
      await runCapture(normalized, context);
    },
    [runCapture, dismiss]
  );

  const captureFromClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      const url = extractUrlFromText(text);
      if (!url) {
        setStatus('error');
        setMessage('No link in clipboard — copy a URL first');
        setTimeout(dismiss, 3000);
        return;
      }
      await runCapture(url);
    } catch {
      setStatus('error');
      setMessage('Allow clipboard access to use Fast-Capture');
      setTimeout(dismiss, 4000);
    }
  }, [runCapture, dismiss]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shared =
      params.get('capture') ||
      params.get('url') ||
      params.get('link') ||
      params.get('text') ||
      params.get('title');
    if (shared) {
      captureUrl(shared);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [captureUrl]);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData('text') ?? '';
      const url = extractUrlFromText(text);
      if (url && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault();
        captureUrl(url);
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [captureUrl]);

  return (
    <FastCaptureContext.Provider value={{ status, message, captureFromClipboard, captureUrl }}>
      {children}
      <CaptureToast status={status} message={message} onDismiss={dismiss} />
    </FastCaptureContext.Provider>
  );
}

export function useFastCapture() {
  const ctx = useContext(FastCaptureContext);
  if (!ctx) throw new Error('useFastCapture must be used within FastCaptureProvider');
  return ctx;
}

export function FastCaptureIcon() {
  return <Link2 className="w-4 h-4" />;
}

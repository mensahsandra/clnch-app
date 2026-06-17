import { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';

export interface CaptureData {
  link: string;
  category: string;
}

interface FastCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CaptureData) => Promise<void>;
}

const categories = [
  { id: 'fellowship', label: 'Fellowship', emoji: '🎓' },
  { id: 'grant', label: 'Grant', emoji: '💰' },
  { id: 'accelerator', label: 'Accelerator', emoji: '🚀' },
  { id: 'job', label: 'Job', emoji: '💼' },
  { id: 'conference', label: 'Conference', emoji: '🏛️' },
];

const processingMessages = [
  'AI is analyzing source page context...',
  'Extracting structural metadata...',
  'Identifying key requirements...',
  'Parsing deadline information...',
  'Building opportunity profile...',
];

export default function FastCaptureModal({
  isOpen,
  onClose,
  onSubmit,
}: FastCaptureModalProps) {
  const [link, setLink] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessageIndex, setProcessingMessageIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    if (!isOpen) {
      setLink('');
      setSelectedCategory(null);
      setIsProcessing(false);
      setProcessingMessageIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isProcessing) {
      interval = setInterval(() => {
        setProcessingMessageIndex((prev) =>
          prev < processingMessages.length - 1 ? prev + 1 : prev
        );
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  const handleSubmit = async () => {
    if (!link.trim() || !selectedCategory) return;
    setIsProcessing(true);
    setProcessingMessageIndex(0);
    try {
      await onSubmit({ link, category: selectedCategory });
      setLink('');
      setSelectedCategory(null);
      onClose();
    } catch {
      // error handled by context toast
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'Enter' && link.trim() && selectedCategory) handleSubmit();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 animate-fade-in"
      onClick={handleBackdropClick}
    >
      {/* Frosted Glass Backdrop */}
      <div className="absolute inset-0 bg-charcoal/30 backdrop-blur-sm" />

      {/* Modal Panel */}
      <div className="relative w-full max-w-[600px] bg-card-white rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-card-border">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xl font-semibold text-charcoal">
              Fast-Capture New Opportunity
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-cream-fill transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-slate" />
            </button>
          </div>
          <p className="text-sm text-slate font-medium">
            CLNCH — From found to filed.
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Link input */}
          <div>
            <label className="block text-sm font-medium text-slate mb-2">
              Paste any link, text snippet, or drag a screenshot here
            </label>
            <input
              ref={inputRef}
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="https://..."
              className="input-field py-3 text-base"
              disabled={isProcessing}
            />
          </div>

          {/* Processing status */}
          {isProcessing && (
            <div className="flex items-center gap-2 text-sm text-burnt-orange">
              <Sparkles className="w-4 h-4 animate-pulse-subtle" />
              <span className="animate-pulse-subtle">
                {processingMessages[processingMessageIndex]}
              </span>
            </div>
          )}

          {/* Category chips */}
          <div>
            <label className="block text-sm font-medium text-slate mb-2">
              Select Category
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  disabled={isProcessing}
                  className={`chip flex items-center gap-1.5 ${
                    selectedCategory === cat.id ? 'chip-active' : ''
                  } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-cream/50 border-t border-card-border flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-sm font-medium text-charcoal rounded-lg hover:bg-cream-fill transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!link.trim() || !selectedCategory || isProcessing}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-burnt-orange rounded-lg hover:bg-burnt-orange/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
            {isProcessing ? 'Processing...' : 'Run Extraction Engine'}
          </button>
        </div>
      </div>
    </div>
  );
}

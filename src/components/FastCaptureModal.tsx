import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Sparkles, Loader2, Image, Link2, FileText, Search, Trash2 } from 'lucide-react';

export interface CaptureData {
  link: string;
  description?: string;
  categoryHints?: string[];
  screenshots?: File[];
}

interface FastCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CaptureData) => Promise<void>;
}

const CATEGORIES = [
  { id: 'fellowship', label: 'Fellowship', emoji: '🎓' },
  { id: 'grant', label: 'Grant', emoji: '💰' },
  { id: 'accelerator', label: 'Accelerator', emoji: '🚀' },
  { id: 'job', label: 'Job', emoji: '💼' },
  { id: 'conference', label: 'Conference', emoji: '🏛️' },
  { id: 'internship', label: 'Internship', emoji: '🌱' },
  { id: 'events', label: 'Events', emoji: '📅' },
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
  const [description, setDescription] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [screenshotPreviews, setScreenshotPreviews] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessageIndex, setProcessingMessageIndex] = useState(0);
  const [inputMode, setInputMode] = useState<'link' | 'text' | 'screenshot'>('link');
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pasteZoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
    if (!isOpen) {
      setLink('');
      setDescription('');
      setSelectedCategories([]);
      setScreenshots([]);
      setScreenshotPreviews([]);
      setIsProcessing(false);
      setProcessingMessageIndex(0);
      setInputMode('link');
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

  // Handle paste anywhere in the modal
  useEffect(() => {
    if (!isOpen) return;
    const handlePaste = (e: ClipboardEvent) => {
      if (isProcessing) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      let foundImage = false;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            addScreenshot(file);
            foundImage = true;
          }
        }
      }
      if (foundImage) {
        e.preventDefault();
        setInputMode('screenshot');
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [isOpen, isProcessing]);

  const addScreenshot = (file: File) => {
    if (screenshots.length >= 5) return;
    setScreenshots((prev) => [...prev, file]);
    const reader = new FileReader();
    reader.onload = (e) => {
      setScreenshotPreviews((prev) => [...prev, e.target?.result as string]);
    };
    reader.readAsDataURL(file);
  };

  const removeScreenshot = (index: number) => {
    setScreenshots((prev) => prev.filter((_, i) => i !== index));
    setScreenshotPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
    files.forEach((f) => addScreenshot(f));
    if (files.length > 0) setInputMode('screenshot');
  }, [isProcessing, screenshots.length]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    const hasLink = link.trim().length > 0;
    const hasText = description.trim().length > 0;
    const hasScreenshots = screenshots.length > 0;
    if (!hasLink && !hasText && !hasScreenshots) return;

    setIsProcessing(true);
    setProcessingMessageIndex(0);
    try {
      await onSubmit({
        link: link.trim(),
        description: description.trim(),
        categoryHints: selectedCategories,
        screenshots: screenshots.length > 0 ? screenshots : undefined,
      });
      setLink('');
      setDescription('');
      setSelectedCategories([]);
      setScreenshots([]);
      setScreenshotPreviews([]);
      onClose();
    } catch {
      // error handled by context toast
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'Enter' && e.metaKey) handleSubmit();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const hasInput = link.trim() || description.trim() || screenshots.length > 0;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 animate-fade-in"
      onClick={handleBackdropClick}
    >
      {/* Frosted Glass Backdrop */}
      <div className="absolute inset-0 bg-charcoal/30 backdrop-blur-sm" />

      {/* Modal Panel */}
      <div className="relative w-full max-w-[640px] bg-card-white rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-card-border flex-shrink-0">
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
        <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          {/* Input Mode Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setInputMode('link')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                inputMode === 'link'
                  ? 'bg-burnt-orange/10 text-burnt-orange'
                  : 'text-slate hover:bg-cream-fill'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              Link
            </button>
            <button
              onClick={() => setInputMode('text')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                inputMode === 'text'
                  ? 'bg-burnt-orange/10 text-burnt-orange'
                  : 'text-slate hover:bg-cream-fill'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Text
            </button>
            <button
              onClick={() => setInputMode('screenshot')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                inputMode === 'screenshot'
                  ? 'bg-burnt-orange/10 text-burnt-orange'
                  : 'text-slate hover:bg-cream-fill'
              }`}
            >
              <Image className="w-3.5 h-3.5" />
              Screenshot
              {screenshots.length > 0 && (
                <span className="bg-burnt-orange text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {screenshots.length}
                </span>
              )}
            </button>
          </div>

          {/* Link Input */}
          {inputMode === 'link' && (
            <div>
              <label className="block text-sm font-medium text-slate mb-2">
                Paste a link to the opportunity
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
              <p className="text-xs text-slate/60 mt-1.5">
                Tip: Paste anywhere (Ctrl+V) to auto-capture a link
              </p>
            </div>
          )}

          {/* Text Input */}
          {inputMode === 'text' && (
            <div>
              <label className="block text-sm font-medium text-slate mb-2">
                Describe the opportunity
              </label>
              <textarea
                ref={textareaRef}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Paste job description, fellowship details, or any text about the opportunity..."
                className="input-field py-3 text-base min-h-[120px] resize-none"
                disabled={isProcessing}
              />
              <p className="text-xs text-slate/60 mt-1.5">
                Paste text and CLNCH will search for the best match
              </p>
            </div>
          )}

          {/* Screenshot Input */}
          {inputMode === 'screenshot' && (
            <div>
              <label className="block text-sm font-medium text-slate mb-2">
                Paste or drop screenshots
              </label>
              <div
                ref={pasteZoneRef}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-card-border rounded-xl p-4 hover:border-burnt-orange/40 transition-colors cursor-pointer"
                onClick={() => document.getElementById('screenshot-input')?.click()}
              >
                {screenshots.length === 0 ? (
                  <div className="text-center py-6">
                    <Image className="w-8 h-8 text-slate/30 mx-auto mb-2" />
                    <p className="text-sm text-slate/60">
                      Paste (Ctrl+V) or drop screenshots here
                    </p>
                    <p className="text-xs text-slate/40 mt-1">
                      Up to 5 screenshots. CLNCH will search visually.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {screenshotPreviews.map((preview, i) => (
                      <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-card-border">
                        <img src={preview} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeScreenshot(i);
                          }}
                          className="absolute top-1 right-1 p-1 bg-black/50 rounded-md text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {screenshots.length < 5 && (
                      <div className="aspect-square rounded-lg border-2 border-dashed border-card-border flex items-center justify-center">
                        <Image className="w-5 h-5 text-slate/30" />
                      </div>
                    )}
                  </div>
                )}
                <input
                  id="screenshot-input"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'));
                    files.forEach((f) => addScreenshot(f));
                  }}
                />
              </div>
              <p className="text-xs text-slate/60 mt-1.5">
                Screenshots help CLNCH find exact matches via visual search
              </p>
            </div>
          )}

          {/* Processing status */}
          {isProcessing && (
            <div className="flex items-center gap-2 text-sm text-burnt-orange">
              <Sparkles className="w-4 h-4 animate-pulse-subtle" />
              <span className="animate-pulse-subtle">
                {processingMessages[processingMessageIndex]}
              </span>
            </div>
          )}

          {/* Category hints — optional, helps search */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate">
                Category hints
              </label>
              <span className="text-xs text-slate/50">Optional — helps narrow results</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const active = selectedCategories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    disabled={isProcessing}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all ${
                      active
                        ? 'bg-burnt-orange/10 border-burnt-orange/30 text-charcoal font-medium'
                        : 'border-card-border text-slate hover:bg-cream-fill hover:border-card-border'
                    } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.label}</span>
                    {active && (
                      <span className="w-1.5 h-1.5 rounded-full bg-burnt-orange ml-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-cream/50 border-t border-card-border flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate/60">
            <Search className="w-3.5 h-3.5" />
            <span>AI will infer category from content</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 text-sm font-medium text-charcoal rounded-lg hover:bg-cream-fill transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!hasInput || isProcessing}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-burnt-orange rounded-lg hover:bg-burnt-orange/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
              {isProcessing ? 'Processing...' : 'Run Extraction Engine'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

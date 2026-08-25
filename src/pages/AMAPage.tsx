import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '../context/OnboardingContext';
import { useOpportunities } from '../context/OpportunitiesContext';
import { ArrowUp, Globe, ClipboardPaste } from 'lucide-react';

const SUGGESTION_CHIPS = [
  'Grants closing this month',
  'Fellowships in Africa',
  'Accelerators for climate tech',
  'Remote jobs in AI',
  'Conferences for founders 2025',
  'Internships for undergrads',
];

function getTimeGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Good morning';
  if (h >= 12 && h < 17) return 'Good afternoon';
  if (h >= 17 && h < 21) return 'Good evening';
  return 'Still up';
}

export default function AMAPage() {
  const { profile } = useOnboarding();
  const { opportunities } = useOpportunities();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const userName = profile.preferredName || 'there';
  const greeting = getTimeGreeting();
  const savedCount = opportunities.filter((o) => o.status === 'saved').length;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    // Phase 2 will wire this to the web search agent
    // For now, redirect to Found with the query as a search filter
    navigate(`/found?q=${encodeURIComponent(query)}`);
  };

  const handleSuggestion = (chip: string) => {
    setQuery(chip);
    inputRef.current?.focus();
  };

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Centered content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 pt-24 pb-12 flex flex-col items-center">
            {/* Greeting */}
            <div className="flex items-center gap-4 mb-8 animate-fade-in">
              <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg shadow-burnt-orange/20 border border-burnt-orange/20 flex-shrink-0">
                <img src="/icons/clnch_icon.png" alt="CLNCH" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-charcoal mb-1.5">
                  {greeting}, {userName}.
                </h1>
                <p className="text-sm text-slate">
                  What opportunity are you looking for today?
                </p>
              </div>
            </div>

            {/* Large input */}
            <form onSubmit={handleSubmit} className="w-full mb-5">
              <div className="relative group">
                <textarea
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e as unknown as React.FormEvent);
                    }
                  }}
                  placeholder="How can I help you today?"
                  rows={3}
                  className="w-full bg-card-white border border-card-border rounded-2xl px-5 py-4 pr-14 text-sm text-charcoal placeholder:text-slate/50 focus:outline-none focus:ring-2 focus:ring-burnt-orange/20 focus:border-burnt-orange/40 transition-all resize-none shadow-sm"
                />
                <button
                  type="submit"
                  disabled={!query.trim()}
                  className={`absolute bottom-4 right-4 w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    query.trim()
                      ? 'bg-burnt-orange text-white hover:bg-burnt-orange/90 shadow-md shadow-burnt-orange/20'
                      : 'bg-cream-fill text-slate/40 cursor-not-allowed'
                  }`}
                  aria-label="Send query"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Suggestion chips */}
            <div className="flex flex-wrap gap-2 justify-center mb-10">
              {SUGGESTION_CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleSuggestion(chip)}
                  className="px-3.5 py-2 bg-card-white border border-card-border rounded-full text-xs font-medium text-slate hover:text-charcoal hover:border-burnt-orange/30 hover:bg-cream-fill/50 transition-all"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Quick stats row */}
            <div className="flex items-center gap-3 w-full max-w-md">
              <button
                onClick={() => navigate('/found')}
                className="flex-1 flex items-center gap-3 p-4 bg-card-white border border-card-border rounded-xl text-left hover:border-burnt-orange/30 hover:shadow-sm transition-all group"
              >
                <div className="w-10 h-10 bg-cream-fill rounded-lg flex items-center justify-center">
                  <ClipboardPaste className="w-5 h-5 text-burnt-orange" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-charcoal">
                    {opportunities.length} {opportunities.length === 1 ? 'opportunity' : 'opportunities'}
                  </p>
                  <p className="text-xs text-slate">
                    {savedCount > 0 ? `${savedCount} saved · ` : ''}View pipeline
                  </p>
                </div>
                <span className="text-xs text-slate group-hover:text-burnt-orange transition-colors">
                  →
                </span>
              </button>

              <button
                onClick={() => navigate('/discover')}
                className="flex-1 flex items-center gap-3 p-4 bg-card-white border border-card-border rounded-xl text-left hover:border-burnt-orange/30 hover:shadow-sm transition-all group"
              >
                <div className="w-10 h-10 bg-cream-fill rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-burnt-orange" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-charcoal">Discover</p>
                  <p className="text-xs text-slate">Browse curated feed</p>
                </div>
                <span className="text-xs text-slate group-hover:text-burnt-orange transition-colors">
                  →
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

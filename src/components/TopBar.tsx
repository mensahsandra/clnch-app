import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  LayoutList,
  LayoutGrid,
  SlidersHorizontal,
  ChevronDown,
  GraduationCap,
  DollarSign,
  Rocket,
  Briefcase,
  Building2,
  CalendarDays,
  Check,
} from 'lucide-react';

export type ViewMode = 'grid' | 'list';

interface Category {
  id: string;
  label: string;
  icon: React.ElementType;
}

const categories: Category[] = [
  { id: 'fellowship', label: 'Fellowship', icon: GraduationCap },
  { id: 'grant', label: 'Grant', icon: DollarSign },
  { id: 'accelerator', label: 'Accelerator', icon: Rocket },
  { id: 'job', label: 'Job', icon: Briefcase },
  { id: 'conference', label: 'Conference', icon: Building2 },
  { id: 'events', label: 'Events', icon: CalendarDays },
];

interface TopBarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  search: string;
  onSearchChange: (value: string) => void;
  selectedCategories: string[];
  onCategoryToggle: (id: string) => void;
  rightPanelWidth?: number;
}

// Dynamic greeting pool — rotates randomly, time-aware
const GREETING_POOLS = {
  morning: [
    { heading: (name: string) => `Good morning, ${name}.`, sub: 'Your pipeline is ready. Drop a link to get started.' },
    { heading: (name: string) => `Rise and build, ${name}.`, sub: 'Let\'s capture an opportunity before breakfast.' },
    { heading: (name: string) => `Morning, ${name}.`, sub: 'Start with a link — CLNCH handles the rest.' },
    { heading: (name: string) => `Fresh day, ${name}.`, sub: 'What opportunity are we going after today?' },
  ],
  afternoon: [
    { heading: (name: string) => `Good afternoon, ${name}.`, sub: 'Start with a link — CLNCH handles the rest.' },
    { heading: (name: string) => `Afternoon, ${name}.`, sub: 'New opportunities are waiting. Let\'s capture them.' },
    { heading: (name: string) => `Keep building, ${name}.`, sub: 'Your pipeline is one link away from growing.' },
    { heading: (name: string) => `Midday check-in, ${name}.`, sub: 'How\'s the pipeline looking? Add something new.' },
  ],
  evening: [
    { heading: (name: string) => `Good evening, ${name}.`, sub: 'End the day strong — one more opportunity.' },
    { heading: (name: string) => `Evening, ${name}.`, sub: 'Review your pipeline or capture something new.' },
    { heading: (name: string) => `Still at it, ${name}?`, sub: 'The best builders never stop. Drop a link.' },
    { heading: (name: string) => `Winding down, ${name}?`, sub: 'CLNCH is ready whenever you are.' },
  ],
  night: [
    { heading: (name: string) => `Burning the midnight oil, ${name}?`, sub: 'CLNCH works as late as you do.' },
    { heading: (name: string) => `Late night session, ${name}.`, sub: 'Paste a link — we\'ll do the heavy lifting.' },
    { heading: (name: string) => `Night owl mode, ${name}.`, sub: 'The pipeline never sleeps. Neither do we.' },
  ],
};

function getTimeSlot(): keyof typeof GREETING_POOLS {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}

function pickGreeting(name: string) {
  const pool = GREETING_POOLS[getTimeSlot()];
  const pick = pool[Math.floor(Math.random() * pool.length)];
  return { heading: pick.heading(name), sub: pick.sub };
}

export default function TopBar({
  viewMode,
  onViewModeChange,
  search,
  onSearchChange,
  selectedCategories,
  onCategoryToggle,
  rightPanelWidth = 0,
}: TopBarProps) {
  const [catOpen, setCatOpen] = useState(false);
  const catRef = useRef<HTMLDivElement>(null);
  const userName = 'Sandra';

  // Pick a greeting once per mount; re-pick when user clicks the heading
  const [greeting, setGreeting] = useState(() => pickGreeting(userName));
  const [greetingKey, setGreetingKey] = useState(0);

  const refreshGreeting = () => {
    setGreeting(pickGreeting(userName));
    setGreetingKey((k) => k + 1);
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (catRef.current && !catRef.current.contains(e.target as Node)) {
        setCatOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      className="h-[60px] bg-card-white border-b border-card-border flex items-center px-4 md:px-6 gap-3 md:gap-6 sticky top-0 z-20"
    >
      {/* Greeting — clickable to cycle */}
      <button
        onClick={refreshGreeting}
        className="flex-1 min-w-0 text-left group"
        title="Click to refresh greeting"
      >
        <h2
          key={greetingKey}
          className="text-base font-semibold text-charcoal leading-tight truncate animate-fade-in group-hover:text-burnt-orange transition-colors duration-150"
        >
          {greeting.heading}
        </h2>
        <p className="text-xs text-slate leading-tight truncate animate-fade-in">
          {greeting.sub}
        </p>
      </button>

      {/* Right Controls */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate/60" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Ask me anything..."
            className="pl-9 pr-4 py-2 w-[140px] sm:w-[180px] md:w-[220px] bg-cream border border-card-border rounded-full text-sm text-charcoal placeholder:text-slate/50 focus:outline-none focus:ring-2 focus:ring-burnt-orange/20 focus:border-burnt-orange/40 transition-all"
          />
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center border border-card-border rounded-lg overflow-hidden">
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-2 transition-colors ${
              viewMode === 'list'
                ? 'bg-cream-fill text-charcoal'
                : 'text-slate hover:bg-cream-fill/60'
            }`}
            aria-label="List view"
          >
            <LayoutList className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-2 transition-colors ${
              viewMode === 'grid'
                ? 'bg-cream-fill text-charcoal'
                : 'text-slate hover:bg-cream-fill/60'
            }`}
            aria-label="Grid view"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>

        {/* Categories Dropdown */}
        <div className="relative" ref={catRef}>
          <button
            onClick={() => setCatOpen(!catOpen)}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-all ${
              catOpen || selectedCategories.length > 0
                ? 'bg-cream-fill border-burnt-orange/30 text-charcoal'
                : 'border-card-border text-slate hover:bg-cream-fill/60 hover:text-charcoal'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Categories</span>
            {selectedCategories.length > 0 && (
              <span className="bg-burnt-orange text-white text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none">
                {selectedCategories.length}
              </span>
            )}
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${catOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {catOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-[200px] bg-card-white border border-card-border rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
              <div className="px-3 py-2 border-b border-card-border">
                <p className="text-xs font-medium text-slate uppercase tracking-wide">
                  Filter by Category
                </p>
              </div>
              <div className="py-1">
                {categories.map(({ id, label, icon: Icon }) => {
                  const active = selectedCategories.includes(id);
                  return (
                    <button
                      key={id}
                      onClick={() => onCategoryToggle(id)}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-cream-fill transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${active ? 'text-burnt-orange' : 'text-slate'}`} />
                        <span className={active ? 'text-charcoal font-medium' : 'text-charcoal'}>
                          {label}
                        </span>
                      </div>
                      {active && <Check className="w-3.5 h-3.5 text-burnt-orange" />}
                    </button>
                  );
                })}
              </div>
              {selectedCategories.length > 0 && (
                <div className="border-t border-card-border px-3 py-2">
                  <button
                    onClick={() => selectedCategories.forEach((id) => onCategoryToggle(id))}
                    className="text-xs text-slate hover:text-burnt-orange transition-colors"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

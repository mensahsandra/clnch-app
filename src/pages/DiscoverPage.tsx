import { useState, useEffect, useMemo } from 'react';
import {
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  MapPin,
  Calendar,
  Bell,
  Plus,
  X,
  Loader2,
  Search,
  Music,
  Moon,
  PartyPopper,
  Briefcase,
  UtensilsCrossed,
  ArrowRight,
  ChevronDown,
  LocateFixed,
  Globe,
  Clock,
  Frown,
} from 'lucide-react';
import { type DiscoverItem, type OpportunityCategory } from '../types';
import { useOpportunities } from '../context/OpportunitiesContext';
import { useMonitoring } from '../context/MonitoringContext';
import { useFastCapture } from '../context/FastCaptureContext';

const DEMO_DISCOVER: DiscoverItem[] = [
  {
    id: 'd1',
    source: 'Eventbrite',
    category: 'conference',
    title: 'African Tech Summit 2026',
    org: 'AfriTech Alliance',
    date: '2026-07-15',
    location: 'Lagos, Nigeria',
    daysLeft: 19,
    link: 'https://example.com/ats',
    tags: ['Networking', 'AI/ML', 'Africa'],
    region: 'West Africa',
    sector: 'Technology',
  },
  {
    id: 'd2',
    source: 'OpDesk',
    category: 'fellowship',
    title: 'TechForward Research Fellowship',
    org: 'TechForward Institute',
    date: '2026-06-24',
    location: 'Accra, Ghana',
    daysLeft: 12,
    link: 'https://example.com/fellowship',
    tags: ['Research', 'AI', 'Remote eligible'],
    region: 'Ghana',
    sector: 'Research',
    isRemote: true,
  },
  {
    id: 'd3',
    source: 'LinkedIn',
    category: 'job',
    title: 'Senior Frontend Engineer',
    org: 'Vercel',
    date: '2026-07-28',
    location: 'Remote',
    daysLeft: 45,
    link: 'https://example.com/vercel-job',
    tags: ['React', 'TypeScript', 'Full-time'],
    region: 'Remote',
    sector: 'Technology',
    isRemote: true,
  },
  {
    id: 'd4',
    source: 'CLNCH',
    category: 'grant',
    title: 'Green Innovation Grant 2026',
    org: 'Climate Action Fund',
    date: '2026-07-10',
    location: 'Global',
    daysLeft: 28,
    link: 'https://example.com/grant',
    tags: ['Climate', 'Sustainability', 'NGO'],
    region: 'Global',
    sector: 'Climate',
  },
  {
    id: 'd5',
    source: 'Conference',
    category: 'conference',
    title: 'Web Summit Lagos',
    org: 'Web Summit',
    date: '2026-08-05',
    location: 'Lagos, Nigeria',
    daysLeft: 40,
    link: 'https://example.com/websummit',
    tags: ['Startups', 'Networking', 'Africa'],
    region: 'West Africa',
    sector: 'Technology',
  },
  {
    id: 'd6',
    source: 'OpDesk',
    category: 'accelerator',
    title: 'AI Startup Accelerator Program',
    org: 'Founders Studio',
    date: '2026-06-17',
    location: 'Nairobi, Kenya',
    daysLeft: 5,
    link: 'https://example.com/accelerator',
    tags: ['AI', 'Startup', 'Funding'],
    region: 'Global',
    sector: 'Technology',
  },
  {
    id: 'd7',
    source: 'LinkedIn',
    category: 'internship',
    title: 'Software Engineering Internship',
    org: 'Google Africa',
    date: '2026-06-15',
    location: 'Accra, Ghana',
    daysLeft: 3,
    link: 'https://example.com/intern',
    tags: ['Google', 'Internship', 'Africa'],
    region: 'Ghana',
    sector: 'Technology',
  },
  {
    id: 'd8',
    source: 'Eventbrite',
    category: 'conference',
    title: 'DevFest Accra 2026',
    org: 'Google Developer Groups',
    date: '2026-09-12',
    location: 'Accra, Ghana',
    daysLeft: 88,
    link: 'https://example.com/devfest',
    tags: ['Developer', 'Google', 'Community'],
    region: 'Ghana',
    sector: 'Technology',
  },
];

const CATEGORY_LABEL: Record<OpportunityCategory, string> = {
  fellowship: 'Fellowship',
  grant: 'Grant',
  accelerator: 'Accelerator',
  job: 'Job',
  conference: 'Conference',
  internship: 'Internship',
  events: 'Event',
};

const CATEGORY_ICON: Record<OpportunityCategory, typeof Briefcase> = {
  fellowship: Music,
  grant: Moon,
  accelerator: PartyPopper,
  job: Briefcase,
  conference: PartyPopper,
  internship: UtensilsCrossed,
  events: Calendar,
};

const CATEGORY_COLOR: Record<OpportunityCategory, string> = {
  fellowship: 'bg-purple-50 text-purple-700 border-purple-200',
  grant: 'bg-green-50 text-green-700 border-green-200',
  accelerator: 'bg-blue-50 text-blue-700 border-blue-200',
  job: 'bg-sky-50 text-sky-700 border-sky-200',
  conference: 'bg-amber-50 text-amber-700 border-amber-200',
  internship: 'bg-pink-50 text-pink-700 border-pink-200',
  events: 'bg-orange-50 text-orange-700 border-orange-200',
};

const REGION_BADGE: Record<string, string> = {
  Ghana: 'bg-green-50 text-green-700 border-green-200',
  'West Africa': 'bg-amber-50 text-amber-700 border-amber-200',
  Global: 'bg-blue-50 text-blue-700 border-blue-200',
  Remote: 'bg-purple-50 text-purple-700 border-purple-200',
};

export default function DiscoverPage() {
  const { addOpportunity, opportunities } = useOpportunities();
  const { addMonitor, monitors } = useMonitoring();
  const { captureUrl } = useFastCapture();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<OpportunityCategory | 'all'>('all');
  const [selectedRegion, setSelectedRegion] = useState<'all' | 'Ghana' | 'West Africa' | 'Global' | 'Remote'>('all');
  const [showSaved, setShowSaved] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem('clnch_discover_saved');
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [trackItem, setTrackItem] = useState<DiscoverItem | null>(null);
  const [trackLoading, setTrackLoading] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('clnch_discover_saved', JSON.stringify([...savedIds]));
    } catch {
      /* ignore */
    }
  }, [savedIds]);

  const savedItems = useMemo(() => {
    return DEMO_DISCOVER.filter((d) => savedIds.has(d.id));
  }, [savedIds]);

  const filtered = useMemo(() => {
    let list = DEMO_DISCOVER;

    if (selectedCategory !== 'all') {
      list = list.filter((d) => d.category === selectedCategory);
    }

    if (selectedRegion !== 'all') {
      list = list.filter((d) => d.region === selectedRegion || (selectedRegion === 'Remote' && d.isRemote));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((d) =>
        [d.title, d.org, d.location, d.category, d.source, ...(d.tags ?? [])].some(
          (f) => f?.toLowerCase().includes(q)
        )
      );
    }

    return list;
  }, [selectedCategory, selectedRegion, searchQuery]);

  const toggleSaved = (id: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleTrack = async (goal: string, email?: string) => {
    if (!trackItem || !trackItem.link) return;
    setTrackLoading(true);
    try {
      await addMonitor({
        name: trackItem.title,
        url: trackItem.link,
        goal: goal || 'Notify me about changes',
        category: trackItem.category,
        email,
      });
      setTrackItem(null);
    } catch {
      /* keep modal open on error */
    } finally {
      setTrackLoading(false);
    }
  };

  const handleCapture = (item: DiscoverItem) => {
    if (item.link) {
      captureUrl(item.link);
    }
  };

  const isTracked = (item: DiscoverItem) =>
    monitors.some((m) => m.url === item.link || m.name === item.title);

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-card-border bg-card-white flex-shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate/60" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search opportunities, events, jobs..."
                className="input-field pl-9 w-full"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate/60 hover:text-charcoal"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowSaved(!showSaved)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                showSaved ? 'bg-burnt-orange text-white' : 'bg-cream-fill text-charcoal hover:bg-cream'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span className="hidden sm:inline">Saved</span>
              {savedIds.size > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${showSaved ? 'bg-white/20 text-white' : 'bg-burnt-orange text-white'}`}>
                  {savedIds.size}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 border-b border-card-border bg-cream flex items-center gap-2 overflow-x-auto flex-shrink-0">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`chip whitespace-nowrap ${selectedCategory === 'all' ? 'chip-active' : ''}`}
          >
            All
          </button>
          {(Object.keys(CATEGORY_LABEL) as OpportunityCategory[]).map((cat) => {
            const Icon = CATEGORY_ICON[cat];
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`chip whitespace-nowrap flex items-center gap-1.5 ${selectedCategory === cat ? 'chip-active' : ''}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {CATEGORY_LABEL[cat]}
              </button>
            );
          })}

          <div className="w-px h-5 bg-card-border mx-1" />

          <div className="relative">
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value as any)}
              className="appearance-none chip pr-7 cursor-pointer bg-cream"
            >
              <option value="all">All Regions</option>
              <option value="Ghana">Ghana</option>
              <option value="West Africa">West Africa</option>
              <option value="Global">Global</option>
              <option value="Remote">Remote</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate pointer-events-none" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {showSaved ? (
            <div>
              <h2 className="text-lg font-bold text-charcoal mb-4 flex items-center gap-2">
                <BookmarkCheck className="w-5 h-5 text-burnt-orange" />
                Saved Items
              </h2>
              {savedItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[200px] text-center">
                  <Frown className="w-8 h-8 text-slate/30 mb-2" />
                  <p className="text-sm text-slate">No saved items yet</p>
                  <p className="text-xs text-slate/60 mt-1">Browse below and click the bookmark icon to save</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {savedItems.map((item) => (
                    <DiscoverCard
                      key={item.id}
                      item={item}
                      isSaved={true}
                      isTracked={isTracked(item)}
                      onToggleSave={() => toggleSaved(item.id)}
                      onTrack={() => setTrackItem(item)}
                      onCapture={() => handleCapture(item)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
                  <Frown className="w-10 h-10 text-slate/30 mb-3" />
                  <p className="text-sm font-medium text-slate">No matches found</p>
                  <p className="text-xs text-slate/60 mt-1">Try adjusting your filters or search query</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filtered.map((item) => (
                    <DiscoverCard
                      key={item.id}
                      item={item}
                      isSaved={savedIds.has(item.id)}
                      isTracked={isTracked(item)}
                      onToggleSave={() => toggleSaved(item.id)}
                      onTrack={() => setTrackItem(item)}
                      onCapture={() => handleCapture(item)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Track Modal */}
      {trackItem && (
        <TrackModal
          item={trackItem}
          loading={trackLoading}
          onConfirm={handleTrack}
          onClose={() => setTrackItem(null)}
        />
      )}
    </div>
  );
}

function DiscoverCard({
  item,
  isSaved,
  isTracked,
  onToggleSave,
  onTrack,
  onCapture,
}: {
  item: DiscoverItem;
  isSaved: boolean;
  isTracked: boolean;
  onToggleSave: () => void;
  onTrack: () => void;
  onCapture: () => void;
}) {
  const catLabel = CATEGORY_LABEL[item.category];
  const catColor = CATEGORY_COLOR[item.category];
  const Icon = CATEGORY_ICON[item.category];
  const regionBadge = item.region ? REGION_BADGE[item.region] ?? 'bg-gray-50 text-slate border-gray-200' : '';

  return (
    <div className="bg-card-white rounded-xl border border-card-border p-5 hover:shadow-md transition-shadow flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${catColor}`}>
          {catLabel}
        </span>
        <div className="flex items-center gap-1">
          {isTracked && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-200">
              <Bell className="w-3 h-3" />
              Tracking
            </span>
          )}
          <button
            onClick={onToggleSave}
            className="p-1 rounded-md hover:bg-cream-fill transition-colors"
            title={isSaved ? 'Remove from saved' : 'Save for later'}
          >
            {isSaved ? (
              <BookmarkCheck className="w-4 h-4 text-burnt-orange" />
            ) : (
              <Bookmark className="w-4 h-4 text-slate/60" />
            )}
          </button>
        </div>
      </div>

      {/* Title & Org */}
      <h3 className="font-bold text-[16px] text-charcoal leading-snug mb-1">
        {item.title}
      </h3>
      <p className="text-sm text-slate mb-3">{item.org}</p>

      {/* Meta */}
      <div className="space-y-1.5 mb-3">
        {item.date && (
          <div className="flex items-center gap-1.5 text-xs text-slate">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{item.date}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-xs text-slate">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{item.location}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate">
          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
          <span className={item.daysLeft <= 7 ? 'text-red-500 font-medium' : item.daysLeft <= 14 ? 'text-amber-600 font-medium' : ''}>
            {item.daysLeft} days left
          </span>
        </div>
      </div>

      {/* Tags */}
      {item.tags && item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {item.tags.map((tag) => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-cream-fill text-slate border border-card-border">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Region badge */}
      {item.region && (
        <div className="mb-4">
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${regionBadge}`}>
            {item.region}
          </span>
        </div>
      )}

      {/* Source */}
      <div className="flex items-center gap-1.5 text-[10px] text-slate/70 mb-4">
        <Globe className="w-3 h-3" />
        <span>{item.source}</span>
      </div>

      {/* Actions */}
      <div className="mt-auto flex items-center gap-2 pt-3 border-t border-card-border/60">
        <button
          onClick={onCapture}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-burnt-orange text-white text-xs font-semibold rounded-lg hover:bg-burnt-orange/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Capture
        </button>
        <button
          onClick={onTrack}
          className="flex items-center justify-center gap-1.5 py-2 px-3 border border-card-border text-charcoal text-xs font-medium rounded-lg hover:bg-cream-fill transition-colors"
        >
          <Bell className="w-3.5 h-3.5" />
          Track
        </button>
        {item.link && (
          <button
            onClick={() => window.open(item.link, '_blank')}
            className="p-2 border border-card-border text-slate rounded-lg hover:bg-cream-fill transition-colors"
            title="Open link"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function EventCard({
  item,
  isSaved,
  onToggleSave,
}: {
  item: DiscoverItem;
  isSaved: boolean;
  onToggleSave: () => void;
}) {
  return (
    <div className="bg-card-white rounded-xl border border-card-border p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-burnt-orange/10 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-burnt-orange" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-charcoal">{item.title}</h3>
            <p className="text-xs text-slate">{item.org}</p>
          </div>
        </div>
        <button
          onClick={onToggleSave}
          className="p-1 rounded-md hover:bg-cream-fill transition-colors"
        >
          {isSaved ? (
            <BookmarkCheck className="w-4 h-4 text-burnt-orange" />
          ) : (
            <Bookmark className="w-4 h-4 text-slate/60" />
          )}
        </button>
      </div>

      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-1.5 text-xs text-slate">
          <MapPin className="w-3.5 h-3.5" />
          <span>{item.location}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate">
          <Calendar className="w-3.5 h-3.5" />
          <span>{item.date ?? 'TBD'}</span>
        </div>
      </div>

      {item.link && (
        <button
          onClick={() => window.open(item.link, '_blank')}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 border border-card-border text-charcoal text-xs font-medium rounded-lg hover:bg-cream-fill transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          View Event
        </button>
      )}
    </div>
  );
}

function TrackModal({
  item,
  loading,
  onConfirm,
  onClose,
}: {
  item: DiscoverItem;
  loading: boolean;
  onConfirm: (goal: string, email?: string) => void;
  onClose: () => void;
}) {
  const [goal, setGoal] = useState('Notify me about deadline changes');
  const [email, setEmail] = useState('');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-card-white border border-card-border rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="px-6 py-5 border-b border-card-border">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-charcoal">Track changes</h3>
              <p className="text-sm text-slate mt-1">Monitor this page for changes</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-cream-fill transition-colors"
            >
              <X className="w-5 h-5 text-slate" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="bg-cream-fill rounded-lg p-3 border border-card-border">
            <p className="text-sm font-medium text-charcoal">{item.title}</p>
            <p className="text-xs text-slate mt-0.5">{item.org}</p>
            {item.link && (
              <p className="text-[10px] text-slate/60 mt-1 truncate">{item.link}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-charcoal mb-1.5 block">Tracking goal</label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="input-field w-full"
            >
              <option>Notify me about deadline changes</option>
              <option>Notify me about new requirements</option>
              <option>Notify me about any changes</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-charcoal mb-1.5 block">Email (optional)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="input-field w-full"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-card-border flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate hover:text-charcoal transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(goal, email || undefined)}
            disabled={loading}
            className="btn-primary px-4 py-2 text-sm flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Setting up...' : 'Start tracking'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SearchEventCard({
  item,
  onSave,
  onTrack,
}: {
  item: DiscoverItem;
  onSave: () => void;
  onTrack: () => void;
}) {
  return (
    <div className="bg-card-white rounded-xl border border-card-border p-4 hover:shadow-sm transition-shadow flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-cream-fill flex items-center justify-center flex-shrink-0">
        <LocateFixed className="w-5 h-5 text-burnt-orange" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-charcoal truncate">{item.title}</h4>
        <p className="text-xs text-slate truncate">{item.org} · {item.location}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onSave}
          className="p-1.5 rounded-md hover:bg-cream-fill transition-colors"
        >
          <Bookmark className="w-4 h-4 text-slate/60" />
        </button>
        <button
          onClick={onTrack}
          className="p-1.5 rounded-md hover:bg-cream-fill transition-colors"
        >
          <Bell className="w-4 h-4 text-slate/60" />
        </button>
        {item.link && (
          <button
            onClick={() => window.open(item.link, '_blank')}
            className="p-1.5 rounded-md hover:bg-cream-fill transition-colors"
          >
            <ArrowRight className="w-4 h-4 text-slate/60" />
          </button>
        )}
      </div>
    </div>
  );
}

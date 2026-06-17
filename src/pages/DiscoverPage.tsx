import { useState } from 'react';
import {
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  MapPin,
  Calendar,
  Eye,
  Bell,
  Plus,
  X,
  Loader2,
} from 'lucide-react';
import { type DiscoverItem, type OpportunityCategory } from '../types';
import { useMonitoring } from '../context/MonitoringContext';
import { useFastCapture } from '../context/FastCaptureContext';

const DISCOVER_FEED: DiscoverItem[] = [
  {
    id: 'd1',
    source: 'OpDesk',
    category: 'fellowship',
    title: 'Mandela Washington Fellowship for Young African Leaders',
    org: 'U.S. Department of State',
    date: '2026-09-01',
    location: 'Washington D.C., USA',
    daysLeft: 18,
    link: 'https://example.com/mandela',
    isRemote: false,
    region: 'Global',
    sector: 'Governance',
    tags: ['Leadership', 'Governance', 'Africa'],
  },
  {
    id: 'd2',
    source: 'OpDesk',
    category: 'grant',
    title: 'Youth Climate Action Innovation Fund',
    org: 'UNDP Africa',
    date: '2026-07-15',
    location: 'Remote',
    daysLeft: 33,
    link: 'https://example.com/undp-climate',
    isRemote: true,
    region: 'Global',
    sector: 'Climate',
    tags: ['Climate', 'Youth', 'Innovation'],
  },
  {
    id: 'd3',
    source: 'Eventbrite',
    category: 'conference',
    title: 'Africa Tech Summit Nairobi 2026',
    org: 'AfriTech Events',
    date: '2026-08-12',
    location: 'Nairobi, Kenya',
    daysLeft: 60,
    link: 'https://example.com/ats-nairobi',
    isRemote: false,
    region: 'West Africa',
    sector: 'Technology',
    tags: ['Tech', 'Networking', 'Startup'],
  },
  {
    id: 'd4',
    source: 'LinkedIn',
    category: 'job',
    title: 'Senior Software Engineer — AI Infrastructure',
    org: 'Paystack',
    date: '2026-07-30',
    location: 'Lagos, Nigeria (Hybrid)',
    daysLeft: 48,
    link: 'https://example.com/paystack-job',
    isRemote: false,
    region: 'Ghana',
    sector: 'Technology',
    tags: ['Engineering', 'AI', 'Fintech'],
  },
  {
    id: 'd5',
    source: 'Conference',
    category: 'conference',
    title: 'NeurIPS 2026 — Call for Papers',
    org: 'Neural Information Processing Systems',
    date: '2026-12-01',
    location: 'Vancouver, Canada',
    daysLeft: 42,
    link: 'https://example.com/neurips',
    isRemote: false,
    region: 'Global',
    sector: 'Technology',
    tags: ['AI', 'Research', 'ML'],
  },
  {
    id: 'd6',
    source: 'OpDesk',
    category: 'accelerator',
    title: 'Google for Startups Africa Accelerator',
    org: 'Google',
    date: '2026-07-08',
    location: 'Remote (Africa)',
    daysLeft: 26,
    link: 'https://example.com/google-accelerator',
    isRemote: true,
    region: 'West Africa',
    sector: 'Technology',
    tags: ['Startup', 'Accelerator', 'Africa'],
  },
];

const CAT_PILLS = [
  { id: 'all', label: 'All' },
  { id: 'monitoring', label: 'Monitoring' },
  { id: 'conference', label: 'Events' },
  { id: 'fellowship', label: 'Fellowships' },
  { id: 'grant', label: 'Grants' },
  { id: 'job', label: 'Jobs' },
  { id: 'accelerator', label: 'Accelerators' },
];

const LOCATION_TABS = [
  { id: 'all', label: 'All' },
  { id: 'Ghana', label: 'Ghana' },
  { id: 'West Africa', label: 'West Africa' },
  { id: 'Global', label: 'Global' },
  { id: 'Remote', label: 'Remote' },
];

const SOURCE_COLORS: Record<string, string> = {
  Eventbrite: 'bg-orange-50 text-orange-700',
  OpDesk: 'bg-blue-50 text-blue-700',
  LinkedIn: 'bg-sky-50 text-sky-700',
  Conference: 'bg-purple-50 text-purple-700',
  CLNCH: 'bg-cream-fill text-charcoal',
};

const CAT_LABELS: Record<string, string> = {
  fellowship: 'Fellowship',
  grant: 'Grant',
  accelerator: 'Accelerator',
  job: 'Job',
  conference: 'Event',
  internship: 'Internship',
};

const MONITOR_GOAL_PLACEHOLDERS: Record<string, string> = {
  fellowship: 'Tell me when applications open',
  grant: 'Tell me if the deadline moves',
  accelerator: 'Tell me when the cohort is announced',
  conference: 'Tell me when tickets go on sale',
  job: 'Tell me if the role closes early',
  internship: 'Tell me when applications open',
};

export default function DiscoverPage() {
  const [catFilter, setCatFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [items, setItems] = useState<DiscoverItem[]>(DISCOVER_FEED);
  const [trackModal, setTrackModal] = useState<DiscoverItem | null>(null);
  const [customMonitor, setCustomMonitor] = useState({ url: '', goal: '', category: 'fellowship' as OpportunityCategory });
  const [isAddingMonitor, setIsAddingMonitor] = useState(false);
  const { enabled, addMonitor, monitors } = useMonitoring();
  const { captureUrl } = useFastCapture();

  const filtered = items.filter((item) => {
    if (catFilter === 'monitoring') {
      return item.monitorStatus === 'watching' || item.monitorStatus === 'changed';
    }
    const catMatch = catFilter === 'all' || item.category === catFilter;
    const locMatch =
      locationFilter === 'all' ||
      (locationFilter === 'Remote' ? item.isRemote : item.region === locationFilter);
    return catMatch && locMatch;
  });

  const toggleSave = (id: string) => {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleTrack = async (item: DiscoverItem, goal: string) => {
    if (!item.link) return;
    await addMonitor({
      name: item.title,
      url: item.link,
      goal,
      category: item.category,
    });
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? { ...i, monitorStatus: 'watching', monitorGoal: goal, lastCheckedAt: 'just now' }
          : i
      )
    );
    setTrackModal(null);
  };

  const handleAddCustomMonitor = async () => {
    if (!customMonitor.url.trim()) return;
    setIsAddingMonitor(true);
    try {
      await addMonitor({
        name: customMonitor.url,
        url: customMonitor.url,
        goal: customMonitor.goal || 'Notify me about meaningful changes',
        category: customMonitor.category,
      });
      setCustomMonitor({ url: '', goal: '', category: 'fellowship' });
    } finally {
      setIsAddingMonitor(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-card-white border-b border-card-border px-6 pt-4 pb-0 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-base font-bold text-charcoal">Discover Opportunities</h1>
          {!enabled && (
            <span className="text-xs text-slate bg-cream-fill px-2 py-1 rounded-full">
              Enable monitoring in Settings
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin pb-3">
          {CAT_PILLS.map((pill) => (
            <button
              key={pill.id}
              onClick={() => setCatFilter(pill.id)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                catFilter === pill.id
                  ? 'bg-burnt-orange text-white shadow-sm'
                  : 'border border-card-border text-slate hover:border-burnt-orange/40 hover:text-charcoal bg-card-white'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {catFilter !== 'monitoring' && (
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin pb-3 border-t border-card-border/50 pt-2">
            {LOCATION_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setLocationFilter(tab.id)}
                className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                  locationFilter === tab.id
                    ? 'bg-cream-fill text-burnt-orange font-semibold'
                    : 'text-slate hover:text-charcoal'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
        {catFilter === 'monitoring' && (
          <div className="mb-6 bg-card-white border border-card-border rounded-xl p-4">
            <h2 className="text-sm font-semibold text-charcoal mb-1 flex items-center gap-2">
              <Eye className="w-4 h-4 text-burnt-orange" />
              Add a website to monitor
            </h2>
            <p className="text-xs text-slate mb-3">
              Paste a URL or describe what you want to know when the page changes.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                value={customMonitor.url}
                onChange={(e) => setCustomMonitor((m) => ({ ...m, url: e.target.value }))}
                placeholder="https://example.com/opportunities"
                className="input-field text-sm"
              />
              <select
                value={customMonitor.category}
                onChange={(e) =>
                  setCustomMonitor((m) => ({ ...m, category: e.target.value as OpportunityCategory }))
                }
                className="input-field text-sm"
              >
                {Object.entries(CAT_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              value={customMonitor.goal}
              onChange={(e) => setCustomMonitor((m) => ({ ...m, goal: e.target.value }))}
              placeholder='What do you want to know when it changes? e.g. "Tell me when applications open"'
              className="input-field text-sm mt-2 resize-none"
              rows={2}
            />
            <button
              onClick={handleAddCustomMonitor}
              disabled={!customMonitor.url.trim() || isAddingMonitor}
              className="mt-3 flex items-center gap-2 px-4 py-2 bg-burnt-orange text-white text-sm font-semibold rounded-lg hover:bg-burnt-orange/90 disabled:opacity-50"
            >
              {isAddingMonitor ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Start monitoring
            </button>

            {monitors.length > 0 && (
              <div className="mt-4 pt-4 border-t border-card-border space-y-2">
                {monitors.map((m) => (
                  <div key={m.id} className="flex items-start justify-between gap-3 text-xs">
                    <div>
                      <p className="font-medium text-charcoal">{m.name}</p>
                      <p className="text-slate truncate max-w-md">{m.url}</p>
                      {m.changeSummary && (
                        <p className="text-amber-700 mt-1">{m.changeSummary}</p>
                      )}
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                        m.status === 'changed'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-green-50 text-green-700'
                      }`}
                    >
                      {m.status === 'changed' ? 'Changed' : `Watching · ${m.lastCheckedAt}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
            <p className="text-sm font-medium text-slate mb-1">No opportunities match this filter</p>
            <button
              onClick={() => {
                setCatFilter('all');
                setLocationFilter('all');
              }}
              className="text-xs text-burnt-orange hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => (
              <DiscoverCard
                key={item.id}
                item={item}
                isSaved={saved.has(item.id)}
                onSave={() => toggleSave(item.id)}
                onTrack={() => setTrackModal(item)}
                onCapture={() => item.link && captureUrl(item.link)}
              />
            ))}
          </div>
        )}
      </div>

      {trackModal && (
        <TrackModal
          item={trackModal}
          onClose={() => setTrackModal(null)}
          onConfirm={(goal) => handleTrack(trackModal, goal)}
        />
      )}
    </div>
  );
}

function TrackModal({
  item,
  onClose,
  onConfirm,
}: {
  item: DiscoverItem;
  onClose: () => void;
  onConfirm: (goal: string) => void;
}) {
  const [goal, setGoal] = useState(MONITOR_GOAL_PLACEHOLDERS[item.category] ?? 'Notify me about meaningful changes');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-sm">
      <div className="bg-card-white rounded-xl shadow-2xl max-w-md w-full p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-charcoal">Track this opportunity</h3>
            <p className="text-xs text-slate mt-1">{item.title}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-cream-fill">
            <X className="w-4 h-4 text-slate" />
          </button>
        </div>
        <label className="text-xs font-medium text-slate block mb-1.5">
          What do you want to know when it changes?
        </label>
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          className="input-field text-sm resize-none"
          rows={3}
          placeholder='e.g. "Tell me when applications open"'
        />
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-2 text-sm border border-card-border rounded-lg hover:bg-cream-fill">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(goal)}
            className="flex-1 py-2 text-sm bg-burnt-orange text-white font-semibold rounded-lg hover:bg-burnt-orange/90 flex items-center justify-center gap-2"
          >
            <Bell className="w-4 h-4" />
            Start tracking
          </button>
        </div>
      </div>
    </div>
  );
}

function DiscoverCard({
  item,
  isSaved,
  onSave,
  onTrack,
  onCapture,
}: {
  item: DiscoverItem;
  isSaved: boolean;
  onSave: () => void;
  onTrack: () => void;
  onCapture: () => void;
}) {
  return (
    <div className="bg-card-white border border-card-border rounded-xl p-4 flex flex-col gap-3 hover:shadow-md hover:border-burnt-orange/30 transition-all duration-200">
      <div className="flex items-center justify-between gap-2">
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${SOURCE_COLORS[item.source] ?? 'bg-gray-100 text-slate'}`}>
          {item.source}
        </span>
        <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-cream-fill text-slate border border-card-border">
          {CAT_LABELS[item.category] ?? item.category}
        </span>
      </div>

      {(item.monitorStatus === 'watching' || item.monitorStatus === 'changed') && (
        <div
          className={`text-xs px-2.5 py-2 rounded-lg ${
            item.monitorStatus === 'changed'
              ? 'bg-amber-50 border border-amber-200 text-amber-800'
              : 'bg-cream-fill border border-card-border text-slate'
          }`}
        >
          {item.monitorStatus === 'changed' ? (
            <>
              <span className="font-semibold">Something changed — check now →</span>
              {item.changeSummary && <p className="mt-0.5">{item.changeSummary}</p>}
            </>
          ) : (
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              Watching — last checked {item.lastCheckedAt ?? 'recently'}
            </span>
          )}
        </div>
      )}

      <div className="flex-1">
        <h3 className="text-sm font-bold text-charcoal leading-snug mb-1">{item.title}</h3>
        <p className="text-xs font-medium text-slate mb-2">{item.org}</p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate/70">
          {item.date && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {item.date}
            </span>
          )}
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {item.location}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1 border-t border-card-border/60">
        <button
          onClick={onSave}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
            isSaved ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-burnt-orange text-white hover:bg-burnt-orange/90'
          }`}
        >
          {isSaved ? (
            <>
              <BookmarkCheck className="w-4 h-4" /> Saved
            </>
          ) : (
            <>Save to Pipeline →</>
          )}
        </button>
        {!item.monitorStatus && (
          <button
            onClick={onTrack}
            title="Track changes"
            className="p-2 rounded-lg border border-card-border hover:bg-cream-fill transition-colors"
          >
            <Eye className="w-4 h-4 text-slate" />
          </button>
        )}
        {item.link && (
          <>
            <button
              onClick={onCapture}
              title="Fast-Capture with Firecrawl"
              className="p-2 rounded-lg border border-card-border hover:bg-cream-fill transition-colors text-burnt-orange"
            >
              <Plus className="w-4 h-4" />
            </button>
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg border border-card-border hover:bg-cream-fill transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-slate" />
            </a>
          </>
        )}
      </div>
    </div>
  );
}

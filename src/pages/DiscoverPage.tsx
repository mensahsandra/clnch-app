import { useState, useEffect, useMemo } from 'react';
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
  Search,
  Music,
  Moon,
  PartyPopper,
  Briefcase,
  UtensilsCrossed,
  ArrowRight,
  Compass,
  SlidersHorizontal,
  ChevronDown,
  LocateFixed,
  Globe,
  Clock,
  Frown,
  Heart,
  Share2,
  Trash2,
} from 'lucide-react';
import { type DiscoverItem, type OpportunityCategory } from '../types';
import { useOpportunities } from '../context/OpportunitiesContext';
import { useMonitoring } from '../context/MonitoringContext';
import { useFastCapture } from '../context/FastCaptureContext';

// ─── Hero Banner Data ───
const HERO_BANNERS = [
  {
    tagline: "GET INTO IT",
    title: "FROM POP BALLADS TO EMO ENCORES",
    cta: "Get Into Live Music",
    image: "https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750",
    category: "Music",
  },
  {
    tagline: "NETWORK & GROW",
    title: "FROM STARTUP MEETS TO PANEL DISCUSSIONS",
    cta: "Explore Business Events",
    image: "https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750",
    category: "Business",
  },
  {
    tagline: "TASTE THE WORLD",
    title: "FROM STREET FOOD TO FINE DINING",
    cta: "Find Food Events",
    image: "https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750",
    category: "Food & Drink",
  },
];

// ─── Event Categories (Eventbrite-style) ───
const EVENT_CATEGORIES = [
  { id: 'Music', label: 'Music', icon: Music },
  { id: 'Nightlife', label: 'Nightlife', icon: Moon },
  { id: 'Holidays', label: 'Holidays', icon: PartyPopper },
  { id: 'Hobbies', label: 'Hobbies', icon: Heart },
  { id: 'Business', label: 'Business', icon: Briefcase },
  { id: 'Food & Drink', label: 'Food & Drink', icon: UtensilsCrossed },
];

// ─── Time Filters ───
const TIME_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'today', label: 'Today' },
  { id: 'weekend', label: 'This weekend' },
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'This month' },
];

// ─── Mock Events (Eventbrite-style real data) ───
const MOCK_EVENTS: DiscoverItem[] = [
  {
    id: 'e1',
    source: 'Eventbrite',
    category: 'conference',
    title: 'Accra Tech Summit 2026 — AI & Innovation Track',
    org: 'AfriTech Foundation',
    date: '2026-07-15',
    location: 'Accra, Ghana',
    daysLeft: 28,
    link: 'https://example.com/accra-tech-summit',
    isRemote: false,
    region: 'Ghana',
    sector: 'Technology',
    tags: ['AI', 'Innovation', 'Networking'],
  },
  {
    id: 'e2',
    source: 'Eventbrite',
    category: 'conference',
    title: 'Ghana Music Festival — Live Stage & Afrobeats Night',
    org: 'GMF Events',
    date: '2026-08-22',
    location: 'Kumasi, Ghana',
    daysLeft: 66,
    link: 'https://example.com/ghana-music-fest',
    isRemote: false,
    region: 'Ghana',
    sector: 'Music',
    tags: ['Music', 'Live', 'Afrobeats'],
  },
  {
    id: 'e3',
    source: 'Eventbrite',
    category: 'conference',
    title: 'Lagos Startup Week — Pitch Day & Networking',
    org: 'TechCabal',
    date: '2026-09-10',
    location: 'Lagos, Nigeria',
    daysLeft: 85,
    link: 'https://example.com/lagos-startup-week',
    isRemote: false,
    region: 'West Africa',
    sector: 'Business',
    tags: ['Startup', 'Pitch', 'Business'],
  },
  {
    id: 'e4',
    source: 'Eventbrite',
    category: 'conference',
    title: 'West African Food & Wine Expo 2026',
    org: 'WAFWE',
    date: '2026-10-05',
    location: 'Abuja, Nigeria',
    daysLeft: 110,
    link: 'https://example.com/food-wine-expo',
    isRemote: false,
    region: 'West Africa',
    sector: 'Food & Drink',
    tags: ['Food', 'Wine', 'Expo'],
  },
  {
    id: 'e5',
    source: 'Eventbrite',
    category: 'conference',
    title: 'Digital Nomad Meetup — Remote Work in Africa',
    org: 'NomadList Africa',
    date: '2026-07-20',
    location: 'Remote',
    daysLeft: 33,
    link: 'https://example.com/nomad-meetup',
    isRemote: true,
    region: 'Remote',
    sector: 'Business',
    tags: ['Remote', 'Networking', 'Digital'],
  },
  {
    id: 'e6',
    source: 'Eventbrite',
    category: 'conference',
    title: 'Nightlife Experience — Accra Rooftop Party',
    org: 'Skyline Events',
    date: '2026-07-12',
    location: 'Accra, Ghana',
    daysLeft: 25,
    link: 'https://example.com/rooftop-party',
    isRemote: false,
    region: 'Ghana',
    sector: 'Nightlife',
    tags: ['Nightlife', 'Party', 'Social'],
  },
  {
    id: 'e7',
    source: 'Eventbrite',
    category: 'conference',
    title: 'Holiday Makers Festival — Family Fun Day',
    org: 'Family First Ghana',
    date: '2026-12-26',
    location: 'Tema, Ghana',
    daysLeft: 192,
    link: 'https://example.com/holiday-makers',
    isRemote: false,
    region: 'Ghana',
    sector: 'Holidays',
    tags: ['Family', 'Holidays', 'Fun'],
  },
  {
    id: 'e8',
    source: 'Eventbrite',
    category: 'conference',
    title: 'Hobby Craft Fair — Handmade & Artisan Market',
    org: 'Artisan Collective',
    date: '2026-08-15',
    location: 'Cape Coast, Ghana',
    daysLeft: 59,
    link: 'https://example.com/craft-fair',
    isRemote: false,
    region: 'Ghana',
    sector: 'Hobbies',
    tags: ['Craft', 'Handmade', 'Artisan'],
  },
  {
    id: 'e9',
    source: 'Eventbrite',
    category: 'conference',
    title: 'Pan-African Business Conference 2026',
    org: 'PABC',
    date: '2026-11-20',
    location: 'Nairobi, Kenya',
    daysLeft: 156,
    link: 'https://example.com/pabc-2026',
    isRemote: false,
    region: 'Global',
    sector: 'Business',
    tags: ['Business', 'Africa', 'Conference'],
  },
  {
    id: 'e10',
    source: 'Eventbrite',
    category: 'conference',
    title: 'Street Food Carnival — Taste of West Africa',
    org: 'StreetEats GH',
    date: '2026-09-25',
    location: 'Accra, Ghana',
    daysLeft: 100,
    link: 'https://example.com/street-food-carnival',
    isRemote: false,
    region: 'Ghana',
    sector: 'Food & Drink',
    tags: ['Food', 'Street', 'Carnival'],
  },
  {
    id: 'e11',
    source: 'Eventbrite',
    category: 'conference',
    title: 'Jazz Night Under the Stars — Live Band',
    org: 'Jazz Accra',
    date: '2026-08-08',
    location: 'Accra, Ghana',
    daysLeft: 52,
    link: 'https://example.com/jazz-night',
    isRemote: false,
    region: 'Ghana',
    sector: 'Music',
    tags: ['Jazz', 'Live', 'Music'],
  },
  {
    id: 'e12',
    source: 'Eventbrite',
    category: 'conference',
    title: 'New Year Eve Countdown — Grand Ballroom Gala',
    org: 'Grand Events',
    date: '2026-12-31',
    location: 'Lagos, Nigeria',
    daysLeft: 197,
    link: 'https://example.com/nye-gala',
    isRemote: false,
    region: 'West Africa',
    sector: 'Holidays',
    tags: ['NYE', 'Gala', 'Party'],
  },
];

// ─── Non-event Discover Feed (opportunities) ───
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

// ─── Event Card Images ───
const EVENT_IMAGES: Record<string, string> = {
  'Music': 'https://images.pexels.com/photos/167491/pexels-photo-167491.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Nightlife': 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Holidays': 'https://images.pexels.com/photos/1303086/pexels-photo-1303086.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Hobbies': 'https://images.pexels.com/photos/1547813/pexels-photo-1547813.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Business': 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Food & Drink': 'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=600',
  default: 'https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg?auto=compress&cs=tinysrgb&w=600',
};

function getEventImage(item: DiscoverItem): string {
  if (item.sector && EVENT_IMAGES[item.sector]) return EVENT_IMAGES[item.sector];
  if (item.tags) {
    for (const tag of item.tags) {
      if (EVENT_IMAGES[tag]) return EVENT_IMAGES[tag];
    }
  }
  return EVENT_IMAGES.default;
}

function formatEventDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return 'Today';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function matchesTimeFilter(item: DiscoverItem, filter: string): boolean {
  if (!item.date || filter === 'all') return true;
  const d = new Date(item.date);
  const now = new Date();
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / 86400000);
  switch (filter) {
    case 'today': return diffDays <= 1 && diffDays >= 0;
    case 'weekend': {
      const day = d.getDay();
      return (day === 0 || day === 6) && diffDays <= 7 && diffDays >= 0;
    }
    case 'week': return diffDays <= 7 && diffDays >= 0;
    case 'month': return diffDays <= 30 && diffDays >= 0;
    default: return true;
  }
}

export default function DiscoverPage() {
  const [catFilter, setCatFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [items, setItems] = useState<DiscoverItem[]>([...MOCK_EVENTS, ...DISCOVER_FEED]);
  const [trackModal, setTrackModal] = useState<DiscoverItem | null>(null);
  const [customMonitor, setCustomMonitor] = useState({ url: '', goal: '', category: 'fellowship' as OpportunityCategory });
  const [isAddingMonitor, setIsAddingMonitor] = useState(false);
  const [eventCategory, setEventCategory] = useState<string>('all');
  const [eventTimeFilter, setEventTimeFilter] = useState('all');
  const [eventSearch, setEventSearch] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const { enabled, addMonitor, monitors } = useMonitoring();
  const { captureUrl } = useFastCapture();
  const { addOpportunity } = useOpportunities();

  const isEventsView = catFilter === 'conference';

  // Auto-rotate hero
  useEffect(() => {
    if (!isEventsView) return;
    const timer = setInterval(() => {
      setHeroIndex((i) => (i + 1) % HERO_BANNERS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isEventsView]);

  const filtered = useMemo(() => {
    let base = items;

    if (catFilter === 'monitoring') {
      return items.filter((i) => i.monitorStatus === 'watching' || i.monitorStatus === 'changed');
    }

    if (catFilter !== 'all') {
      base = base.filter((item) => item.category === catFilter);
    }

    // Events view filters
    if (isEventsView) {
      if (eventCategory !== 'all') {
        base = base.filter((item) => item.sector === eventCategory || item.tags?.includes(eventCategory));
      }
      if (eventTimeFilter !== 'all') {
        base = base.filter((item) => matchesTimeFilter(item, eventTimeFilter));
      }
      if (eventSearch.trim()) {
        const q = eventSearch.toLowerCase();
        base = base.filter(
          (item) =>
            item.title.toLowerCase().includes(q) ||
            item.org.toLowerCase().includes(q) ||
            item.location.toLowerCase().includes(q)
        );
      }
      if (eventLocation.trim()) {
        const loc = eventLocation.toLowerCase();
        base = base.filter((item) => item.location.toLowerCase().includes(loc));
      }
    }

    // Location filter for non-events
    if (!isEventsView && locationFilter !== 'all') {
      base = base.filter(
        (item) =>
          locationFilter === 'Remote'
            ? item.isRemote
            : item.region === locationFilter
      );
    }

    return base;
  }, [items, catFilter, locationFilter, eventCategory, eventTimeFilter, eventSearch, eventLocation, isEventsView]);

  const toggleSave = (item: DiscoverItem) => {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        next.add(item.id);
        // Also add to home pipeline
        addOpportunity({
          id: item.id,
          title: item.title,
          org: item.org,
          category: item.category,
          status: 'saved',
          urgency: 'Medium',
          daysLeft: item.daysLeft,
          deadline: item.date,
          link: item.link,
          location: item.location,
        });
      }
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

  const useCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => setEventLocation('Accra, Ghana'),
        () => setEventLocation('Accra, Ghana')
      );
    } else {
      setEventLocation('Accra, Ghana');
    }
    setShowLocationDropdown(false);
  };

  const currentHero = HERO_BANNERS[heroIndex];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Header ── */}
      <div className="bg-card-white border-b border-card-border px-6 pt-4 pb-0 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-base font-bold text-charcoal">
            {isEventsView ? 'Discover Events' : 'Discover Opportunities'}
          </h1>
          {!enabled && (
            <span className="text-xs text-slate bg-cream-fill px-2 py-1 rounded-full">
              Enable monitoring in Settings
            </span>
          )}
        </div>

        {/* Category pills */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin pb-3">
          {CAT_PILLS.map((pill) => (
            <button
              key={pill.id}
              onClick={() => { setCatFilter(pill.id); setEventCategory('all'); }}
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

        {/* Location tabs for non-events */}
        {!isEventsView && catFilter !== 'monitoring' && (
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

      {/* ── Events View ── */}
      {isEventsView && (
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {/* Hero Banner */}
          <div className="relative h-[280px] overflow-hidden">
            <img
              src={currentHero.image}
              alt=""
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-center px-8">
              <span className="text-white/80 text-sm font-medium uppercase tracking-wider mb-2">
                {currentHero.tagline}
              </span>
              <h2 className="text-white text-3xl font-bold max-w-md leading-tight mb-4">
                {currentHero.title}
              </h2>
              <button
                onClick={() => setEventCategory(currentHero.category)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-charcoal text-sm font-semibold rounded-full hover:bg-white/90 transition-colors w-fit"
              >
                {currentHero.cta}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            {/* Hero dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {HERO_BANNERS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setHeroIndex(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === heroIndex ? 'bg-white w-6' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Search & Location Bar */}
          <div className="px-6 py-4 bg-card-white border-b border-card-border">
            <div className="flex items-center gap-3 max-w-3xl mx-auto">
              <div className="flex-1 flex items-center gap-2 bg-cream-fill border border-card-border rounded-xl px-4 py-2.5 focus-within:border-burnt-orange/30 focus-within:ring-2 focus-within:ring-burnt-orange/10 transition-all">
                <Search className="w-4 h-4 text-slate" />
                <input
                  value={eventSearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                  placeholder="Search events"
                  className="flex-1 bg-transparent text-sm text-charcoal placeholder:text-slate/50 outline-none"
                />
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-cream-fill border border-card-border rounded-xl text-sm text-charcoal hover:border-burnt-orange/30 transition-all"
                >
                  <MapPin className="w-4 h-4 text-burnt-orange" />
                  {eventLocation || 'Your Location'}
                  <ChevronDown className="w-3 h-3 text-slate" />
                </button>
                {showLocationDropdown && (
                  <div className="absolute top-full right-0 mt-2 bg-card-white border border-card-border rounded-xl shadow-xl py-2 w-56 z-50">
                    <button
                      onClick={useCurrentLocation}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-charcoal hover:bg-cream-fill transition-colors"
                    >
                      <LocateFixed className="w-4 h-4 text-burnt-orange" />
                      Use my current location
                    </button>
                    <button
                      onClick={() => { setEventLocation(''); setShowLocationDropdown(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-charcoal hover:bg-cream-fill transition-colors"
                    >
                      <Globe className="w-4 h-4 text-burnt-orange" />
                      Browse online events
                    </button>
                    <div className="border-t border-card-border mx-3 my-1" />
                    <button
                      onClick={() => { setEventLocation('Accra, Ghana'); setShowLocationDropdown(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate hover:bg-cream-fill transition-colors"
                    >
                      <Clock className="w-4 h-4" />
                      Accra, Ghana
                    </button>
                    <button
                      onClick={() => { setEventLocation('Lagos, Nigeria'); setShowLocationDropdown(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate hover:bg-cream-fill transition-colors"
                    >
                      <Clock className="w-4 h-4" />
                      Lagos, Nigeria
                    </button>
                    <button
                      onClick={() => { setEventLocation('Nairobi, Kenya'); setShowLocationDropdown(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate hover:bg-cream-fill transition-colors"
                    >
                      <Clock className="w-4 h-4" />
                      Nairobi, Kenya
                    </button>
                  </div>
                )}
              </div>
              <button className="w-10 h-10 flex items-center justify-center bg-burnt-orange text-white rounded-xl hover:bg-burnt-orange/90 transition-colors">
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Event Categories */}
          <div className="px-6 py-6">
            <div className="flex items-center justify-center gap-6 flex-wrap">
              {EVENT_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const active = eventCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setEventCategory(active ? 'all' : cat.id)}
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div
                      className={`w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all ${
                        active
                          ? 'border-burnt-orange bg-burnt-orange/10'
                          : 'border-card-border hover:border-burnt-orange/40 hover:bg-cream-fill'
                      }`}
                    >
                      <Icon className={`w-6 h-6 transition-colors ${active ? 'text-burnt-orange' : 'text-slate group-hover:text-burnt-orange'}`} />
                    </div>
                    <span className={`text-xs font-medium transition-colors ${active ? 'text-burnt-orange' : 'text-slate'}`}>
                      {cat.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time filters */}
          <div className="px-6 pb-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-charcoal">
                {eventLocation ? `Events in ${eventLocation}` : 'All Events'}
              </span>
              <div className="flex items-center gap-1">
                {TIME_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setEventTimeFilter(f.id)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                      eventTimeFilter === f.id
                        ? 'text-burnt-orange border-b-2 border-burnt-orange'
                        : 'text-slate hover:text-charcoal'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Event Results */}
          <div className="px-6 pb-8">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-full bg-cream-fill flex items-center justify-center mb-4">
                  <Frown className="w-8 h-8 text-slate/40" />
                </div>
                <p className="text-base font-semibold text-slate mb-1">We couldn&apos;t find anything</p>
                <p className="text-sm text-slate/60 mb-4">
                  Adjust your filters and try again
                </p>
                <button
                  onClick={() => {
                    setEventCategory('all');
                    setEventTimeFilter('all');
                    setEventSearch('');
                    setEventLocation('');
                  }}
                  className="px-4 py-2 text-sm text-burnt-orange font-medium hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {filtered.slice(0, 10).map((item) => (
                  <EventCard
                    key={item.id}
                    item={item}
                    isSaved={saved.has(item.id)}
                    onSave={() => toggleSave(item)}
                    onTrack={() => setTrackModal(item)}
                    onCapture={() => item.link && captureUrl(item.link)}
                  />
                ))}
              </div>
            )}
            {filtered.length > 10 && (
              <p className="text-center text-xs text-slate mt-4">
                Showing 10 of {filtered.length} results
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Non-Events View (existing) ── */}
      {!isEventsView && (
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
                  onChange={(e) => setCustomMonitor((m) => ({ ...m, category: e.target.value as OpportunityCategory }))}
                  className="input-field text-sm"
                >
                  {Object.entries(CAT_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <textarea
                value={customMonitor.goal}
                onChange={(e) => setCustomMonitor((m) => ({ ...m, goal: e.target.value }))}
                placeholder='What do you want to know when it changes?'
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
                        {m.changeSummary && <p className="text-amber-700 mt-1">{m.changeSummary}</p>}
                      </div>
                      <span className={`px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                        m.status === 'changed' ? 'bg-amber-100 text-amber-800' : 'bg-green-50 text-green-700'
                      }`}>
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
                onClick={() => { setCatFilter('all'); setLocationFilter('all'); }}
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
                  onSave={() => toggleSave(item)}
                  onTrack={() => setTrackModal(item)}
                  onCapture={() => item.link && captureUrl(item.link)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Track Modal */}
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

// ─── Event Card (Eventbrite style) ───
function EventCard({
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
  const image = getEventImage(item);

  return (
    <div className="group bg-white rounded-xl border border-card-border overflow-hidden hover:shadow-lg hover:border-burnt-orange/20 transition-all duration-200">
      {/* Image */}
      <div className="relative h-40 overflow-hidden">
        <img src={image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        <div className="absolute top-2 right-2 flex gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onSave(); }}
            className={`p-1.5 rounded-full backdrop-blur-sm transition-colors ${
              isSaved ? 'bg-burnt-orange text-white' : 'bg-white/80 text-slate hover:text-burnt-orange'
            }`}
          >
            {isSaved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onTrack(); }}
            className="p-1.5 rounded-full bg-white/80 text-slate hover:text-burnt-orange backdrop-blur-sm transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
        {/* Date badge */}
        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 text-center min-w-[48px]">
          <div className="text-[10px] font-bold text-burnt-orange uppercase">
            {item.date ? new Date(item.date).toLocaleDateString('en-US', { month: 'short' }) : ''}
          </div>
          <div className="text-lg font-bold text-charcoal leading-none">
            {item.date ? new Date(item.date).getDate() : ''}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        <h3 className="text-sm font-bold text-charcoal leading-snug line-clamp-2 group-hover:text-burnt-orange transition-colors">
          {item.title}
        </h3>
        <div className="space-y-1">
          <p className="text-xs text-slate font-medium">{item.date ? formatEventDate(item.date) : ''}</p>
          <p className="text-xs text-slate/70 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {item.location}
          </p>
          <p className="text-xs text-slate/70">{item.org}</p>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 pt-2 border-t border-card-border/40">
          <button
            onClick={onSave}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all ${
              isSaved
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-burnt-orange text-white hover:bg-burnt-orange/90'
            }`}
          >
            {isSaved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
            {isSaved ? 'Saved' : 'Save'}
          </button>
          {item.link && (
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg border border-card-border hover:bg-cream-fill transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Track Modal ───
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

// ─── Discover Card (original, for non-events) ───
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
        <div className={`text-xs px-2.5 py-2 rounded-lg ${
          item.monitorStatus === 'changed'
            ? 'bg-amber-50 border border-amber-200 text-amber-800'
            : 'bg-cream-fill border border-card-border text-slate'
        }`}>
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
            <><BookmarkCheck className="w-4 h-4" /> Saved</>
          ) : (
            <><Bookmark className="w-4 h-4" /> Save</>
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
              title="Fast-Capture"
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

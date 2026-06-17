import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Clock, ChevronDown } from 'lucide-react';
import { supabase } from '../services/supabase';
import { type ApplicationSession } from '../types';

const SORT_OPTIONS = [
  { value: 'recent', label: 'Most Recent Activity' },
  { value: 'deadline', label: 'Looming Deadline' },
  { value: 'status', label: 'Application Status' },
];

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-green-50 text-green-700 border border-green-200',
  filed: 'bg-blue-50 text-blue-700 border border-blue-200',
  archived: 'bg-gray-100 text-slate',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ChatsPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<ApplicationSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('recent');
  const [sortOpen, setSortOpen] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('application_sessions')
      .select('*')
      .order('last_active_at', { ascending: false })
      .limit(50);
    setSessions(data ?? []);
    setLoading(false);
  };

  const sorted = [...sessions].sort((a, b) => {
    if (sortBy === 'recent') {
      return new Date(b.last_active_at).getTime() - new Date(a.last_active_at).getTime();
    }
    if (sortBy === 'status') {
      return a.status.localeCompare(b.status);
    }
    return 0;
  });

  const currentSort = SORT_OPTIONS.find((o) => o.value === sortBy)!;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-[60px] bg-card-white border-b border-card-border flex items-center justify-between px-6 flex-shrink-0">
        <h1 className="text-base font-bold text-charcoal">Coaching Sessions</h1>

        {/* Sort dropdown */}
        <div className="relative">
          <button
            onClick={() => setSortOpen(!sortOpen)}
            className="flex items-center gap-2 text-xs font-medium text-slate border border-card-border rounded-lg px-3 py-2 hover:bg-cream-fill transition-colors"
          >
            <span>Sort by: {currentSort.label}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
          </button>
          {sortOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-[220px] bg-card-white border border-card-border rounded-xl shadow-xl z-50 py-1 animate-fade-in">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setSortBy(opt.value); setSortOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    sortBy === opt.value ? 'text-burnt-orange font-medium bg-cream-fill' : 'text-charcoal hover:bg-cream-fill'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-burnt-orange/20 border-t-burnt-orange rounded-full animate-spin" />
          </div>
        ) : sorted.length === 0 ? (
          <EmptyState onStart={() => navigate('/')} />
        ) : (
          <div className="space-y-3 max-w-2xl">
            {sorted.map((session) => (
              <SessionCard key={session.id} session={session} onClick={() => navigate(`/chat/${session.id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SessionCard({ session, onClick }: { session: ApplicationSession; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-card-white border border-card-border rounded-xl p-4 hover:border-burnt-orange/40 hover:shadow-sm transition-all duration-150 group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 bg-burnt-orange/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-burnt-orange/20 transition-colors">
            <MessageSquare className="w-4 h-4 text-burnt-orange" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-charcoal truncate group-hover:text-burnt-orange transition-colors">
              {session.opportunity_title}
            </p>
            <p className="text-xs text-slate truncate">{session.opportunity_org}</p>
            {session.last_message_preview && (
              <p className="text-xs text-slate/70 mt-1 line-clamp-1">{session.last_message_preview}</p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_BADGE[session.status] ?? 'bg-gray-100 text-slate'}`}>
            {session.status}
          </span>
          <span className="text-xs text-slate/60 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {timeAgo(session.last_active_at)}
          </span>
        </div>
      </div>
    </button>
  );
}

function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center max-w-sm mx-auto">
      <div className="w-16 h-16 mb-5 bg-cream-fill rounded-2xl flex items-center justify-center">
        <MessageSquare className="w-8 h-8 text-slate/30" />
      </div>
      <p className="text-base font-semibold text-charcoal mb-2">No coaching sessions yet</p>
      <p className="text-sm text-slate/70 leading-relaxed mb-6">
        Open an active opportunity from your dashboard and tap{' '}
        <span className="font-medium text-charcoal">Launch Coach</span> to begin formatting your
        voice profile drafts.
      </p>
      <button
        onClick={onStart}
        className="px-5 py-2.5 bg-burnt-orange text-white text-sm font-semibold rounded-lg hover:bg-burnt-orange/90 transition-colors"
      >
        Go to Dashboard →
      </button>
    </div>
  );
}
